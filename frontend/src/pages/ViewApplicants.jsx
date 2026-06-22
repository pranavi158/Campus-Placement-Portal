import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, GraduationCap, FileText, Calendar, CheckCircle, Star, X } from 'lucide-react';
import Toast from '../components/Toast';

const ViewApplicants = () => {
  const { apiCall } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [drive, setDrive] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const res = await apiCall(`/api/company/drives/${id}/applications`);
        const data = await res.json();
        if (res.ok) {
          setDrive(data.drive);
          setApplications(data.applications);
        } else {
          setToast({ message: data.message || 'Failed to load applicants', type: 'error' });
        }
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, [id]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const res = await apiCall(`/api/company/applications/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: `Candidate status updated to "${newStatus}"`, type: 'success' });
        // Update local state to reflect change without refetching
        setApplications(prev =>
          prev.map(app => app._id === appId ? { ...app, status: newStatus } : app)
        );
      } else {
        setToast({ message: data.message || 'Status update failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selected':
        return <span className="badge badge-success">Selected</span>;
      case 'Shortlisted':
        return <span className="badge badge-info">Shortlisted</span>;
      case 'Rejected':
        return <span className="badge badge-danger">Rejected</span>;
      case 'Applied':
        return <span className="badge badge-warning">Applied</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
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
    <div>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>{drive?.title} — Applicants</h1>
          <p>Review and manage candidate applications for this placement drive</p>
        </div>
        <button
          onClick={() => navigate('/company')}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {drive && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--accent-gold-light)', border: '1px solid var(--accent-gold)' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Drive Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <div><strong>Eligibility:</strong> {drive.eligibility}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={14} />
              <strong>Deadline:</strong>&nbsp;{new Date(drive.deadline).toLocaleDateString()}
            </div>
            <div><strong>Status:</strong> {drive.status}</div>
            <div><strong>Total Applicants:</strong> {applications.length}</div>
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <strong>Job Description:</strong> {drive.jd}
          </p>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h2>Candidate Applications ({applications.length})</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Branch</th>
                <th>CGPA</th>
                <th>Resume</th>
                <th>Applied Date</th>
                <th>Current Status</th>
                <th style={{ textAlign: 'right' }}>Update Decision</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No candidates have applied to this drive yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--accent-gold-light)',
                          border: '2px solid var(--accent-gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-gold)',
                          fontWeight: 700,
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}>
                          {app.student?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{app.student?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.student?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <GraduationCap size={14} style={{ color: 'var(--text-muted)' }} />
                        {app.student?.branch}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: app.student?.cgpa >= 8 ? 'var(--color-success)' : app.student?.cgpa >= 6 ? 'var(--accent-gold)' : 'var(--text-muted)'
                      }}>
                        {app.student?.cgpa?.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      {app.student?.resume ? (
                        <a
                          href={`http://localhost:5001/uploads/${app.student.resume}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <FileText size={14} /> View PDF
                        </a>
                      ) : (
                        <span style={{ color: 'var(--silver-gray-dark)', fontStyle: 'italic', fontSize: '0.85rem' }}>No Resume</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.9rem' }}>
                      {new Date(app.appliedDate).toLocaleDateString()}
                    </td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {app.status !== 'Shortlisted' && (
                          <button
                            onClick={() => handleStatusChange(app._id, 'Shortlisted')}
                            className="btn btn-sm"
                            style={{
                              background: 'var(--color-info-bg)',
                              color: 'var(--color-info)',
                              border: '1px solid rgba(21,101,192,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Star size={13} /> Shortlist
                          </button>
                        )}
                        {app.status !== 'Selected' && (
                          <button
                            onClick={() => handleStatusChange(app._id, 'Selected')}
                            className="btn btn-sm"
                            style={{
                              background: 'var(--color-success-bg)',
                              color: 'var(--color-success)',
                              border: '1px solid rgba(46,125,50,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <CheckCircle size={13} /> Select
                          </button>
                        )}
                        {app.status !== 'Rejected' && (
                          <button
                            onClick={() => handleStatusChange(app._id, 'Rejected')}
                            className="btn btn-sm"
                            style={{
                              background: 'var(--color-danger-bg)',
                              color: 'var(--color-danger)',
                              border: '1px solid rgba(198,40,40,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <X size={13} /> Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
};

export default ViewApplicants;
