/**
 * Centralized API configuration.
 * Uses VITE_API_URL if provided in production (e.g. on Vercel),
 * and defaults to http://localhost:5001 for local development.
 */
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Remove trailing slash if present
export const API_BASE_URL = rawUrl.replace(/\/+$/, '');

/**
 * Returns full URL for uploaded files (e.g., student resumes)
 */
export const getUploadUrl = (filename) => {
  if (!filename) return '';
  return `${API_BASE_URL}/uploads/${filename}`;
};

export default API_BASE_URL;
