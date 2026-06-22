import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const CompanyProfile = () => {
  const { apiCall } = useAuth();
  
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [hr, setHr] = useState('');
  const [site, setSite] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiCall('/api/company/profile');
        const data = await res.json();
        if (res.ok) {
          setName(data.name);
          setIndustry(data.industry);
          setHr(data.hr);
          setSite(data.site);
        } else {
          setToast({ message: data.message || 'Failed to fetch profile', type: 'error' });
        }
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !industry || !hr) {
      setToast({ message: 'Name, Industry and HR Rep are required fields', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiCall('/api/company/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, industry, hr, site }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: 'Profile updated successfully!', type: 'success' });
        // Update user details stored locally
        const storedUser = localStorage.getItem('placement_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.name = name;
          localStorage.setItem('placement_user', JSON.stringify(parsed));
        }
      } else {
        setToast({ message: data.message || 'Profile update failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Edit Company Profile</h1>
          <p>Update your recruiting account information</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Company Name</label>
            <input
              type="text"
              id="name"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="industry">Industry Vertical</label>
            <input
              type="text"
              id="industry"
              className="form-control"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hr">HR Representative</label>
            <input
              type="text"
              id="hr"
              className="form-control"
              value={hr}
              onChange={(e) => setHr(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="site">Company Website</label>
            <input
              type="url"
              id="site"
              className="form-control"
              placeholder="e.g. https://example.com"
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
            {submitting ? 'Saving changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {toast && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
};

export default CompanyProfile;
