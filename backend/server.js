require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Models (required for seeding)
const Admin = require('./models/Admin');

const http = require('http');
const { Server } = require('socket.io');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const companyRoutes = require('./routes/companyRoutes');
const studentRoutes = require('./routes/studentRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const { initInterviewSocket } = require('./socket/interviewSocket');

// Connect to Database
connectDB();

// Initialize BullMQ Redis Email Worker
const { startEmailWorker } = require('./workers/emailWorker');
try {
  startEmailWorker();
} catch (err) {
  console.error('Failed to initialize Redis Email Worker:', err.message);
}

const app = express();
const httpServer = http.createServer(app);

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Prevent CSP from blocking WebRTC video streams and embedded PDF previews
}));

// CORS Whitelist config
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    
    // Check if origin is in whitelist, is any localhost port, or is a Vercel preview/production domain
    const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin);
    const isVercel = /\.vercel\.app$/.test(origin);
    if (rawAllowedOrigins.includes(origin) || isLocalhost || isVercel) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json()); // Parse incoming JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse url-encoded form values

// Auth Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Initialize Socket.io with matching CORS policy
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin);
      const isVercel = /\.vercel\.app$/.test(origin);
      if (rawAllowedOrigins.includes(origin) || isLocalhost || isVercel) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
});

// Attach io to express app for access inside route controllers
app.set('io', io);

// Initialize real-time interview signaling & collaborative code sync
initInterviewSocket(io);

// Ensure uploads directory exists on host
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded PDF resumes statically
app.use('/uploads', express.static(uploadsDir));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/interviews', interviewRoutes);

// Base route to check API health
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Seed default admin account on startup
const seedAdmin = async () => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    const adminExists = await Admin.findOne({ username: adminUsername });
    if (!adminExists) {
      console.log('Seeding default admin account...');
      await Admin.create({
        username: adminUsername,
        password: adminPassword, // The pre-save model hook will automatically hash this password
      });
      console.log(`Default admin account created successfully (Username: ${adminUsername})`);
    }
  } catch (error) {
    console.error('Error seeding admin account:', error.message);
  }
};

// Execute seeding logic
seedAdmin();

// Global 404 Route handler for API
app.use((req, res, next) => {
  res.status(404).json({ message: `Endpoint not found: ${req.originalUrl}` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    message: 'An unexpected internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running in environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server listening on port: ${PORT} (HTTP + Socket.io)`);
});
