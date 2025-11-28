import React, { useState, useEffect } from "react";
import { getAdminTheme } from './themeConfig';

function AdminDashboard({ onLogout }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLightMode, setIsLightMode] = useState(localStorage.getItem('adminLightMode') === 'true');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTesters: 0,
    totalDevelopers: 0,
    newUsersThisWeek: 0,
    totalProjects: 0,
    pendingProjects: 0,
    approvedProjects: 0,
    newProjectsThisWeek: 0,
    totalBugReports: 0,
    pendingBugReports: 0,
    approvedBugReports: 0,
    newBugReportsThisWeek: 0,
    totalBounty: 0,
    paidOut: 0,
    utilizationRate: 0
  });

  // Get theme based on light mode
  const theme = getAdminTheme(isLightMode);

  useEffect(() => {
    // Get admin info from localStorage
    const adminData = localStorage.getItem('adminUser');
    if (adminData) {
      setAdmin(JSON.parse(adminData));
    }

    // Load dashboard data
    loadDashboardData();

    // Listen for theme changes
    const handleThemeChange = () => {
      setIsLightMode(localStorage.getItem('adminLightMode') === 'true');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Load platform statistics
      const statsResponse = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/admin?action=stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        const platformStats = data.stats;
        
        setStats({
          totalUsers: platformStats.users.total,
          totalTesters: platformStats.users.testers,
          totalDevelopers: platformStats.users.developers,
          newUsersThisWeek: platformStats.users.newThisWeek,
          totalProjects: platformStats.projects.total,
          pendingProjects: platformStats.projects.pending,
          approvedProjects: platformStats.projects.approved,
          newProjectsThisWeek: platformStats.projects.newThisWeek,
          totalBugReports: platformStats.bugReports.total,
          pendingBugReports: platformStats.bugReports.pending,
          approvedBugReports: platformStats.bugReports.approved,
          newBugReportsThisWeek: platformStats.bugReports.newThisWeek,
          totalBounty: platformStats.financial.totalBounty,
          paidOut: platformStats.financial.paidOut,
          utilizationRate: platformStats.financial.utilizationRate
        });
      } else {
        throw new Error('Failed to load platform statistics');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to simulated data on error
      setStats({
        totalUsers: 156,
        totalTesters: 89,
        totalDevelopers: 67,
        newUsersThisWeek: 12,
        totalProjects: 5,
        pendingProjects: 2,
        approvedProjects: 3,
        newProjectsThisWeek: 3,
        totalBugReports: 89,
        pendingBugReports: 15,
        approvedBugReports: 58,
        newBugReportsThisWeek: 15,
        totalBounty: 25000,
        paidOut: 12500,
        utilizationRate: 50
      });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    onLogout();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
        transition: 'background-color 0.3s ease'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${theme.border}`,
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Loading admin dashboard...</p>
        </div>
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
        backgroundColor: theme.cardBackground,
        borderBottom: `1px solid ${theme.border}`,
        padding: '20px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: isLightMode ? '0 2px 10px rgba(0,0,0,0.05)' : '0 2px 10px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: theme.textPrimary,
              margin: 0,
              transition: 'color 0.3s ease'
            }}>
              TestQuest Admin
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.textSecondary,
              margin: 0,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'color 0.3s ease'
            }}>
              Administrative Dashboard
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme Toggle Button */}
          <button
            onClick={() => {
              const newMode = !isLightMode;
              localStorage.setItem('adminLightMode', newMode);
              setIsLightMode(newMode);
              window.dispatchEvent(new Event('themeChange'));
            }}
            style={{
              background: theme.buttonLight,
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              padding: '12px 20px',
              color: theme.textPrimary,
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Sansita, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = theme.buttonLightHover;
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = theme.buttonLight;
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {isLightMode ? 'Dark Mode' : 'Light Mode'}
          </button>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: theme.textPrimary,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'color 0.3s ease'
            }}>
              {admin?.username}
            </div>
            <div style={{
              fontSize: '12px',
              color: theme.textSecondary,
              textTransform: 'capitalize',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'color 0.3s ease'
            }}>
              {admin?.role?.replace('_', ' ')}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
              color: theme.textPrimary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'Sansita, sans-serif',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px) scale(1.05)';
              e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        backgroundColor: theme.cardBackground,
        borderBottom: `1px solid ${theme.border}`,
        padding: '0 30px',
        transition: 'all 0.3s ease'
      }}>
        <nav style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'projects', label: 'Projects' },
            { id: 'users', label: 'Users' },
            { id: 'reports', label: 'Bug Reports' },
            { id: 'moderators', label: 'Moderators' },
            { id: 'payments', label: 'Payments' },
            { id: 'settings', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : theme.buttonDark,
                border: 'none',
                borderRadius: '10px',
                padding: '14px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: theme.textPrimary,
                fontFamily: 'Sansita, sans-serif',
                boxShadow: activeTab === tab.id ? '0 4px 15px rgba(102, 126, 234, 0.4)' : (isLightMode ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.2)'),
                transition: 'all 0.3s ease',
                margin: '8px 4px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = theme.buttonDarkHover;
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = isLightMode ? '0 4px 15px rgba(0, 0, 0, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.4)';
                } else {
                  e.target.style.transform = 'translateY(-2px) scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = theme.buttonDark;
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = isLightMode ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.2)';
                } else {
                  e.target.style.transform = 'translateY(0) scale(1)';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ padding: '30px' }}>
        {activeTab === 'overview' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-5">
              <div>
                <h2 style={{
                  color: theme.textPrimary,
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  marginBottom: '8px',
                  fontFamily: 'Sansita, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  Platform Overview
                </h2>
                <p style={{
                  color: theme.textSecondary,
                  fontSize: '1.1rem',
                  marginBottom: 0,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.3s ease'
                }}>Comprehensive insights into your TestQuest platform</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {[
                {
                  label: 'Total Users',
                  value: stats.totalUsers,
                  gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                  change: `+${stats.newUsersThisWeek} this week`
                },
                {
                  label: 'Active Projects',
                  value: stats.totalProjects,
                  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  change: `+${stats.newProjectsThisWeek} this week`
                },
                {
                  label: 'Pending Approval',
                  value: stats.pendingProjects,
                  gradient: 'linear-gradient(135deg, #FDBB2D 0%, #E67E22 100%)',
                  change: 'Needs attention'
                },
                {
                  label: 'Bug Reports',
                  value: stats.totalBugReports,
                  gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
                  change: `+${stats.newBugReportsThisWeek} this week`
                }
              ].map((stat, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: theme.cardBackground,
                    padding: '28px',
                    borderRadius: '16px',
                    border: `1px solid ${theme.border}`,
                    boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        color: theme.textSecondary,
                        fontFamily: 'DM Sans, sans-serif',
                        transition: 'color 0.3s ease'
                      }}>
                        {stat.label}
                      </div>
                      <div style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: theme.textPrimary,
                        fontFamily: 'Sansita, sans-serif',
                        transition: 'color 0.3s ease'
                      }}>
                        {stat.value}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.textMuted,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'color 0.3s ease'
                  }}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{
              backgroundColor: theme.cardBackground,
              padding: '24px',
              borderRadius: '16px',
              border: `1px solid ${theme.border}`,
              boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: theme.textPrimary,
                marginBottom: '16px',
                fontFamily: 'Sansita, sans-serif',
                transition: 'color 0.3s ease'
              }}>
                Quick Actions
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {[
                  { label: 'Approve Projects', action: () => setActiveTab('projects') },
                  { label: 'Review Bug Reports', action: () => setActiveTab('reports') },
                  { label: 'Manage Users', action: () => setActiveTab('users') },
                  { label: 'Process Payments', action: () => setActiveTab('payments') }
                ].map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    style={{
                      background: theme.buttonDark,
                      border: `1px solid ${theme.border}`,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: theme.textPrimary,
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = theme.buttonDarkHover;
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = isLightMode ? '0 4px 15px rgba(0, 0, 0, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = theme.buttonDark;
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Platform Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
              marginTop: '32px'
            }}>
              {/* User Breakdown */}
              <div style={{
                backgroundColor: theme.cardBackground,
                padding: '20px',
                borderRadius: '16px',
                border: `1px solid ${theme.border}`,
                boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: theme.textPrimary,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'Sansita, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  User Demographics
                </h4>
                <div style={{ space: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Testers</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#4ECDC4', fontFamily: 'DM Sans, sans-serif' }}>
                      {stats.totalTesters}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Developers</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#10B981' }}>
                      {stats.totalDevelopers}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${theme.border}`,
                    transition: 'border-color 0.3s ease'
                  }}>
                    <span style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>New this week</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#059669' }}>
                      +{stats.newUsersThisWeek}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Status */}
              <div style={{
                backgroundColor: theme.cardBackground,
                padding: '20px',
                borderRadius: '16px',
                border: `1px solid ${theme.border}`,
                boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: theme.textPrimary,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'Sansita, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  Project Status
                </h4>
                <div style={{ space: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Approved</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#10B981', fontFamily: 'DM Sans, sans-serif' }}>
                      {stats.approvedProjects}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Pending</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#F59E0B' }}>
                      {stats.pendingProjects}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${theme.border}`,
                    transition: 'border-color 0.3s ease'
                  }}>
                    <span style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>New submissions</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#059669' }}>
                      +{stats.newProjectsThisWeek}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Overview */}
              <div style={{
                backgroundColor: theme.cardBackground,
                padding: '20px',
                borderRadius: '16px',
                border: `1px solid ${theme.border}`,
                boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: theme.textPrimary,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'Sansita, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  Financial Summary
                </h4>
                <div style={{ space: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Total Bounty</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                      {(stats.totalBounty || 0).toLocaleString()} credits
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Paid Out</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#10B981', fontFamily: 'DM Sans, sans-serif' }}>
                      {(stats.paidOut || 0).toLocaleString()} credits
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${theme.border}`,
                    transition: 'border-color 0.3s ease'
                  }}>
                    <span style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Utilization Rate</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#3B82F6' }}>
                      {stats.utilizationRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && <ProjectsManagement theme={theme} isLightMode={isLightMode} />}
        {activeTab === 'users' && <UsersManagement theme={theme} isLightMode={isLightMode} />}
        {activeTab === 'reports' && <BugReportsManagement theme={theme} isLightMode={isLightMode} />}
        {activeTab === 'moderators' && <ModeratorsManagement theme={theme} isLightMode={isLightMode} />}
        {activeTab === 'payments' && <PaymentsManagement theme={theme} isLightMode={isLightMode} />}

        {activeTab !== 'overview' && activeTab !== 'projects' && activeTab !== 'users' && activeTab !== 'reports' && activeTab !== 'moderators' && activeTab !== 'payments' && (
          <div style={{
            backgroundColor: theme.cardBackground,
            padding: '48px',
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: theme.textPrimary,
              marginBottom: '8px',
              textTransform: 'capitalize',
              fontFamily: 'Sansita, sans-serif',
              transition: 'color 0.3s ease'
            }}>
              {activeTab} Management
            </h3>
            <p style={{ color: theme.textSecondary, marginBottom: '24px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
              This section is under construction. Full admin features will be implemented here.
            </p>
            <div style={{
              padding: '12px 16px',
              backgroundColor: theme.statsCardBg,
              borderRadius: '10px',
              fontSize: '14px',
              color: theme.textSecondary,
              transition: 'all 0.3s ease',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              Coming soon: {activeTab} management interface with full CRUD operations
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Projects Management Component
function ProjectsManagement({ theme, isLightMode }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [filter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/projects?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        console.error('Failed to load projects:', data.message);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectAction = async (projectId, action, reason = '') => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/admin?action=approve-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId,
          action,
          rejectionReason: reason
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the local projects list
        const updatedProjects = projects.map(project => {
          if (project._id === projectId) {
            return {
              ...project,
              status: data.project.status,
              approvedBy: data.project.approvedBy,
              approvedAt: data.project.approvedAt,
              rejectedAt: data.project.rejectedAt,
              rejectionReason: data.project.rejectionReason
            };
          }
          return project;
        });
        
        // Filter projects based on current filter
        setProjects(updatedProjects.filter(p => p.status === filter));
        setShowModal(false);
        setSelectedProject(null);
        
        // Show success message
        alert(`Project ${action}d successfully! It is now ${data.project.status === 'approved' ? 'live for testers' : 'rejected'}.`);
        
        // Reload projects to get fresh data
        loadProjects();
      } else {
        console.error('Error updating project:', data.message);
        alert(`Failed to ${action} project: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: 'Pending Review' },
      approved: { bg: '#D1FAE5', color: '#065F46', text: 'Approved' },
      rejected: { bg: '#FEE2E2', color: '#991B1B', text: 'Rejected' },
      completed: { bg: '#E0E7FF', color: '#3730A3', text: 'Completed' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {config.text}
      </span>
    );
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: theme.textPrimary,
          margin: 0,
          transition: 'color 0.3s ease'
        }}>
          Project Management
        </h2>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['pending', 'approved', 'rejected', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                background: filter === status ? '#DC2626' : theme.buttonLight,
                color: filter === status ? 'white' : theme.textPrimary,
                fontFamily: 'DM Sans, sans-serif',
                border: `1px solid ${theme.border}`,
                padding: '6px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textTransform: 'capitalize',
                transition: 'all 0.3s ease'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{
          backgroundColor: theme.cardBackground,
          padding: '48px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: `3px solid ${theme.border}`,
            borderTop: '3px solid #DC2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div style={{
          backgroundColor: theme.cardBackground,
          padding: '48px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: theme.textPrimary,
            marginBottom: '8px',
            transition: 'color 0.3s ease'
          }}>
            No {filter} projects found
          </h3>
          <p style={{ color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
            There are no projects with {filter} status at the moment.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
            gap: '16px',
            padding: '16px 20px',
            backgroundColor: theme.tableHeaderBg,
            borderBottom: `1px solid ${theme.border}`,
            fontSize: '14px',
            fontWeight: '600',
            color: theme.textPrimary,
            fontFamily: 'Sansita, sans-serif',
            transition: 'all 0.3s ease'
          }}>
            <div>Project Details</div>
            <div>Developer</div>
            <div>Bounty</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {projects.map((project) => (
            <div
              key={project._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                gap: '16px',
                padding: '20px',
                borderBottom: `1px solid ${theme.tableRowBorder}`,
                alignItems: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '4px',
                  transition: 'color 0.3s ease'
                }}>
                  {project.name}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary,
                  fontFamily: 'DM Sans, sans-serif',
                  marginBottom: '4px',
                  transition: 'color 0.3s ease'
                }}>
                  Platform: {project.platform}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.textMuted,
                  transition: 'color 0.3s ease'
                }}>
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.textPrimary,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  {project.postedBy?.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.textSecondary,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  {project.postedBy?.email}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#059669'
                }}>
                  {(project.totalBounty || 0).toLocaleString()} credits
                </div>
              </div>

              <div>
                {getStatusBadge(project.status)}
              </div>

              <div>
                <button
                  onClick={() => {
                    setSelectedProject(project);
                    setShowModal(true);
                  }}
                  style={{
                    background: theme.buttonDark,
                    border: `1px solid ${theme.border}`,
                    padding: '6px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: theme.textPrimary,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = theme.buttonDarkHover;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = theme.buttonDark;
                  }}
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Review Modal */}
      {showModal && selectedProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: theme.textPrimary,
                margin: 0,
                transition: 'color 0.3s ease'
              }}>
                Review Project
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedProject(null);
                }}
                style={{
                  background: theme.buttonLight,
                  border: `1px solid ${theme.border}`,
                  fontSize: '24px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: theme.textPrimary,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = theme.buttonLightHover;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = theme.buttonLight;
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: theme.textPrimary,
                marginBottom: '8px',
                transition: 'color 0.3s ease'
              }}>
                {selectedProject.name}
              </h4>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Platform:
                  </label>
                  <div style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    {selectedProject.platform}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Total Bounty:
                  </label>
                  <div style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    {(selectedProject.totalBounty || 0).toLocaleString()} credits
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                  Objective:
                </label>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary,
                  fontFamily: 'DM Sans, sans-serif',
                  marginTop: '4px',
                  padding: '12px',
                  backgroundColor: theme.statsCardBg,
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.3s ease'
                }}>
                  {selectedProject.objective}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                  Scope:
                </label>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary,
                  fontFamily: 'DM Sans, sans-serif',
                  marginTop: '4px',
                  padding: '12px',
                  backgroundColor: theme.statsCardBg,
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.3s ease'
                }}>
                  {selectedProject.scope}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                  Areas to Test:
                </label>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary,
                  fontFamily: 'DM Sans, sans-serif',
                  marginTop: '4px',
                  padding: '12px',
                  backgroundColor: theme.statsCardBg,
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.3s ease'
                }}>
                  {selectedProject.areasToTest}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                  Project Link:
                </label>
                <div style={{ fontSize: '14px', color: '#2563eb', marginTop: '4px' }}>
                  <a
                    href={selectedProject.projectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'underline' }}
                  >
                    {selectedProject.projectLink}
                  </a>
                </div>
              </div>
            </div>

            {selectedProject.status === 'pending' && (
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => handleProjectAction(selectedProject._id, 'reject')}
                  disabled={actionLoading}
                  style={{
                    background: actionLoading ? '#9ca3af' : '#dc2626',
                    color: theme.textPrimary,
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleProjectAction(selectedProject._id, 'approve')}
                  disabled={actionLoading}
                  style={{
                    background: actionLoading ? '#9ca3af' : '#059669',
                    color: theme.textPrimary,
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Bug Reports Management Component
function BugReportsManagement({ theme, isLightMode }) {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0
  });
  const [summary, setSummary] = useState({
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    resolvedReports: 0,
    totalRewards: 0,
    criticalBugs: 0,
    majorBugs: 0,
    minorBugs: 0
  });

  // Filters and search
  const [filters, setFilters] = useState({
    search: '',
    severity: '',
    status: '',
    projectId: '',
    submittedBy: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    dateFrom: '',
    dateTo: '',
    rewardMin: '',
    rewardMax: ''
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalAction, setModalAction] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rewardAmount, setRewardAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    loadBugReports();
  }, [pagination.currentPage, filters]);

  const loadBugReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        ...filters
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/admin?action=bug-reports&${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBugReports(data.bugReports || []);
        setPagination(data.pagination || {});
        setSummary(data.summary || {});
      } else {
        console.error('Failed to load bug reports');
      }
    } catch (error) {
      console.error('Error loading bug reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const openActionModal = (report, action) => {
    setSelectedReport(report);
    setModalAction(action);
    setRewardAmount((report.reward?.amount || report.project?.bugRewards?.[report.severity] || 0).toString());
    setAdminNotes('');
    setActionReason('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
    setModalAction('');
    setRewardAmount('');
    setAdminNotes('');
    setActionReason('');
  };

  const handleBugReportAction = async () => {
    if (!selectedReport || !modalAction) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const body = {
        bugReportId: selectedReport._id,
        action: modalAction,
        adminNotes,
        reason: actionReason
      };

      if (modalAction === 'approve' || modalAction === 'update-reward') {
        body.rewardAmount = parseFloat(rewardAmount);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/admin?action=bug-reports`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        closeModal();
        loadBugReports();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error performing bug report action:', error);
      alert('Error performing action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this bug report? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const reason = prompt('Please provide a reason for deletion:');
      
      if (!reason) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/admin?action=bug-reports`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bugReportId: reportId, reason })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        loadBugReports();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting bug report:', error);
      alert('Error deleting bug report. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: 'Pending' },
      approved: { bg: '#D1FAE5', color: '#065F46', text: 'Approved' },
      rejected: { bg: '#FEE2E2', color: '#991B1B', text: 'Rejected' },
      resolved: { bg: '#E0E7FF', color: '#3730A3', text: 'Resolved' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {config.text}
      </span>
    );
  };

  const getSeverityBadge = (severity) => {
    const severityConfig = {
      critical: { bg: '#DC2626', text: 'Critical' },
      major: { bg: '#F59E0B', text: 'Major' },
      minor: { bg: '#3B82F6', text: 'Minor' }
    };
    const config = severityConfig[severity] || severityConfig.minor;
    
    return (
      <span style={{
        backgroundColor: config.bg,
        color: theme.textPrimary,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {config.text}
      </span>
    );
  };

  const getActionButtons = (report) => {
    const buttons = [];
    
    if (report.status === 'pending') {
      buttons.push(
        <button 
          key="approve"
          onClick={() => openActionModal(report, 'approve')}
          style={{
            backgroundColor: '#10B981',
            color: theme.textPrimary,
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
        >
          Approve
        </button>
      );
      buttons.push(
        <button 
          key="reject"
          onClick={() => openActionModal(report, 'reject')}
          style={{
            backgroundColor: '#DC2626',
            color: theme.textPrimary,
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
        >
          Reject
        </button>
      );
    }

    if (report.status === 'approved') {
      buttons.push(
        <button 
          key="resolve"
          onClick={() => openActionModal(report, 'resolve')}
          style={{
            backgroundColor: '#6366F1',
            color: theme.textPrimary,
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
        >
          Resolve
        </button>
      );
      buttons.push(
        <button 
          key="update-reward"
          onClick={() => openActionModal(report, 'update-reward')}
          style={{
            backgroundColor: '#059669',
            color: theme.textPrimary,
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
        >
          Update Reward
        </button>
      );
    }

    if (report.status === 'resolved') {
      buttons.push(
        <button 
          key="reopen"
          onClick={() => openActionModal(report, 'reopen')}
          style={{
            backgroundColor: '#F59E0B',
            color: theme.textPrimary,
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
        >
          Reopen
        </button>
      );
    }

    buttons.push(
      <button 
        key="delete"
        onClick={() => handleDeleteReport(report._id)}
        style={{
          backgroundColor: '#EF4444',
          color: theme.textPrimary,
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        Delete
      </button>
    );

    return buttons;
  };

  return (
    <div>
      {/* Summary Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[
          { label: 'Total Reports', value: summary.totalReports, color: '#3B82F6' },
          { label: 'Pending', value: summary.pendingReports, color: '#F59E0B' },
          { label: 'Approved', value: summary.approvedReports, color: '#10B981' },
          { label: 'Total Rewards', value: `${(summary.totalRewards || 0).toLocaleString()} credits`, color: '#059669' }
        ].map((stat, index) => (
          <div key={index} style={{
            backgroundColor: theme.cardBackground,
            padding: '16px',
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>{stat.label}</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Header with Advanced Filters */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: theme.textPrimary,
          margin: 0,
          transition: 'color 0.3s ease'
        }}>
          Bug Reports Management
        </h2>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search reports..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              fontSize: '14px',
              minWidth: '180px',
              backgroundColor: theme.cardBackground,
              color: theme.textPrimary,
              transition: 'all 0.3s ease'
            }}
          />
          
          {/* Severity Filter */}
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              fontSize: '14px',
              backgroundColor: theme.cardBackground,
              color: theme.textPrimary,
              transition: 'all 0.3s ease'
            }}
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              fontSize: '14px',
              backgroundColor: theme.cardBackground,
              color: theme.textPrimary,
              transition: 'all 0.3s ease'
            }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Sort */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              fontSize: '14px',
              backgroundColor: theme.cardBackground,
              color: theme.textPrimary,
              transition: 'all 0.3s ease'
            }}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="severity-desc">High Severity First</option>
            <option value="reward.amount-desc">Highest Reward</option>
          </select>
        </div>
      </div>

      {/* Bug Reports Table */}
      {loading ? (
        <div style={{
          backgroundColor: theme.cardBackground,
          padding: '48px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: `3px solid ${theme.buttonDark}`,
            borderTop: '3px solid #DC2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Loading bug reports...</p>
        </div>
      ) : bugReports.length === 0 ? (
        <div style={{
          backgroundColor: theme.cardBackground,
          padding: '48px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: theme.textPrimary,
            marginBottom: '8px',
            transition: 'color 0.3s ease'
          }}>
            No bug reports found
          </h3>
          <p style={{ color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
            No bug reports match your current filters.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: theme.tableHeaderBg, borderBottom: `1px solid ${theme.border}`, transition: 'all 0.3s ease' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Bug Report
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Project
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Submitted By
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Severity
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Status
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Reward
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Date
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {bugReports.map((report) => (
                  <tr key={report._id} style={{ borderBottom: `1px solid ${theme.tableRowBorder}`, transition: 'all 0.3s ease' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary, marginBottom: '4px', transition: 'color 0.3s ease' }}>
                        {report.title}
                      </div>
                      <div style={{ fontSize: '12px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                        {report.description?.length > 60 ? report.description.substring(0, 60) + '...' : report.description}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                        {report.project?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '12px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                        by {report.project?.postedBy?.name || 'Unknown'}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: report.submittedBy?.avatar ? `url(${report.submittedBy.avatar})` : 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.textPrimary,
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {!report.submittedBy?.avatar && report.submittedBy?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                            {report.submittedBy?.name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '12px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                            {report.submittedBy?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getSeverityBadge(report.severity)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getStatusBadge(report.status)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: '#059669' }}>
                      {(report.reward?.amount || 0).toLocaleString()} credits
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                      {formatTimeAgo(report.createdAt)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {getActionButtons(report)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderTop: `1px solid ${theme.border}`,
              backgroundColor: theme.tableHeaderBg,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalReports)} of {pagination.totalReports} reports
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    backgroundColor: pagination.hasPrev ? theme.buttonDark : theme.buttonLight,
                    color: pagination.hasPrev ? theme.textPrimary : theme.textMuted,
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Previous
                </button>

                <span style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: theme.textPrimary,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    backgroundColor: pagination.hasNext ? theme.buttonDark : theme.buttonLight,
                    color: pagination.hasNext ? theme.textPrimary : theme.textMuted,
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: theme.textPrimary,
                margin: 0,
                textTransform: 'capitalize',
                transition: 'color 0.3s ease'
              }}>
                {modalAction.replace('-', ' ')} Bug Report
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: theme.buttonLight,
                  border: `1px solid ${theme.border}`,
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: theme.textPrimary,
                  fontFamily: 'DM Sans, sans-serif',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = theme.buttonLightHover}
                onMouseLeave={(e) => e.target.style.background = theme.buttonLight}
              >
                ×
              </button>
            </div>

            {/* Bug Report Details */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.textPrimary,
                marginBottom: '8px',
                transition: 'color 0.3s ease'
              }}>
                {selectedReport.title}
              </h4>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {getSeverityBadge(selectedReport.severity)}
                {getStatusBadge(selectedReport.status)}
              </div>

              <div style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', marginBottom: '16px', transition: 'color 0.3s ease' }}>
                <strong>Project:</strong> {selectedReport.project?.name} |
                <strong> Submitted by:</strong> {selectedReport.submittedBy?.name} |
                <strong> Date:</strong> {formatDate(selectedReport.createdAt)}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '14px', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Description:</strong>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary,
                  fontFamily: 'DM Sans, sans-serif',
                  marginTop: '4px',
                  padding: '12px',
                  backgroundColor: theme.statsCardBg,
                  borderRadius: '6px',
                  transition: 'all 0.3s ease'
                }}>
                  {selectedReport.description}
                </div>
              </div>
            </div>

            {/* Action-specific inputs */}
            {(modalAction === 'approve' || modalAction === 'update-reward') && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.textPrimary,
                  display: 'block',
                  marginBottom: '8px',
                  transition: 'color 0.3s ease'
                }}>
                  Reward Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    backgroundColor: theme.cardBackground,
                    color: theme.textPrimary,
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: theme.textPrimary,
                display: 'block',
                marginBottom: '8px',
                transition: 'color 0.3s ease'
              }}>
                Admin Notes {modalAction === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={`Enter notes for ${modalAction}...`}
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '12px',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '10px',
                  fontSize: '14px',
                  resize: 'none',
                  backgroundColor: theme.cardBackground,
                  color: theme.textPrimary,
                  transition: 'all 0.3s ease'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeModal}
                disabled={actionLoading}
                style={{
                  background: theme.buttonDark,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`,
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => !actionLoading && (e.target.style.background = theme.buttonDarkHover)}
                onMouseLeave={(e) => !actionLoading && (e.target.style.background = theme.buttonDark)}
              >
                Cancel
              </button>
              <button
                onClick={handleBugReportAction}
                disabled={actionLoading || (modalAction === 'reject' && !adminNotes.trim())}
                style={{
                  background: modalAction === 'reject' ? '#DC2626' : '#059669',
                  color: theme.textPrimary,
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: (actionLoading || (modalAction === 'reject' && !adminNotes.trim())) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  textTransform: 'capitalize',
                  transition: 'all 0.3s ease'
                }}
              >
                {actionLoading ? 'Processing...' : modalAction.replace('-', ' ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Users Management Component
function UsersManagement({ theme, isLightMode }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });
  
  // Filters and search
  const [filters, setFilters] = useState({
    search: '',
    accountType: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalAction, setModalAction] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [pagination.currentPage, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        ...filters
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/admin?action=users&${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setPagination(data.pagination || {});
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const openActionModal = (user, action) => {
    setSelectedUser(user);
    setModalAction(action);
    setActionReason('');
    setNewBalance(user.balance?.toString() || '0');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setModalAction('');
    setActionReason('');
    setNewBalance('');
  };

  const handleUserAction = async () => {
    if (!selectedUser || !modalAction) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      
      let body = {
        userId: selectedUser._id,
        action: modalAction,
        reason: actionReason
      };

      if (modalAction === 'update-balance') {
        body.newBalance = parseFloat(newBalance);
      }

      let method = 'PUT';
      if (modalAction === 'delete') {
        method = 'DELETE';
        body = { userId: selectedUser._id, reason: actionReason };
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/admin?action=users`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        closeModal();
        loadUsers(); // Refresh the users list
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      alert('Error performing action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  const getStatusBadge = (user) => {
    if (user.isBanned) {
      return <span style={{ 
        backgroundColor: '#DC2626', 
        color: theme.textPrimary, 
        padding: '2px 8px', 
        borderRadius: '12px', 
        fontSize: '12px' 
      }}>Banned</span>;
    }
    if (!user.isEmailVerified) {
      return <span style={{ 
        backgroundColor: '#F59E0B', 
        color: theme.textPrimary, 
        padding: '2px 8px', 
        borderRadius: '12px', 
        fontSize: '12px' 
      }}>Unverified</span>;
    }
    return <span style={{ 
      backgroundColor: '#10B981', 
      color: theme.textPrimary, 
      padding: '2px 8px', 
      borderRadius: '12px', 
      fontSize: '12px' 
    }}>Active</span>;
  };

  const getActionButtons = (user) => {
    const buttons = [];
    
    if (user.isBanned) {
      buttons.push(
        <button 
          key="unban"
          onClick={() => openActionModal(user, 'unban')}
          style={{
            backgroundColor: '#10B981',
            color: theme.textPrimary,
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
        >
          Unban
        </button>
      );
    } else {
      buttons.push(
        <button 
          key="ban"
          onClick={() => openActionModal(user, 'ban')}
          style={{
            backgroundColor: '#DC2626',
            color: theme.textPrimary,
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
        >
          Ban
        </button>
      );
    }

    if (user.isEmailVerified) {
      buttons.push(
        <button 
          key="unverify"
          onClick={() => openActionModal(user, 'unverify')}
          style={{
            backgroundColor: '#F59E0B',
            color: theme.textPrimary,
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
        >
          Unverify
        </button>
      );
    } else {
      buttons.push(
        <button 
          key="verify"
          onClick={() => openActionModal(user, 'verify')}
          style={{
            backgroundColor: '#3B82F6',
            color: theme.textPrimary,
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
        >
          Verify
        </button>
      );
    }

    buttons.push(
      <button 
        key="balance"
        onClick={() => openActionModal(user, 'update-balance')}
        style={{
          backgroundColor: '#6366F1',
          color: theme.textPrimary,
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          marginRight: '4px'
        }}
      >
        Balance
      </button>
    );

    buttons.push(
      <button 
        key="delete"
        onClick={() => openActionModal(user, 'delete')}
        style={{
          backgroundColor: '#EF4444',
          color: theme.textPrimary,
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        Delete
      </button>
    );

    return buttons;
  };

  return (
    <div>
      {/* Header with filters */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: theme.textPrimary,
          margin: 0,
          transition: 'color 0.3s ease'
        }}>
          Users Management
        </h2>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              fontSize: '14px',
              minWidth: '200px',
              backgroundColor: theme.cardBackground,
              color: theme.textPrimary,
              transition: 'all 0.3s ease'
            }}
          />

          {/* Account Type Filter */}
          <select
            value={filters.accountType}
            onChange={(e) => handleFilterChange('accountType', e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              fontSize: '14px',
              backgroundColor: theme.cardBackground,
              color: theme.textPrimary,
              transition: 'all 0.3s ease'
            }}
          >
            <option value="">All Types</option>
            <option value="tester">Testers</option>
            <option value="developer">Developers</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              fontSize: '14px',
              backgroundColor: theme.cardBackground,
              color: theme.textPrimary,
              transition: 'all 0.3s ease'
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="banned">Banned</option>
          </select>

          {/* Sort */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              fontSize: '14px',
              backgroundColor: theme.cardBackground,
              color: theme.textPrimary,
              transition: 'all 0.3s ease'
            }}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="balance-desc">Highest Balance</option>
            <option value="balance-asc">Lowest Balance</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{
          backgroundColor: theme.cardBackground,
          padding: '48px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: `3px solid ${theme.buttonDark}`,
            borderTop: '3px solid #DC2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div style={{
          backgroundColor: theme.cardBackground,
          padding: '48px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: theme.textPrimary,
            marginBottom: '8px',
            transition: 'color 0.3s ease'
          }}>
            No users found
          </h3>
          <p style={{ color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
            No users match your current filters.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: theme.tableHeaderBg, borderBottom: `1px solid ${theme.border}`, transition: 'all 0.3s ease' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    User
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Type
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Status
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Balance
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Activity
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Stats
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Joined
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} style={{ borderBottom: `1px solid ${theme.tableRowBorder}`, transition: 'all 0.3s ease' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: user.avatar ? `url(${user.avatar})` : 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.textPrimary,
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}>
                          {!user.avatar && user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '12px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        backgroundColor: user.accountType === 'developer' ? '#3B82F6' : '#10B981',
                        color: theme.textPrimary,
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        textTransform: 'capitalize'
                      }}>
                        {user.accountType}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getStatusBadge(user)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: '#059669' }}>
                      {(user.balance || 0).toLocaleString()} credits
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                      {formatTimeAgo(user.stats?.lastActivity)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                        <div>Reports: {user.stats?.bugReports || 0}</div>
                        <div>Projects: {user.stats?.projects || 0}</div>
                        <div>Earned: {(user.stats?.earnings || 0).toLocaleString()} credits</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {getActionButtons(user)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderTop: `1px solid ${theme.border}`,
              backgroundColor: theme.tableHeaderBg,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalUsers)} of {pagination.totalUsers} users
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    backgroundColor: pagination.hasPrev ? theme.buttonDark : theme.buttonLight,
                    color: pagination.hasPrev ? theme.textPrimary : theme.textMuted,
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Previous
                </button>

                <span style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: theme.textPrimary,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    backgroundColor: pagination.hasNext ? theme.buttonDark : theme.buttonLight,
                    color: pagination.hasNext ? theme.textPrimary : theme.textMuted,
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: theme.textPrimary,
                margin: 0,
                textTransform: 'capitalize',
                transition: 'color 0.3s ease'
              }}>
                {modalAction.replace('-', ' ')} User
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: theme.buttonLight,
                  border: `1px solid ${theme.border}`,
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: theme.textPrimary,
                  fontFamily: 'DM Sans, sans-serif',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = theme.buttonLightHover}
                onMouseLeave={(e) => e.target.style.background = theme.buttonLight}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.textPrimary,
                marginBottom: '8px',
                transition: 'color 0.3s ease'
              }}>
                {selectedUser.name}
              </h4>
              <p style={{ fontSize: '14px', color: theme.textSecondary, fontFamily: 'DM Sans, sans-serif', margin: 0, transition: 'color 0.3s ease' }}>
                {selectedUser.email} • {selectedUser.accountType}
              </p>
            </div>

            {modalAction === 'update-balance' ? (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.textPrimary,
                  display: 'block',
                  marginBottom: '8px',
                  transition: 'color 0.3s ease'
                }}>
                  New Balance ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    backgroundColor: theme.cardBackground,
                    color: theme.textPrimary,
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.textPrimary,
                  display: 'block',
                  marginBottom: '8px',
                  transition: 'color 0.3s ease'
                }}>
                  Reason {modalAction === 'delete' ? '(Required)' : '(Optional)'}
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={`Enter reason for ${modalAction}...`}
                  style={{
                    width: '100%',
                    height: '80px',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    resize: 'none',
                    backgroundColor: theme.cardBackground,
                    color: theme.textPrimary,
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeModal}
                disabled={actionLoading}
                style={{
                  background: theme.buttonDark,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`,
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => !actionLoading && (e.target.style.background = theme.buttonDarkHover)}
                onMouseLeave={(e) => !actionLoading && (e.target.style.background = theme.buttonDark)}
              >
                Cancel
              </button>
              <button
                onClick={handleUserAction}
                disabled={actionLoading || (modalAction === 'delete' && !actionReason.trim())}
                style={{
                  background: modalAction === 'delete' || modalAction === 'ban' ? '#DC2626' : '#059669',
                  color: theme.textPrimary,
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: (actionLoading || (modalAction === 'delete' && !actionReason.trim())) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  textTransform: 'capitalize',
                  transition: 'all 0.3s ease'
                }}
              >
                {actionLoading ? 'Processing...' : modalAction.replace('-', ' ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Moderators Management Component
function ModeratorsManagement({ theme, isLightMode }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/admin?action=moderator-applications&status=${filter}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching moderator applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewApplication = async (applicationId, status, reviewNotes) => {
    try {
      const token = localStorage.getItem('adminToken');

      if (!token) {
        alert('Admin authentication required');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/admin?action=moderator-applications`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId,
          status,
          reviewNotes
        })
      });

      if (response.ok) {
        alert(`Application ${status} successfully!`);
        fetchApplications();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update application');
      }
    } catch (error) {
      console.error('Error reviewing application:', error);
      alert('Error reviewing application');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: '#FEF3C7', color: '#92400E' },
      approved: { bg: '#D1FAE5', color: '#065F46' },
      rejected: { bg: '#FEE2E2', color: '#991B1B' }
    };
    const config = colors[status] || colors.pending;

    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            color: theme.textPrimary,
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '8px',
            fontFamily: 'Sansita, sans-serif',
            transition: 'color 0.3s ease'
          }}>
            Moderator Applications
          </h2>
          <p style={{ color: theme.textMuted, fontSize: '0.9rem', transition: 'color 0.3s ease' }}>
            Review and manage moderator applications from qualified testers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: filter === status ? 'none' : `1px solid ${theme.border}`,
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: filter === status ? '#667eea' : theme.buttonDark,
                color: theme.textPrimary,
                textTransform: 'capitalize',
                transition: 'all 0.3s ease'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: theme.textMuted, transition: 'color 0.3s ease' }}>
          Loading applications...
        </div>
      ) : applications.length === 0 ? (
        <div style={{
          backgroundColor: theme.cardBackground,
          padding: '60px',
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
          <h3 style={{ color: theme.textPrimary, marginBottom: '8px', transition: 'color 0.3s ease' }}>No Applications Found</h3>
          <p style={{ color: theme.textMuted, transition: 'color 0.3s ease' }}>No {filter} moderator applications to display.</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}`, transition: 'all 0.3s ease' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: theme.textMuted, fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', transition: 'color 0.3s ease' }}>Applicant</th>
                <th style={{ padding: '16px', textAlign: 'center', color: theme.textMuted, fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Exam Score</th>
                <th style={{ padding: '16px', textAlign: 'center', color: theme.textMuted, fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Reputation</th>
                <th style={{ padding: '16px', textAlign: 'center', color: theme.textMuted, fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Submitted</th>
                <th style={{ padding: '16px', textAlign: 'center', color: theme.textMuted, fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center', color: theme.textMuted, fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: app.userId?.avatar ? `url(${app.userId.avatar})` : 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.textPrimary,
                        fontWeight: 'bold'
                      }}>
                        {!app.userId?.avatar && (app.userId?.name?.charAt(0)?.toUpperCase() || '?')}
                      </div>
                      <div>
                        <div style={{ color: theme.textPrimary, fontWeight: '600' }}>
                          {app.userId?.name || 'Unknown'}
                        </div>
                        <div style={{ color: theme.textMuted, fontSize: '0.8rem' }}>
                          {app.userId?.email || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{
                      color: app.examScore >= 90 ? '#10B981' : app.examScore >= 80 ? '#F59E0B' : '#EF4444',
                      fontWeight: '700',
                      fontSize: '1.2rem'
                    }}>
                      {app.examScore}%
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: '0.7rem' }}>
                      {app.examScore >= 87 ? '13-15/15' : '12/15'}
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ color: theme.textPrimary, fontWeight: '600' }}>
                      {app.userId?.stats?.reputationScore || 0}/100
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', color: theme.textMuted, fontSize: '0.85rem' }}>
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {getStatusBadge(app.status)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {app.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            const notes = prompt('Review notes (optional):');
                            handleReviewApplication(app._id, 'approved', notes || '');
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: '#10B981',
                            color: theme.textPrimary
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt('Rejection reason:');
                            if (notes) {
                              handleReviewApplication(app._id, 'rejected', notes);
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: '#EF4444',
                            color: theme.textPrimary
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: theme.textMuted, fontSize: '0.8rem' }}>
                        Reviewed by {app.reviewedBy?.username || 'Admin'}
                        {app.reviewNotes && (
                          <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                            "{app.reviewNotes}"
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Payments Management Component (Withdrawal Management)
function PaymentsManagement({ theme, isLightMode }) {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalWithdrawals: 0
  });
  const [summary, setSummary] = useState({});

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [modalAction, setModalAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, [pagination.currentPage]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)}/api/admin?action=withdrawals&${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
        setPagination(data.pagination || {});
        setSummary(data.summary || {});
      } else {
        console.error('Failed to load withdrawals');
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const openActionModal = (withdrawal, action) => {
    setSelectedWithdrawal(withdrawal);
    setModalAction(action);
    setAdminNotes(withdrawal.adminNotes || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedWithdrawal(null);
    setModalAction('');
    setAdminNotes('');
  };

  const handleWithdrawalAction = async () => {
    if (!selectedWithdrawal || !modalAction) return;

    if ((modalAction === 'reject' || modalAction === 'complete') && !adminNotes.trim()) {
      alert('Please provide admin notes for this action');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)}/api/admin?action=withdrawals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal._id,
          action: modalAction,
          adminNotes: adminNotes.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        await loadWithdrawals();
        closeModal();

        // Check if withdrawal actually failed (status is 'failed')
        if (data.withdrawal && data.withdrawal.status === 'failed') {
          alert(`⚠️ PAYOUT FAILED!\n\n${data.withdrawal.failureReason || 'Unknown error'}`);
        } else {
          alert(`✅ ${data.message || `Withdrawal ${modalAction}d successfully`}`);
        }
      } else {
        alert(`❌ Error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      alert('Network error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'processing': return '#17A2B8';
      case 'completed': return '#28A745';
      case 'rejected': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const getStatusBadge = (status) => (
    <span style={{
      backgroundColor: getStatusColor(status),
      color: theme.textPrimary,
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase'
    }}>
      {status}
    </span>
  );

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#1F1F1F',
        padding: '48px',
        borderRadius: '16px',
        textAlign: 'center',
        color: theme.textPrimary
      }}>
        Loading withdrawal requests...
      </div>
    );
  }

  return (
    <div style={{ color: theme.textPrimary }}>
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: theme.cardBackground,
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: theme.textMuted, transition: 'color 0.3s ease' }}>Total Requests</h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: theme.textPrimary, transition: 'color 0.3s ease' }}>{summary.totalRequests || 0}</p>
        </div>
        <div style={{
          backgroundColor: theme.cardBackground,
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: theme.textMuted, transition: 'color 0.3s ease' }}>Pending</h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FFA500' }}>{summary.pendingRequests || 0}</p>
        </div>
        <div style={{
          backgroundColor: theme.cardBackground,
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: theme.textMuted, transition: 'color 0.3s ease' }}>Completed</h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#28A745' }}>{summary.completedRequests || 0}</p>
        </div>
        <div style={{
          backgroundColor: theme.cardBackground,
          padding: '20px',
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
          transition: 'all 0.3s ease'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: theme.textMuted, transition: 'color 0.3s ease' }}>Total Amount</h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: theme.textPrimary, transition: 'color 0.3s ease' }}>{(summary.totalAmount || 0).toLocaleString()} credits</p>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div style={{
        backgroundColor: theme.cardBackground,
        borderRadius: '16px',
        border: `1px solid ${theme.border}`,
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${theme.border}`
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: theme.textPrimary,
            transition: 'color 0.3s ease'
          }}>
            Withdrawal Requests
          </h3>
        </div>

        {withdrawals.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: theme.textMuted }}>
            No withdrawal requests found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: theme.tableHeaderBg, transition: 'all 0.3s ease' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, transition: 'color 0.3s ease' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, transition: 'color 0.3s ease' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, transition: 'color 0.3s ease' }}>PayPal Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, transition: 'color 0.3s ease' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, transition: 'color 0.3s ease' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: theme.textPrimary, transition: 'color 0.3s ease' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal, index) => (
                  <tr key={withdrawal._id} style={{
                    borderBottom: `1px solid ${theme.border}`,
                    backgroundColor: index % 2 === 0 ? 'transparent' : theme.statsCardBg,
                    transition: 'all 0.3s ease'
                  }}>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: theme.textPrimary, transition: 'color 0.3s ease' }}>
                          {withdrawal.userId?.name || 'Unknown User'}
                        </div>
                        <div style={{ fontSize: '12px', color: theme.textMuted, transition: 'color 0.3s ease' }}>
                          {withdrawal.userId?.email || 'No email'}
                        </div>
                        {withdrawal.userId?.balance !== undefined && (
                          <div style={{ fontSize: '12px', color: theme.textMuted, transition: 'color 0.3s ease' }}>
                            Balance: {(withdrawal.userId.balance || 0).toLocaleString()} credits
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 'bold', fontSize: '16px', color: theme.textPrimary, transition: 'color 0.3s ease' }}>
                      {(withdrawal.amount || 0).toLocaleString()} credits
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: theme.textPrimary, transition: 'color 0.3s ease' }}>
                      {withdrawal.paypalEmail}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(withdrawal.status)}
                      {withdrawal.status === 'failed' && withdrawal.failureReason && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: 'rgba(220, 53, 69, 0.1)',
                          border: '1px solid rgba(220, 53, 69, 0.3)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#DC3545'
                        }}>
                          <strong>Error:</strong> {withdrawal.failureReason}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: theme.textMuted }}>
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {withdrawal.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openActionModal(withdrawal, 'approve')}
                              style={{
                                backgroundColor: '#28A745',
                                color: theme.textPrimary,
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openActionModal(withdrawal, 'reject')}
                              style={{
                                backgroundColor: '#DC3545',
                                color: theme.textPrimary,
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {withdrawal.status === 'processing' && (
                          <button
                            onClick={() => openActionModal(withdrawal, 'complete')}
                            style={{
                              backgroundColor: '#17A2B8',
                              color: theme.textPrimary,
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Mark Complete
                          </button>
                        )}
                        {withdrawal.adminNotes && (
                          <span style={{ fontSize: '12px', color: theme.textMuted }} title={withdrawal.adminNotes}>
                            Note
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #2A2A2A',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '14px', color: theme.textMuted }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                style={{
                  backgroundColor: pagination.currentPage === 1 ? '#2A2A2A' : '#007BFF',
                  color: pagination.currentPage === 1 ? '#666' : 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                style={{
                  backgroundColor: !pagination.hasNext ? '#2A2A2A' : '#007BFF',
                  color: !pagination.hasNext ? '#666' : 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: !pagination.hasNext ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1F1F1F',
            borderRadius: '16px',
            border: '1px solid #2A2A2A',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            color: theme.textPrimary
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 'bold' }}>
              {modalAction === 'approve' && 'Approve Withdrawal'}
              {modalAction === 'reject' && 'Reject Withdrawal'}
              {modalAction === 'complete' && 'Complete Withdrawal'}
            </h3>

            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: theme.buttonDark, borderRadius: '10px' }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>User:</strong> {selectedWithdrawal?.userId?.name || 'Unknown'}
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Amount:</strong> {(selectedWithdrawal?.amount || 0).toLocaleString()} credits
              </p>
              <p style={{ margin: 0 }}>
                <strong>PayPal Email:</strong> {selectedWithdrawal?.paypalEmail}
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: theme.textPrimary,
                display: 'block',
                marginBottom: '8px'
              }}>
                Admin Notes {modalAction === 'approve' ? '(Optional)' : '(Required)'}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={`Enter notes for ${modalAction}...`}
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '12px',
                  border: '1px solid #2A2A2A',
                  borderRadius: '10px',
                  fontSize: '14px',
                  resize: 'none',
                  backgroundColor: theme.buttonDark,
                  color: theme.textPrimary
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                disabled={actionLoading}
                style={{
                  backgroundColor: '#6C757D',
                  color: theme.textPrimary,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawalAction}
                disabled={actionLoading}
                style={{
                  backgroundColor: modalAction === 'reject' ? '#DC3545' :
                                 modalAction === 'approve' ? '#28A745' : '#17A2B8',
                  color: theme.textPrimary,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {actionLoading ? 'Processing...' :
                 modalAction === 'approve' ? 'Approve Withdrawal' :
                 modalAction === 'reject' ? 'Reject Withdrawal' : 'Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;