const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.post("/fcm-token", async (req, res) => {
  try {
    const user = await User.findById('68a5638080ea92dc70051f11');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { token, deviceInfo } = req.body;

    if (!user.fcmTokens.some(t => t.token === token)) {
      user.fcmTokens.push({ token, deviceInfo });
    }

    await user.save();

    res.json({ success: true, message: "FCM token saved" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-notificationPreferences');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   GET /api/users/sales
// @desc    Get all sales reps
// @access  Private
router.get('/sales', protect, async (req, res) => {
  try {
    const users = await User.find({ role: 'sales' }).select('name email');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private/Admin or Self
router.get('/:id', protect, async (req, res) => {
  try {
    // Check if user is requesting their own profile or is an admin
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin or Self
router.put('/:id', protect, async (req, res) => {
  try {
    // Check if user is updating their own profile or is an admin
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    // Only allow admins to update role
    if (req.body.role && req.user.role !== 'admin') {
      delete req.body.role;
    }

    // Don't allow password update through this route
    if (req.body.password) {
      delete req.body.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   PUT /api/users/:id/notification-preferences
// @desc    Update user notification preferences
// @access  Private/Self
router.put('/:id/notification-preferences', protect, async (req, res) => {
  try {
    // Only allow users to update their own notification preferences
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with id of ${req.params.id}`
      });
    }

    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...req.body
    };

    await user.save();

    res.status(200).json({
      success: true,
      data: user.notificationPreferences
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with id of ${req.params.id}`
      });
    }

    // Don't allow deleting self
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.remove();

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

router.post('/test-notification', protect, async (req, res) => {
  try {
    const { token, title, body, data = {} } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    console.log('🧪 Sending test notification to token:', token);

    const result = await sendNotification(
      [token], // Array of tokens
      title || 'Test Notification',
      body || 'This is a test notification from the server',
      {
        type: 'test',
        timestamp: new Date().toISOString(),
        ...data
      }
    );

    console.log('🧪 Test notification result:', result);

    res.json({
      success: true,
      message: 'Test notification sent',
      result: result
    });

  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
});

module.exports = router;