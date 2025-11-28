import React, { useState, useEffect } from "react";
import WithdrawalInterface from './WithdrawalInterface';
import { getTesterTheme } from './themeConfig';

function TesterDashboard({ onProjectClick, onCategorize, onProfile, onLeaderboards }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('testerLightMode');
    return saved === null ? false : saved === 'true';
  });

  const theme = getTesterTheme(isLightMode);

  useEffect(() => {
    fetchProjects();
    fetchUserBalance();

    // Refresh balance every 30 seconds to keep it updated
    const balanceInterval = setInterval(fetchUserBalance, 30000);

    const handleThemeChange = () => {
      setIsLightMode(localStorage.getItem('testerLightMode') === 'true');
    };

    window.addEventListener('themeChange', handleThemeChange);

    return () => {
      clearInterval(balanceInterval);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/projects`);

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        setError('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      // Fetch user's actual balance from user-profile endpoint (serverless function)
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/user-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.user?.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const toggleTheme = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    localStorage.setItem('testerLightMode', newMode.toString());
    window.dispatchEvent(new Event('themeChange'));
  };
  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: theme.background,
      position: 'relative',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Main Content */}
      <div style={{ padding: '40px 30px' }}>

        {/* Navigation */}
        <div style={{ marginBottom: '30px' }}>
          <div className="d-flex justify-content-between align-items-center">
            <nav className="d-flex gap-3 align-items-center">
              <h2 style={{
                color: theme.textPrimary,
                margin: 0,
                marginRight: '20px',
                fontSize: '1.5rem',
                fontWeight: '600',
                transition: 'color 0.3s ease'
              }}>TestQuest</h2>
              <button style={{
                background: theme.buttonDark,
                border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                color: theme.textPrimary,
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'Sansita, sans-serif',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = theme.buttonDarkHover;
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = theme.buttonDark;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
              }}>Dashboard</button>
              <button onClick={onLeaderboards} style={{
                background: theme.buttonLight,
                border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                color: theme.textPrimary,
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Sansita, sans-serif',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = theme.buttonLightHover;
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = theme.buttonLight;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
              }}>Leaderboards</button>
            </nav>
            
            <div className="d-flex align-items-center gap-3">
              <div style={{
                background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                borderRadius: '10px',
                padding: '12px 20px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(78, 205, 196, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Sansita, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.02)';
                e.target.style.boxShadow = '0 6px 20px rgba(78, 205, 196, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
              }}
              title="Total earnings from approved bug reports">
                {userBalance.toLocaleString()} credits
              </div>

              <button
                onClick={() => setShowWithdrawal(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  fontFamily: 'Sansita, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px) scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0) scale(1)'}
              >
                Withdraw
              </button>

              <div
                onClick={onProfile}
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >👤</div>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            color: theme.textPrimary,
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '8px',
            fontFamily: 'Sansita, sans-serif',
            transition: 'color 0.3s ease'
          }}>Available Projects</h1>
          <p style={{
            color: theme.textSecondary,
            fontSize: '1.1rem',
            marginBottom: 0,
            fontFamily: 'DM Sans, sans-serif',
            transition: 'color 0.3s ease'
          }}>Find and test security vulnerabilities in approved projects</p>
        </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center" style={{ minHeight: '200px' }}>
          <h5 style={{ color: theme.textPrimary, transition: 'color 0.3s ease' }}>No approved projects available</h5>
          <p style={{ color: theme.textMuted, transition: 'color 0.3s ease' }}>Check back later for new testing opportunities!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginTop: '20px'
        }}>
          {projects.map((project, index) => (
            <div key={project._id || index} style={{
              background: theme.cardBackground,
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: `1px solid ${theme.border}`,
              padding: '20px',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 16px 32px rgba(78, 205, 196, 0.15)';
              e.currentTarget.style.borderColor = theme.borderHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = theme.border;
            }}
            onClick={() => onProjectClick(project._id)}>

              {/* Project Header */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    color: theme.textPrimary,
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '6px',
                    lineHeight: '1.3',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'color 0.3s ease'
                  }}>{project.name}</h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      background: 'rgba(78, 205, 196, 0.2)',
                      color: '#4ECDC4',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '500'
                    }}>{project.platform}</div>
                    <span style={{ color: theme.textMuted, fontSize: '0.8rem', transition: 'color 0.3s ease' }}>•</span>
                    <span style={{ color: theme.textSecondary, fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                      {formatTimeAgo(project.createdAt)}
                    </span>
                  </div>
                  <p style={{
                    color: theme.textSecondary,
                    fontSize: '0.75rem',
                    margin: 0,
                    fontWeight: '400',
                    transition: 'color 0.3s ease'
                  }}>Posted by {project.postedBy?.name || 'Unknown'}</p>
                </div>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: project.image ? `url(${project.image})` : theme.statsCardBg,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '12px',
                  flexShrink: 0,
                  border: project.image ? `1px solid ${theme.border}` : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {!project.image && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-image" viewBox="0 0 16 16" style={{ color: theme.textMuted, transition: 'color 0.3s ease' }}>
                      <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                      <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Project Description */}
              <p style={{
                color: theme.textSecondary,
                fontSize: '0.85rem',
                lineHeight: '1.4',
                marginBottom: '14px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'color 0.3s ease'
              }}>{project.scope}</p>

              {/* Bug Rewards - Simplified */}
              <div style={{ marginBottom: '14px' }}>
                <div className="d-flex justify-content-between" style={{ gap: '6px' }}>
                  <div style={{
                    background: 'rgba(255, 107, 107, 0.15)',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    flex: 1,
                    textAlign: 'center',
                    border: '1px solid rgba(255, 107, 107, 0.2)'
                  }}>
                    <div style={{ color: '#FF6B6B', fontSize: '0.8rem', fontWeight: '700' }}>
                      {(project.bugRewards?.critical || 0).toLocaleString()} credits
                    </div>
                    <small style={{ color: theme.textMuted, fontSize: '0.65rem', transition: 'color 0.3s ease' }}>Critical</small>
                  </div>
                  <div style={{
                    background: 'rgba(255, 183, 77, 0.15)',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    flex: 1,
                    textAlign: 'center',
                    border: '1px solid rgba(255, 183, 77, 0.2)'
                  }}>
                    <div style={{ color: '#FFB74D', fontSize: '0.8rem', fontWeight: '700' }}>
                      {(project.bugRewards?.major || 0).toLocaleString()} credits
                    </div>
                    <small style={{ color: theme.textMuted, fontSize: '0.65rem', transition: 'color 0.3s ease' }}>Major</small>
                  </div>
                  <div style={{
                    background: 'rgba(129, 199, 132, 0.15)',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    flex: 1,
                    textAlign: 'center',
                    border: '1px solid rgba(129, 199, 132, 0.2)'
                  }}>
                    <div style={{ color: '#81C784', fontSize: '0.8rem', fontWeight: '700' }}>
                      {(project.bugRewards?.minor || 0).toLocaleString()} credits
                    </div>
                    <small style={{ color: theme.textMuted, fontSize: '0.65rem', transition: 'color 0.3s ease' }}>Minor</small>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="d-flex justify-content-between align-items-center">
                <div style={{
                  background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>{(project.remainingBounty || project.totalBounty || 0).toLocaleString()} credits</div>
                <div style={{
                  color: '#4ECDC4',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  fontFamily: 'DM Sans, sans-serif'
                }}>
                  Test Now →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Withdrawal Interface */}
      {showWithdrawal && (
        <WithdrawalInterface
          userBalance={userBalance}
          onClose={() => {
            setShowWithdrawal(false);
            // Refresh balance after withdrawal request
            fetchUserBalance();
          }}
        />
      )}
      
      </div>
    </div>
  );
}

export default TesterDashboard;