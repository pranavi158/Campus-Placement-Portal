const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Drive = require('../models/Drive');
const Application = require('../models/Application');

const router = express.Router();

// Apply auth protection & admin restriction to all routes in this router
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard metrics count
 */
router.get('/stats', async (req, res) => {
  try {
    const students = await Student.countDocuments();
    const companies = await Company.countDocuments();
    const drives = await Drive.countDocuments();
    const applications = await Application.countDocuments();

    return res.json({ students, companies, drives, applications });
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    return res.status(500).json({ message: 'Server error retrieving dashboard stats' });
  }
});

/**
 * @route   GET /api/admin/companies
 * @desc    Get all companies with optional search filter and pagination
 */
router.get('/companies', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    let query = {};

    if (search) {
      // Find companies matching name case-insensitively
      query.name = { $regex: search, $options: 'i' };
    }

    const totalCount = await Company.countDocuments(query);
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.json({
      companies,
      pagination: {
        totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Admin companies fetch error:', error);
    return res.status(500).json({ message: 'Server error retrieving companies list' });
  }
});

/**
 * @route   PUT /api/admin/companies/approve/:id
 * @desc    Approve a company registration
 */
router.put('/companies/approve/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.approved = true;
    await company.save();

    return res.json({ message: `Company ${company.name} approved successfully`, company });
  } catch (error) {
    console.error('Company approval error:', error);
    return res.status(500).json({ message: 'Server error approving company' });
  }
});

/**
 * @route   PUT /api/admin/companies/blacklist/:id
 * @desc    Toggle company blacklist status
 */
router.put('/companies/blacklist/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    company.blacklisted = !company.blacklisted;
    await company.save();

    const statusText = company.blacklisted ? 'blacklisted' : 'removed from blacklist';
    return res.json({ message: `Company ${company.name} ${statusText} successfully`, company });
  } catch (error) {
    console.error('Company blacklist toggle error:', error);
    return res.status(500).json({ message: 'Server error toggling company blacklist status' });
  }
});

/**
 * @route   GET /api/admin/students
 * @desc    Get all students with optional search filter and pagination
 */
router.get('/students', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    let query = {};

    if (search) {
      // Search by name or email case-insensitively, or exact mongoose ID
      const searchRegex = { $regex: search, $options: 'i' };
      const orConditions = [
        { name: searchRegex },
        { email: searchRegex },
        { branch: searchRegex }
      ];

      // If search query is a valid MongoDB ObjectId, search by ID too
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        orConditions.push({ _id: search });
      }

      query = { $or: orConditions };
    }

    const totalCount = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    return res.json({
      students,
      pagination: {
        totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Admin students fetch error:', error);
    return res.status(500).json({ message: 'Server error retrieving students list' });
  }
});

/**
 * @route   PUT /api/admin/students/blacklist/:id
 * @desc    Toggle student blacklist status
 */
router.put('/students/blacklist/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.blacklisted = !student.blacklisted;
    await student.save();

    const statusText = student.blacklisted ? 'blacklisted' : 'removed from blacklist';
    return res.json({ message: `Student ${student.name} ${statusText} successfully`, student });
  } catch (error) {
    console.error('Student blacklist toggle error:', error);
    return res.status(500).json({ message: 'Server error toggling student blacklist status' });
  }
});

/**
 * @route   GET /api/admin/drives
 * @desc    Get all drives populated with company details and paginated
 */
router.get('/drives', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Drive.countDocuments();
    const drives = await Drive.find()
      .populate('company', 'name email industry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.json({
      drives,
      pagination: {
        totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Admin drives fetch error:', error);
    return res.status(500).json({ message: 'Server error retrieving drives list' });
  }
});

/**
 * @route   PUT /api/admin/drives/approve/:id
 * @desc    Approve a drive posting
 */
router.put('/drives/approve/:id', async (req, res) => {
  try {
    const drive = await Drive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    drive.status = 'approved';
    await drive.save();

    return res.json({ message: `Drive ${drive.title} approved`, drive });
  } catch (error) {
    console.error('Drive approval error:', error);
    return res.status(500).json({ message: 'Server error approving drive' });
  }
});

/**
 * @route   PUT /api/admin/drives/reject/:id
 * @desc    Reject a drive posting
 */
router.put('/drives/reject/:id', async (req, res) => {
  try {
    const drive = await Drive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    drive.status = 'rejected';
    await drive.save();

    return res.json({ message: `Drive ${drive.title} rejected`, drive });
  } catch (error) {
    console.error('Drive rejection error:', error);
    return res.status(500).json({ message: 'Server error rejecting drive' });
  }
});

/**
 * @route   GET /api/admin/applications
 * @desc    Get all applications populated and paginated
 */
router.get('/applications', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Application.countDocuments();
    const applications = await Application.find()
      .populate('student', 'name email branch cgpa resume isPlaced placedCTC')
      .populate({
        path: 'drive',
        select: 'title company ctc',
        populate: {
          path: 'company',
          select: 'name'
        }
      })
      .sort({ appliedDate: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.json({
      applications,
      pagination: {
        totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    console.error('Admin applications fetch error:', error);
    return res.status(500).json({ message: 'Server error retrieving applications' });
  }
});

module.exports = router;
