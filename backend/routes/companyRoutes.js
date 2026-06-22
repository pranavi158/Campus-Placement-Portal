const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const Company = require('../models/Company');
const Drive = require('../models/Drive');
const Application = require('../models/Application');

const router = express.Router();

// Apply auth protection & company restriction to all routes
router.use(protect);
router.use(authorize('company'));

/**
 * @route   GET /api/company/profile
 * @desc    Get current logged in company details
 */
router.get('/profile', async (req, res) => {
  try {
    const company = await Company.findById(req.user.id).select('-password');
    if (!company) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    return res.json(company);
  } catch (error) {
    console.error('Fetch company profile error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

/**
 * @route   PUT /api/company/profile
 * @desc    Update company profile details
 */
router.put('/profile', async (req, res) => {
  try {
    const { name, industry, hr, site } = req.body;

    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (name) company.name = name;
    if (industry) company.industry = industry;
    if (hr) company.hr = hr;
    if (site !== undefined) company.site = site;

    await company.save();
    return res.json({ message: 'Profile updated successfully', company });
  } catch (error) {
    console.error('Update company profile error:', error);
    return res.status(500).json({ message: 'Server error updating profile' });
  }
});

/**
 * @route   GET /api/company/drives
 * @desc    Get all drives created by the logged in company
 */
router.get('/drives', async (req, res) => {
  try {
    const drives = await Drive.find({ company: req.user.id }).sort({ createdAt: -1 });
    return res.json(drives);
  } catch (error) {
    console.error('Fetch company drives error:', error);
    return res.status(500).json({ message: 'Server error retrieving job drives' });
  }
});

/**
 * @route   POST /api/company/drives
 * @desc    Create a new placement drive (only if approved)
 */
router.post(
  '/drives',
  [
    body('title').trim().notEmpty().withMessage('Drive title is required'),
    body('jd').trim().notEmpty().withMessage('Job description is required'),
    body('eligibility').trim().notEmpty().withMessage('Eligibility criteria is required'),
    body('deadline').isISO8601().toDate().withMessage('Provide a valid deadline date'),
    body('ctc').isNumeric().withMessage('CTC must be a number'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('jobType').isIn(['Full-Time', 'Internship', 'Contract']).withMessage('Invalid job type'),
    body('minCGPA').isFloat({ min: 0, max: 10 }).withMessage('Minimum CGPA must be between 0 and 10'),
    body('allowedBranches').isArray().withMessage('Allowed branches must be an array'),
    body('rounds').isArray().withMessage('Rounds must be an array'),
    validate
  ],
  async (req, res) => {
    try {
      const { title, jd, eligibility, deadline, ctc, location, jobType, minCGPA, allowedBranches, rounds } = req.body;

      // Verify company status
      const company = await Company.findById(req.user.id);
      if (!company.approved) {
        return res.status(403).json({
          message: 'Your account is pending admin approval. You cannot post job drives yet.'
        });
      }

      const newDrive = await Drive.create({
        title,
        jd,
        eligibility,
        deadline,
        ctc,
        location,
        jobType,
        minCGPA,
        allowedBranches,
        rounds,
        company: req.user.id,
        status: 'pending' // Default status, awaits admin approval
      });

      return res.status(201).json({
        message: 'Job drive created successfully. Pending administrator approval.',
        drive: newDrive
      });
    } catch (error) {
      console.error('Create drive error:', error);
      return res.status(500).json({ message: 'Server error creating job drive' });
    }
  }
);

/**
 * @route   PUT /api/company/drives/:id
 * @desc    Edit an existing placement drive
 */
router.put(
  '/drives/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Drive title cannot be empty'),
    body('jd').optional().trim().notEmpty().withMessage('Job description cannot be empty'),
    body('eligibility').optional().trim().notEmpty().withMessage('Eligibility criteria cannot be empty'),
    body('deadline').optional().isISO8601().toDate().withMessage('Provide a valid deadline date'),
    body('ctc').optional().isNumeric().withMessage('CTC must be a number'),
    body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
    body('jobType').optional().isIn(['Full-Time', 'Internship', 'Contract']).withMessage('Invalid job type'),
    body('minCGPA').optional().isFloat({ min: 0, max: 10 }).withMessage('Minimum CGPA must be between 0 and 10'),
    body('allowedBranches').optional().isArray().withMessage('Allowed branches must be an array'),
    body('rounds').optional().isArray().withMessage('Rounds must be an array'),
    validate
  ],
  async (req, res) => {
    try {
      const { title, jd, eligibility, deadline, ctc, location, jobType, minCGPA, allowedBranches, rounds } = req.body;

      const drive = await Drive.findById(req.params.id);
      if (!drive) {
        return res.status(404).json({ message: 'Job drive not found' });
      }

      // Verify ownership
      if (drive.company.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized modification' });
      }

      if (title) drive.title = title;
      if (jd) drive.jd = jd;
      if (eligibility) drive.eligibility = eligibility;
      if (deadline) drive.deadline = deadline;
      if (ctc !== undefined) drive.ctc = ctc;
      if (location) drive.location = location;
      if (jobType) drive.jobType = jobType;
      if (minCGPA !== undefined) drive.minCGPA = minCGPA;
      if (allowedBranches) drive.allowedBranches = allowedBranches;
      if (rounds) drive.rounds = rounds;

      // After editing, status remains pending or resets to pending for admin re-approval
      drive.status = 'pending';

      await drive.save();
      return res.json({ message: 'Job drive updated successfully. Pending re-approval.', drive });
    } catch (error) {
      console.error('Edit drive error:', error);
      return res.status(500).json({ message: 'Server error updating job drive' });
    }
  }
);

/**
 * @route   PUT /api/company/drives/:id/close
 * @desc    Close a job drive posting
 */
router.put('/drives/:id/close', async (req, res) => {
  try {
    const drive = await Drive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: 'Job drive not found' });
    }

    if (drive.company.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    drive.status = 'closed';
    await drive.save();

    return res.json({ message: 'Job drive closed successfully', drive });
  } catch (error) {
    console.error('Close drive error:', error);
    return res.status(500).json({ message: 'Server error closing job drive' });
  }
});

/**
 * @route   DELETE /api/company/drives/:id
 * @desc    Delete a drive post and its application submissions
 */
router.delete('/drives/:id', async (req, res) => {
  try {
    const drive = await Drive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: 'Job drive not found' });
    }

    if (drive.company.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized deletion' });
    }

    // Cascading delete: Remove applications associated with this drive
    await Application.deleteMany({ drive: drive._id });

    // Remove the drive
    await Drive.findByIdAndDelete(drive._id);

    return res.json({ message: 'Job drive and associated applications deleted successfully' });
  } catch (error) {
    console.error('Delete drive error:', error);
    return res.status(500).json({ message: 'Server error deleting job drive' });
  }
});

/**
 * @route   GET /api/company/drives/:id/applications
 * @desc    View all candidates who applied to a specific job drive
 */
router.get('/drives/:id/applications', async (req, res) => {
  try {
    const drive = await Drive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: 'Job drive not found' });
    }

    if (drive.company.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const applications = await Application.find({ drive: drive._id })
      .populate('student', 'name email branch cgpa resume')
      .sort({ appliedDate: -1 });

    return res.json({ drive, applications });
  } catch (error) {
    console.error('Fetch drive applications error:', error);
    return res.status(500).json({ message: 'Server error retrieving applications' });
  }
});

/**
 * @route   PUT /api/company/applications/:id/status
 * @desc    Update decision status of an application (Applied, Shortlisted, Selected, Rejected)
 */
router.put('/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Applied', 'Shortlisted', 'Selected', 'Rejected'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status update value' });
    }

    const application = await Application.findById(req.params.id).populate('drive');
    if (!application) {
      return res.status(404).json({ message: 'Application record not found' });
    }

    // Verify company owns the job drive
    if (application.drive.company.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized status update' });
    }

    application.status = status;
    await application.save();

    // Placed Flow: If status is Selected, mark student as placed with CTC
    if (status === 'Selected') {
      const Student = require('../models/Student');
      await Student.findByIdAndUpdate(application.student, {
        isPlaced: true,
        placedCTC: application.drive.ctc || 0
      });
    }

    return res.json({ message: 'Application candidate status updated successfully', application });
  } catch (error) {
    console.error('Update application status error:', error);
    return res.status(500).json({ message: 'Server error updating application status' });
  }
});

module.exports = router;
