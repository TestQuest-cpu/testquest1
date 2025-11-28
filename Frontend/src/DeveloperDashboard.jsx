import React, { useState, useEffect } from "react";
import { getDeveloperTheme } from './themeConfig';

function DeveloperDashboard({ onPost, onProjectClick, onProfile, onLeaderboards }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLightMode, setIsLightMode] = useState(localStorage.getItem('developerLightMode') === 'true');

  const theme = getDeveloperTheme(isLightMode);

  useEffect(() => {
    fetchMyProjects();

    const handleThemeChange = () => {
      setIsLightMode(localStorage.getItem('developerLightMode') === 'true');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  const fetchMyProjects = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        setError('Please log in to view your projects');
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/projects?myProjects=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        // Fallback: get all projects and filter by current user
        const allProjectsResponse = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (allProjectsResponse.ok) {
          const allData = await allProjectsResponse.json();
          const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
          const myProjects = allData.projects.filter(p => p.postedBy?.id === user.id || p.postedBy?._id === user.id);
          setProjects(myProjects);
        } else {
          setError('Failed to fetch your projects');
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: 'Pending Review' },
      approved: { bg: '#D1FAE5', color: '#065F46', text: 'Approved & Live' },
      rejected: { bg: '#FEE2E2', color: '#991B1B', text: 'Rejected' },
      completed: { bg: '#E0E7FF', color: '#3730A3', text: 'Completed' }
    };
    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '6px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        width: 'fit-content'
      }}>
        {config.text}
      </span>
    );
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

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

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

        {/* Navigation Updated */}
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
              <button onClick={onPost} style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '14px 28px',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                fontFamily: 'Sansita, sans-serif'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px) scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0) scale(1)'}
              >Post Project</button>

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
              color: theme.textPrimary,
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '8px',
              fontFamily: 'Sansita, sans-serif',
              transition: 'color 0.3s ease'
            }}>Live Projects</h1>
            <p style={{
              color: theme.textSecondary,
              fontSize: '1.1rem',
              marginBottom: 0,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'color 0.3s ease'
            }}>Track your posted projects and their approval status</p>
          </div>
          <div className="d-flex gap-4">
            <div style={{
              background: theme.statsCardBg,
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'center',
              transition: 'background 0.3s ease'
            }}>
              <div style={{ color: theme.textPrimary, fontSize: '1.8rem', fontWeight: 'bold', transition: 'color 0.3s ease' }}>{projects.length}</div>
              <div style={{ color: theme.textSecondary, fontSize: '0.9rem', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Total Projects</div>
            </div>
            <div style={{
              background: theme.statsCardBg,
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'center',
              transition: 'background 0.3s ease'
            }}>
              <div style={{ color: theme.textPrimary, fontSize: '1.8rem', fontWeight: 'bold', transition: 'color 0.3s ease' }}>
                {projects.filter(p => p.status === 'approved').length}
              </div>
              <div style={{ color: theme.textSecondary, fontSize: '0.9rem', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Approved</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Projects', count: projects.length },
              { key: 'pending', label: 'Pending Review', count: projects.filter(p => p.status === 'pending').length },
              { key: 'approved', label: 'Approved & Live', count: projects.filter(p => p.status === 'approved').length },
              { key: 'rejected', label: 'Rejected', count: projects.filter(p => p.status === 'rejected').length },
              { key: 'completed', label: 'Completed', count: projects.filter(p => p.status === 'completed').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  background: filter === tab.key
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : theme.buttonLight,
                  color: theme.textPrimary,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: filter === tab.key ? '0 4px 15px rgba(102, 126, 234, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
                  fontFamily: 'DM Sans, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (filter !== tab.key) {
                    e.target.style.background = theme.buttonLightHover;
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== tab.key) {
                    e.target.style.background = theme.buttonLight;
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                  }
                }}
              >
                {tab.label}
                <span style={{
                  background: filter === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
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
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Loading projects...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            color: '#FF6B6B',
            fontSize: '1.1rem',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProjects.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: theme.cardBackground,
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
            <h3 style={{ color: theme.textPrimary, marginBottom: '12px', fontSize: '1.5rem', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
              {filter === 'all' ? 'No Projects Yet' : `No ${filter} Projects`}
            </h3>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', marginBottom: '30px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
              {filter === 'all'
                ? "You haven't posted any projects yet. Start by creating your first security testing project!"
                : `You don't have any projects with ${filter} status.`
              }
            </p>
            {filter === 'all' && (
              <button onClick={onPost} style={{
                background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
                fontFamily: 'DM Sans, sans-serif'
              }}>Post Your First Project</button>
            )}
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && filteredProjects.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
            gap: '24px',
            marginTop: '30px'
          }}>
            {filteredProjects.map((project) => (
              <div key={project._id} style={{
                background: theme.cardBackground,
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: `1px solid ${theme.border}`,
                padding: '24px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = theme.cardHoverShadow;
                e.currentTarget.style.borderColor = theme.borderHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = theme.border;
              }}
              onClick={() => onProjectClick && onProjectClick(project)}>
                
                {/* Project Header */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      color: theme.textPrimary,
                      fontSize: '1.3rem',
                      fontWeight: '600',
                      marginBottom: '8px',
                      lineHeight: '1.3',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'color 0.3s ease'
                    }}>{project.name}</h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        background: theme.platformBadgeBg,
                        color: '#00D4FF',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        transition: 'background 0.3s ease'
                      }}>{project.platform}</div>
                      <span style={{ color: theme.textMuted, fontSize: '0.85rem', transition: 'color 0.3s ease' }}>•</span>
                      <span style={{ color: theme.textSecondary, fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                        {formatTimeAgo(project.createdAt)}
                      </span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      {getStatusBadge(project.status)}
                    </div>
                  </div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    background: project.image ? `url(${project.image})` : (isLightMode ? '#E5E7EB' : '#2A2A2A'),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '16px',
                    flexShrink: 0,
                    border: project.image ? `1px solid ${theme.border}` : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {!project.image && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-image" viewBox="0 0 16 16" style={{ color: theme.textSecondary, transition: 'color 0.3s ease' }}>
                        <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Project Description */}
                <p style={{
                  color: theme.textSecondary,
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.3s ease'
                }}>{project.objective || project.scope}</p>

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
                    }}>{(project.totalBounty || 0).toLocaleString()} credits</div>
                  </div>
                  {project.projectLink && (
                    <a
                      href={project.projectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: '#00D4FF',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        fontFamily: 'DM Sans, sans-serif'
                      }}
                    >
                      View Project →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
if (!document.head.querySelector('style[data-developer-dashboard-styles]')) {
  style.setAttribute('data-developer-dashboard-styles', 'true');
  document.head.appendChild(style);
}

export default DeveloperDashboard;