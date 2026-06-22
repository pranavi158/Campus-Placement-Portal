import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route protection wrapper. Ensures user is logged in
 * and has one of the allowed roles for the route.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user doesn't have required role, redirect to their default home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`User with role ${user.role} tried to access unauthorized route`);
    
    // Redirect based on actual role
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'company') return <Navigate to="/company" replace />;
    if (user.role === 'student') return <Navigate to="/student" replace />;
    
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
