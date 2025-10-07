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

const LEAD_SOURCES = ['linkedin', 'email', 'upwork', 'otherportal'];
const PROSPECT_STATUSES = ['interested', 'not_interested', 'not_now', 'unqualified', 'no_response'];
const INTERESTED_SERVICES = ['mvp', 'website', 'app', 'dedicated developer', 'ui/ux', 'qa', 'devops', 'other'];
const DEAL_STAGES = ['proposal_sent', 'negotiation', 'verbal_commit', 'legal/procurement', 'closed_won', 'closed_lost'];

const SuspectSchema = new mongoose.Schema({
  leadSource: { type: String, enum: LEAD_SOURCES, required: true },
  otherPortalName: { type: String, trim: true }, // when leadSource === 'OtherPortal'
  jobUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/i, 'Please add a valid URL']
  }
}, { _id: false });

const ProspectSchema = new mongoose.Schema({
  status: { type: String, enum: PROSPECT_STATUSES, required: true },
  lastContactedAt: { type: Date },
  notes: { type: String, trim: true }
}, { _id: false });

const OpportunitySchema = new mongoose.Schema({
  budgetAmount: { type: Number, min: 0 },
  budgetCurrency: { type: String, enum: ['USD', 'EUR', 'INR', 'GBP', 'Other'], default: 'USD' },
  dealStage: { type: String, enum: DEAL_STAGES },
  notes: { type: String },
  customRequirements: { type: String, trim: true },
}, { _id: false });


const LeadQualifiedSchema = new mongoose.Schema({
  interestedServices: [{ type: String, enum: INTERESTED_SERVICES }],
  budgetApprox: { type: Number, min: 0 },
  budgetCurrency: { type: String, enum: ['USD', 'EUR', 'INR', 'GBP', 'Other'], default: 'USD' },
  timelineApprox: { type: String, trim: true }, // e.g., "4-6 weeks", "Q4"
  meetingScheduled: { type: Boolean, default: false },
  meetingDate: { type: Date }
}, { _id: false });

const DealSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Won', 'Lost'],
    required: true
  },

  // Fields when deal is WON
  serviceTypeSold: { type: String, trim: true },
  projectStartDate: { type: Date },
  finalDealValue: { type: Number, min: 0 },
  finalDealCurrency: {
    type: String,
    enum: ['USD', 'EUR', 'INR', 'GBP', 'Other'],
    default: 'USD'
  },

  // Fields when deal is LOST
  reasonLost: {
    type: String,
    enum: ['Price', 'Delay', 'No Response', 'Bad Fit', 'Timing', 'Competitor', 'Other']
  },
  otherNotes: { type: String, trim: true },
  closedAt: { type: Date }
}, { _id: false });

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
    enum: ['warm', 'hot', 'cold'],
    default: 'cold'
    // enum: ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    // default: 'New Lead'
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
  suspect: SuspectSchema,
  prospect: ProspectSchema,
  leadQualified: LeadQualifiedSchema,
  opportunity: OpportunitySchema,
  deal: DealSchema,
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
LeadSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Lead', LeadSchema);