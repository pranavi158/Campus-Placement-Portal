import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const CreateDrive = () => {
  const { apiCall } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [jd, setJd] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [ctc, setCtc] = useState('');
  const [location, setLocation] = useState('Remote');
  const [jobType, setJobType] = useState('Full-Time');
  const [minCGPA, setMinCGPA] = useState('0');
  const [allowedBranches, setAllowedBranches] = useState('');
  const [rounds, setRounds] = useState('');
  const [deadline, setDeadline] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !jd || !eligibility || !deadline || !ctc || !location || !jobType || !minCGPA) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const parsedBranches = allowedBranches.split(',').map(b => b.trim()).filter(Boolean);
      const parsedRounds = rounds.split(',').map(r => r.trim()).filter(Boolean);

      const res = await apiCall('/api/company/drives', {
        method: 'POST',
        body: JSON.stringify({
          title,
          jd,
          eligibility,
          deadline,
          ctc: parseFloat(ctc),
          location,
          jobType,
          minCGPA: parseFloat(minCGPA),
          allowedBranches: parsedBranches,
          rounds: parsedRounds
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: 'Job drive created! Redirecting...', type: 'success' });
        setTimeout(() => {
          navigate('/company');
        }, 2000);
      } else {
        setToast({ message: data.message || 'Creation failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Post Job Drive</h1>
          <p>Register a new placement job opportunity</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Job Title</label>
            <input
              type="text"
              id="title"
              className="form-control"
              placeholder="e.g. Associate Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="jd">Job Description</label>
            <textarea
              id="jd"
              className="form-control"
              placeholder="Describe roles, responsibilities..."
              rows="4"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>

          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="ctc">CTC Offered (LPA)</label>
              <input
                type="number"
                id="ctc"
                className="form-control"
                placeholder="e.g. 12"
                value={ctc}
                onChange={(e) => setCtc(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="minCGPA">Minimum CGPA Required</label>
              <input
                type="number"
                id="minCGPA"
                className="form-control"
                step="0.1"
                min="0"
                max="10"
                value={minCGPA}
                onChange={(e) => setMinCGPA(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="jobType">Job Type</label>
              <select
                id="jobType"
                className="form-control"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                required
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="location">Job Location</label>
              <input
                type="text"
                id="location"
                className="form-control"
                placeholder="e.g. Bangalore or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="allowedBranches">Eligible Branches (comma separated)</label>
            <input
              type="text"
              id="allowedBranches"
              className="form-control"
              placeholder="Computer Science, Information Technology"
              value={allowedBranches}
              onChange={(e) => setAllowedBranches(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="rounds">Interview Rounds (comma separated)</label>
            <input
              type="text"
              id="rounds"
              className="form-control"
              placeholder="Online Test, Technical Round, HR Round"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="eligibility">Eligibility Criteria text description</label>
            <input
              type="text"
              id="eligibility"
              className="form-control"
              placeholder="e.g. B.Tech (CS/IT) with CGPA >= 8.0, 0 active backlogs"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Application Deadline</label>
            <input
              type="date"
              id="deadline"
              className="form-control"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => navigate('/company')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={submitting}
            >
              {submitting ? 'Creating job posting...' : 'Submit Job Drive'}
            </button>
          </div>
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

export default CreateDrive;
