const { Worker } = require('bullmq');
const Student = require('../models/Student');
const { sendEmail } = require('../config/mailer');
const { isRedisConfigured, getRedisConnection } = require('../config/redis');

/**
 * Core business logic: Send new placement drive notification to eligible students
 */
const processDriveNotification = async (data) => {
  const { companyName, title, eligibleBranches, minCGPA, ctc } = data;

  try {
    // Query eligible students from MongoDB (case-insensitive branch matching)
    const query = {};
    if (eligibleBranches && eligibleBranches.length > 0) {
      const branchRegexes = eligibleBranches.map(
        (b) => new RegExp(`^${b.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      );
      query.branch = { $in: branchRegexes };
    }
    if (minCGPA && !isNaN(minCGPA)) {
      query.cgpa = { $gte: parseFloat(minCGPA) };
    }

    const eligibleStudents = await Student.find(query).select('name email branch cgpa');
    console.log(`📧 [Notification] Found ${eligibleStudents.length} eligible student(s) for drive: "${title}" by ${companyName}`);

    if (eligibleStudents.length === 0) {
      console.log(`⚠️ [Notification] No students matched criteria: Branches [${(eligibleBranches || []).join(', ')}], Min CGPA >= ${minCGPA}`);
      return;
    }

    // Broadcast email to each eligible student
    for (const student of eligibleStudents) {
      await sendEmail({
        to: student.email,
        subject: `🎓 New Placement Drive: ${companyName} - ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Hi ${student.name},</h2>
            <p>A new placement drive matching your profile has been posted!</p>
            <div style="background: #f4f6f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Company:</strong> ${companyName}</p>
              <p><strong>Role:</strong> ${title}</p>
              <p><strong>CTC / Package:</strong> ${ctc || 'As per industry standards'}</p>
              <p><strong>Eligible Branches:</strong> ${(eligibleBranches || []).join(', ')}</p>
            </div>
            <p>Log into the <strong>Campus Placement Portal</strong> to apply immediately!</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error(`❌ [Notification Error] Failed to dispatch drive notification:`, err.message);
  }
};

/**
 * Core business logic: Send application status change email to student
 */
const processStatusChange = async (data) => {
  const { studentEmail, studentName, driveTitle, companyName, status } = data;

  try {
    await sendEmail({
      to: studentEmail,
      subject: `📌 Application Update: ${companyName} (${driveTitle})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Hi ${studentName},</h2>
          <p>Your application status for <strong>${driveTitle}</strong> at <strong>${companyName}</strong> has been updated to:</p>
          <h3 style="color: #2563eb; text-transform: uppercase;">${status}</h3>
          <p>Check your placement portal dashboard for further instructions.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error(`❌ [Notification Error] Failed to dispatch status update email:`, err.message);
  }
};

/**
 * Initializes the BullMQ Worker process if Redis is configured.
 */
const startEmailWorker = () => {
  if (!isRedisConfigured()) {
    console.log('⚡ [Email Service] Redis not configured. Running in Direct Asynchronous mode.');
    return null;
  }

  const connection = getRedisConnection();
  const worker = new Worker(
    'emailQueue',
    async (job) => {
      console.log(`\n⚙️ [BullMQ Worker] Processing Job ID: ${job.id} - Type: ${job.name}`);

      if (job.name === 'sendDriveNotification') {
        await processDriveNotification(job.data);
      } else if (job.name === 'sendApplicationStatusChange') {
        await processStatusChange(job.data);
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on('completed', (job) => {
    console.log(`✅ [BullMQ Worker] Job ${job.id} (${job.name}) completed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [BullMQ Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.warn('⚠️ [BullMQ Worker] Redis warning:', err.message);
  });

  console.log('🚀 [BullMQ Worker] Email Queue Worker active and listening to Redis...');
  return worker;
};

module.exports = {
  startEmailWorker,
  processDriveNotification,
  processStatusChange,
};
