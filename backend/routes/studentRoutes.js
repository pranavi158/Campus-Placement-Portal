const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/authMiddleware');
const Student = require('../models/Student');
const Drive = require('../models/Drive');
const Application = require('../models/Application');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique name: studentId-timestamp.pdf
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// PDF file filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Protect all routes with authentication and check for student role
router.use(protect);
router.use(authorize('student'));

/**
 * @route   GET /api/student/profile
 * @desc    Get current student details
 */
router.get('/profile', async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    return res.json(student);
  } catch (error) {
    console.error('Fetch student profile error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

/**
 * @route   PUT /api/student/profile
 * @desc    Update student profile details (supports PDF upload)
 */
router.put('/profile', (req, res) => {
  // Use upload.single('resume') middleware. Handles errors cleanly.
  upload.single('resume')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { name, branch, cgpa, rollNo, phone, skills, linkedIn, github, yearOfPassing, backlogs } = req.body;
      const student = await Student.findById(req.user.id);

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // If user is blacklisted, prevent updates
      if (student.blacklisted) {
        return res.status(403).json({ message: 'Your account is blacklisted, update denied' });
      }

      if (name) student.name = name;
      if (branch) student.branch = branch;
      if (cgpa) student.cgpa = parseFloat(cgpa);
      if (rollNo !== undefined) student.rollNo = rollNo;
      if (phone !== undefined) student.phone = phone;
      if (linkedIn !== undefined) student.linkedIn = linkedIn;
      if (github !== undefined) student.github = github;
      if (yearOfPassing !== undefined) student.yearOfPassing = parseInt(yearOfPassing);
      if (backlogs !== undefined) student.backlogs = parseInt(backlogs);
      
      if (skills !== undefined) {
        student.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
      }

      // Save filename in the DB if uploaded
      if (req.file) {
        // Optional: Delete previous resume file to save space
        if (student.resume) {
          const oldPath = path.join(uploadDir, student.resume);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (err) {
              console.error('Error removing old resume file:', err);
            }
          }
        }
        student.resume = req.file.filename;
      }

      await student.save();

      // Return student details excluding password
      const updatedStudent = student.toObject();
      delete updatedStudent.password;

      return res.json({
        message: 'Profile updated successfully',
        student: updatedStudent
      });
    } catch (error) {
      console.error('Update student profile error:', error);
      return res.status(500).json({ message: 'Server error updating profile' });
    }
  });
});

/**
 * @route   GET /api/student/drives
 * @desc    Get all approved drives and indicate application status (supports query filtering)
 */
router.get('/drives', async (req, res) => {
  try {
    const { search, jobType, location, minCGPA } = req.query;
    let query = { status: 'approved' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { eligibility: { $regex: search, $options: 'i' } }
      ];
    }
    if (jobType) {
      query.jobType = jobType;
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (minCGPA) {
      query.minCGPA = { $lte: parseFloat(minCGPA) };
    }

    // Get all matching approved job postings
    const drives = await Drive.find(query)
      .populate('company', 'name industry site hr')
      .sort({ deadline: 1 }); // Sort by deadline (closest first)

    // Find drive IDs the student has already applied to
    const applications = await Application.find({ student: req.user.id });
    const appliedDriveIds = applications.map(app => app.drive.toString());

    // Format the list to show applied state for the UI
    const formattedDrives = drives.map(drive => {
      const driveObj = drive.toObject();
      driveObj.hasApplied = appliedDriveIds.includes(drive._id.toString());
      return driveObj;
    });

    return res.json(formattedDrives);
  } catch (error) {
    console.error('Fetch student drives error:', error);
    return res.status(500).json({ message: 'Server error retrieving job drives' });
  }
});

/**
 * @route   POST /api/student/apply/:driveId
 * @desc    Apply to a specific drive
 */
router.post('/apply/:driveId', async (req, res) => {
  try {
    const driveId = req.params.driveId;

    // Check blacklist status
    const student = await Student.findById(req.user.id);
    if (student.blacklisted) {
      return res.status(403).json({ message: 'Your account is blacklisted. Application denied.' });
    }

    // Verify drive exists and is approved
    const drive = await Drive.findById(driveId);
    if (!drive || drive.status !== 'approved') {
      return res.status(400).json({ message: 'This job drive is not active or not approved' });
    }

    // Check if deadline has passed
    if (new Date() > new Date(drive.deadline)) {
      return res.status(400).json({ message: 'The application deadline for this drive has passed' });
    }

    // Check if already applied
    const existingApp = await Application.findOne({
      student: req.user.id,
      drive: driveId
    });

    if (existingApp) {
      return res.status(400).json({ message: 'You have already applied to this job drive' });
    }

    // Create application
    const application = await Application.create({
      student: req.user.id,
      drive: driveId,
      status: 'Applied'
    });

    return res.status(201).json({
      message: 'Successfully applied for ' + drive.title,
      application
    });
  } catch (error) {
    console.error('Job application submission error:', error);
    return res.status(500).json({ message: 'Server error processing job application' });
  }
});

/**
 * @route   GET /api/student/applications
 * @desc    Get student's application history
 */
router.get('/applications', async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .populate({
        path: 'drive',
        select: 'title jd eligibility deadline company',
        populate: {
          path: 'company',
          select: 'name industry'
        }
      })
      .sort({ appliedDate: -1 });

    return res.json(applications);
  } catch (error) {
    console.error('Fetch student history error:', error);
    return res.status(500).json({ message: 'Server error retrieving applications history' });
  }
});

module.exports = router;
