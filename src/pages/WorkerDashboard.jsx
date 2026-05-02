import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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

  // Status Toggle State
  const [workerStatus, setWorkerStatus] = useState('Looking for job');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Hirers Directory State
  const [showHirersModal, setShowHirersModal] = useState(false);
  const [hirers, setHirers] = useState([]);
  const [loadingHirers, setLoadingHirers] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [blockedHirers, setBlockedHirers] = useState([]);

  // Notifications State
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifTab, setNotifTab] = useState('received'); // 'received' | 'sent'
  const [receivedNotifs, setReceivedNotifs] = useState([]);
  const [sentNotifs, setSentNotifs] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Work History State
  const [activeTab, setActiveTab] = useState('profile');

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
            if (!data.adminRemark) {
              data.adminRemark = "FLAGGED: Involved in a property dispute / petty theft incident reported on 12/04/2025 at Ernakulam central station. Case #402-B pending review.";
            }
            setUserData(data);
            setEditName(data.name || currentUser.displayName || '');
            setEditAge(data.age || '');
            setEditPlace(data.place || '');
            setWorkerStatus(data.status || 'Looking for job');
          }
        } catch (error) {
          console.error("Failed to fetch user data", error);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.uid && canvasRef.current && userData?.isVerified) {
      QRCode.toCanvas(
        canvasRef.current,
        currentUser.uid,
        { width: 180, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } },
        function (error) { if (error) console.error(error); }
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
      await updateDoc(userDocRef, { name: editName, age: editAge, place: editPlace, isVerified: true });
      setUserData(prev => ({ ...prev, name: editName, age: editAge, place: editPlace, isVerified: true }));
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = workerStatus === 'Looking for job' ? 'Currently Hired' : 'Looking for job';
    setIsUpdatingStatus(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { status: newStatus });
      setWorkerStatus(newStatus);
      setUserData(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const fetchHirers = async () => {
    setShowHirersModal(true);
    setLoadingHirers(true);
    try {
      const sentRef = collection(db, 'users', currentUser.uid, 'sentRequests');
      const sentSnap = await getDocs(sentRef);
      setSentNotifs(sentSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const hirersList = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.role === 'Hirer' || data.role === 'hirer') {
          hirersList.push({ id: doc.id, ...data });
        }
      });
      setHirers(hirersList);
    } catch (error) {
      console.error("Failed to fetch hirers", error);
    } finally {
      setLoadingHirers(false);
    }
  };

  const handleApply = async (hirer) => {
    try {
      const sentRef = await addDoc(collection(db, 'users', currentUser.uid, 'sentRequests'), {
        toUid: hirer.id,
        toName: hirer.name || hirer.displayName || 'Unnamed Hirer',
        toEmail: hirer.email,
        type: 'application',
        status: 'pending',
        timestamp: serverTimestamp()
      });
      
      await addDoc(collection(db, 'users', hirer.id, 'receivedRequests'), {
        fromUid: currentUser.uid,
        fromName: userData?.name || currentUser.displayName || 'Worker',
        fromEmail: currentUser.email,
        type: 'application',
        status: 'pending',
        timestamp: serverTimestamp(),
        senderDocId: sentRef.id
      });

      setAppliedJobs(prev => [...prev, hirer.id]);
      setSentNotifs(prev => [...prev, { id: sentRef.id, toUid: hirer.id, toName: hirer.name || 'Hirer', type: 'application', status: 'pending' }]);
      alert("Application sent successfully!");
    } catch (error) {
      console.error("Error applying", error);
      alert("Failed to send application.");
    }
  };

  const handleBlock = (hirerId) => {
    const reason = prompt("Please provide a reason for reporting/blocking this Hirer:");
    if (reason) {
      setBlockedHirers(prev => [...prev, hirerId]);
      alert("Hirer has been reported and blocked.");
    }
  };

  const fetchNotifications = async () => {
    setShowNotificationsModal(true);
    setLoadingNotifs(true);
    try {
      const recRef = collection(db, 'users', currentUser.uid, 'receivedRequests');
      const recSnap = await getDocs(recRef);
      setReceivedNotifs(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const sentRef = collection(db, 'users', currentUser.uid, 'sentRequests');
      const sentSnap = await getDocs(sentRef);
      setSentNotifs(sentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleUpdateNotifStatus = async (notifId, newStatus) => {
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'receivedRequests', notifId);
      await updateDoc(docRef, { status: newStatus });
      setReceivedNotifs(prev => prev.map(n => n.id === notifId ? { ...n, status: newStatus } : n));

      const n = receivedNotifs.find(x => x.id === notifId);
      if (n && n.senderDocId && n.fromUid) {
        const senderDocRef = doc(db, 'users', n.fromUid, 'sentRequests', n.senderDocId);
        await updateDoc(senderDocRef, { status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const fetchHistory = async () => {
    setActiveTab('history');
    if (workHistory.length > 0) return;
    setIsFetchingHistory(true);
    try {
      const historyRef = collection(db, 'users', currentUser.uid, 'workHistory');
      const snapshot = await getDocs(historyRef);
      if (!snapshot.empty) {
        setWorkHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
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

  const tabStyle = (tabName, currentTab) => ({
    flex: 1,
    padding: '12px',
    background: currentTab === tabName ? 'rgba(225, 65, 236, 0.2)' : 'transparent',
    border: 'none',
    borderBottom: currentTab === tabName ? '2px solid #e141ec' : '2px solid transparent',
    color: currentTab === tabName ? '#fff' : '#a0a0a0',
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
      <div style={{ position: 'absolute', top: '25px', left: '35px', zIndex: 10 }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: '#fff', letterSpacing: '3px', textShadow: '0 0 10px rgba(225, 65, 236, 0.4)' }}>
          KAIYOPPU
        </h2>
      </div>

      <div style={{ position: 'absolute', top: '25px', right: '35px', display: 'flex', gap: '15px', zIndex: 10 }}>
        
        {/* Notifications Button */}
        <button
          onClick={fetchNotifications}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(225, 65, 236, 0.5)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🔔 Notifications
        </button>

        <button
          onClick={fetchHirers}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(225, 65, 236, 0.5)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Look for Hirers
        </button>

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
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Account
        </button>
      </div>

      <h1 style={{
        fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem', color: '#e141ec',
        textShadow: '0 0 15px rgba(225, 65, 236, 0.5)', letterSpacing: '2px', textAlign: 'center'
      }}>
        Worker Dashboard
      </h1>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)',
        borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '420px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1
      }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center', width: '100%' }}>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', color: '#fff' }}>{userData?.name || currentUser?.displayName || 'Worker'}</h2>
          <p style={{ fontSize: '1.1rem', color: '#d0d0d0', margin: '0 0 8px 0', fontFamily: '"Inter", sans-serif' }}>{currentUser?.email}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
            {userData?.isVerified ? (
              <span style={{ background: 'rgba(0, 200, 83, 0.2)', color: '#00e676', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid rgba(0, 200, 83, 0.4)' }}>✓ Aadhar Verified</span>
            ) : (
              <span style={{ background: 'rgba(255, 152, 0, 0.2)', color: '#ff9800', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid rgba(255, 152, 0, 0.4)' }}>⚠ Profile Unverified</span>
            )}
          </div>
          <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', color: '#b0b0b0' }}>Status:</span>
            <button
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
              style={{
                background: workerStatus === 'Looking for job' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                color: workerStatus === 'Looking for job' ? '#00e676' : '#ff9800',
                border: `1px solid ${workerStatus === 'Looking for job' ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
                padding: '6px 15px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {isUpdatingStatus ? 'Updating...' : workerStatus}
            </button>
          </div>
        </div>

        <div style={{
          position: 'relative', background: 'rgba(255, 255, 255, 0.9)', padding: '1.5rem',
          borderRadius: '16px', marginBottom: '2.5rem', boxShadow: '0 0 20px rgba(225, 65, 236, 0.4)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
        }}>
          {userData?.isVerified ? (
            <canvas ref={canvasRef} style={{ width: 180, height: 180, borderRadius: '8px' }}></canvas>
          ) : (
            <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', textAlign: 'center', color: '#0b0b0b', fontWeight: 'bold' }}>
              Please verify your Aadhar in Account to view your QR.
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '14px', fontSize: '1.1rem', fontWeight: 'bold', color: '#fff',
            backgroundColor: 'transparent', border: '1px solid rgba(225, 65, 236, 0.5)', borderRadius: '10px', cursor: 'pointer'
          }}
        >
          SIGN OUT
        </button>
      </div>

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(48, 43, 99, 0.9) 0%, rgba(36, 36, 62, 0.9) 100%)',
            border: '1px solid rgba(225, 65, 236, 0.3)', borderRadius: '16px', padding: '30px',
            width: '90%', maxWidth: '600px', boxShadow: '0 15px 35px rgba(0,0,0,0.5)', position: 'relative'
          }}>
            <button onClick={() => setShowNotificationsModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10 }}>✕</button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#e141ec', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>Notifications</h2>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button onClick={() => setNotifTab('received')} style={tabStyle('received', notifTab)}>Received Invitations</button>
              <button onClick={() => setNotifTab('sent')} style={tabStyle('sent', notifTab)}>Sent Applications</button>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '400px', paddingRight: '10px', fontFamily: '"Inter", sans-serif' }}>
              {loadingNotifs ? (
                <div style={{ textAlign: 'center', color: '#b0b0b0', padding: '20px' }}>Loading...</div>
              ) : notifTab === 'received' ? (
                receivedNotifs.length === 0 ? <div style={{ textAlign: 'center', color: '#888' }}>No invitations received.</div> : (
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {receivedNotifs.map(n => (
                      <div key={n.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '5px' }}>{n.fromName} invited you!</div>
                        <div style={{ color: '#b0b0b0', fontSize: '0.9rem', marginBottom: '10px' }}>{n.fromEmail}</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {n.status === 'pending' ? (
                            <>
                              <button onClick={() => handleUpdateNotifStatus(n.id, 'accepted')} style={{ background: '#00e676', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Accept</button>
                              <button onClick={() => handleUpdateNotifStatus(n.id, 'rejected')} style={{ background: 'transparent', color: '#ff4c4c', border: '1px solid #ff4c4c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Reject</button>
                            </>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <div style={{ color: n.status === 'accepted' ? '#00e676' : '#ff4c4c', fontWeight: 'bold' }}>
                                Status: {n.status.charAt(0).toUpperCase() + n.status.slice(1)}
                              </div>
                              {n.status === 'accepted' && (
                                <div style={{ color: '#00e676', fontWeight: 'bold' }}>📞 +91 9876543210</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                sentNotifs.length === 0 ? <div style={{ textAlign: 'center', color: '#888' }}>No applications sent.</div> : (
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {sentNotifs.map(n => (
                      <div key={n.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '5px' }}>Applied to {n.toName}</div>
                        <div style={{ color: '#b0b0b0', fontSize: '0.9rem', marginBottom: '10px' }}>Status: {n.status.charAt(0).toUpperCase() + n.status.slice(1)}</div>
                        {n.status === 'accepted' && (
                          <div style={{ color: '#00e676', fontWeight: 'bold' }}>📞 +91 9876543210</div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(48, 43, 99, 0.9) 0%, rgba(36, 36, 62, 0.9) 100%)',
            border: '1px solid rgba(225, 65, 236, 0.3)', borderRadius: '16px', padding: '30px',
            width: '90%', maxWidth: activeTab === 'history' ? '700px' : '400px', position: 'relative'
          }}>
            <button onClick={() => setShowProfileModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10 }}>✕</button>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button onClick={() => setActiveTab('profile')} style={tabStyle('profile', activeTab)}>Profile</button>
              <button onClick={fetchHistory} style={tabStyle('history', activeTab)}>Work History</button>
            </div>
            {/* Account Form UI */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: '"Inter", sans-serif' }}>
                <input type="text" placeholder="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', boxSizing: 'border-box' }} />
                <input type="number" placeholder="Age" value={editAge} onChange={(e) => setEditAge(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Place" value={editPlace} onChange={(e) => setEditPlace(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', boxSizing: 'border-box' }} />
                <button onClick={handleVerify} disabled={isVerifying || userData?.isVerified} style={{ marginTop: '15px', width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold', color: '#fff', backgroundColor: userData?.isVerified ? '#2e7d32' : '#e141ec', border: 'none', borderRadius: '8px', cursor: userData?.isVerified ? 'default' : 'pointer' }}>
                  {isVerifying ? 'Verifying...' : userData?.isVerified ? '✓ Verified' : 'Verify using Aadhar'}
                </button>
              </div>
            )}
            {activeTab === 'history' && (
              <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                {isFetchingHistory ? <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                    <thead><tr style={{ borderBottom: '1px solid rgba(225, 65, 236, 0.4)', color: '#e141ec' }}><th>S.No</th><th>Where</th><th>What</th><th>Duration</th><th>Amount</th><th>Remark</th></tr></thead>
                    <tbody>
                      {workHistory.map((job, idx) => (
                        <tr key={job.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '14px 8px' }}>{job.sno || idx + 1}</td><td style={{ padding: '14px 8px' }}>{job.location}</td><td style={{ padding: '14px 8px' }}>{job.role}</td><td style={{ padding: '14px 8px' }}>{job.duration}</td><td style={{ padding: '14px 8px', color: '#00e676' }}>{job.amount}</td><td style={{ padding: '14px 8px' }}>"{job.remark}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hirers Modal */}
      {showHirersModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(48, 43, 99, 0.9) 0%, rgba(36, 36, 62, 0.9) 100%)',
            border: '1px solid rgba(225, 65, 236, 0.3)', borderRadius: '16px', padding: '30px',
            width: '90%', maxWidth: '600px', position: 'relative'
          }}>
            <button onClick={() => setShowHirersModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10 }}>✕</button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#e141ec', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}>Available Hirers</h2>
            
            <div style={{ overflowY: 'auto', maxHeight: '400px', paddingRight: '10px', fontFamily: '"Inter", sans-serif' }}>
              {loadingHirers ? <div style={{ textAlign: 'center', padding: '20px' }}>Loading hirers...</div> : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {hirers.filter(h => !blockedHirers.includes(h.id)).map(hirer => (
                    <div key={hirer.id} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{hirer.name || hirer.displayName || 'Unnamed Hirer'}</span>
                        <span style={{ color: '#00e676', fontSize: '0.8rem', background: 'rgba(0, 230, 118, 0.1)', padding: '4px 8px', borderRadius: '10px' }}>Active</span>
                      </div>
                      <span style={{ color: '#b0b0b0', fontSize: '0.9rem', marginBottom: '5px' }}>✉️ {hirer.email}</span>
                      <span style={{ color: '#b0b0b0', fontSize: '0.9rem', marginBottom: '15px' }}>📍 {hirer.place || 'Location not specified'}</span>
                      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                        {(() => {
                          const sentReq = sentNotifs.find(n => n.toUid === hirer.id);
                          if (sentReq) {
                            if (sentReq.status === 'accepted') {
                              return <div style={{ flex: 1, background: 'rgba(0, 230, 118, 0.1)', color: '#00e676', padding: '8px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>📞 +91 9876543210</div>;
                            } else if (sentReq.status === 'rejected') {
                              return <div style={{ flex: 1, background: 'rgba(255, 76, 76, 0.1)', color: '#ff4c4c', padding: '8px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>Rejected</div>;
                            } else {
                              return <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.1)', color: '#b0b0b0', padding: '8px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>Pending...</div>;
                            }
                          } else {
                            return <button onClick={() => handleApply(hirer)} style={{ flex: 1, background: '#e141ec', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Apply for Work</button>;
                          }
                        })()}
                        <button onClick={() => handleBlock(hirer.id)} style={{ background: 'transparent', color: '#ff4c4c', border: '1px solid rgba(255, 76, 76, 0.4)', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}>Report</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
