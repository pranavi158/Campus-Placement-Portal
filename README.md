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

### Placement Officer (Admin) Control
- **Global Overview**: Track placement portal stats (total students registered, companies active, job drives approved, and global applications submitted).
- **Verification Center**: Approve pending company registries and drive posts before they go live.
- **Account Moderation**: Blacklist/restore access for student profiles and recruiter accounts.
- **Paginated Logs**: View student registry records and global application logs using backend query pagination controls.

---

## Tech Stack

- **Frontend**: React (v19), React Router (v6), Vite, Lucide React (Icons).
- **Backend**: Node.js, Express.js, JWT Authentication, Multer (PDF File Uploads).
- **Database**: MongoDB Atlas Cloud database, Mongoose ODM.
- **Security & Quality**: Helmet (HTTP security headers), Express Rate Limit (Auth endpoints brute-force defense), Express Validator (Backend inputs schemas validation and sanitization).

---

## Project Structure

```text
├── backend/                   # Node/Express API Server
│   ├── config/                # DB connections
│   ├── middleware/            # Auth guard, rate limits, validations
│   ├── models/                # Student, Company, Admin schemas
│   ├── routes/                # Sub-routes handlers
│   └── server.js              # Entrypoint server.js
├── frontend/                  # React/Vite Client app
│   ├── src/
│   │   ├── components/        # Reusable Toast, Protected Routes, Navbar
│   │   ├── context/           # Auth provider & local state
│   │   ├── pages/             # Dashboard and Management screens
│   │   └── App.jsx            # Layout routes mapper
└── package.json               # Monorepo concurrently launch runner
```

---

## Installation & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas) (or a local MongoDB instance running)

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
Create a `.env` file in the `backend/` directory based on the `.env.example` file provided:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_uri
JWT_SECRET=your_super_secret_jwt_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
ALLOWED_ORIGINS=http://localhost:5173
```

### Step 3: Run the Application
You can launch both the frontend and backend concurrently with one command from the project root directory:

```bash
# Run from the root directory
npm run dev
```

- **Frontend client**: http://localhost:5173/
- **Backend API**: http://localhost:5001/

---

## Security Implementation
- **HTTP Header Security**: Utilizes `helmet` to set secure response headers preventing cross-site scripting (XSS) and clickjacking.
- **API Rate Limiting**: REST Auth API endpoints are protected against brute-force login attacks using window-based request rules (100 requests per 15 minutes max).
- **Backend Data Validation**: Request payloads undergo strict validation schemas using `express-validator` prior to database writes.
- **Secure Seeding**: Admin configuration uses environment secrets rather than hardcoded credentials.
