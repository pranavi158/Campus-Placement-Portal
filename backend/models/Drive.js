const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  jd: {
    type: String,
    required: true,
  },
  eligibility: {
    type: String,
    required: true,
  },
  ctc: {
    type: Number,
    required: true,
    default: 0,
  },
  location: {
    type: String,
    required: true,
    default: 'Remote',
  },
  jobType: {
    type: String,
    enum: ['Full-Time', 'Internship', 'Contract'],
    default: 'Full-Time',
  },
  minCGPA: {
    type: Number,
    required: true,
    default: 0.0,
  },
  allowedBranches: {
    type: [String],
    default: [],
  },
  rounds: {
    type: [String],
    default: [],
  },
  deadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'closed'],
    default: 'pending',
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Drive', driveSchema);
