import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import Toast from '../components/Toast';

const StudentProfile = () => {
  const { apiCall } = useAuth();

  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [github, setGithub] = useState('');
  const [yearOfPassing, setYearOfPassing] = useState('');
  const [backlogs, setBacklogs] = useState('');
  const [isPlaced, setIsPlaced] = useState(false);
  const [placedCTC, setPlacedCTC] = useState(0);
  const [currentResume, setCurrentResume] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiCall('/api/student/profile');
        const data = await res.json();
        if (res.ok) {
          setName(data.name);
          setBranch(data.branch);
          setCgpa(data.cgpa);
          setRollNo(data.rollNo || '');
          setPhone(data.phone || '');
          setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : data.skills || '');
          setLinkedIn(data.linkedIn || '');
          setGithub(data.github || '');
          setYearOfPassing(data.yearOfPassing || '');
          setBacklogs(data.backlogs || 0);
          setIsPlaced(data.isPlaced || false);
          setPlacedCTC(data.placedCTC || 0);
          setCurrentResume(data.resume || '');
        } else {
          setToast({ message: data.message || 'Error fetching profile', type: 'error' });
        }
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setToast({ message: 'Only PDF files are accepted for resume upload', type: 'error' });
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'File size must be under 5MB', type: 'error' });
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !branch || !cgpa) {
      setToast({ message: 'Name, branch and CGPA are required', type: 'error' });
      return;
    }

    const cgpaVal = parseFloat(cgpa);
    if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) {
      setToast({ message: 'CGPA must be between 0 and 10', type: 'error' });
      return;
    }

    // Use FormData because we might be uploading a file (multipart/form-data)
    const formData = new FormData();
    formData.append('name', name);
    formData.append('branch', branch);
    formData.append('cgpa', cgpaVal);
    formData.append('rollNo', rollNo);
    formData.append('phone', phone);
    formData.append('skills', skills);
    formData.append('linkedIn', linkedIn);
    formData.append('github', github);
    formData.append('yearOfPassing', yearOfPassing);
    formData.append('backlogs', backlogs);

    if (selectedFile) {
      formData.append('resume', selectedFile);
    }

    setSubmitting(true);
    try {
      const res = await apiCall('/api/student/profile', {
        method: 'PUT',
        body: formData,
        // Note: Do NOT set Content-Type header; the browser will set it with boundary for multipart
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: 'Profile updated successfully!', type: 'success' });
        if (data.student.resume) {
          setCurrentResume(data.student.resume);
        }
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Update name in localStorage
        const storedUser = localStorage.getItem('placement_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.name = name;
          localStorage.setItem('placement_user', JSON.stringify(parsed));
        }
      } else {
        setToast({ message: data.message || 'Profile update failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
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
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Edit My Profile</h1>
          <p>Keep your academic details up to date for recruiters</p>
        </div>
      </div>

      {isPlaced && (
        <div style={{
          padding: '1rem',
          background: 'rgba(76,175,80,0.1)',
          border: '1px solid #4caf50',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1rem',
          color: '#4caf50',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>🎉 Congratulations! You have been PLACED!</span>
          <span>CTC Offered: {placedCTC} LPA</span>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="rollNo">Roll Number</label>
            <input
              type="text"
              id="rollNo"
              className="form-control"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="text"
              id="phone"
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="branch">Branch / Specialization</label>
            <select
              id="branch"
              className="form-control"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Communication">Electronics & Communication</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cgpa">Current CGPA</label>
            <input
              type="number"
              id="cgpa"
              className="form-control"
              step="0.01"
              min="0"
              max="10"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="skills">Skills (comma separated)</label>
            <input
              type="text"
              id="skills"
              className="form-control"
              placeholder="e.g. React, Node.js, Express, MongoDB"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="linkedIn">LinkedIn Profile URL</label>
            <input
              type="text"
              id="linkedIn"
              className="form-control"
              value={linkedIn}
              onChange={(e) => setLinkedIn(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="github">GitHub Profile URL</label>
            <input
              type="text"
              id="github"
              className="form-control"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
            />
          </div>

          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="yearOfPassing">Year of Passing</label>
              <input
                type="number"
                id="yearOfPassing"
                className="form-control"
                value={yearOfPassing}
                onChange={(e) => setYearOfPassing(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="backlogs">Active Backlogs</label>
              <input
                type="number"
                id="backlogs"
                className="form-control"
                value={backlogs}
                onChange={(e) => setBacklogs(e.target.value)}
              />
            </div>
          </div>

          {/* Resume PDF Upload Section */}
          <div className="form-group">
            <label>Resume (PDF)</label>

            {/* Show currently uploaded resume */}
            {currentResume && !selectedFile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'var(--color-success-bg)',
                border: '1px solid rgba(46,125,50,0.2)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '0.75rem',
                fontSize: '0.9rem',
              }}>
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Resume uploaded</div>
                  <a
                    href={`http://localhost:5001/uploads/${currentResume}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <FileText size={13} /> View current resume
                  </a>
                </div>
              </div>
            )}

            {/* File picker area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${selectedFile ? 'var(--accent-gold)' : 'var(--silver-gray)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: selectedFile ? 'var(--accent-gold-light)' : 'var(--silver-gray-light)',
                transition: 'all 0.2s ease',
              }}
            >
              <UploadCloud size={28} style={{ color: selectedFile ? 'var(--accent-gold)' : 'var(--silver-gray-dark)', marginBottom: '0.5rem' }} />
              {selectedFile ? (
                <>
                  <p style={{ fontWeight: 600, color: 'var(--accent-gold)', marginBottom: '0.25rem' }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {(selectedFile.size / 1024).toFixed(0)} KB · Click to change
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {currentResume ? 'Upload new resume to replace' : 'Upload your resume'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--silver-gray-dark)' }}>
                    PDF format only · Max 5MB
                  </p>
                </>
              )}
            </div>

            {/* Hidden actual file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Saving profile...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {toast && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
