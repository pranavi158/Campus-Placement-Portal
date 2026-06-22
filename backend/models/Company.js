const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const companySchema = new mongoose.Schema({
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
  industry: {
    type: String,
    required: true,
  },
  hr: {
    type: String,
    required: true,
  },
  site: {
    type: String, // Company website
    default: '',
  },
  approved: {
    type: Boolean,
    default: false,
  },
  blacklisted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Pre-save hook to hash password before saving
companySchema.pre('save', async function (next) {
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
companySchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Company', companySchema);
