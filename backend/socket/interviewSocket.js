const jwt = require('jsonwebtoken');
const Interview = require('../models/Interview');

// In-memory room state cache for real-time collaboration
const activeRooms = new Map();

/**
 * Initializes Socket.io handlers for WebRTC peer signaling and
 * collaborative code editor synchronization with JWT authentication.
 */
function initInterviewSocket(io) {
  // Socket.io JWT Authentication Middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization &&
          socket.handshake.headers.authorization.split(' ')[1]);

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretjwtkey12345!'
      );

      socket.user = {
        id: decoded.id,
        role: decoded.role,
        name: decoded.name,
      };

      return next();
    } catch (err) {
      return next(new Error('Invalid or expired socket token'));
    }
  });

  io.on('connection', (socket) => {
    let currentRoomId = null;

    // Join dedicated interview room with server-side authorization check
    socket.on('join-interview-room', async ({ roomId }) => {
      if (!roomId || typeof roomId !== 'string') {
        socket.emit('error', { message: 'Invalid roomId parameter' });
        return;
      }

      try {
        const interview = await Interview.findOne({ roomId });
        if (!interview) {
          socket.emit('error', { message: 'Interview session not found' });
          return;
        }

        const userId = socket.user.id;
        const userRole = socket.user.role;
        const isStudent = userRole === 'student' && interview.student.toString() === userId;
        const isCompany = userRole === 'company' && interview.company.toString() === userId;
        const isAdmin = userRole === 'admin';

        if (!isStudent && !isCompany && !isAdmin) {
          socket.emit('error', { message: 'Unauthorized room access' });
          return;
        }

        currentRoomId = roomId;
        socket.currentRoomId = roomId;
        socket.join(roomId);

        // Initialize room state cache if not present
        if (!activeRooms.has(roomId)) {
          let initialCode =
            interview.code ||
            `// Write your solution here\nfunction solveProblem(input) {\n  console.log("Processing input:", input);\n  return true;\n}\n\n// Test cases\nconsole.log(solveProblem([1, 2, 3]));\n`;
          let initialLanguage = interview.language || 'javascript';

          activeRooms.set(roomId, {
            code: initialCode,
            language: initialLanguage,
            participants: new Map(),
          });
        }

        const roomData = activeRooms.get(roomId);
        roomData.participants.set(socket.id, {
          id: socket.user.id,
          name: socket.user.name || (socket.user.role === 'company' ? 'Recruiter' : 'Student'),
          role: socket.user.role,
          socketId: socket.id,
        });

        const participantList = Array.from(roomData.participants.values());

        // Send initial synchronized state to the joiner
        socket.emit('sync-room-state', {
          code: roomData.code,
          language: roomData.language,
          participants: participantList,
        });

        // Notify other peer in the room
        socket.to(roomId).emit('user-joined', {
          user: {
            id: socket.user.id,
            name: socket.user.name || (socket.user.role === 'company' ? 'Recruiter' : 'Student'),
            role: socket.user.role,
          },
          participants: participantList,
          socketId: socket.id,
        });
      } catch (err) {
        console.error('Error joining interview room:', err.message);
        socket.emit('error', { message: 'Failed to join interview room' });
      }
    });

    // --- WebRTC Signaling Handlers (Peer-to-Peer Audio/Video) ---
    socket.on('webrtc-offer', ({ roomId, sdp }) => {
      if (!roomId || socket.currentRoomId !== roomId || !sdp) return;
      socket.to(roomId).emit('webrtc-offer', { sdp, from: socket.id });
    });

    socket.on('webrtc-answer', ({ roomId, sdp }) => {
      if (!roomId || socket.currentRoomId !== roomId || !sdp) return;
      socket.to(roomId).emit('webrtc-answer', { sdp, from: socket.id });
    });

    socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
      if (!roomId || socket.currentRoomId !== roomId || !candidate) return;
      socket.to(roomId).emit('webrtc-ice-candidate', { candidate, from: socket.id });
    });

    // --- Collaborative Code Editor Handlers ---
    socket.on('code-change', ({ roomId, code }) => {
      if (!roomId || socket.currentRoomId !== roomId || typeof code !== 'string') return;
      const room = activeRooms.get(roomId);
      if (room) {
        room.code = code;
      }
      socket.to(roomId).emit('code-change', { code });
    });

    socket.on('language-change', ({ roomId, language }) => {
      if (!roomId || socket.currentRoomId !== roomId || !language) return;
      const room = activeRooms.get(roomId);
      if (room) {
        room.language = language;
      }
      socket.to(roomId).emit('language-change', { language });
    });

    // Save code to MongoDB on demand or debounce
    socket.on('save-code', async ({ roomId, code, language }) => {
      if (!roomId || socket.currentRoomId !== roomId) return;
      try {
        await Interview.findOneAndUpdate(
          { roomId },
          { code, language },
          { new: true }
        );
      } catch (err) {
        console.error('Error auto-saving interview code:', err.message);
      }
    });

    // Handle Disconnect & Leave
    const handleLeave = () => {
      if (currentRoomId && activeRooms.has(currentRoomId)) {
        const room = activeRooms.get(currentRoomId);
        room.participants.delete(socket.id);

        const updatedParticipants = Array.from(room.participants.values());
        socket.to(currentRoomId).emit('user-left', {
          user: socket.user,
          participants: updatedParticipants,
          socketId: socket.id,
        });

        if (room.participants.size === 0) {
          // Persist final code to DB before memory eviction
          if (room.code) {
            Interview.findOneAndUpdate(
              { roomId: currentRoomId },
              { code: room.code, language: room.language }
            ).catch((e) => console.warn('Eviction sync failed:', e.message));
          }
          activeRooms.delete(currentRoomId);
        }

        socket.leave(currentRoomId);
        currentRoomId = null;
        socket.currentRoomId = null;
      }
    };

    socket.on('leave-interview-room', handleLeave);
    socket.on('disconnect', handleLeave);
  });
}

module.exports = { initInterviewSocket };
