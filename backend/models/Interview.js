const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drive',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled'],
      default: 'active',
    },
    title: {
      type: String,
      default: 'Technical Interview',
    },
    roundNumber: {
      type: Number,
      default: 1,
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
    code: {
      type: String,
      default: `// Write your solution here\nfunction solveProblem(input) {\n  console.log("Processing input:", input);\n  return true;\n}\n\n// Test cases\nconsole.log(solveProblem([1, 2, 3]));\n`,
    },
    language: {
      type: String,
      default: 'javascript',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Interview', interviewSchema);
