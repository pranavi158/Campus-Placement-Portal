const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Selected', 'Rejected'],
    default: 'Applied',
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  drive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drive',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Application', applicationSchema);
