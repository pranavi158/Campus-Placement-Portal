import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Building2, Briefcase, FileSpreadsheet, AlertCircle } from 'lucide-react';
import Toast from '../components/Toast';

const AdminDashboard = () => {
  const { apiCall } = useAuth();
  const [stats, setStats] = useState({ students: 0, companies: 0, drives: 0, applications: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiCall('/api/admin/stats');
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        } else {
          setToast({ message: data.message || 'Error fetching stats', type: 'error' });
        }
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
          <h1>Admin Dashboard</h1>
          <p>System statistics and controls overview</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-info">
            <h3>Registered Students</h3>
            <div className="stat-number">{stats.students}</div>
          </div>
          <div className="stat-icon">
            <Users size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Registered Companies</h3>
            <div className="stat-number">{stats.companies}</div>
          </div>
          <div className="stat-icon">
            <Building2 size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Job Drives</h3>
            <div className="stat-number">{stats.drives}</div>
          </div>
          <div className="stat-icon">
            <Briefcase size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>Total Applications</h3>
            <div className="stat-number">{stats.applications}</div>
          </div>
          <div className="stat-icon">
            <FileSpreadsheet size={24} />
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-gold)' }}>
          Quick Administration Actions
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          As an Administrator, you possess rights to review recruiter accounts, manage drives for companies, view all placement stats, and configure account access rules.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Link to="/admin/companies" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Approve & Blacklist Companies
          </Link>
          <Link to="/admin/students" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Manage Student Registry
          </Link>
          <Link to="/admin/drives" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Approve Placement Drives
          </Link>
          <Link to="/admin/applications" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Review Student Submissions
          </Link>
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

export default AdminDashboard;
