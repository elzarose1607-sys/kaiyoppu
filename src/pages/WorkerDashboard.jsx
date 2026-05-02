import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const WorkerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [userData, setUserData] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editPlace, setEditPlace] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Work History State
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'history'
  const [workHistory, setWorkHistory] = useState([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            
            // Inject mock admin remark for demonstration if it doesn't exist
            if (!data.adminRemark) {
              data.adminRemark = "FLAGGED: Involved in a property dispute / petty theft incident reported on 12/04/2025 at Ernakulam central station. Case #402-B pending review.";
            }

            setUserData(data);
            setEditName(data.name || currentUser.displayName || '');
            setEditAge(data.age || '');
            setEditPlace(data.place || '');
          }
        } catch (error) {
          console.error("Failed to fetch user data", error);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    // Only generate QR if verified
    if (currentUser?.uid && canvasRef.current && userData?.isVerified) {
      QRCode.toCanvas(
        canvasRef.current,
        currentUser.uid,
        {
          width: 180,
          margin: 1,
          color: {
            dark: '#1a1a1a',
            light: '#ffffff'
          }
        },
        function (error) {
          if (error) console.error(error);
        }
      );
    }
  }, [currentUser, userData?.isVerified]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleVerify = async () => {
    if (!editName || !editAge || !editPlace) {
      alert("Please fill in all fields before verifying.");
      return;
    }
    setIsVerifying(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        name: editName,
        age: editAge,
        place: editPlace,
        isVerified: true
      });
      setUserData(prev => ({ ...prev, name: editName, age: editAge, place: editPlace, isVerified: true }));
      // Keep modal open, just show verification success
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchHistory = async () => {
    setActiveTab('history');
    if (workHistory.length > 0) return; // already fetched
    
    setIsFetchingHistory(true);
    try {
      const historyRef = collection(db, 'users', currentUser.uid, 'workHistory');
      const snapshot = await getDocs(historyRef);
      if (!snapshot.empty) {
        const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWorkHistory(historyData);
      } else {
        // Mock data fallback if none exists yet
        setWorkHistory([
          { id: '1', sno: 1, location: 'Bangalore', role: 'Plumbing', duration: '2 Days', amount: '₹1500', remark: 'Excellent work, very professional.' },
          { id: '2', sno: 2, location: 'Kochi', role: 'Electrical', duration: '5 Hours', amount: '₹800', remark: 'Fixed the wiring issue quickly.' }
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch work history", error);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const tabStyle = (tabName) => ({
    flex: 1,
    padding: '12px',
    background: activeTab === tabName ? 'rgba(225, 65, 236, 0.2)' : 'transparent',
    border: 'none',
    borderBottom: activeTab === tabName ? '2px solid #e141ec' : '2px solid transparent',
    color: activeTab === tabName ? '#fff' : '#a0a0a0',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    fontFamily: '"Advent Pro", sans-serif',
    fontSize: '1.1rem',
    letterSpacing: '1px'
  });

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: '"Advent Pro", "Inter", sans-serif',
      padding: '2rem',
      boxSizing: 'border-box',
      margin: 0,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Left Logo */}
      <div style={{ position: 'absolute', top: '25px', left: '35px' }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.8rem', 
          fontWeight: '700', 
          color: '#fff', 
          letterSpacing: '3px',
          textShadow: '0 0 10px rgba(225, 65, 236, 0.4)'
        }}>
          KAIYOPPU
        </h2>
      </div>

      {/* Top Right Account Button */}
      <div style={{ position: 'absolute', top: '25px', right: '35px' }}>
        <button 
          onClick={() => { setShowProfileModal(true); setActiveTab('profile'); }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(225, 65, 236, 0.5)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(225, 65, 236, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(225, 65, 236, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          Account
        </button>
      </div>

      <h1 style={{
        fontSize: '3rem',
        fontWeight: 'bold',
        marginBottom: '2rem',
        color: '#e141ec',
        textShadow: '0 0 15px rgba(225, 65, 236, 0.5), 0 0 25px rgba(225, 65, 236, 0.3)',
        letterSpacing: '2px',
        textAlign: 'center'
      }}>
        Worker Dashboard
      </h1>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '20px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1
      }}>
        
        {/* User Info Section */}
        <div style={{ marginBottom: '2rem', textAlign: 'center', width: '100%' }}>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', color: '#fff', letterSpacing: '1px' }}>
            {userData?.name || currentUser?.displayName || 'Worker Name'}
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#d0d0d0', margin: '0 0 8px 0', fontFamily: '"Inter", sans-serif' }}>
            {currentUser?.email || 'worker@example.com'}
          </p>
          {userData?.isVerified ? (
            <span style={{ 
              background: 'rgba(0, 200, 83, 0.2)', 
              color: '#00e676', 
              padding: '4px 10px', 
              borderRadius: '12px', 
              fontSize: '0.8rem',
              fontFamily: '"Inter", sans-serif',
              border: '1px solid rgba(0, 200, 83, 0.4)'
            }}>
              ✓ Aadhar Verified
            </span>
          ) : (
            <span style={{ 
              background: 'rgba(255, 152, 0, 0.2)', 
              color: '#ff9800', 
              padding: '4px 10px', 
              borderRadius: '12px', 
              fontSize: '0.8rem',
              fontFamily: '"Inter", sans-serif',
              border: '1px solid rgba(255, 152, 0, 0.4)'
            }}>
              ⚠ Profile Unverified
            </span>
          )}
        </div>

        {/* QR Code Section */}
        <div style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '1.5rem',
          borderRadius: '16px',
          marginBottom: '2.5rem',
          boxShadow: '0 0 20px rgba(225, 65, 236, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'transform 0.3s ease',
          overflow: 'hidden'
        }}
        onMouseOver={(e) => {
          if (userData?.isVerified) e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {userData?.isVerified ? (
            <canvas ref={canvasRef} style={{ width: 180, height: 180, borderRadius: '8px' }}></canvas>
          ) : (
            <>
              {/* Blurred Placeholder */}
              <div style={{ 
                width: 180, 
                height: 180, 
                background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M10 10h30v30H10zM60 10h30v30H60zM10 60h30v30H10z\' fill=\'%230b0b0b\'/%3E%3Cpath d=\'M60 60h10v10H60zM80 60h10v10H80zM60 80h10v10H60zM80 80h10v10H80z\' fill=\'%230b0b0b\'/%3E%3C/svg>")',
                backgroundSize: 'cover',
                filter: 'blur(8px)',
                opacity: 0.5
              }}></div>
              
              {/* Instructional Overlay */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(2px)'
              }}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="#0b0b0b" style={{ marginBottom: '10px' }}>
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                </svg>
                <p style={{ 
                  margin: 0, 
                  color: '#0b0b0b', 
                  fontFamily: '"Inter", sans-serif', 
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  Please click 'Account' and verify with Aadhar to view your QR.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: '#fff',
            backgroundColor: 'transparent',
            border: '1px solid rgba(225, 65, 236, 0.5)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            letterSpacing: '2px',
            fontFamily: '"Advent Pro", sans-serif'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(225, 65, 236, 0.15)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(225, 65, 236, 0.4)';
            e.currentTarget.style.borderColor = '#e141ec';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'rgba(225, 65, 236, 0.5)';
          }}
        >
          SIGN OUT
        </button>
      </div>

      {/* Account Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(48, 43, 99, 0.9) 0%, rgba(36, 36, 62, 0.9) 100%)',
            border: '1px solid rgba(225, 65, 236, 0.3)',
            borderRadius: '16px',
            padding: '30px',
            width: '90%',
            maxWidth: activeTab === 'history' ? '700px' : '400px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
            position: 'relative',
            transition: 'max-width 0.3s ease'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setShowProfileModal(false)}
              style={{
                position: 'absolute', top: '15px', right: '15px',
                background: 'transparent', border: 'none', color: '#fff',
                fontSize: '1.2rem', cursor: 'pointer',
                zIndex: 10
              }}
            >
              ✕
            </button>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button onClick={() => setActiveTab('profile')} style={tabStyle('profile')}>Profile</button>
              <button onClick={fetchHistory} style={tabStyle('history')}>Work History</button>
            </div>
            
            {/* Tab Content: Profile */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: '"Inter", sans-serif' }}>
                {/* Admin / Govt Remark Box */}
                {userData?.adminRemark && (
                  <div style={{
                    padding: '12px 15px',
                    background: 'rgba(255, 76, 76, 0.1)',
                    border: '1px solid rgba(255, 76, 76, 0.4)',
                    borderRadius: '8px',
                    color: '#ff4c4c',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    boxShadow: '0 0 10px rgba(255, 76, 76, 0.2)'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      OFFICIAL GOVT/ADMIN REMARK
                    </div>
                    <div style={{ lineHeight: '1.4', color: '#ffb3b3' }}>
                      {userData.adminRemark}
                    </div>
                  </div>
                )}
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#b0b0b0' }}>Full Name</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#b0b0b0' }}>Age</label>
                  <input 
                    type="number" 
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#b0b0b0' }}>Place / City</label>
                  <input 
                    type="text" 
                    value={editPlace}
                    onChange={(e) => setEditPlace(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button 
                  onClick={handleVerify}
                  disabled={isVerifying || userData?.isVerified}
                  style={{
                    marginTop: '15px',
                    width: '100%',
                    padding: '12px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    backgroundColor: userData?.isVerified ? '#2e7d32' : '#e141ec',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: userData?.isVerified ? 'default' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: isVerifying ? 0.7 : 1
                  }}
                >
                  {isVerifying ? 'Verifying...' : userData?.isVerified ? '✓ Verified' : 'Verify using Aadhar'}
                </button>
              </div>
            )}

            {/* Tab Content: Work History */}
            {activeTab === 'history' && (
              <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', fontFamily: '"Inter", sans-serif' }}>
                {isFetchingHistory ? (
                  <div style={{ textAlign: 'center', color: '#b0b0b0', padding: '20px' }}>Loading history...</div>
                ) : workHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#b0b0b0', padding: '20px' }}>No work history available.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.9rem', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(225, 65, 236, 0.4)', color: '#e141ec' }}>
                        <th style={{ padding: '12px 8px' }}>S.No</th>
                        <th style={{ padding: '12px 8px' }}>Where</th>
                        <th style={{ padding: '12px 8px' }}>What</th>
                        <th style={{ padding: '12px 8px' }}>Duration</th>
                        <th style={{ padding: '12px 8px' }}>Amount</th>
                        <th style={{ padding: '12px 8px' }}>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workHistory.map((job, idx) => (
                        <tr key={job.id} style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                          background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                        >
                          <td style={{ padding: '14px 8px', color: '#b0b0b0' }}>{job.sno || idx + 1}</td>
                          <td style={{ padding: '14px 8px', fontWeight: 'bold' }}>{job.location}</td>
                          <td style={{ padding: '14px 8px' }}>{job.role}</td>
                          <td style={{ padding: '14px 8px', color: '#b0b0b0' }}>{job.duration}</td>
                          <td style={{ padding: '14px 8px', color: '#00e676', fontWeight: 'bold' }}>{job.amount}</td>
                          <td style={{ padding: '14px 8px', fontStyle: 'italic', color: '#d0d0d0' }}>"{job.remark}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#a0a0a0', textAlign: 'center' }}>
                  Note: Work history can only be updated by the Hirer.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
