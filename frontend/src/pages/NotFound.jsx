import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{
        fontSize: '6rem',
        margin: 0,
        color: 'var(--accent-gold)',
        fontWeight: 'bold',
        textShadow: '2px 2px 10px rgba(0,0,0,0.1)'
      }}>404</h1>
      <h2 style={{
        fontSize: '2rem',
        margin: '1rem 0',
        color: 'var(--text-main)'
      }}>Page Not Found</h2>
      <p style={{
        color: 'var(--text-muted)',
        maxWidth: '450px',
        marginBottom: '2rem',
        lineHeight: 1.6
      }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <button 
        onClick={() => navigate('/')} 
        className="btn btn-primary"
        style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
      >
        Go Back Home
      </button>
    </div>
  );
};

export default NotFound;
