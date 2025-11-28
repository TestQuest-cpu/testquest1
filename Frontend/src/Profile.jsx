import React, { useState, useEffect } from "react";
import { getDeveloperTheme, getTesterTheme } from './themeConfig';

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
if (!document.head.querySelector('#badge-animations')) {
  badgeStyles.id = 'badge-animations';
  document.head.appendChild(badgeStyles);
}

function Profile({ onBack, onLogout, onLeaderboards, onModeratorExam, onModeratorSetup }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bugReports, setBugReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    bugsFound: 0,
    pendingBugs: 0,
    approvedBugs: 0,
    rejectedBugs: 0,
    totalEarnings: 0,
    projectsTested: 0
  });
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ name: '', avatar: '' });
  const [moderatorApplication, setModeratorApplication] = useState(null);
  const [isLightMode, setIsLightMode] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    const storageKey = user.accountType === 'developer' ? 'developerLightMode' : 'testerLightMode';
    return localStorage.getItem(storageKey) === 'true';
  });

  const theme = user?.accountType === 'developer' ? getDeveloperTheme(isLightMode) : getTesterTheme(isLightMode);

  useEffect(() => {
    fetchUserProfile();
    fetchUserActivity();
    checkModeratorApplication();

    const handleThemeChange = () => {
      const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      const storageKey = userData.accountType === 'developer' ? 'developerLightMode' : 'testerLightMode';
      setIsLightMode(localStorage.getItem(storageKey) === 'true');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  const checkModeratorApplication = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/user-profile?action=check-moderator-application`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.application && data.application.status === 'approved') {
          setModeratorApplication(data.application);
        }
      }
    } catch (error) {
      console.error('Error checking moderator application:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      console.log('Profile Debug - Token check:', { hasToken: !!token });
      
      if (!token) {
        // Try to get user data from localStorage as fallback
        const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          console.log('Profile Debug - Using localStorage user:', user);
          setUser(user);
          setEditData({ name: user.name || '', avatar: user.avatar || '' });
          setLoading(false);
          return;
        }
        setError('Please log in to view profile');
        setLoading(false);
        return;
      }

      console.log('Profile Debug - Fetching from API...');
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/user-profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Profile Debug - API Response:', { 
        ok: response.ok, 
        status: response.status,
        statusText: response.statusText 
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profile Debug - User data received:', data.user);
        setUser(data.user);
        setEditData({ name: data.user.name || '', avatar: data.user.avatar || '' });
      } else {
        console.error('Profile API Error:', response.status, response.statusText);
        // Fallback to localStorage if API fails
        const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          console.log('Profile Debug - Fallback to localStorage:', user);
          setUser(user);
          setEditData({ name: user.name || '', avatar: user.avatar || '' });
        } else {
          setError(`Failed to fetch profile: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Try localStorage fallback
      try {
        const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          console.log('Profile Debug - Error fallback to localStorage:', user);
          setUser(user);
          setEditData({ name: user.name || '', avatar: user.avatar || '' });
        } else {
          setError('Error loading profile - no backup data available');
        }
      } catch (fallbackError) {
        setError('Error loading profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      console.log('Activity Debug - Token check:', { hasToken: !!token });
      
      if (!token) {
        console.log('Activity Debug - No token, skipping activity fetch');
        return;
      }

      // Fetch bug reports
      console.log('Activity Debug - Fetching bug reports...');
      const bugReportsResponse = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Activity Debug - Bug reports response:', { 
        ok: bugReportsResponse.ok, 
        status: bugReportsResponse.status 
      });

      if (bugReportsResponse.ok) {
        const bugReportsData = await bugReportsResponse.json();
        console.log('Activity Debug - Bug reports data:', bugReportsData);
        setBugReports(bugReportsData.bugReports || []);
        
        // Calculate stats
        const allBugs = bugReportsData.bugReports || [];
        const pendingBugs = allBugs.filter(bug => bug.status === 'pending');
        const approvedBugs = allBugs.filter(bug => bug.status === 'approved');
        const rejectedBugs = allBugs.filter(bug => bug.status === 'rejected');
        const totalEarnings = approvedBugs.reduce((sum, bug) => sum + (bug.reward?.amount || 0), 0);
        const uniqueProjects = new Set(allBugs.map(bug => bug.project?._id)).size;

        console.log('Profile Stats Debug:', {
          totalBugs: allBugs.length,
          pending: pendingBugs.length,
          approved: approvedBugs.length,
          rejected: rejectedBugs.length,
          earnings: totalEarnings,
          projects: uniqueProjects
        });

        setStats({
          bugsFound: allBugs.length,
          pendingBugs: pendingBugs.length,
          approvedBugs: approvedBugs.length,
          rejectedBugs: rejectedBugs.length,
          totalEarnings: totalEarnings,
          projectsTested: uniqueProjects
        });
      }

      // Fetch projects for developers
      console.log('Activity Debug - Fetching projects...');
      const projectsResponse = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/projects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Activity Debug - Projects response:', { 
        ok: projectsResponse.ok, 
        status: projectsResponse.status 
      });

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        console.log('Activity Debug - Projects data:', projectsData);
        setProjects(projectsData.projects || []);
      } else {
        console.error('Activity Debug - Failed to fetch projects:', projectsResponse.status);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const handleEditProfile = async () => {
    if (!editMode) {
      setEditMode(true);
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/user-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editData.name,
          avatar: editData.avatar
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditMode(false);
        
        // Update localStorage
        const currentUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (currentUser) {
          const userData = JSON.parse(currentUser);
          userData.name = data.user.name;
          userData.avatar = data.user.avatar;
          if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            sessionStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: theme.background,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'background-color 0.3s ease'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', backgroundColor: theme.background, padding: '20px', transition: 'background-color 0.3s ease' }}>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: theme.background,
      position: 'relative',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '40px 30px 30px 30px'
      }}>
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
            <button
              onClick={onBack}
              style={{
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
              }}
            >
              Dashboard
            </button>
            <button
              onClick={onLeaderboards}
              style={{
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
              }}
            >
              Leaderboards
            </button>
          </nav>
          
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={onLogout}
              style={{
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
                transition: 'all 0.3s ease',
                fontFamily: 'Sansita, sans-serif'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px) scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0) scale(1)'}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0px 30px 40px 30px' }}>

      <div style={{ display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Left Sidebar */}
        <div style={{ width: '280px' }}>
          {/* Profile Card */}
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '12px',
            padding: '30px',
            textAlign: 'center',
            marginBottom: '20px',
            minHeight: '320px',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: user?.avatar ? `url(${user.avatar})` : 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '36px',
              fontWeight: 'bold'
            }}>
              {!user?.avatar && (user?.name?.charAt(0)?.toUpperCase() || '?')}
            </div>
            
            {editMode ? (
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  placeholder="Your name"
                  style={{
                    background: theme.statsCardBg,
                    border: '1px solid #404040',
                    borderRadius: '4px',
                    padding: '8px',
                    color: 'white',
                    width: '100%',
                    marginBottom: '10px',
                    fontSize: '1rem'
                  }}
                />
                <input
                  type="url"
                  value={editData.avatar}
                  onChange={(e) => setEditData({...editData, avatar: e.target.value})}
                  placeholder="Avatar URL (optional)"
                  style={{
                    background: '#2A2D31',
                    border: '1px solid #404040',
                    borderRadius: '4px',
                    padding: '8px',
                    color: 'white',
                    width: '100%',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            ) : (
              <>
                <h5 style={{ color: theme.textPrimary, marginBottom: '8px', fontSize: '1.2rem', transition: 'color 0.3s ease' }}>
                  {user?.name || 'User'}
                </h5>
                <p style={{ color: theme.textSecondary, fontSize: '0.9rem', marginBottom: '20px', transition: 'color 0.3s ease' }}>
                  {user?.accountType === 'tester' ? 'Bug Tester' : user?.accountType === 'developer' ? 'Project Developer' : 'User'}
                </p>
              </>
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '15px'
            }}>
              <span style={{ color: '#00BFA5', fontSize: '0.9rem' }}>● Active</span>
            </div>

            {user?.accountType === 'tester' && (
              <>
                {/* Reputation Score */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '15px',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Reputation Score
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{
                      color: 'white',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}>
                      {user?.stats?.reputationScore || 0}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.2rem', marginLeft: '4px' }}>
                      /100
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    height: '8px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                      height: '100%',
                      width: `${user?.stats?.reputationScore || 0}%`,
                      transition: 'width 0.5s ease',
                      boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                    }}></div>
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.7rem', textAlign: 'center' }}>
                    {user?.stats?.reputationScore >= 80 ? '⭐ Excellent' :
                     user?.stats?.reputationScore >= 60 ? '✨ Good' :
                     user?.stats?.reputationScore >= 40 ? '📊 Average' : '🔰 Building'}
                  </div>
                </div>

                {/* Moderator Invitation - Only show if reputation >= 85 */}
                {user?.stats?.reputationScore >= 85 && onModeratorExam && (
                  <div style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '15px',
                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={onModeratorExam}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
                  }}>
                    <div style={{
                      color: 'white',
                      fontSize: '1.2rem',
                      marginBottom: '8px',
                      textAlign: 'center'
                    }}>
                      Become a Moderator
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      lineHeight: '1.4'
                    }}>
                      Would you like to become one of the platform's trusted moderators?
                    </div>
                    <div style={{
                      color: 'white',
                      fontSize: '0.7rem',
                      textAlign: 'center',
                      marginTop: '8px',
                      fontWeight: 'bold',
                      textDecoration: 'underline'
                    }}>
                      Click here to apply
                    </div>
                  </div>
                )}

                {/* Moderator Application Approved - Show setup banner */}
                {moderatorApplication && moderatorApplication.status === 'approved' && onModeratorSetup && (
                  <div style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '15px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    animation: 'pulse 2s infinite'
                  }}
                  onClick={onModeratorSetup}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                  }}>
                    <div style={{
                      color: 'white',
                      fontSize: '1.2rem',
                      marginBottom: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      Application Approved!
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      lineHeight: '1.4'
                    }}>
                      Congratulations! Your moderator application has been approved.
                    </div>
                    <div style={{
                      color: 'white',
                      fontSize: '0.7rem',
                      textAlign: 'center',
                      marginTop: '8px',
                      fontWeight: 'bold',
                      textDecoration: 'underline'
                    }}>
                      Click here to set up your moderator account
                    </div>
                  </div>
                )}

                <div style={{
                  background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '15px'
                }}>
                  <div style={{ color: 'white', fontSize: '0.8rem', marginBottom: '4px' }}>
                    Available Credits
                  </div>
                  <div style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold' }}>
                    {(user?.balance || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '15px'
                }}>
                  <div style={{ color: 'white', fontSize: '0.8rem', marginBottom: '4px' }}>
                    Total Credits Acquired
                  </div>
                  <div style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold' }}>
                    {(user?.totalCreditsAcquired || 0).toLocaleString()}
                  </div>
                </div>

                {/* Badges Section */}
                {(user?.badges?.firstBlood || user?.badges?.bugHunter || user?.badges?.eliteTester || user?.badges?.bugConqueror || user?.badges?.bugMaster || user?.badges?.bugExpert) && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '15px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Badges
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {user?.badges?.firstBlood && (
                        <div style={{
                          background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
                          borderRadius: '12px',
                          padding: '8px 14px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4), 0 0 20px rgba(255, 107, 107, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          position: 'relative',
                          overflow: 'hidden',
                          animation: 'pulse 2s infinite'
                        }}
                        title="First verified bug report"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1) rotate(2deg)';
                          e.currentTarget.style.boxShadow = '0 6px 25px rgba(255, 107, 107, 0.6), 0 0 30px rgba(255, 107, 107, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4), 0 0 20px rgba(255, 107, 107, 0.2)';
                        }}>
                          <span style={{ fontSize: '1rem' }}></span> First Blood
                        </div>
                      )}
                      {user?.badges?.bugHunter && (
                        <div style={{
                          background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
                          borderRadius: '12px',
                          padding: '8px 14px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 15px rgba(255, 183, 77, 0.4), 0 0 20px rgba(255, 183, 77, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        title="10+ verified bug reports"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1) rotate(-2deg)';
                          e.currentTarget.style.boxShadow = '0 6px 25px rgba(255, 183, 77, 0.6), 0 0 30px rgba(255, 183, 77, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 183, 77, 0.4), 0 0 20px rgba(255, 183, 77, 0.2)';
                        }}>
                          <span style={{ fontSize: '1rem' }}></span> Bug Hunter
                        </div>
                      )}
                      {user?.badges?.eliteTester && (
                        <div style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '12px',
                          padding: '8px 14px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4), 0 0 20px rgba(102, 126, 234, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        title="100+ verified bug reports"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1) rotate(2deg)';
                          e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.6), 0 0 30px rgba(102, 126, 234, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4), 0 0 20px rgba(102, 126, 234, 0.2)';
                        }}>
                          <span style={{ fontSize: '1rem' }}></span> Elite Tester
                        </div>
                      )}
                      {user?.badges?.bugConqueror && (
                        <div style={{
                          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                          borderRadius: '12px',
                          padding: '8px 14px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 15px rgba(255, 215, 0, 0.5), 0 0 25px rgba(255, 215, 0, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: '2px solid rgba(255, 255, 255, 0.5)',
                          position: 'relative',
                          overflow: 'hidden',
                          animation: 'shimmer 3s infinite'
                        }}
                        title="Rank #1 on leaderboard"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)';
                          e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 215, 0, 0.7), 0 0 40px rgba(255, 215, 0, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.5), 0 0 25px rgba(255, 215, 0, 0.3)';
                        }}>
                          <span style={{ fontSize: '1.1rem' }}></span> Bug Conqueror
                        </div>
                      )}
                      {user?.badges?.bugMaster && (
                        <div style={{
                          background: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
                          borderRadius: '12px',
                          padding: '8px 14px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 15px rgba(192, 192, 192, 0.4), 0 0 20px rgba(192, 192, 192, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: '2px solid rgba(255, 255, 255, 0.4)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        title="Rank #2 on leaderboard"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1) rotate(-3deg)';
                          e.currentTarget.style.boxShadow = '0 6px 25px rgba(192, 192, 192, 0.6), 0 0 30px rgba(192, 192, 192, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(192, 192, 192, 0.4), 0 0 20px rgba(192, 192, 192, 0.2)';
                        }}>
                          <span style={{ fontSize: '1rem' }}></span> Bug Master
                        </div>
                      )}
                      {user?.badges?.bugExpert && (
                        <div style={{
                          background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
                          borderRadius: '12px',
                          padding: '8px 14px',
                          fontSize: '0.75rem',
                          color: 'white',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 15px rgba(205, 127, 50, 0.4), 0 0 20px rgba(205, 127, 50, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        title="Rank #3 on leaderboard"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1) rotate(2deg)';
                          e.currentTarget.style.boxShadow = '0 6px 25px rgba(205, 127, 50, 0.6), 0 0 30px rgba(205, 127, 50, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(205, 127, 50, 0.4), 0 0 20px rgba(205, 127, 50, 0.2)';
                        }}>
                          <span style={{ fontSize: '1rem' }}></span> Bug Expert
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              onClick={handleEditProfile}
              style={{
                background: editMode ? '#4ECDC4' : theme.buttonLight,
                border: editMode ? 'none' : `1px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '8px 16px',
                color: editMode ? 'white' : theme.textPrimary,
                fontSize: '0.9rem',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.3s ease'
              }}
            >
              {editMode ? 'Save Changes' : 'Edit Profile'}
            </button>

            {editMode && (
              <button
                onClick={() => setEditMode(false)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  padding: '8px 16px',
                  color: theme.textMuted,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
            )}

            <button
              onClick={() => {
                const storageKey = user?.accountType === 'developer' ? 'developerLightMode' : 'testerLightMode';
                const currentMode = localStorage.getItem(storageKey) === 'true';
                localStorage.setItem(storageKey, !currentMode);
                window.dispatchEvent(new Event('themeChange'));
              }}
              style={{
                background: theme.buttonLight,
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '8px 16px',
                color: theme.textPrimary,
                fontSize: '0.9rem',
                cursor: 'pointer',
                width: '100%',
                marginTop: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              {(user?.accountType === 'developer' ? localStorage.getItem('developerLightMode') : localStorage.getItem('testerLightMode')) === 'true' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            </button>
          </div>

          {/* Contact Information */}
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '12px',
            padding: '25px',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <h6 style={{ color: theme.textPrimary, marginBottom: '20px', fontSize: '1rem', transition: 'color 0.3s ease' }}>Account Information</h6>

            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: theme.textSecondary, fontSize: '0.9rem', transition: 'color 0.3s ease' }}>{user?.email || 'No email'}</span>
            </div>

            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: theme.textSecondary, fontSize: '0.9rem', textTransform: 'capitalize', transition: 'color 0.3s ease' }}>
                {user?.accountType || 'Unknown'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: theme.textSecondary, fontSize: '0.9rem', transition: 'color 0.3s ease' }}>
                Joined {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div style={{ flex: 1 }}>
          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px', 
            marginBottom: '20px' 
          }}>
            {/* Total Bugs/Projects */}
            <div style={{
              backgroundColor: theme.statsCardBg,
              borderRadius: '12px',
              padding: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              height: '100px',
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '10px',
                backgroundColor: 'rgba(124, 58, 237, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              </div>
              <div>
                <div style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '5px', transition: 'color 0.3s ease' }}>
                  {user?.accountType === 'tester' ? 'Total Bugs Found' : 'Projects Created'}
                </div>
                <div style={{ color: theme.textPrimary, fontSize: '1.8rem', fontWeight: 'bold', transition: 'color 0.3s ease' }}>
                  {user?.accountType === 'tester' ? stats.bugsFound : projects.length}
                </div>
              </div>
            </div>

            {/* Pending */}
            <div style={{
              backgroundColor: theme.statsCardBg,
              borderRadius: '12px',
              padding: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              height: '100px',
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 193, 7, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              </div>
              <div>
                <div style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '5px', transition: 'color 0.3s ease' }}>
                  {user?.accountType === 'tester' ? 'Pending Bugs' : 'Pending Projects'}
                </div>
                <div style={{ color: theme.textPrimary, fontSize: '1.8rem', fontWeight: 'bold', transition: 'color 0.3s ease' }}>
                  {user?.accountType === 'tester' ? stats.pendingBugs : projects.filter(p => p.status === 'pending').length}
                </div>
              </div>
            </div>

            {/* Approved */}
            <div style={{
              backgroundColor: theme.statsCardBg,
              borderRadius: '12px',
              padding: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              height: '100px',
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 191, 165, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              </div>
              <div>
                <div style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '5px', transition: 'color 0.3s ease' }}>
                  {user?.accountType === 'tester' ? 'Approved Bugs' : 'Approved Projects'}
                </div>
                <div style={{ color: theme.textPrimary, fontSize: '1.8rem', fontWeight: 'bold', transition: 'color 0.3s ease' }}>
                  {user?.accountType === 'tester' ? stats.approvedBugs : projects.filter(p => p.status === 'approved').length}
                </div>
              </div>
            </div>

            {/* Earnings/Bounty */}
            <div style={{
              backgroundColor: theme.statsCardBg,
              borderRadius: '12px',
              padding: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              height: '100px',
              border: `1px solid ${theme.border}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '10px',
                backgroundColor: 'rgba(78, 205, 196, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              </div>
              <div>
                <div style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '5px', transition: 'color 0.3s ease' }}>
                  {user?.accountType === 'tester' ? 'Total Earnings' : 'Total Bounty'}
                </div>
                <div style={{ color: theme.textPrimary, fontSize: '1.8rem', fontWeight: 'bold', transition: 'color 0.3s ease' }}>
                  {user?.accountType === 'tester' ?
                    (user?.balance || 0).toLocaleString() :
                    projects.reduce((sum, p) => sum + (p.totalBounty || 0), 0).toLocaleString()
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '20px',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <h6 style={{ color: theme.textPrimary, marginBottom: '25px', fontSize: '1.1rem', transition: 'color 0.3s ease' }}>Recent Activity</h6>
            
            {bugReports.length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center',
                color: '#666'
              }}>
                No recent activity
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {bugReports.slice(0, 5).map((report) => (
                  <div key={report._id} style={{
                    padding: '15px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ color: theme.textPrimary, fontSize: '0.95rem', marginBottom: '4px', transition: 'color 0.3s ease' }}>
                        {report.title}
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: '0.8rem', transition: 'color 0.3s ease' }}>
                        Project: {report.project?.name || 'Unknown'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: report.status === 'approved' ? 'rgba(0, 191, 165, 0.2)' : 
                                   report.status === 'rejected' ? 'rgba(255, 71, 87, 0.2)' : 
                                   'rgba(255, 193, 7, 0.2)',
                        color: report.status === 'approved' ? '#00BFA5' : 
                               report.status === 'rejected' ? '#FF4757' : '#FFC107',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        marginBottom: '4px',
                        display: 'block'
                      }}>
                        {report.status.toUpperCase()}
                      </span>
                      <div style={{ color: '#666', fontSize: '0.7rem' }}>
                        {formatTimeAgo(report.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Projects / Earnings History */}
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '12px',
            padding: '30px',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <h6 style={{ color: theme.textPrimary, marginBottom: '25px', fontSize: '1.1rem', transition: 'color 0.3s ease' }}>
              {user?.accountType === 'tester' ? 'Earnings History' : 'Your Projects'}
            </h6>
            
            {(user?.accountType === 'tester' ? bugReports.filter(r => r.status === 'approved') : projects).length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center',
                color: '#666'
              }}>
                {user?.accountType === 'tester' ? 'No earnings yet' : 'No projects created'}
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {user?.accountType === 'tester' ? 
                  bugReports.filter(r => r.status === 'approved').slice(0, 10).map((report) => (
                    <div key={report._id} style={{
                      padding: '15px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ color: theme.textPrimary, fontSize: '0.95rem', marginBottom: '4px', transition: 'color 0.3s ease' }}>
                          {report.title}
                        </div>
                        <div style={{ color: theme.textSecondary, fontSize: '0.8rem', transition: 'color 0.3s ease' }}>
                          {report.project?.name || 'Unknown'} • {report.severity}
                        </div>
                      </div>
                      <div style={{ color: '#4ECDC4', fontSize: '1rem', fontWeight: 'bold' }}>
                        +{(report.reward?.amount || 0).toLocaleString()} credits
                      </div>
                    </div>
                  )) :
                  projects.slice(0, 10).map((project) => (
                    <div key={project._id} style={{
                      padding: '15px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ color: theme.textPrimary, fontSize: '0.95rem', marginBottom: '4px', transition: 'color 0.3s ease' }}>
                          {project.name}
                        </div>
                        <div style={{ color: theme.textSecondary, fontSize: '0.8rem', transition: 'color 0.3s ease' }}>
                          {project.platform} • {(project.remainingBounty || 0).toLocaleString()} credits remaining
                        </div>
                      </div>
                      <span style={{
                        background: project.status === 'approved' ? 'rgba(0, 191, 165, 0.2)' : 
                                   project.status === 'rejected' ? 'rgba(255, 71, 87, 0.2)' : 
                                   'rgba(255, 193, 7, 0.2)',
                        color: project.status === 'approved' ? '#00BFA5' : 
                               project.status === 'rejected' ? '#FF4757' : '#FFC107',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>
                        {project.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
      
      </div>
    </div>
  );
}

export default Profile;