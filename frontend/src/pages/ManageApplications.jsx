import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileSpreadsheet, Calendar, User, Briefcase, FileText } from 'lucide-react';
import Toast from '../components/Toast';

const ManageApplications = () => {
  const { apiCall } = useAuth();
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchApplications = async (page = 1) => {
    try {
      const res = await apiCall(`/api/admin/applications?page=${page}&limit=10`);
      const data = await res.json();
      if (res.ok) {
        setApplications(data.applications || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setToast({ message: data.message || 'Error fetching applications', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(1);
  }, []);

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

  return (
    <div>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Student Applications Log</h1>
          <p>Global list of candidate job applications and selection cycles</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-header">
            <h2>Application Log ({applications.length})</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Branch & CGPA</th>
                  <th>Resume</th>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No applications submitted yet.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        {app.student ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                              <User size={14} style={{ color: 'var(--accent-gold)' }} />
                              {app.student.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.student.email}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-danger)', fontStyle: 'italic' }}>Deleted Student</span>
                        )}
                      </td>
                      <td>
                        {app.student ? (
                          <div>
                            <div>{app.student.branch}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>CGPA: {app.student.cgpa.toFixed(2)}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {app.student && app.student.resume ? (
                          <a 
                            href={`http://localhost:5001/uploads/${app.student.resume}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-gold)' }}
                          >
                            <FileText size={14} /> PDF
                          </a>
                        ) : (
                          <span style={{ color: 'var(--silver-gray-dark)', fontStyle: 'italic' }}>No PDF</span>
                        )}
                      </td>
                      <td>
                        {app.drive ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                            <Briefcase size={14} style={{ color: 'var(--text-muted)' }} />
                            {app.drive.title}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-danger)', fontStyle: 'italic' }}>Deleted Drive</span>
                        )}
                      </td>
                      <td>
                        {app.drive && app.drive.company ? (
                          <span style={{ fontWeight: 500 }}>{app.drive.company.name}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          {new Date(app.appliedDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td>{getStatusBadge(app.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchApplications(pagination.page - 1)}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Page <strong>{pagination.page}</strong> of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchApplications(pagination.page + 1)}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          )}
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

export default ManageApplications;
