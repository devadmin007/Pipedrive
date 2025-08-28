const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'note', 'follow-up'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const LeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot be more than 100 characters']
  },
  email: {
    type: String,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  value: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    default: 'New Lead'
  },
  notes: {
    type: String
  },
  activities: [ActivitySchema],
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
LeadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Lead', LeadSchema);