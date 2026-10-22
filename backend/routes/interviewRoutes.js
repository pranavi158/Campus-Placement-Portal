const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const Interview = require('../models/Interview');
const Application = require('../models/Application');

const router = express.Router();

/**
 * @route   POST /api/interviews/create
 * @desc    Initialize or retrieve a live interview room for an applicant
 * @access  Private (Company only)
 */
router.post('/create', protect, authorize('company'), async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      return res.status(400).json({ message: 'applicationId is required' });
    }

    const application = await Application.findById(applicationId)
      .populate('drive')
      .populate('student', 'name email branch');

    if (!application) {
      return res.status(404).json({ message: 'Application record not found' });
    }

    // Verify company owns this drive
    if (application.drive.company.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to schedule interview for this drive' });
    }

    // Check if an active interview already exists for this application
    let interview = await Interview.findOne({
      application: application._id,
      status: { $in: ['active', 'scheduled'] },
    })
      .populate('student', 'name email branch')
      .populate('drive', 'title jd ctc rounds')
      .populate('company', 'name industry');

    if (!interview) {
      const generatedRoomId = `intv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      interview = await Interview.create({
        roomId: generatedRoomId,
        application: application._id,
        drive: application.drive._id,
        company: req.user.id,
        student: application.student._id,
        title: `${application.drive.title} - Technical Interview`,
        status: 'active',
      });

      interview = await Interview.findById(interview._id)
        .populate('student', 'name email branch')
        .populate('drive', 'title jd ctc rounds')
        .populate('company', 'name industry');
    }

    return res.json({
      message: 'Interview room initialized successfully',
      interview,
      roomId: interview.roomId,
    });
  } catch (error) {
    console.error('Create interview room error:', error);
    return res.status(500).json({ message: 'Failed to create interview session' });
  }
});

/**
 * @route   GET /api/interviews/room/:roomId
 * @desc    Get interview session details and participant metadata
 * @access  Private (Student, Company, Admin)
 */
router.get('/room/:roomId', protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const interview = await Interview.findOne({ roomId })
      .populate('student', 'name email branch')
      .populate('drive', 'title jd ctc rounds location jobType')
      .populate('company', 'name industry')
      .populate('application');

    if (!interview) {
      return res.status(404).json({ message: 'Interview room not found' });
    }

    // Authorization check: User must be student, company, or admin
    const userId = req.user.id;
    const userRole = req.user.role;

    const isStudent = userRole === 'student' && interview.student._id.toString() === userId;
    const isCompany = userRole === 'company' && interview.company._id.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isStudent && !isCompany && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to join this interview room' });
    }

    return res.json({
      interview,
      role: userRole,
      isHost: isCompany,
    });
  } catch (error) {
    console.error('Fetch interview room error:', error);
    return res.status(500).json({ message: 'Server error retrieving interview room' });
  }
});

/**
 * @route   GET /api/interviews/active
 * @desc    Get any active/pending interviews for the current logged-in user
 * @access  Private (Student or Company)
 */
router.get('/active', protect, async (req, res) => {
  try {
    const query = { status: { $in: ['active', 'scheduled'] } };
    if (req.user.role === 'student') {
      query.student = req.user.id;
    } else if (req.user.role === 'company') {
      query.company = req.user.id;
    } else {
      return res.json({ interviews: [] });
    }

    const interviews = await Interview.find(query)
      .populate('drive', 'title ctc location')
      .populate('company', 'name')
      .populate('student', 'name email branch')
      .sort({ updatedAt: -1 })
      .limit(10);

    return res.json({ interviews });
  } catch (error) {
    console.error('Fetch active interviews error:', error);
    return res.status(500).json({ message: 'Server error retrieving active interviews' });
  }
});

module.exports = router;
