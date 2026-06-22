import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Auth Pages
import Login from './pages/Login';
import RegisterStudent from './pages/RegisterStudent';
import RegisterCompany from './pages/RegisterCompany';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import ManageCompanies from './pages/ManageCompanies';
import ManageStudents from './pages/ManageStudents';
import ManageDrives from './pages/ManageDrives';
import ManageApplications from './pages/ManageApplications';

// Company Pages
import CompanyDashboard from './pages/CompanyDashboard';
import CompanyProfile from './pages/CompanyProfile';
import CreateDrive from './pages/CreateDrive';
import EditDrive from './pages/EditDrive';
import ViewApplicants from './pages/ViewApplicants';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentHistory from './pages/StudentHistory';
import NotFound from './pages/NotFound';

/**
 * HomeRedirect: Redirects logged-in users to their role-specific dashboard.
 * Unauthenticated users are sent to /login.
 */
const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'company') return <Navigate to="/company" replace />;
  if (user.role === 'student') return <Navigate to="/student" replace />;

  return <Navigate to="/login" replace />;
};

/**
 * AppRoutes: Contains the entire routing structure.
 * Separated from App so it can access the AuthContext provided by AuthProvider.
 */
const AppRoutes = () => {
  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        <Routes>
          {/* Root redirects based on logged-in role */}
          <Route path="/" element={<HomeRedirect />} />

          {/* ─── Public Auth Routes ─── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register/student" element={<RegisterStudent />} />
          <Route path="/register/company" element={<RegisterCompany />} />

          {/* ─── Admin Routes (admin only) ─── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageCompanies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/drives"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageDrives />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageApplications />
              </ProtectedRoute>
            }
          />

          {/* ─── Company Routes (company only) ─── */}
          <Route
            path="/company"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/profile"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <CompanyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/drive/create"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <CreateDrive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/drive/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <EditDrive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/drive/:id/applications"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <ViewApplicants />
              </ProtectedRoute>
            }
          />

          {/* ─── Student Routes (student only) ─── */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentHistory />
              </ProtectedRoute>
            }
          />

          {/* ─── 404 Fallback ─── */}
          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </main>
    </div>
  );
};

/**
 * App: Root component. Wraps AppRoutes in AuthProvider and Router.
 */
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
