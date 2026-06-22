import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { PlusCircle, Calendar, Users, Edit3, Trash2, ShieldAlert, XCircle } from 'lucide-react';
import Toast from '../components/Toast';

const CompanyDashboard = () => {
  const { apiCall } = useAuth();
  const [company, setCompany] = useState(null);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      // Fetch company profile
      const profRes = await apiCall('/api/company/profile');
      const companyData = await profRes.json();
      if (profRes.ok) {
        setCompany(companyData);
      }

      // Fetch company drives
      const driveRes = await apiCall('/api/company/drives');
      const drivesData = await driveRes.json();
      if (driveRes.ok) {
        setDrives(drivesData);
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClose = async (id, title) => {
    try {
      const res = await apiCall(`/api/company/drives/${id}/close`, { method: 'PUT' });
      if (res.ok) {
        setToast({ message: `Drive "${title}" closed successfully!`, type: 'success' });
        setDrives(prev => prev.map(d => d._id === id ? { ...d, status: 'closed' } : d));
      } else {
        const data = await res.json();
        setToast({ message: data.message || 'Operation failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the job drive "${title}"? This will delete all applications submitted by students.`)) {
      return;
    }

    try {
      const res = await apiCall(`/api/company/drives/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: `Drive "${title}" deleted successfully!`, type: 'success' });
        setDrives(prev => prev.filter(d => d._id !== id));
      } else {
        const data = await res.json();
        setToast({ message: data.message || 'Deletion failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Active / Approved</span>;
      case 'pending':
        return <span className="badge badge-warning">Awaiting Approval</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rejected by Admin</span>;
      case 'closed':
        return <span className="badge badge-neutral">Closed</span>;
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
          <h1>Recruiter Dashboard</h1>
          <p>{company?.name} • HR Portal</p>
        </div>
        
        {company?.approved && (
          <Link to="/company/drive/create" className="btn btn-primary">
            <PlusCircle size={18} />
            Post New Job Drive
          </Link>
        )}
      </div>

      {!company?.approved && (
        <div className="card" style={{ marginBottom: '2rem', borderLeftColor: 'var(--color-warning)', backgroundColor: 'var(--accent-gold-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={24} style={{ color: 'var(--color-warning)' }} />
            <div>
              <h3 style={{ fontWeight: 600, color: 'var(--text-main)' }}>Account Pending Approval</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Your account is currently undergoing review. You will be able to create job drives once an administrator approves your profile.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h2>Job Postings and Active Drives ({drives.length})</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Eligibility</th>
                <th>Application Deadline</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drives.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No job drives created. Click the button above to create one.
                  </td>
                </tr>
              ) : (
                drives.map((drive) => (
                  <tr key={drive._id}>
                    <td style={{ fontWeight: 600 }}>{drive.title}</td>
                    <td>{drive.eligibility}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        {new Date(drive.deadline).toLocaleDateString()}
                      </div>
                    </td>
                    <td>{getStatusBadge(drive.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {drive.status === 'approved' && (
                          <Link to={`/company/drive/${drive._id}/applications`} className="btn btn-primary btn-sm">
                            <Users size={14} /> Applicants
                          </Link>
                        )}
                        
                        {(drive.status === 'pending' || drive.status === 'approved') && (
                          <Link to={`/company/drive/edit/${drive._id}`} className="btn btn-secondary btn-sm">
                            <Edit3 size={14} /> Edit
                          </Link>
                        )}

                        {drive.status === 'approved' && (
                          <button
                            onClick={() => handleClose(drive._id, drive.title)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <XCircle size={14} /> Close
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(drive._id, drive.title)}
                          className="btn btn-danger btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
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

export default CompanyDashboard;
