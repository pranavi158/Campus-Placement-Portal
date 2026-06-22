import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Calendar, Building2, Clock } from 'lucide-react';
import Toast from '../components/Toast';

const StudentHistory = () => {
  const { apiCall } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiCall('/api/student/applications');
        const data = await res.json();
        if (res.ok) {
          setApplications(data);
        } else {
          setToast({ message: data.message || 'Error loading history', type: 'error' });
        }
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selected':
        return <span className="badge badge-success">✓ Selected</span>;
      case 'Shortlisted':
        return <span className="badge badge-info">Shortlisted</span>;
      case 'Rejected':
        return <span className="badge badge-danger">✗ Rejected</span>;
      case 'Applied':
        return <span className="badge badge-warning">Under Review</span>;
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
          <h1>My Application History</h1>
          <p>Track the status of all your job applications</p>
        </div>
        <div>
          <span className="badge badge-neutral">{applications.length} Total Applications</span>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Clock size={48} style={{ color: 'var(--silver-gray)', marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-muted)' }}>No Applications Yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Apply to job drives from your dashboard to see them here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map((app) => (
            <div
              key={app._id}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.25rem 1.5rem',
                borderLeft: `4px solid ${
                  app.status === 'Selected' ? 'var(--color-success)' :
                  app.status === 'Shortlisted' ? 'var(--color-info)' :
                  app.status === 'Rejected' ? 'var(--color-danger)' :
                  'var(--accent-gold)'
                }`,
              }}
            >
              <div>
                {/* Job Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Briefcase size={18} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    {app.drive?.title || 'Drive Deleted'}
                  </h3>
                </div>

                {/* Company */}
                {app.drive?.company && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    <Building2 size={14} />
                    <span style={{ fontWeight: 500 }}>{app.drive.company.name}</span>
                    {app.drive.company.industry && (
                      <span>• {app.drive.company.industry}</span>
                    )}
                  </div>
                )}

                {/* Applied date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--silver-gray-dark)' }}>
                  <Calendar size={13} />
                  Applied on {new Date(app.appliedDate).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                {getStatusBadge(app.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
};

export default StudentHistory;
