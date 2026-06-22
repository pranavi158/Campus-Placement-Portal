const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  cgpa: {
    type: Number,
    required: true,
    default: 0.0,
  },
  rollNo: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  skills: {
    type: [String],
    default: [],
  },
  linkedIn: {
    type: String,
    trim: true,
    default: '',
  },
  github: {
    type: String,
    trim: true,
    default: '',
  },
  yearOfPassing: {
    type: Number,
    default: new Date().getFullYear(),
  },
  backlogs: {
    type: Number,
    default: 0,
  },
  isPlaced: {
    type: Boolean,
    default: false,
  },
  placedCTC: {
    type: Number,
    default: 0,
  },
  resume: {
    type: String, // Will store filename of the uploaded PDF resume
    default: '',
  },
  blacklisted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Pre-save hook to hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
studentSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
