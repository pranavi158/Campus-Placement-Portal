import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Building2, Briefcase, CheckCircle2, Clock } from 'lucide-react';
import Toast from '../components/Toast';

const StudentDashboard = () => {
  const { apiCall } = useAuth();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [applying, setApplying] = useState(null); // ID of drive being applied to

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [cgpaFilter, setCgpaFilter] = useState('');

  const fetchDrives = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (jobTypeFilter) params.append('jobType', jobTypeFilter);
      if (locationFilter) params.append('location', locationFilter);
      if (cgpaFilter) params.append('minCGPA', cgpaFilter);

      const res = await apiCall(`/api/student/drives?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setDrives(data);
      } else {
        setToast({ message: data.message || 'Failed to load job drives', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, [searchTerm, jobTypeFilter, locationFilter, cgpaFilter]);

  const handleApply = async (driveId, driveTitle) => {
    setApplying(driveId);
    try {
      const res = await apiCall(`/api/student/apply/${driveId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: `Successfully applied to "${driveTitle}"!`, type: 'success' });
        // Mark drive as applied in local state
        setDrives(prev =>
          prev.map(d => d._id === driveId ? { ...d, hasApplied: true } : d)
        );
      } else {
        setToast({ message: data.message || 'Application failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setApplying(null);
    }
  };

  const isDeadlineSoon = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 3 && days >= 0;
  };

  const isDeadlinePassed = (deadline) => {
    return new Date(deadline) < new Date();
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
          <h1>Placement Opportunities</h1>
          <p>Active job drives open for application</p>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <span className="badge badge-success" style={{ marginRight: '0.5rem' }}>
            {drives.filter(d => d.hasApplied).length} Applied
          </span>
          <span className="badge badge-neutral">
            {drives.filter(d => !d.hasApplied).length} Available
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Search Keywords</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by title, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Job Type</label>
            <select
              className="form-control"
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Location</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Bangalore"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Max Required CGPA</label>
            <input
              type="number"
              className="form-control"
              step="0.1"
              min="0"
              max="10"
              placeholder="e.g. 8.0"
              value={cgpaFilter}
              onChange={(e) => setCgpaFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {drives.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Briefcase size={48} style={{ color: 'var(--silver-gray)', marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-muted)' }}>No Active Drives Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Adjust your search filter criteria or check back later!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {drives.map((drive) => {
            const deadlinePassed = isDeadlinePassed(drive.deadline);
            const deadlineSoon = isDeadlineSoon(drive.deadline);

            return (
              <div
                key={drive._id}
                className="card"
                style={{
                  opacity: deadlinePassed && !drive.hasApplied ? 0.7 : 1,
                  borderTop: drive.hasApplied ? '3px solid var(--color-success)' : '3px solid var(--accent-gold)',
                }}
              >
                {/* Job Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '6px',
                    background: 'var(--accent-gold-light)',
                    border: '2px solid var(--accent-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-gold)',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}>
                    {drive.company?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    {drive.hasApplied && (
                      <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> Applied
                      </span>
                    )}
                    {deadlineSoon && !drive.hasApplied && (
                      <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> Closing Soon
                      </span>
                    )}
                  </div>
                </div>

                {/* Job Details */}
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{drive.title}</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  <Building2 size={14} />
                  <span style={{ fontWeight: 500 }}>{drive.company?.name}</span>
                  {drive.company?.industry && (
                    <span style={{ color: 'var(--silver-gray-dark)' }}>• {drive.company.industry}</span>
                  )}
                </div>

                {/* Extra parameters badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                  <span className="badge badge-neutral" style={{ background: 'var(--accent-gold-light)', color: 'var(--accent-gold)', fontWeight: 600 }}>
                    💰 {drive.ctc} LPA
                  </span>
                  <span className="badge badge-neutral">
                    📍 {drive.location}
                  </span>
                  <span className="badge badge-neutral">
                    💼 {drive.jobType}
                  </span>
                  <span className="badge badge-neutral" style={{ background: 'rgba(244,67,54,0.1)', color: '#f44336' }}>
                    🎓 Min CGPA: {drive.minCGPA}
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
                  {drive.jd?.length > 120 ? drive.jd.substring(0, 120) + '...' : drive.jd}
                </p>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <strong>Eligibility: </strong>{drive.eligibility}
                  </div>
                  {drive.allowedBranches && drive.allowedBranches.length > 0 && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <strong>Branches: </strong>{drive.allowedBranches.join(', ')}
                    </div>
                  )}
                  {drive.rounds && drive.rounds.length > 0 && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <strong>Rounds: </strong>{drive.rounds.join(' → ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: deadlineSoon ? 'var(--color-warning)' : 'var(--text-muted)' }}>
                    <Calendar size={13} />
                    <strong>Deadline: </strong>&nbsp;
                    {new Date(drive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {deadlinePassed && <span style={{ color: 'var(--color-danger)' }}> (Expired)</span>}
                  </div>
                </div>

                {/* Apply button */}
                <button
                  onClick={() => handleApply(drive._id, drive.title)}
                  disabled={drive.hasApplied || deadlinePassed || applying === drive._id}
                  className={`btn ${drive.hasApplied ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {applying === drive._id
                    ? 'Submitting...'
                    : drive.hasApplied
                    ? '✓ Application Submitted'
                    : deadlinePassed
                    ? 'Deadline Passed'
                    : 'Apply Now'}
                </button>
              </div>
            );
          })}
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

export default StudentDashboard;
