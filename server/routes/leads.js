const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { sendNotification } = require('../lib/firebase-admin');

// @route   GET /api/leads
// @desc    Get all leads
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // If user is not an admin, only show leads assigned to them
    if (req.user.role !== 'admin') {
      const parsed = JSON.parse(queryStr);
      parsed.assignedTo = req.user._id;
      query = Lead.find(parsed);
    } else {
      query = Lead.find(JSON.parse(queryStr));
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Lead.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Populate
    query = query.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'activities.createdBy', select: 'name email' }
    ]);

    // Executing query
    const leads = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: leads.length,
      pagination,
      data: leads
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   GET /api/leads/:id
// @desc    Get single lead
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'activities.createdBy', select: 'name email' }
    ]);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: `No lead found with id of ${req.params.id}`
      });
    }

    // Make sure user is lead owner or an admin
    // if (
    //   lead.assignedTo && 
    //   lead.assignedTo.toString() !== req.user.id && 
    // ) {
    //   return res.status(403).json({
    //     success: false,
    //     message: `User ${req.user.id} is not authorized to access this lead`
    //   });
    // }
    
    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   POST /api/leads
// @desc    Create new lead
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    req.body.createdBy = req.user?.id;

    const lead = await Lead.create(req.body);

    // If lead is assigned to someone, create notification
    if (req.body.assignedTo && req.body.assignedTo !== req.user?.id) {
      const io = req.app.get('io');
      
      const notification = await Notification.create({
        type: 'leadAssignment',
        message: `A new lead (${lead.name}) has been assigned to you`,
        recipient: req.body.assignedTo,
        relatedLead: lead._id
      });

      // Socket.io notification
      io.to(req.body.assignedTo).emit('notification', notification);

      // Firebase push notification
      try {
        
        
       const assignedUser = await User.findById(req.body.assignedTo);

if (assignedUser && assignedUser.fcmTokens.length > 0) {
  const tokens = assignedUser.fcmTokens.map(t => t.token);

  const notificationPayload = {
    title: 'New Lead Assigned',
    body: `A new lead (${lead.name}) has been assigned to you`,
    data: {
      type: 'leadAssignment',
      leadId: lead._id.toString(),
      leadName: lead.name,
      notificationId: notification._id.toString(),
      url: `/leads/${lead._id}`   // 👈 useful for click
    }
  };

  const result = await sendNotification(
    tokens, 
    notificationPayload.title, 
    notificationPayload.body, 
    notificationPayload.data
  );

  console.log('Firebase notification sent:', result);

  // Remove failed tokens
  if (result.failed?.length > 0) {
    assignedUser.fcmTokens = assignedUser.fcmTokens.filter(
      t => !result.failed.includes(t.token)
    );
    await assignedUser.save();
  }
} else {
  console.log('No FCM tokens found for user:', req.body.assignedTo);
}

      } catch (firebaseError) {
        console.error('Error sending Firebase notification:', firebaseError);
        // Don't fail the request if Firebase notification fails
      }
    }

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update lead
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: `No lead found with id of ${req.params.id}`
      });
    }

    // Make sure user is lead owner or admin
    if (
      lead.assignedTo && 
      lead.assignedTo.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this lead`
      });
    }

    const oldStatus = lead.status;
    const oldAssignedTo = lead.assignedTo ? lead.assignedTo.toString() : null;

    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    const io = req.app.get('io');

    // If status changed, create notification
    if (req.body.status && oldStatus !== req.body.status) {
      // Notify the assigned user about status change
      if (lead.assignedTo && lead.assignedTo.toString() !== req.user.id) {
        const notification = await Notification.create({
          type: 'leadUpdate',
          message: `Lead ${lead.name} status changed from ${oldStatus} to ${req.body.status}`,
          recipient: lead.assignedTo,
          relatedLead: lead._id
        });

        io.to(lead.assignedTo.toString()).emit('notification', notification);
      }
    }

    // If assignment changed, create notification for new assignee
    if (
      req.body.assignedTo && 
      oldAssignedTo !== req.body.assignedTo && 
      req.body.assignedTo !== req.user.id
    ) {
      const notification = await Notification.create({
        type: 'leadAssignment',
        message: `Lead ${lead.name} has been assigned to you`,
        recipient: req.body.assignedTo,
        relatedLead: lead._id
      });

      io.to(req.body.assignedTo).emit('notification', notification);
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   DELETE /api/leads/:id
// @desc    Delete lead
// @access  Private
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: `No lead found with id of ${req.params.id}`
      });
    }

    await lead.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   POST /api/leads/:id/activities
// @desc    Add activity to lead
// @access  Private
router.post('/:id/activities', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: `No lead found with id of ${req.params.id}`
      });
    }

    // Make sure user is lead owner or admin
    if (
      lead.assignedTo && 
      lead.assignedTo.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this lead`
      });
    }

    // Add user id to activity
    req.body.createdBy = req.user.id;

    // Add activity to lead
    lead.activities.push(req.body);

    await lead.save();

    const io = req.app.get('io');

    // Create follow-up notification if activity is a follow-up
    if (req.body.type === 'follow-up' && req.body.dueDate) {
      const recipient = lead.assignedTo ? lead.assignedTo : req.user.id;
      
      const notification = await Notification.create({
        type: 'followUp',
        message: `Follow-up for lead ${lead.name} is scheduled for ${new Date(req.body.dueDate).toLocaleDateString()}`,
        recipient,
        relatedLead: lead._id
      });

      io.to(recipient.toString()).emit('notification', notification);
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Add this to your notifications router


module.exports = router;