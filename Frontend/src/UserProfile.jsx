import React, { useState, useEffect } from "react";

// Add badge animations
const badgeStyles = document.createElement('style');
badgeStyles.innerHTML = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  @keyframes shimmer {
    0% { filter: brightness(1); }
    50% { filter: brightness(1.3); }
    100% { filter: brightness(1); }
  }
`;
if (!document.head.querySelector('#badge-animations-userprofile')) {
  badgeStyles.id = 'badge-animations-userprofile';
  document.head.appendChild(badgeStyles);
}

function UserProfile({ onBack }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvedBugReports, setApprovedBugReports] = useState([]);

  useEffect(() => {
    fetchUserProfile();
    fetchApprovedBugReports();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view profile');
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/user-profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setError('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedBugReports = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports?status=approved`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApprovedBugReports(data.bugReports || []);
      }
    } catch (error) {
      console.error('Error fetching approved bug reports:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '100vh', 
        backgroundColor: '#0A0E27',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        minHeight: '100vh', 
        backgroundColor: '#0A0E27',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      backgroundColor: '#0A0E27',
      backgroundImage: 'linear-gradient(135deg, #0A0E27 0%, #1A1B3A 50%, #2D1B69 100%)'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px 30px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="d-flex justify-content-between align-items-center">
          <h2 style={{
            color: '#00D4FF',
            fontWeight: 'bold',
            fontSize: '1.8rem',
            marginBottom: 0,
            letterSpacing: '1px'
          }}>TESTQUEST</h2>
          <button onClick={onBack} style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px 20px',
            color: '#E0E0E0',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 30px' }}>
        <div className="row">
          {/* Profile Info */}
          <div className="col-md-4">
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  color: 'white',
                  fontWeight: 'bold',
                  margin: '0 auto 16px auto'
                }}>
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <h3 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '4px' }}>
                  {user?.name}
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '8px' }}>
                  {user?.email}
                </p>
                <span style={{
                  background: user?.accountType === 'tester' ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                  color: user?.accountType === 'tester' ? '#4ECDC4' : '#FF6B6B',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {user?.accountType}
                </span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ color: 'white', fontSize: '0.9rem', marginBottom: '4px' }}>
                    Available Credits
                  </div>
                  <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                    {(user?.balance || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ color: 'white', fontSize: '0.9rem', marginBottom: '4px' }}>
                    Total Credits Acquired
                  </div>
                  <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                    {(user?.totalCreditsAcquired || 0).toLocaleString()}
                  </div>
                </div>

                {/* Badges Section */}
                {(user?.badges?.firstBlood || user?.badges?.bugHunter || user?.badges?.eliteTester || user?.badges?.bugConqueror || user?.badges?.bugMaster || user?.badges?.bugExpert) && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Badges
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {user?.badges?.firstBlood && (
                        <div style={{
                          background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }} title="First verified bug report">
                          🩸 First Blood
                        </div>
                      )}
                      {user?.badges?.bugHunter && (
                        <div style={{
                          background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }} title="10+ verified bug reports">
                          🐛 Bug Hunter
                        </div>
                      )}
                      {user?.badges?.eliteTester && (
                        <div style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }} title="100+ verified bug reports">
                          👑 Elite Tester
                        </div>
                      )}
                      {user?.badges?.bugConqueror && (
                        <div style={{
                          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }} title="Rank #1 on leaderboard">
                          🏆 Bug Conqueror
                        </div>
                      )}
                      {user?.badges?.bugMaster && (
                        <div style={{
                          background: 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }} title="Rank #2 on leaderboard">
                          🥈 Bug Master
                        </div>
                      )}
                      {user?.badges?.bugExpert && (
                        <div style={{
                          background: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }} title="Rank #3 on leaderboard">
                          🥉 Bug Expert
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                  Member since {formatDate(user?.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Earnings History */}
          <div className="col-md-8">
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '24px'
            }}>
              <h4 style={{ color: 'white', fontSize: '1.3rem', marginBottom: '20px' }}>
                💰 Earnings History
              </h4>
              
              {approvedBugReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                  <h5 style={{ color: 'white', marginBottom: '8px' }}>No Earnings Yet</h5>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                    Start testing projects to earn your first rewards!
                  </p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {approvedBugReports.map((report, index) => (
                    <div key={report._id || index} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h6 style={{ color: 'white', fontSize: '1rem', marginBottom: '4px' }}>
                          {report.title}
                        </h6>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem', marginBottom: '4px' }}>
                          Project: {report.project?.name || 'Unknown'}
                        </p>
                        <span style={{
                          background: report.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 
                                     report.severity === 'major' ? 'rgba(245, 158, 11, 0.2)' : 
                                     'rgba(59, 130, 246, 0.2)',
                          color: report.severity === 'critical' ? '#EF4444' : 
                                 report.severity === 'major' ? '#F59E0B' : '#3B82F6',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {report.severity}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#4ECDC4', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          +{(report.reward?.amount || 0).toLocaleString()} credits
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                          {formatDate(report.reward?.approvedAt || report.updatedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;