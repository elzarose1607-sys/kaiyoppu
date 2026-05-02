import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: '"Inter", sans-serif',
      margin: 0,
      overflow: 'hidden'
    }}>
      <h1 style={{ color: '#ffb347', textShadow: '0 0 15px rgba(255, 179, 71, 0.4)', marginBottom: '10px' }}>
        Admin Dashboard
      </h1>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '30px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 179, 71, 0.2)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <p style={{ margin: '10px 0', fontSize: '1.2rem' }}>Welcome, <span style={{ fontWeight: 'bold' }}>{currentUser?.displayName || currentUser?.email}</span></p>
        <p style={{ margin: '20px 0', color: '#b0b0b0' }}>System oversight and platform management.</p>

        <button 
          onClick={handleLogout}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            width: '100%'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
