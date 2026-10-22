import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Calendar, Building2, Clock, Video } from 'lucide-react';
import Toast from '../components/Toast';

const StudentHistory = () => {
  const { apiCall } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [interviewMap, setInterviewMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchHistoryAndInterviews = async () => {
      try {
        const [appRes, intvRes] = await Promise.all([
          apiCall('/api/student/applications'),
          apiCall('/api/interviews/active'),
        ]);

        const appData = await appRes.json();
        const intvData = await intvRes.json();

        if (appRes.ok) {
          setApplications(appData);
        } else {
          setToast({ message: appData.message || 'Error loading history', type: 'error' });
        }

        if (intvRes.ok && intvData.interviews) {
          const map = {};
          intvData.interviews.forEach((inv) => {
            // Handle both populated object and plain ObjectId string
            const appId = typeof inv.application === 'object' && inv.application?._id
              ? inv.application._id.toString()
              : inv.application?.toString();
            if (appId) {
              map[appId] = inv;
            }
          });
          setInterviewMap(map);
        }
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchHistoryAndInterviews();
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

              {/* Status Badge & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                {getStatusBadge(app.status)}
                {interviewMap[app._id] && (
                  <button
                    onClick={() => navigate(`/interview/${interviewMap[app._id].roomId}`)}
                    className="btn btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-gold), #8A6D2F)',
                      color: '#FFF',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600,
                      boxShadow: '0 2px 6px rgba(197, 160, 89, 0.3)',
                    }}
                  >
                    <Video size={13} /> Join Interview
                  </button>
                )}
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
