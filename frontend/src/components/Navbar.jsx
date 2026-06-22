import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <Briefcase size={24} />
          Placement<span>Portal</span>
        </Link>

        <div className="navbar-menu">
          {user ? (
            <>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin" className={`navbar-item ${isActive('/admin') ? 'active' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/admin/drives" className={`navbar-item ${isActive('/admin/drives') ? 'active' : ''}`}>
                    Manage Drives
                  </Link>
                  <Link to="/admin/applications" className={`navbar-item ${isActive('/admin/applications') ? 'active' : ''}`}>
                    All Applications
                  </Link>
                  <Link to="/admin/companies" className={`navbar-item ${isActive('/admin/companies') ? 'active' : ''}`}>
                    Manage Companies
                  </Link>
                  <Link to="/admin/students" className={`navbar-item ${isActive('/admin/students') ? 'active' : ''}`}>
                    Manage Students
                  </Link>
                </>
              )}

              {user.role === 'company' && (
                <>
                  <Link to="/company" className={`navbar-item ${isActive('/company') ? 'active' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/company/profile" className={`navbar-item ${isActive('/company/profile') ? 'active' : ''}`}>
                    Edit Profile
                  </Link>
                </>
              )}

              {user.role === 'student' && (
                <>
                  <Link to="/student" className={`navbar-item ${isActive('/student') ? 'active' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/student/applications" className={`navbar-item ${isActive('/student/applications') ? 'active' : ''}`}>
                    History
                  </Link>
                  <Link to="/student/profile" className={`navbar-item ${isActive('/student/profile') ? 'active' : ''}`}>
                    Edit Profile
                  </Link>
                </>
              )}

              <div className="navbar-user">
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  Welcome, <strong>{user.name}</strong> ({user.role})
                </span>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-secondary btn-sm navbar-logout"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={`navbar-item ${isActive('/login') ? 'active' : ''}`}>
                Login
              </Link>
              <Link to="/register/student" className={`navbar-item ${isActive('/register/student') ? 'active' : ''}`}>
                Student Registration
              </Link>
              <Link to="/register/company" className={`navbar-item ${isActive('/register/company') ? 'active' : ''}`}>
                Company Registration
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
