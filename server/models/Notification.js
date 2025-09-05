const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['leadUpdate', 'leadAssignment', 'followUp', 'activity'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  relatedLead: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lead'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);