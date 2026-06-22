import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Briefcase, Check, X } from 'lucide-react';
import Toast from '../components/Toast';

const ManageDrives = () => {
  const { apiCall } = useAuth();
  const [drives, setDrives] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchDrives = async (page = 1) => {
    try {
      const res = await apiCall(`/api/admin/drives?page=${page}&limit=10`);
      const data = await res.json();
      if (res.ok) {
        setDrives(data.drives || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setToast({ message: data.message || 'Error fetching drives', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives(1);
  }, []);

  const handleApprove = async (id, title) => {
    try {
      const res = await apiCall(`/api/admin/drives/approve/${id}`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: `Drive "${title}" approved!`, type: 'success' });
        setDrives(prev => prev.map(d => d._id === id ? { ...d, status: 'approved' } : d));
      } else {
        setToast({ message: data.message || 'Approval failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleReject = async (id, title) => {
    try {
      const res = await apiCall(`/api/admin/drives/reject/${id}`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: `Drive "${title}" rejected!`, type: 'warning' });
        setDrives(prev => prev.map(d => d._id === id ? { ...d, status: 'rejected' } : d));
      } else {
        setToast({ message: data.message || 'Rejection failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Approved</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending Review</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rejected</span>;
      case 'closed':
        return <span className="badge badge-neutral">Closed</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Manage Placement Drives</h1>
          <p>Review and publish job posting requests submitted by verified companies</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-header">
            <h2>Active and Pending Drives ({drives.length})</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Job Description</th>
                  <th>Eligibility Criteria</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drives.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No job drives created yet.
                    </td>
                  </tr>
                ) : (
                  drives.map((drive) => (
                    <tr key={drive._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                          <Briefcase size={16} style={{ color: 'var(--accent-gold)' }} />
                          {drive.title}
                        </div>
                      </td>
                      <td>
                        {drive.company ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{drive.company.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{drive.company.industry}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-danger)' }}>Deleted Company</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {drive.jd}
                        </div>
                      </td>
                      <td>{drive.eligibility}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          {new Date(drive.deadline).toLocaleDateString()}
                        </div>
                      </td>
                      <td>{getStatusBadge(drive.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        {drive.status === 'pending' && (
                          <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleApprove(drive._id, drive.title)}
                              className="btn btn-primary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(drive._id, drive.title)}
                              className="btn btn-danger btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
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
                onClick={() => fetchDrives(pagination.page - 1)}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Page <strong>{pagination.page}</strong> of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchDrives(pagination.page + 1)}
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

export default ManageDrives;
