/**
 * Redis connection configuration for BullMQ
 * Supports local Redis, Upstash Redis, Render Redis, and cloud REDIS_URL.
 */

/**
 * Checks if a Redis server has been explicitly configured in environment variables.
 * Returns false if Redis is omitted, allowing the app to run in standalone mode.
 */
const isRedisConfigured = () => {
  if (process.env.DISABLE_REDIS === 'true') return false;
  return Boolean(
    process.env.REDIS_URL ||
    process.env.ENABLE_REDIS === 'true' ||
    (process.env.REDIS_HOST && process.env.REDIS_HOST !== '127.0.0.1')
  );
};

const getRedisConnection = () => {
  if (process.env.REDIS_URL) {
    try {
      const url = new URL(process.env.REDIS_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        username: url.username || undefined,
        password: url.password ? decodeURIComponent(url.password) : undefined,
        tls: url.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null,
      };
    } catch (err) {
      console.error('Failed to parse REDIS_URL, falling back to host/port:', err.message);
    }
  }

  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true' ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: null,
  };
};

module.exports = { isRedisConfigured, getRedisConnection };
