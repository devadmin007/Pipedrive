
const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { sendNotification, sendToTopic } = require('../lib/firebase-admin');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register-token', protect, async (req, res) => {
  try {
    const { fcmToken, deviceInfo } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // ✅ Always keep only one FCM token
    user.fcmTokens = [{
      token: fcmToken,
      deviceInfo: deviceInfo || 'Unknown Device',
      lastUsed: new Date()
    }];

    await user.save();

    res.json({ success: true, message: 'FCM token registered successfully' });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// Remove FCM token (for logout)
router.delete('/remove-token' , async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (user) {
      user.fcmTokens = user.fcmTokens.filter(t => t.token !== fcmToken);
      await user.save();
    }

    res.json({ success: true, message: 'FCM token removed successfully' });
  } catch (error) {
    console.error('Error removing FCM token:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Helper function to send notification to user
const notifyUser = async (userId, title, message, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.fcmTokens.length === 0) {
      console.log('No FCM tokens found for user:', userId);
      return;
    }

    const tokens = user.fcmTokens.map(t => t.token);
    const result = await sendNotification(tokens, title, message, data);
    
    // Remove failed/invalid tokens
    if (result.failed.length > 0) {
      user.fcmTokens = user.fcmTokens.filter(t => !result.failed.includes(t.token));
      await user.save();
    }
    
    return result;
  } catch (error) {
    console.error('Error sending notification to user:', error);
  }
};

router.post("/send", async (req, res) => {
  try {
    const { tokens, title, body, data } = req.body;
    const result = await sendNotification(tokens, title, body, data);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    let query = Notification.find({ recipient: req.user.id });

    // Sort
    query = query.sort('-createdAt');

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Notification.countDocuments({ recipient: req.user.id });

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const notifications = await query.populate({
      path: 'relatedLead',
      select: 'name company'
    });

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
      count: notifications.length,
      pagination,
      data: notifications
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   GET /api/notifications/unread
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user.id,
      read: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   PUT /api/notifications/:id
// @desc    Mark notification as read
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: `No notification found with id of ${req.params.id}`
      });
    }

    // Make sure user owns notification
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this notification`
      });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.post("/send-topic", async (req, res) => {
  try {
    const { topic, title, body, data } = req.body;
    const result = await sendToTopic(topic, title, body, data);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send topic notification" });
  }
});

// router.post('/', async (req, res) => {
//   try {
//     const testToken = '68a5638080ea92dc70051f11';
    
//     console.log('Testing Firebase with token:', testToken);
    
//     const result = await sendNotification(
//       [testToken],
//       'Firebase Test',
//       'If you see this, Firebase is working!',
//       { 
//         type: 'test',
//         timestamp: new Date().toISOString()
//       }
//     );
    
//     console.log('Firebase test result:', result);
    
//     res.json({
//       success: true,
//       message: 'Test notification sent',
//       result: result
//     });
//   } catch (error) {
//     console.error('Firebase test failed:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       stack: error.stack
//     });
//   }
// });

// Export the helper function
router.notifyUser = notifyUser;

module.exports = router;