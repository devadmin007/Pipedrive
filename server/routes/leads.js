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
      { path: 'activities.createdBy', select: 'name email' },
      { path: 'suspect', select: 'leadSource jobTitle jobLocation jobUrl jobDescription jobType jobSalary jobExperience jobSkills jobRequirements jobBenefits jobStatus' },
      { path: 'prospect', select: 'status lastContactedAt notes' },
      { path: 'leadQualified', select: 'status' },
      { path: 'opportunity', select: 'dealStage expectedCloseDate budgetAmount budgetCurrency' },
      { path: 'deal', select: 'status finalDealValue finalDealCurrency closedAt' }
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
      { path: 'activities.createdBy', select: 'name email' },
      // { path: 'suspect', select: 'leadSource jobTitle jobLocation jobUrl jobDescription jobType jobSalary jobExperience jobSkills jobRequirements jobBenefits jobStatus' },
      // { path: 'prospect', select: 'status lastContactedAt notes' },
      // { path: 'leadQualified', select: 'status' },
      // { path: 'opportunity', select: 'dealStage expectedCloseDate budgetAmount budgetCurrency' },
      // { path: 'deal', select: 'status finalDealValue finalDealCurrency closedAt' }
    ]); 
    const formattedLead = {
      ...lead.toObject(),
      suspect: lead.suspect || {},
      prospect: lead.prospect || {},
      leadQualified: lead.leadQualified || {},
      opportunity: lead.opportunity || {},
      deal: lead.deal || {}
    };
    
    res.status(200).json({ success: true, data: formattedLead });
    
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

    // res.status(200).json({
    //   success: true,
    //   data: lead
    // });
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


          // Remove failed tokens
          // if (result.failed?.length > 0) {
          //   assignedUser.fcmTokens = assignedUser.fcmTokens.filter(
          //     t => !result.failed.includes(t.token)
          //   );
          //   await assignedUser.save();
          // }
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
// router.put('/:id', protect, async (req, res) => {
//   try {
//     let lead = await Lead.findById(req.params.id);

//     if (!lead) {
//       return res.status(404).json({
//         success: false,
//         message: `No lead found with id of ${req.params.id}`
//       });
//     }

//     // Make sure user is lead owner or admin
//     if (
//       lead.assignedTo &&
//       lead.assignedTo.toString() !== req.user.id &&
//       req.user.role !== 'admin'
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: `User ${req.user.id} is not authorized to update this lead`
//       });
//     }

//     const oldStatus = lead.status;
//     const oldAssignedTo = lead.assignedTo ? lead.assignedTo.toString() : null;

//     lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true
//     });

//     const io = req.app.get('io');

//     // If status changed, create notification
//     if (req.body.status && oldStatus !== req.body.status) {
//       // Notify the assigned user about status change
//       const assignedUser = await User.findById(lead.assignedTo);
//       if (lead.assignedTo && lead.assignedTo.toString() !== req.user.id) {
//         const tokens = assignedUser.fcmTokens.map(t => t.token);
//         const notification = await Notification.create({
//           type: 'leadUpdate',
//           message: `Lead ${lead.name} status changed from ${oldStatus} to ${req.body.status}`,
//           recipient: lead.assignedTo,
//           relatedLead: lead._id
//         });
//         const notificationPayload = {
//           title: 'Lead Status Updated',
//           body: `Lead ${lead.name} status changed from ${oldStatus} to ${req.body.status}`,
//           data: {
//             type: 'leadAssignment',
//             leadId: lead._id.toString(),
//             leadName: lead.name,
//             notificationId: notification._id.toString(),
//             url: `/leads/${lead._id}`   // 👈 useful for click
//           }
//         };
//         await sendNotification(
//           tokens,
//           notificationPayload.title,
//           notificationPayload.body,
//           notificationPayload.data
//         );

//         io.to(lead.assignedTo.toString()).emit('notification', notification);
//       }
//     }

//     // If assignment changed, create notification for new assignee
//     if (
//       req.body.assignedTo &&
//       oldAssignedTo !== req.body.assignedTo &&
//       req.body.assignedTo !== req.user.id
//     ) {
//       const assignedUser = await User.findById(lead.assignedTo);
//       const tokens = assignedUser.fcmTokens.map(t => t.token);


//       const notification = await Notification.create({
//         type: 'leadAssignment',
//         message: `Lead ${lead.name} has been assigned to you`,
//         recipient: req.body.assignedTo,
//         relatedLead: lead._id
//       });
//       const notificationPayload = {
//         title: 'Lead Assigned',
//         body: `Lead ${lead.name} has been assigned to you`,
//         data: {
//           type: 'leadAssignment',
//           leadId: lead._id.toString(),
//           leadName: lead.name,
//           notificationId: notification._id.toString(),
//           url: `/leads/${lead._id}`   // 👈 useful for click
//         }
//       };
//       await sendNotification(
//         tokens,
//         notificationPayload.title,
//         notificationPayload.body,
//         notificationPayload.data
//       );

//       io.to(req.body.assignedTo).emit('notification', notification);
//     }

//     res.status(200).json({
//       success: true,
//       data: lead
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

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
    const oldDealStage = lead.opportunity?.dealStage;
    const oldProspectStatus = lead.prospect?.status;

    // ---- Merge Nested Updates ----
    if (req.body.suspect) {
      lead.suspect = { ...lead.suspect?.toObject(), ...req.body.suspect };
    }
    if (req.body.prospect) {
      lead.prospect = { ...lead.prospect?.toObject(), ...req.body.prospect };
    }
    if (req.body.leadQualified) {
      lead.leadQualified = { ...lead.leadQualified?.toObject(), ...req.body.leadQualified };
    }
    if (req.body.opportunity) {
      lead.opportunity = { ...lead.opportunity?.toObject(), ...req.body.opportunity };
    }
    if (req.body.deal) {
      lead.deal = { ...lead.deal?.toObject(), ...req.body.deal };
    }


    // ---- Merge Top-Level Fields ----
    const topLevelFields = [
      'name', 'company', 'position', 'email', 'phone',
      'value', 'status', 'notes', 'assignedTo'
    ];
    topLevelFields.forEach(field => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    lead.updatedAt = Date.now();
    await lead.save();

    const io = req.app.get('io');

    // ---- Notifications ----

    // 1. Status change
    if (req.body.status && oldStatus !== req.body.status) {
      const assignedUser = await User.findById(lead.assignedTo);
      if (lead.assignedTo && lead.assignedTo.toString() !== req.user.id) {
        const tokens = assignedUser.fcmTokens.map(t => t.token);
        const notification = await Notification.create({
          type: 'leadUpdate',
          message: `Lead ${lead.name} status changed from ${oldStatus} to ${req.body.status}`,
          recipient: lead.assignedTo,
          relatedLead: lead._id
        });
        const payload = {
          title: 'Lead Status Updated',
          body: `Lead ${lead.name} status changed from ${oldStatus} to ${req.body.status}`,
          data: {
            type: 'leadUpdate',
            leadId: lead._id.toString(),
            leadName: lead.name,
            notificationId: notification._id.toString(),
            url: `/leads/${lead._id}`
          }
        };
        await sendNotification(tokens, payload.title, payload.body, payload.data);
        io.to(lead.assignedTo.toString()).emit('notification', notification);
      }
    }

    // 2. Assignment change
    if (
      req.body.assignedTo &&
      oldAssignedTo !== req.body.assignedTo &&
      req.body.assignedTo !== req.user.id
    ) {
      const assignedUser = await User.findById(lead.assignedTo);
      const tokens = assignedUser.fcmTokens.map(t => t.token);

      const notification = await Notification.create({
        type: 'leadAssignment',
        message: `Lead ${lead.name} has been assigned to you`,
        recipient: req.body.assignedTo,
        relatedLead: lead._id
      });
      const payload = {
        title: 'Lead Assigned',
        body: `Lead ${lead.name} has been assigned to you`,
        data: {
          type: 'leadAssignment',
          leadId: lead._id.toString(),
          leadName: lead.name,
          notificationId: notification._id.toString(),
          url: `/leads/${lead._id}`
        }
      };
      await sendNotification(tokens, payload.title, payload.body, payload.data);
      io.to(req.body.assignedTo).emit('notification', notification);
    }

    if (req.body.prospect?.status && oldProspectStatus !== req.body.prospect.status) {
    }

    if (req.body.opportunity?.dealStage && oldDealStage !== req.body.opportunity.dealStage) {
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (err) {
    console.error("Update Lead Error:", err);
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

    const recipient = lead.assignedTo ? lead.assignedTo : req.user.id;

    // ---- Create Notification ----
    const notification = await Notification.create({
      type: 'activity',
      message: `A new activity (${req.body.type}) was added to lead ${lead.name}`,
      recipient,
      relatedLead: lead._id
    });

    // ---- Socket.io ----
    io.to(recipient.toString()).emit('notification', notification);

    // ---- Firebase Push Notification ----
try {
  const assignedUser = await User.findById(recipient);

  if (assignedUser && assignedUser.fcmTokens.length > 0) {
    const tokens = assignedUser.fcmTokens.map(t => t.token);

    const payload = {
      title: 'New Activity Added',
      body: `Activity (${req.body.type}) was added to lead ${lead.name}`,
      data: {
        type: 'activity',
        leadId: lead._id.toString(),
        leadName: lead.name,
        activityType: req.body.type,
        notificationId: notification._id.toString(),
        url: `/leads/${lead._id}`
      }
    };

    const result = await sendNotification(
      tokens,
      payload.title,
      payload.body,
      payload.data
    );

    console.log(
      `✅ Firebase notification sent successfully to user ${recipient} for lead ${lead._id}. Result:`,
      result
    );
  } else {
    console.log('⚠️ No FCM tokens found for user:', recipient);
  }
} catch (firebaseError) {
  console.error('❌ Error sending Firebase notification:', firebaseError);
  // Don't block request on Firebase error
}


    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (err) {
    console.error("Add Activity Error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


// Add this to your notifications router


module.exports = router;