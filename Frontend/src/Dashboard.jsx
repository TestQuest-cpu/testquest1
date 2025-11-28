import React, { useState, useEffect } from "react";

function Dashboard({ onPostProject, onProfile, onLogs, refreshTrigger }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userAccountType, setUserAccountType] = useState('');

  useEffect(() => {
    fetchProjects();
    
    // Get user account type from localStorage
    try {
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      setUserAccountType(user.accountType || '');
    } catch (error) {
      console.error('Error parsing user data:', error);
      setUserAccountType('');
    }
  }, [refreshTrigger]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/projects?status=approved`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

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
  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      backgroundColor: '#0E0F15'
    }}>
      
      {/* Main Content */}
      <div style={{ padding: '40px 30px' }}>

        {/* Navigation */}
        <div style={{ marginBottom: '30px' }}>
          <div className="d-flex justify-content-between align-items-center">
            <nav className="d-flex gap-3">
              <button style={{
                background: '#1F1F1F',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'Sansita, sans-serif',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2F2F2F';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#1F1F1F';
                e.target.style.transform = 'translateY(0)';
              }}>Dashboard</button>
              <button style={{
                background: '#1F1F1F',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Sansita, sans-serif'
              }} 
              onMouseEnter={(e) => {
                e.target.style.background = '#2F2F2F';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#1F1F1F';
                e.target.style.transform = 'translateY(0)';
              }}>Leaderboards</button>
            </nav>
            
            <div className="d-flex align-items-center gap-3">
              <button onClick={onLogs} style={{
                background: '#1F1F1F',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: 'Sansita, sans-serif',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2F2F2F';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#1F1F1F';
                e.target.style.transform = 'translateY(0)';
              }}
              >📋 Logs</button>
              
              {/* Only show Post Project button for developers */}
              {userAccountType === 'developer' && (
                <button onClick={onPostProject} style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px 28px',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px) scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0) scale(1)'}
                >🚀 Post Project</button>
              )}
              
              <div onClick={onProfile} style={{
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
              }}>👤</div>
            </div>
          </div>
        </div>

        {/* Page Title & Stats */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h1 style={{
              color: 'white',
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '8px',
              fontFamily: 'Sansita, sans-serif'
            }}>Live Projects</h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1.1rem',
              marginBottom: 0
            }}>Discover and test the latest security challenges</p>
          </div>
          <div className="d-flex gap-4">
            <div style={{
              background: '#1F1F1F',
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'center'
            }}>
              <div style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>{projects.length}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>Active Projects</div>
            </div>
            <div style={{
              background: '#1F1F1F',
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'center'
            }}>
              <div style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
                ${projects.reduce((total, p) => total + (p.remainingBounty || 0), 0)}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>Total Bounty</div>
            </div>
          </div>
        </div>

        {loading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid rgba(0, 212, 255, 0.3)',
              borderTop: '3px solid #00D4FF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }}></div>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem' }}>Loading projects...</p>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            color: '#FF6B6B',
            fontSize: '1.1rem'
          }}>
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
            <h3 style={{ color: 'white', marginBottom: '12px', fontSize: '1.5rem' }}>No Projects Available</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', marginBottom: '30px' }}>Be the first to post a security testing project!</p>
            <button onClick={onPostProject} style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
            }}>Post Your First Project</button>
          </div>
        )}

        {/* Projects Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
          gap: '24px',
          marginTop: '30px'
        }}>
          {projects.map((project) => (
            <div key={project._id} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '24px',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 212, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}>
              
              {/* Project Header */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    marginBottom: '8px',
                    lineHeight: '1.3'
                  }}>{project.name}</h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      background: 'rgba(0, 212, 255, 0.2)',
                      color: '#00D4FF',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>{project.platform}</div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>•</span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>by {project.postedBy?.name || 'Unknown'}</span>
                  </div>
                </div>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '16px',
                  flexShrink: 0
                }}>
                  {project.image ? (
                    <img src={project.image} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                  ) : (
                    <span style={{ fontSize: '1.5rem', color: 'white' }}>🛡️</span>
                  )}
                </div>
              </div>

              {/* Project Description */}
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                marginBottom: '16px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>{project.scope}</p>

              {/* Bounty Breakdown */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '0.85rem', 
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>Bug Bounty Rewards</div>
                <div className="d-flex gap-3">
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ color: '#FF6B6B', fontSize: '1rem', fontWeight: '600' }}>${project.bugRewards?.critical || 0}</div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>Critical</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ color: '#FFA726', fontSize: '1rem', fontWeight: '600' }}>${project.bugRewards?.major || 0}</div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>Major</div>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ color: '#66BB6A', fontSize: '1rem', fontWeight: '600' }}>${project.bugRewards?.minor || 0}</div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>Minor</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="d-flex justify-content-between align-items-center">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>${project.remainingBounty} Available</div>
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.8rem'
                }}>{formatTimeAgo(project.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Add spinning animation for loading
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-dashboard-styles]')) {
  style.setAttribute('data-dashboard-styles', 'true');
  document.head.appendChild(style);
}

export default Dashboard;