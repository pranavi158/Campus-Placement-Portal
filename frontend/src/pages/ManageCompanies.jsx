import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Globe, Check, AlertOctagon, Undo2 } from 'lucide-react';
import Toast from '../components/Toast';

const ManageCompanies = () => {
  const { apiCall } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchCompanies = async (searchVal = '', page = 1) => {
    try {
      let endpoint = `/api/admin/companies?page=${page}&limit=10`;
      if (searchVal) {
        endpoint += `&search=${encodeURIComponent(searchVal)}`;
      }
      const res = await apiCall(endpoint);
      const data = await res.json();
      if (res.ok) {
        setCompanies(data.companies || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setToast({ message: data.message || 'Error fetching companies', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies('', 1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchCompanies(search, 1);
  };

  const handleApprove = async (id, name) => {
    try {
      const res = await apiCall(`/api/admin/companies/approve/${id}`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: `${name} approved successfully!`, type: 'success' });
        // Refresh local state
        setCompanies(prev => prev.map(c => c._id === id ? { ...c, approved: true } : c));
      } else {
        setToast({ message: data.message || 'Approval failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleToggleBlacklist = async (id, name, isCurrentlyBlacklisted) => {
    try {
      const res = await apiCall(`/api/admin/companies/blacklist/${id}`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        const actionText = isCurrentlyBlacklisted ? 'removed from blacklist' : 'blacklisted';
        setToast({ message: `${name} ${actionText}!`, type: 'success' });
        setCompanies(prev => prev.map(c => c._id === id ? { ...c, blacklisted: !isCurrentlyBlacklisted } : c));
      } else {
        setToast({ message: data.message || 'Blacklist operation failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Manage Companies</h1>
          <p>Approve recruiter accounts and control platform access permissions</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search companies by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {search && (
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => { setSearch(''); setLoading(true); fetchCompanies('', 1); }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-header">
            <h2>Registered Recruiters ({companies.length})</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Email Address</th>
                  <th>Industry</th>
                  <th>HR Rep</th>
                  <th>Website</th>
                  <th>Status</th>
                  <th>Blacklisted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No companies found.
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company._id}>
                      <td style={{ fontWeight: 600 }}>{company.name}</td>
                      <td>{company.email}</td>
                      <td>{company.industry}</td>
                      <td>{company.hr}</td>
                      <td>
                        {company.site ? (
                          <a 
                            href={company.site} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Globe size={14} /> Visit
                          </a>
                        ) : (
                          <span style={{ color: 'var(--silver-gray-dark)', fontStyle: 'italic' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        {company.approved ? (
                          <span className="badge badge-success">Approved</span>
                        ) : (
                          <span className="badge badge-warning">Pending Approval</span>
                        )}
                      </td>
                      <td>
                        {company.blacklisted ? (
                          <span className="badge badge-danger">Yes</span>
                        ) : (
                          <span className="badge badge-neutral">No</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {!company.approved && (
                            <button
                              onClick={() => handleApprove(company._id, company.name)}
                              className="btn btn-primary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Check size={14} /> Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleBlacklist(company._id, company.name, company.blacklisted)}
                            className={`btn ${company.blacklisted ? 'btn-secondary' : 'btn-danger'} btn-sm`}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            {company.blacklisted ? (
                              <>
                                <Undo2 size={14} /> Restore
                              </>
                            ) : (
                              <>
                                <AlertOctagon size={14} /> Blacklist
                              </>
                            )}
                          </button>
                        </div>
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
                onClick={() => fetchCompanies(search, pagination.page - 1)}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Page <strong>{pagination.page}</strong> of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCompanies(search, pagination.page + 1)}
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

export default ManageCompanies;
