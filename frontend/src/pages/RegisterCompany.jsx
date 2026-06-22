import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const RegisterCompany = () => {
  const { registerCompany } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [industry, setIndustry] = useState('');
  const [hr, setHr] = useState('');
  const [site, setSite] = useState('');

  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !industry || !hr) {
      setToast({ message: 'Please provide all required fields', type: 'error' });
      return;
    }

    setSubmitting(true);
    const result = await registerCompany({
      name,
      email,
      password,
      industry,
      hr,
      site,
    });
    setSubmitting(false);

    if (result.success) {
      setToast({ 
        message: 'Account request submitted! Pending admin approval. Redirecting to login...', 
        type: 'success' 
      });
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setToast({ message: result.message || 'Registration failed', type: 'error' });
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <h2>Company Registration</h2>
          <p>Register as a recruiter to post placement drives</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Company Name</label>
            <input
              type="text"
              id="name"
              className="form-control"
              placeholder="e.g. Acme Tech Solutions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Recruiting Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="e.g. careers@acmetech.com"
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
            <label htmlFor="industry">Industry Vertical</label>
            <input
              type="text"
              id="industry"
              className="form-control"
              placeholder="e.g. Software, Finance, Healthcare"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hr">HR Representative Name</label>
            <input
              type="text"
              id="hr"
              className="form-control"
              placeholder="e.g. Jane Smith"
              value={hr}
              onChange={(e) => setHr(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="site">Company Website (Optional)</label>
            <input
              type="url"
              id="site"
              className="form-control"
              placeholder="e.g. https://acmetech.com"
              value={site}
              onChange={(e) => setSite(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Submitting request...' : 'Apply for Account'}
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

export default RegisterCompany;
