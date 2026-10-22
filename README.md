# Campus Placement Portal

A modern, highly secure, and feature-rich **MERN-stack** (MongoDB, Express.js, React.js, Node.js) web application designed to streamline campus recruitment drives, student job application cycles, and university placement officer admin management.

---

## Key Features

### Student Dashboard
- **Profile Customization**: Manage contact information, roll number, year of passing, active backlogs, LinkedIn/GitHub urls, and academic branch/specialization.
- **Interactive Resume Desk**: Upload PDF resumes safely with size limits (< 5MB) and automated old-file cleanups.
- **Job Opportunities & Search**: Browse actively approved recruiter job postings with search keyword parameters (location, job type, minimum CGPA).
- **Placement & CTC Records**: Track application logs (Applied, Shortlisted, Selected, Rejected) and view congratulations notifications once placed, indicating the CTC package package.

### Recruiter / Company Panel
- **Company Verification Request**: Register corporate industry sector, website address, and HR representative details (awaits admin approval).
- **Job Drive Manager**: Create, update, and close job postings specifying details such as location, CTC offered, min CGPA requirements, interview rounds, and eligible branches.
- **Applicant Review Desk**: Access and filter candidate profiles who applied for posted job drives and view resume PDFs.
- **Candidate Hiring Panel**: Shortlist, reject, or select candidates (hiring a candidate automatically marks the student as placed with the drive's CTC).

### 💻 In-App Live Technical Interview Room
- **Unified Technical Evaluation**: Replaces external meeting links with an in-portal technical interview room at `/interview/:roomId`.
- **WebRTC Peer-to-Peer Calling**: Encrypted direct audio/video streaming, mic mute/unmute, and camera toggle with Google STUN server NAT traversal.
- **Real-Time Collaborative Code Editor**: Multi-language scratchpad (JavaScript, Python, C++, Java) synchronized live between student and interviewer using Socket.io with tab-indentation and problem templates (Two Sum, Valid Parentheses, Blank).
- **Authenticated Room Access**: Server-validated JWT authorization ensuring only the authorized candidate and recruiter can join and broadcast changes.
- **Connection State Tracking**: Real-time P2P connection status (Ready → Connecting → Live → Failed) with user-facing notifications for disconnections and failures.
- **Auto-Save & Code Persistence**: Interview code is auto-saved to MongoDB with 1.5s debounce and automatically persisted when the last participant leaves the room.

### 👑 Placement Officer (Admin) Control
- **Global Overview**: Track placement portal stats (total students registered, companies active, job drives approved, and global applications submitted).
- **Verification Center**: Approve pending company registries and drive posts before they go live.
- **Account Moderation**: Blacklist/restore access for student profiles and recruiter accounts.
- **Paginated Logs**: View student registry records and global application logs using backend query pagination controls.

---

## Tech Stack

- **Frontend**: React (v19), React Router (v6), Vite, Lucide React, Socket.io-client.
- **Backend**: Node.js, Express.js, HTTP Server, Socket.io, BullMQ, Redis, JWT Authentication, Multer (PDF File Uploads).
- **Real-Time Protocols**: WebRTC (`RTCPeerConnection` P2P Audio/Video/Screen), WebSockets (Full-duplex Socket.io signaling & collaborative code sync).
- **Database**: MongoDB Atlas Cloud database, Mongoose ODM.
- **Security & Quality**: Helmet (HTTP security headers), Express Rate Limit (Auth endpoints brute-force defense), Express Validator (Backend inputs schemas validation and sanitization).

---

## 🏗️ Real-Time Interview Architecture

The live interview system is the core differentiator of this project. Below is the technical architecture:

### Signaling Flow (Socket.io + WebRTC)

```
┌──────────────┐                ┌─────────────────┐                ┌──────────────┐
│   Recruiter   │                │  Socket.io       │                │   Student     │
│   (Browser)   │                │  Server (Node)   │                │   (Browser)   │
└──────┬───────┘                └────────┬────────┘                └──────┬───────┘
       │                                  │                                │
       │── join-interview-room ──────────▶│                                │
       │◀── sync-room-state ─────────────│                                │
       │                                  │◀── join-interview-room ────────│
       │                                  │── sync-room-state ────────────▶│
       │◀── user-joined ─────────────────│── user-joined ─────────────────▶│
       │                                  │                                │
       │── webrtc-offer (SDP) ──────────▶│── webrtc-offer (SDP) ─────────▶│
       │                                  │◀── webrtc-answer (SDP) ────────│
       │◀── webrtc-answer (SDP) ─────────│                                │
       │                                  │                                │
       │◀─────── ICE candidates ────────▶│◀─────── ICE candidates ───────▶│
       │                                  │                                │
       │◀═══════ Direct P2P Media Stream (WebRTC, encrypted) ════════════▶│
       │                                  │                                │
       │── code-change ─────────────────▶│── code-change ─────────────────▶│
       │◀── code-change ────────────────│◀── code-change ────────────────│
       │                                  │                                │
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **WebRTC for video** (not WebSocket streaming) | P2P eliminates server bandwidth for media. Audio/video flows directly between peers. |
| **Socket.io for signaling** (not REST polling) | Full-duplex needed for SDP/ICE exchange and real-time code sync. |
| **In-memory room cache** (`Map`) | Code state stays in RAM for instant reads. Persisted to MongoDB on save/eviction. |
| **STUN only** (no TURN) | Sufficient for campus LAN/most NAT types. TURN requires hosting a relay server. |
| **JWT auth on Socket.io** | Same auth middleware as REST API; prevents unauthorized room joins. |
| **localStreamRef pattern** | Prevents WebRTC peer connection teardown on mic/camera toggle. |

### Interview Data Lifecycle

```
Company clicks "Interview" → POST /api/interviews/create
  → Creates Interview doc with unique roomId
  → Redirects to /interview/:roomId

Both users join → Socket.io "join-interview-room"
  → Server validates JWT + room authorization
  → Sends "sync-room-state" (code, language, participants)
  → WebRTC signaling begins (offer → answer → ICE)

During interview:
  → Code changes broadcast via Socket.io (real-time)
  → Auto-saved to MongoDB every 1.5s (debounced)
  → Video/audio flows P2P (WebRTC)

On disconnect:
  → "user-left" broadcast to remaining peer
  → When room empties, final code persisted + room cache evicted
```

---

## 📁 Project Structure

```text
├── backend/                       # Node/Express API Server
│   ├── config/                    # DB connections
│   ├── middleware/                # Auth guard, rate limits, validations
│   ├── models/                   # Mongoose schemas
│   │   ├── Student.js            # Student profile + placement data
│   │   ├── Company.js            # Company profile + approval status
│   │   ├── Admin.js              # Admin auth credentials
│   │   ├── Drive.js              # Job posting + eligibility criteria
│   │   ├── Application.js        # Student ↔ Drive applications
│   │   └── Interview.js          # Live interview room state
│   ├── routes/                   # Express route handlers
│   │   ├── authRoutes.js         # Login/register endpoints
│   │   ├── adminRoutes.js        # Admin management endpoints
│   │   ├── companyRoutes.js      # Company drives + applicant actions
│   │   ├── studentRoutes.js      # Student profile + application actions
│   │   └── interviewRoutes.js    # Interview room CRUD + active lookup
│   ├── socket/                   # Socket.io event handlers
│   │   └── interviewSocket.js    # WebRTC signaling + code sync
│   ├── queues/                   # BullMQ job queues
│   │   └── emailQueue.js         # Email notification queue
│   ├── workers/                  # Background workers
│   │   └── emailWorker.js        # Email queue processor
│   └── server.js                 # Entrypoint (HTTP + Socket.io)
├── frontend/                      # React/Vite Client app
│   ├── src/
│   │   ├── components/           # Toast, ProtectedRoute, Navbar
│   │   ├── config/               # API base URL + Socket.io client
│   │   │   ├── api.js            # REST API configuration
│   │   │   └── socket.js         # Socket.io singleton (JWT auth)
│   │   ├── context/              # AuthContext provider
│   │   ├── pages/                # All dashboard + management pages
│   │   │   ├── InterviewRoom.jsx # Live interview suite (1050+ lines)
│   │   │   ├── StudentDashboard  # Browse drives + apply
│   │   │   ├── CompanyDashboard  # Manage drives + applicants
│   │   │   ├── ViewApplicants    # Review + interview candidates
│   │   │   └── ...               # Admin, Profile, History pages
│   │   └── App.jsx               # Route configuration
└── package.json                   # Monorepo concurrently launch runner
```

---

## Installation & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas) (or a local MongoDB instance running)
- **Optional**: [Redis](https://redis.io/) for BullMQ email queuing (falls back to direct async mode if unavailable)

### Step 1: Clone and install dependencies
```bash
git clone https://github.com/pranavi158/Campus-Placement-Portal.git
cd Campus-Placement-Portal

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the `backend/` directory based on the `backend/.env.example` file provided:

```env
PORT=5001
NODE_ENV=development
MONGO_URI=your_mongodb_connection_uri
JWT_SECRET=your_super_secret_jwt_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app

# Optional: Upstash or Local Redis URL for BullMQ email queue (omit to run in direct async mode)
# REDIS_URL=rediss://default:password@endpoint.upstash.io:6379

# Optional: Custom SMTP for email notifications (defaults to Ethereal in development)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
```

Create a `.env` file in the `frontend/` directory (optional for local, defaults to port 5001):
```env
VITE_API_URL=http://localhost:5001
```

### Step 3: Run the Application
You can launch both the frontend and backend concurrently with one command from the project root directory:

```bash
# Run from the root directory
npm run dev
```

- **Frontend client**: http://localhost:5173/
- **Backend API**: http://localhost:5001/

### Step 4: Using the Live Interview Room
1. **Login as a Company** → Navigate to a drive → View Applicants → Click the **"Interview"** button next to any shortlisted applicant.
2. **Login as the Student** in another browser/window → Go to **Application History** → Click **"Join Interview"** on the active interview badge.
3. Both participants are now in the synchronized room with:
   - P2P video/audio calling
   - Real-time collaborative code editor
   - Problem templates and language switching
   - Code auto-saved directly to MongoDB

> **Note**: WebRTC media streaming utilizes Google STUN servers. For cross-network NAT traversal in enterprise/restricted firewalls, a TURN server relay can be configured.

---

## 🐛 Identified Bugs & Engineering Fixes

During the development and testing of the live interview and real-time infrastructure, several non-trivial edge cases and race conditions were identified and resolved:

### 1. WebRTC Asymmetric / One-Way Video Stream Bug
- **Issue**: One participant (e.g. interviewer) could see their own video and the candidate's video, but the candidate could only see their own local camera feed.
- **Root Cause**: The `RTCPeerConnection` instance was created immediately upon component mount before the browser's asynchronous `navigator.mediaDevices.getUserMedia()` had finished requesting user camera permissions. When the SDP offer was generated, zero media tracks were attached. Consequently, subsequent answers from the remote peer negotiated zero video tracks.
- **Fix**: Synchronized the WebRTC initialization lifecycle in [InterviewRoom.jsx](file:///Users/pranavi/Placement%20Portal%20copy/frontend/src/pages/InterviewRoom.jsx) using a gated trigger: the peer connection is instantiated only after `localStream` (or confirmed `mediaError`) is available. Media tracks are added prior to `createOffer()`, guaranteeing symmetric bidirectional video negotiation.

### 2. Out-of-Order ICE Candidate Arrival
- **Issue**: Network jitter or rapid signaling caused ICE candidate events to arrive before the remote SDP description was processed, triggering `InvalidStateError: Failed to execute 'addIceCandidate' on 'RTCPeerConnection': remote description is null`.
- **Fix**: Implemented an in-memory ICE candidate queue (`iceCandidateQueue`). Candidates arriving before `pc.remoteDescription` is set are held in buffer and automatically flushed via `flushIceQueue()` once `setRemoteDescription()` resolves.

### 3. Media Toggle Teardown & Re-negotiation Loop
- **Issue**: Toggling the microphone mute or camera off caused React state updates that re-triggered the main connection `useEffect`, tearing down the WebRTC connection mid-call.
- **Fix**: Decoupled device hardware track controls (`track.enabled = !track.enabled`) from peer connection initialization using `hasInitializedRef.current` and `localStreamRef`. Peer connections persist uninterrupted across UI toggles.

### 4. Redis Dependency & Infrastructure Resilience
- **Issue**: Local environments or basic deployments without a running Redis instance caused BullMQ connection crashes on server startup.
- **Fix**: Engineered an adaptive dual-mode email system in [mailer.js](file:///Users/pranavi/Placement%20Portal%20copy/backend/config/mailer.js) and [emailQueue.js](file:///Users/pranavi/Placement%20Portal%20copy/backend/queues/emailQueue.js). If `REDIS_URL` or `REDIS_HOST` is not configured, the service seamlessly degrades to direct asynchronous in-process dispatch with zero disruption.

### 5. Helmet CSP Blocking WebRTC & PDF Resumes
- **Issue**: Default Helmet Content Security Policy (CSP) blocked WebRTC peer media elements and embedded resume preview blobs.
- **Fix**: Configured Helmet in [server.js](file:///Users/pranavi/Placement%20Portal%20copy/backend/server.js) with `contentSecurityPolicy: false` while keeping all other HTTP security headers (X-Frame-Options, DNS Prefetch Control, HSTS, No-Sniff) active.

### 6. CORS & Origin Resolution for Socket.IO
- **Issue**: Socket.io connections failed handshake when deployed across different ports or on Vercel preview URLs.
- **Fix**: Added dynamic origin verification supporting regex checks for `localhost:*` and `*.vercel.app` domains alongside explicitly configured `ALLOWED_ORIGINS`.

---

## Security Implementation
- **HTTP Header Security**: Utilizes `helmet` to set secure response headers preventing cross-site scripting (XSS) and clickjacking.
- **API Rate Limiting**: REST Auth API endpoints are protected against brute-force login attacks using window-based request rules (100 requests per 15 minutes max).
- **Backend Data Validation**: Request payloads undergo strict validation schemas using `express-validator` prior to database writes.
- **Secure Seeding**: Admin configuration uses environment secrets rather than hardcoded credentials.
- **Socket.io JWT Auth**: WebSocket connections are authenticated with the same JWT middleware, preventing unauthorized access to interview rooms.
- **Room-Level Authorization**: Both REST and Socket endpoints verify that only the assigned student, recruiter, or admin can access a specific interview room.

---

## 🎯 Motivation

> During university campus drives, students and recruiters deal with massive link fragmentation — Company A sends an MS Teams link that lands in spam, Company B uses Google Meet with a different link per round, Company C uses Zoom. **This portal eliminates that friction** by consolidating the entire recruitment lifecycle — from job posting to application to live technical interview — into a single authenticated platform.

