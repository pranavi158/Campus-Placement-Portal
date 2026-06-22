const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Admin = require('../models/Admin');

const router = express.Router();

/**
 * Generate JWT utility function
 */
const generateToken = (id, role, name) => {
  return jwt.sign(
    { id, role, name },
    process.env.JWT_SECRET || 'supersecretjwtkey12345!',
    { expiresIn: '30d' }
  );
};

/**
 * @route   POST /api/auth/register/student
 * @desc    Register a new student
 */
router.post(
  '/register/student',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Must be a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('branch').trim().notEmpty().withMessage('Branch is required'),
    body('cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10'),
    validate
  ],
  async (req, res) => {
    try {
      const { name, email, password, branch, cgpa } = req.body;

      const studentExists = await Student.findOne({ email });
      if (studentExists) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const student = await Student.create({
        name,
        email,
        password, // Mongoose schema pre-save hook handles hashing
        branch,
        cgpa: cgpa ? parseFloat(cgpa) : 0.0,
      });

      return res.status(201).json({
        message: 'Student registered successfully',
        user: {
          id: student._id,
          name: student.name,
          email: student.email,
          role: 'student',
        }
      });
    } catch (error) {
      console.error('Student registration error:', error);
      return res.status(500).json({ message: 'Server error during student registration' });
    }
  }
);

/**
 * @route   POST /api/auth/register/company
 * @desc    Register a new company (needs admin approval)
 */
router.post(
  '/register/company',
  [
    body('name').trim().notEmpty().withMessage('Company name is required'),
    body('email').isEmail().withMessage('Must be a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('industry').trim().notEmpty().withMessage('Industry type is required'),
    body('hr').trim().notEmpty().withMessage('HR contact name is required'),
    body('site').optional().trim(),
    validate
  ],
  async (req, res) => {
    try {
      const { name, email, password, industry, hr, site } = req.body;

      const companyExists = await Company.findOne({ email });
      if (companyExists) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const company = await Company.create({
        name,
        email,
        password, // Mongoose schema pre-save hook handles hashing
        industry,
        hr,
        site: site || '',
        approved: false, // Default is pending admin approval
      });

      return res.status(201).json({
        message: 'Company registered successfully. Pending administrator approval.',
        user: {
          id: company._id,
          name: company.name,
          email: company.email,
          role: 'company',
        }
      });
    } catch (error) {
      console.error('Company registration error:', error);
      return res.status(500).json({ message: 'Server error during company registration' });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 */
router.post(
  '/login',
  [
    body('email').trim().notEmpty().withMessage('Email/Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').isIn(['admin', 'company', 'student']).withMessage('Invalid role selection'),
    validate
  ],
  async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    let user = null;

    if (role === 'admin') {
      // Admin username corresponds to the email input in standard layout
      user = await Admin.findOne({ username: email });
    } else if (role === 'company') {
      user = await Company.findOne({ email });
    } else if (role === 'student') {
      user = await Student.findOne({ email });
    } else {
      return res.status(400).json({ message: 'Invalid role selection' });
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check password using custom schema instance method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Role-specific validation
    if (role === 'company' || role === 'student') {
      if (user.blacklisted) {
        return res.status(403).json({ message: 'Your account has been blacklisted' });
      }
    }

    if (role === 'company' && !user.approved) {
      return res.status(403).json({ message: 'Your account is pending admin approval' });
    }

    const name = role === 'admin' ? user.username : user.name;
    const token = generateToken(user._id, role, name);

    return res.json({
      token,
      user: {
        id: user._id,
        name,
        email: role === 'admin' ? user.username : user.email,
        role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
