import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const RegisterStudent = () => {
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [cgpa, setCgpa] = useState('');

  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !branch || !cgpa) {
      setToast({ message: 'All fields are required', type: 'error' });
      return;
    }

    const cgpaVal = parseFloat(cgpa);
    if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) {
      setToast({ message: 'CGPA must be a number between 0 and 10', type: 'error' });
      return;
    }

    setSubmitting(true);
    const result = await registerStudent({
      name,
      email,
      password,
      branch,
      cgpa: cgpaVal,
    });
    setSubmitting(false);

    if (result.success) {
      setToast({ message: 'Registration successful! Redirecting to login...', type: 'success' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setToast({ message: result.message || 'Registration failed', type: 'error' });
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <h2>Student Registration</h2>
          <p>Join the Placement Portal to apply for active drives</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              className="form-control"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="e.g. john@university.edu"
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
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="branch">Branch / Specialization</label>
            <select
              id="branch"
              className="form-control"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Communication">Electronics & Communication</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cgpa">Current CGPA</label>
            <input
              type="number"
              id="cgpa"
              className="form-control"
              step="0.01"
              min="0"
              max="10"
              placeholder="e.g. 8.5"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
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

export default RegisterStudent;
