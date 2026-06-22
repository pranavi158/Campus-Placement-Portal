import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, FileText, AlertOctagon, Undo2 } from 'lucide-react';
import Toast from '../components/Toast';

const ManageStudents = () => {
  const { apiCall } = useAuth();
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchStudents = async (searchVal = '', page = 1) => {
    try {
      let endpoint = `/api/admin/students?page=${page}&limit=10`;
      if (searchVal) {
        endpoint += `&search=${encodeURIComponent(searchVal)}`;
      }
      const res = await apiCall(endpoint);
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setToast({ message: data.message || 'Error fetching students', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents('', 1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchStudents(search, 1);
  };

  const handleToggleBlacklist = async (id, name, isCurrentlyBlacklisted) => {
    try {
      const res = await apiCall(`/api/admin/students/blacklist/${id}`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        const actionText = isCurrentlyBlacklisted ? 'removed from blacklist' : 'blacklisted';
        setToast({ message: `${name} ${actionText}!`, type: 'success' });
        setStudents(prev => prev.map(s => s._id === id ? { ...s, blacklisted: !isCurrentlyBlacklisted } : s));
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
          <h1>Manage Students</h1>
          <p>Search candidate profiles and manage platform access controls</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search students by name, branch, email, or exact ID..."
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
              onClick={() => { setSearch(''); setLoading(true); fetchStudents('', 1); }}
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
            <h2>Candidate Registry ({students.length})</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Branch</th>
                  <th>CGPA</th>
                  <th>Resume (PDF)</th>
                  <th>Blacklisted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No students registered.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{student._id}</td>
                      <td style={{ fontWeight: 600 }}>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.branch}</td>
                      <td style={{ fontWeight: 500 }}>{student.cgpa.toFixed(2)}</td>
                      <td>
                        {student.resume ? (
                          <a 
                            href={`http://localhost:5001/uploads/${student.resume}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-gold)' }}
                          >
                            <FileText size={14} /> View Resume
                          </a>
                        ) : (
                          <span style={{ color: 'var(--silver-gray-dark)', fontStyle: 'italic' }}>Not Uploaded</span>
                        )}
                      </td>
                      <td>
                        {student.blacklisted ? (
                          <span className="badge badge-danger">Yes</span>
                        ) : (
                          <span className="badge badge-neutral">No</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleBlacklist(student._id, student.name, student.blacklisted)}
                          className={`btn ${student.blacklisted ? 'btn-secondary' : 'btn-danger'} btn-sm`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          {student.blacklisted ? (
                            <>
                              <Undo2 size={14} /> Restore Access
                            </>
                          ) : (
                            <>
                              <AlertOctagon size={14} /> Blacklist
                            </>
                          )}
                        </button>
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
                onClick={() => fetchStudents(search, pagination.page - 1)}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Page <strong>{pagination.page}</strong> of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchStudents(search, pagination.page + 1)}
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

export default ManageStudents;
