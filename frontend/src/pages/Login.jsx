import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('student'); // Default role
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Toast state
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setToast({ message: 'Please enter all fields', type: 'error' });
      return;
    }

    setSubmitting(true);
    const result = await login(email, password, role);
    setSubmitting(false);

    if (result.success) {
      navigate('/');
    } else {
      setToast({ message: result.message || 'Login failed', type: 'error' });
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to your Placement Portal account</p>
        </div>

        {/* Tab switcher for login role selection */}
        <div className="tab-switcher">
          <button
            type="button"
            className={`tab-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button
            type="button"
            className={`tab-btn ${role === 'company' ? 'active' : ''}`}
            onClick={() => setRole('company')}
          >
            Company
          </button>
          <button
            type="button"
            className={`tab-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              {role === 'admin' ? 'Username' : 'Email Address'}
            </label>
            <input
              type={role === 'admin' ? 'text' : 'email'}
              id="email"
              className="form-control"
              placeholder={role === 'admin' ? 'Enter admin username' : 'Enter your email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {role === 'student' && (
            <p>
              New student? <Link to="/register/student">Register here</Link>
            </p>
          )}
          {role === 'company' && (
            <p>
              Recruiter? <Link to="/register/company">Apply for account</Link>
            </p>
          )}
          {role === 'admin' && (
            <p style={{ fontStyle: 'italic' }}>
              Admin credentials are seeded during system boot.
            </p>
          )}
        </div>
      </div>

      {toast && (
        <div className="toast-container">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
};

export default Login;
