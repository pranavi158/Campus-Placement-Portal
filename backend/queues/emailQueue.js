const { Queue } = require('bullmq');
const { isRedisConfigured, getRedisConnection } = require('../config/redis');
const { processDriveNotification, processStatusChange } = require('../workers/emailWorker');

let emailQueue = null;

// Only instantiate BullMQ Queue if Redis is configured
if (isRedisConfigured()) {
  try {
    const connection = getRedisConnection();
    emailQueue = new Queue('emailQueue', { connection });

    emailQueue.on('error', (err) => {
      console.warn('⚠️ [BullMQ emailQueue] Redis connection warning:', err.message);
    });

    console.log('📬 [BullMQ] Email Queue initialized with Redis connection.');
  } catch (err) {
    console.error('Failed to initialize BullMQ emailQueue:', err.message);
    emailQueue = null;
  }
}

/**
 * Adds a drive notification job to the background queue or executes it directly in the background.
 */
const addDriveNotificationJob = async (driveData) => {
  if (emailQueue) {
    return await emailQueue.add('sendDriveNotification', driveData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 100,
    });
  }

  // Fallback: Run asynchronously in the background via Node.js event loop
  setImmediate(() => {
    processDriveNotification(driveData).catch((err) =>
      console.error('Direct drive notification error:', err.message)
    );
  });
  return { id: 'direct-async-' + Date.now(), name: 'sendDriveNotification' };
};

/**
 * Adds an application status change notification job to the queue or executes directly.
 */
const addStatusChangeJob = async (statusData) => {
  if (emailQueue) {
    return await emailQueue.add('sendApplicationStatusChange', statusData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    });
  }

  // Fallback: Run asynchronously in the background via Node.js event loop
  setImmediate(() => {
    processStatusChange(statusData).catch((err) =>
      console.error('Direct status change notification error:', err.message)
    );
  });
  return { id: 'direct-async-' + Date.now(), name: 'sendApplicationStatusChange' };
};

module.exports = {
  emailQueue,
  addDriveNotificationJob,
  addStatusChangeJob,
};
