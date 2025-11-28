import React, { useState, useEffect } from 'react';
import WithdrawalInterface from './WithdrawalInterface';
import { getModeratorTheme } from './themeConfig';

// Bug Reports List Component with expandable details
function BugReportsList({ title, reports, backgroundColor, borderColor, highlightColor, disputingTesterId }) {
  const [expandedReportId, setExpandedReportId] = useState(null);

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div style={{
      backgroundColor: backgroundColor,
      border: `1px solid ${borderColor}`,
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <div style={{
        fontSize: '0.85rem',
        fontWeight: '600',
        color: highlightColor || '#374151',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {title}
      </div>

      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {reports.map((report, idx) => {
          const isExpanded = expandedReportId === report._id;
          const isDisputingTester = disputingTesterId && report.submittedBy?._id === disputingTesterId;

          return (
            <div
              key={idx}
              style={{
                padding: '12px',
                backgroundColor: isDisputingTester ? '#FEF3C7' : 'white',
                border: isDisputingTester ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedReportId(isExpanded ? null : report._id)}
              >
                <div style={{
                  fontWeight: '600',
                  color: '#1F2937',
                  flex: 1
                }}>
                  <span style={{ marginRight: '8px', fontSize: '12px', color: '#6B7280' }}>{isExpanded ? '▾' : '▸'}</span>
                  {report.title}
                  {isDisputingTester && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '0.75rem',
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '600'
                    }}>
                      DISPUTING TESTER
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                  <span style={{
                    backgroundColor: report.severity === 'critical' ? '#FEE2E2' :
                                 report.severity === 'major' ? '#FED7AA' : '#FEF3C7',
                    color: report.severity === 'critical' ? '#991B1B' :
                           report.severity === 'major' ? '#EA580C' : '#92400E',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}>
                    {report.severity?.toUpperCase()}
                  </span>
                  <span style={{
                    backgroundColor: report.status === 'approved' ? '#D1FAE5' :
                                 report.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                    color: report.status === 'approved' ? '#065F46' :
                           report.status === 'rejected' ? '#991B1B' : '#92400E',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}>
                    {report.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6B7280',
                marginBottom: isExpanded ? '12px' : '0'
              }}>
                By {report.submittedBy?.name} • {formatTimeAgo(report.createdAt)}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #E5E7EB'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                      Description:
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: '1.4' }}>
                      {report.description || 'N/A'}
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                      Steps to Reproduce:
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                      {report.stepsToReproduce || 'N/A'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                        Expected Behavior:
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: '1.4' }}>
                        {report.expectedBehavior || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                        Actual Behavior:
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: '1.4' }}>
                        {report.actualBehavior || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModeratorDashboard({ moderator, onLogout }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [moderatorBalance, setModeratorBalance] = useState(moderator.balance || 0);
  const [isLightMode, setIsLightMode] = useState(localStorage.getItem('moderatorLightMode') === 'true');
  const [stats, setStats] = useState({
    totalDisputes: 0,
    pendingDisputes: 0,
    resolvedDisputes: 0,
    todayDisputes: 0
  });

  // Get theme based on light mode
  const theme = getModeratorTheme(isLightMode);

  const getAuthToken = () => {
    return localStorage.getItem('moderatorToken');
  };

  const fetchModeratorBalance = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'moderator_verify'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.moderator) {
          setModeratorBalance(data.moderator.balance || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching moderator balance:', error);
    }
  };

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      if (!token) {
        onLogout();
        return;
      }

      // Fetch all disputes through the combined moderator API
      const disputesResponse = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'moderator_disputes'
        })
      });

      if (disputesResponse.ok) {
        const disputesData = await disputesResponse.json();
        const projectDisputes = disputesData.projectDisputes || [];
        setDisputes(projectDisputes);

        // Calculate stats
        setStats({
          totalDisputes: projectDisputes.length,
          pendingDisputes: projectDisputes.filter(d => d.status === 'pending').length,
          resolvedDisputes: projectDisputes.filter(d => ['resolved', 'dismissed'].includes(d.status)).length,
          todayDisputes: projectDisputes.filter(d => {
            const today = new Date().toDateString();
            return new Date(d.createdAt).toDateString() === today;
          }).length
        });
      }

    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
    fetchModeratorBalance();

    // Listen for theme changes
    const handleThemeChange = () => {
      setIsLightMode(localStorage.getItem('moderatorLightMode') === 'true');
    };

    window.addEventListener('themeChange', handleThemeChange);

    // Refresh balance every 30 seconds
    const balanceInterval = setInterval(fetchModeratorBalance, 30000);

    return () => {
      clearInterval(balanceInterval);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  const getCurrentDisputes = () => {
    if (filter === 'all') return disputes;
    return disputes.filter(dispute => dispute.status === filter);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: 'Pending' },
      investigating: { bg: '#DBEAFE', color: '#1E40AF', text: 'Investigating' },
      resolved: { bg: '#D1FAE5', color: '#065F46', text: 'Resolved' },
      dismissed: { bg: '#FEE2E2', color: '#991B1B', text: 'Dismissed' }
    };
    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { bg: '#F3F4F6', color: '#6B7280', text: 'Low' },
      medium: { bg: '#FEF3C7', color: '#92400E', text: 'Medium' },
      high: { bg: '#FED7AA', color: '#EA580C', text: 'High' },
      urgent: { bg: '#FEE2E2', color: '#DC2626', text: 'Urgent' }
    };
    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
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

  const handleLogout = () => {
    localStorage.removeItem('moderatorToken');
    localStorage.removeItem('moderatorInfo');
    onLogout();
  };

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
              TestQuest Moderator
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.textSecondary,
              margin: 0,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'color 0.3s ease'
            }}>
              Dispute Management Dashboard
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Balance Display */}
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
          title="Total earnings from resolved disputes">
            {moderatorBalance.toLocaleString()} credits
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

          {/* Theme Toggle Button */}
          <button
            onClick={() => {
              const newMode = !isLightMode;
              localStorage.setItem('moderatorLightMode', newMode);
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
              {moderator.fullName || moderator.username}
            </div>
            <div style={{
              fontSize: '12px',
              color: theme.textSecondary,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'color 0.3s ease'
            }}>
              Moderator
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
              color: 'white',
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
        padding: '20px 30px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div>
            <h3 style={{
              color: theme.textPrimary,
              fontSize: '20px',
              fontWeight: '700',
              margin: 0,
              transition: 'color 0.3s ease'
            }}>
              Project Reports
            </h3>
            <p style={{
              color: theme.textSecondary,
              fontSize: '14px',
              margin: 0,
              transition: 'color 0.3s ease'
            }}>
              {disputes.length} total reports
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '30px' }}>
        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '30px'
        }}>
          {[
            { title: 'Total Disputes', value: stats.totalDisputes, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { title: 'Pending Review', value: stats.pendingDisputes, gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
            { title: 'Resolved', value: stats.resolvedDisputes, gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
            { title: 'Today\'s Reports', value: stats.todayDisputes, gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }
          ].map((stat, index) => (
            <div key={index} style={{
              background: `linear-gradient(145deg, ${theme.cardBackground} 0%, ${theme.cardBackgroundAlt} 100%)`,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${theme.border}`,
              boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 15px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <h3 style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: theme.textSecondary,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  {stat.title}
                </h3>
              </div>
              <p style={{
                fontSize: '36px',
                fontWeight: '700',
                background: stat.gradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                fontFamily: 'Sansita, sans-serif'
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          background: `linear-gradient(145deg, ${theme.cardBackground} 0%, ${theme.cardBackgroundAlt} 100%)`,
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          padding: '20px',
          marginBottom: '24px',
          boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 15px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme.textSecondary,
              fontFamily: 'DM Sans, sans-serif',
              marginRight: '8px',
              transition: 'color 0.3s ease'
            }}>Filter:</span>
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'investigating', label: 'Investigating' },
              { key: 'resolved', label: 'Resolved' },
              { key: 'dismissed', label: 'Dismissed' }
            ].map(status => (
              <button
                key={status.key}
                onClick={() => setFilter(status.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: filter === status.key ? '1px solid #667eea' : `1px solid ${theme.border}`,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: filter === status.key ? '#667eea' : theme.buttonLight,
                  color: filter === status.key ? 'white' : theme.textSecondary,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (filter !== status.key) {
                    e.target.style.backgroundColor = theme.buttonLightHover;
                    e.target.style.color = theme.textPrimary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== status.key) {
                    e.target.style.backgroundColor = theme.buttonLight;
                    e.target.style.color = theme.textSecondary;
                  }
                }}
              >
                {status.label}
              </button>
            ))}
            <button
              onClick={fetchDisputes}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                backgroundColor: theme.buttonLight,
                color: theme.textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'DM Sans, sans-serif',
                marginLeft: 'auto',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = theme.buttonLightHover;
                e.target.style.color = theme.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = theme.buttonLight;
                e.target.style.color = theme.textSecondary;
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Disputes List */}
        <div style={{
          background: `linear-gradient(145deg, ${theme.cardBackground} 0%, ${theme.cardBackgroundAlt} 100%)`,
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          overflow: 'hidden',
          boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 15px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}>
          {loading ? (
            <div style={{
              padding: '60px',
              textAlign: 'center',
              color: theme.textSecondary,
              transition: 'color 0.3s ease'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${theme.border}`,
                borderTop: '3px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              Loading disputes...
            </div>
          ) : getCurrentDisputes().length === 0 ? (
            <div style={{
              padding: '60px',
              textAlign: 'center',
              color: theme.textSecondary,
              transition: 'color 0.3s ease'
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: theme.textPrimary, transition: 'color 0.3s ease' }}>No reports found</h3>
              <p style={{ margin: 0 }}>No {filter !== 'all' ? filter + ' ' : ''}project reports to display.</p>
            </div>
          ) : (
            <div>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 120px 100px 120px 80px',
                gap: '16px',
                padding: '20px 24px',
                backgroundColor: theme.tableHeaderBg,
                borderBottom: `1px solid ${theme.border}`,
                fontSize: '12px',
                fontWeight: '600',
                color: theme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.3s ease'
              }}>
                <div>Project & Issue</div>
                <div>Reporter</div>
                <div>Priority</div>
                <div>Status</div>
                <div>Submitted</div>
                <div>Actions</div>
              </div>

              {/* Table Rows */}
              {getCurrentDisputes().map((dispute) => (
                <div
                  key={dispute._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 120px 100px 120px 80px',
                    gap: '16px',
                    padding: '20px 24px',
                    borderBottom: `1px solid ${theme.tableRowBorder}`,
                    alignItems: 'center',
                    fontSize: '14px',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Project/Issue Info */}
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: theme.textPrimary,
                      marginBottom: '6px',
                      fontSize: '15px',
                      transition: 'color 0.3s ease'
                    }}>
                      {dispute.projectName || dispute.project?.name}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: theme.textSecondary,
                      marginBottom: '4px',
                      transition: 'color 0.3s ease'
                    }}>
                      {dispute.subject}
                    </div>
                    {dispute.category && (
                      <div style={{
                        fontSize: '12px',
                        color: theme.textMuted,
                        textTransform: 'capitalize',
                        transition: 'color 0.3s ease'
                      }}>
                        {dispute.category.replace('_', ' ')}
                      </div>
                    )}
                  </div>

                  {/* Reporter */}
                  <div>
                    <div style={{ fontWeight: '500', color: theme.textPrimary, transition: 'color 0.3s ease' }}>
                      {dispute.submittedBy?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.textMuted, transition: 'color 0.3s ease' }}>
                      {dispute.submittedBy?.email}
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    {getPriorityBadge(dispute.priority || 'medium')}
                  </div>

                  {/* Status */}
                  <div>
                    {getStatusBadge(dispute.status)}
                  </div>

                  {/* Time */}
                  <div style={{ fontSize: '13px', color: theme.textMuted, transition: 'color 0.3s ease' }}>
                    {formatTimeAgo(dispute.createdAt)}
                  </div>

                  {/* Actions */}
                  <div>
                    <button
                      onClick={() => setSelectedDispute(dispute)}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Dispute Review Modal */}
      {selectedDispute && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: `linear-gradient(145deg, ${theme.cardBackground} 0%, ${theme.cardBackgroundAlt} 100%)`,
            borderRadius: '16px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: `1px solid ${theme.border}`,
              position: 'sticky',
              top: 0,
              background: `linear-gradient(145deg, ${theme.cardBackground} 0%, ${theme.cardBackgroundAlt} 100%)`,
              zIndex: 10,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: theme.textPrimary,
                  margin: 0,
                  fontFamily: 'Sansita, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  Review Dispute
                </h2>
                <button
                  onClick={() => setSelectedDispute(null)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.buttonLight,
                    color: theme.textPrimary,
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = theme.buttonLightHover;
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = theme.buttonLight;
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              {/* Dispute Info */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  {getStatusBadge(selectedDispute.status)}
                  {getPriorityBadge(selectedDispute.priority || 'medium')}
                </div>

                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '8px',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  {selectedDispute.subject}
                </h3>

                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary,
                  marginBottom: '20px',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  Project: <strong style={{ color: theme.textPrimary }}>{selectedDispute.projectName || selectedDispute.project?.name}</strong>
                </div>

                <div style={{
                  backgroundColor: theme.statsCardBg,
                  border: `1px solid ${theme.border}`,
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted, marginBottom: '8px', letterSpacing: '1px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                    DESCRIPTION
                  </div>
                  <div style={{ color: theme.textPrimary, whiteSpace: 'pre-wrap', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.6', transition: 'color 0.3s ease' }}>
                    {selectedDispute.description}
                  </div>
                </div>

                {selectedDispute.evidence && (
                  <div style={{
                    backgroundColor: theme.statsCardBg,
                    border: `1px solid ${theme.border}`,
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted, marginBottom: '8px', letterSpacing: '1px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                      EVIDENCE
                    </div>
                    <div style={{ color: theme.textPrimary, whiteSpace: 'pre-wrap', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.6', transition: 'color 0.3s ease' }}>
                      {selectedDispute.evidence}
                    </div>
                  </div>
                )}

                {selectedDispute.expectedResolution && (
                  <div style={{
                    backgroundColor: theme.statsCardBg,
                    border: `1px solid ${theme.border}`,
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: theme.textMuted, marginBottom: '8px', letterSpacing: '1px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                      EXPECTED RESOLUTION
                    </div>
                    <div style={{ color: theme.textPrimary, whiteSpace: 'pre-wrap', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.6', transition: 'color 0.3s ease' }}>
                      {selectedDispute.expectedResolution}
                    </div>
                  </div>
                )}

                {/* Related Bug Report Details (for project reports) */}
                {selectedDispute.bugReport && (
                  <div style={{
                    backgroundColor: '#EEF2FF',
                    border: '2px solid #6366F1',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#4F46E5',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      RELATED BUG REPORT
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1F2937',
                        marginBottom: '4px'
                      }}>
                        {selectedDispute.bugReport.title}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        fontSize: '0.8rem',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          backgroundColor: selectedDispute.bugReport.severity === 'critical' ? '#FEE2E2' :
                                         selectedDispute.bugReport.severity === 'major' ? '#FED7AA' : '#FEF3C7',
                          color: selectedDispute.bugReport.severity === 'critical' ? '#991B1B' :
                                selectedDispute.bugReport.severity === 'major' ? '#EA580C' : '#92400E',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontWeight: '600'
                        }}>
                          {selectedDispute.bugReport.severity.toUpperCase()}
                        </span>
                        <span style={{
                          backgroundColor: selectedDispute.bugReport.status === 'approved' ? '#D1FAE5' :
                                         selectedDispute.bugReport.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                          color: selectedDispute.bugReport.status === 'approved' ? '#065F46' :
                                selectedDispute.bugReport.status === 'rejected' ? '#991B1B' : '#92400E',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontWeight: '600'
                        }}>
                          {selectedDispute.bugReport.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {selectedDispute.bugReport.description && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                          Description:
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.4' }}>
                          {selectedDispute.bugReport.description}
                        </div>
                      </div>
                    )}

                    {selectedDispute.bugReport.stepsToReproduce && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                          Steps to Reproduce:
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                          {selectedDispute.bugReport.stepsToReproduce}
                        </div>
                      </div>
                    )}

                    {selectedDispute.bugReport.expectedBehavior && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                          Expected Behavior:
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.4' }}>
                          {selectedDispute.bugReport.expectedBehavior}
                        </div>
                      </div>
                    )}

                    {selectedDispute.bugReport.actualBehavior && (
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
                          Actual Behavior:
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.4' }}>
                          {selectedDispute.bugReport.actualBehavior}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Disputing Tester's Bug Reports */}
                {selectedDispute.allProjectBugReports && selectedDispute.allProjectBugReports.length > 0 && (() => {
                  const testerReports = selectedDispute.allProjectBugReports.filter(
                    report => report.submittedBy?._id === selectedDispute.submittedBy?._id
                  );

                  return testerReports.length > 0 ? (
                    <BugReportsList
                      title={`DISPUTING TESTER'S BUG REPORTS (${testerReports.length})`}
                      reports={testerReports}
                      backgroundColor="#FEF3C7"
                      borderColor="#F59E0B"
                      highlightColor="#F59E0B"
                    />
                  ) : null;
                })()}

                {/* All Bug Reports for This Project */}
                {selectedDispute.allProjectBugReports && selectedDispute.allProjectBugReports.length > 0 && (
                  <BugReportsList
                    title={`ALL BUG REPORTS FOR THIS PROJECT (${selectedDispute.allProjectBugReports.length})`}
                    reports={selectedDispute.allProjectBugReports}
                    backgroundColor="#F9FAFB"
                    borderColor="#E5E7EB"
                    disputingTesterId={selectedDispute.submittedBy?._id}
                  />
                )}

                {/* Reporter Info */}
                <div style={{
                  padding: '16px',
                  backgroundColor: theme.statsCardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: theme.textSecondary,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.3s ease'
                }}>
                  <strong style={{ color: theme.textPrimary }}>Submitted by:</strong> {selectedDispute.submittedBy?.name} ({selectedDispute.submittedBy?.email})
                  <br />
                  <strong style={{ color: theme.textPrimary }}>Submitted:</strong> {formatTimeAgo(selectedDispute.createdAt)}
                </div>
              </div>

              {/* Response Section */}
              <DisputeReviewActions
                dispute={selectedDispute}
                onClose={() => {
                  setSelectedDispute(null);
                  fetchDisputes();
                  fetchModeratorBalance(); // Refresh balance after dispute resolution
                }}
                token={getAuthToken()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Interface */}
      {showWithdrawal && (
        <WithdrawalInterface
          userBalance={moderatorBalance}
          onClose={() => {
            setShowWithdrawal(false);
            fetchModeratorBalance();
          }}
        />
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Dispute Review Actions Component
function DisputeReviewActions({ dispute, onClose, token }) {
  const [action, setAction] = useState('');
  const [response, setResponse] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Bug report override states (for project disputes with bug reports)
  const [overrideBugReport, setOverrideBugReport] = useState(false);
  const [newSeverity, setNewSeverity] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [grantReward, setGrantReward] = useState(false);

  const handleSubmit = async (selectedAction) => {
    if (!selectedAction) {
      setError('Please select an action');
      return;
    }

    if ((selectedAction === 'resolve' || selectedAction === 'dismiss') && !response) {
      setError('Please provide a response message');
      return;
    }

    // Validation for bug report override
    if (overrideBugReport) {
      if (!newSeverity && !newStatus && !grantReward) {
        setError('Please select at least one override option (severity, status, or grant reward)');
        return;
      }
      if (newSeverity && !['critical', 'major', 'minor'].includes(newSeverity)) {
        setError('Invalid severity level');
        return;
      }
      if (newStatus && !['pending', 'approved', 'rejected'].includes(newStatus)) {
        setError('Invalid status');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      const requestBody = {
        type: 'moderator_resolve',
        disputeId: dispute._id,
        disputeType: 'project',
        action: selectedAction,
        response: response
      };

      if (selectedAction === 'resolve' && resolutionDetails) {
        requestBody.resolution = {
          action: 'resolved',
          details: resolutionDetails
        };
      }

      // Include bug report override data if applicable
      if (overrideBugReport && dispute.bugReport) {
        requestBody.bugReportOverride = {
          bugReportId: dispute.bugReport._id,
          newSeverity: newSeverity || undefined,
          newStatus: newStatus || undefined,
          grantReward: grantReward
        };
      }

      const apiResponse = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        let successMessage = `Dispute ${selectedAction}d successfully!`;

        if (result.bugReportUpdated) {
          successMessage += '\n\nBug report has been updated.';
        }
        if (result.rewardGranted) {
          successMessage += `\n\nReward granted: ${result.rewardAmount} credits`;
        }

        alert(successMessage);
        onClose();
      } else {
        const errorData = await apiResponse.json();
        setError(errorData.error || 'Failed to process dispute');
      }
    } catch (err) {
      console.error('Error processing dispute:', err);
      setError('An error occurred while processing the dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{
        borderTop: '1px solid #E5E7EB',
        paddingTop: '24px'
      }}>
        <h4 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1F2937',
          marginBottom: '16px'
        }}>
          Take Action
        </h4>

        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* Response Message */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Response Message
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Enter your response to the user..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Resolution Details (only for resolve action) */}
        {action === 'resolve' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Resolution Details (Optional)
            </label>
            <textarea
              value={resolutionDetails}
              onChange={(e) => setResolutionDetails(e.target.value)}
              placeholder="Enter resolution details..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
        )}

        {/* Bug Report Override Section (only for project disputes with bug reports) */}
        {dispute.bugReport && (
          <div style={{
            backgroundColor: '#FEF3C7',
            border: '2px solid #F59E0B',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <input
                type="checkbox"
                id="overrideBugReport"
                checked={overrideBugReport}
                onChange={(e) => setOverrideBugReport(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <label
                htmlFor="overrideBugReport"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: '#92400E',
                  cursor: 'pointer'
                }}
              >
                Override Bug Report (Moderator Authority)
              </label>
            </div>

            {overrideBugReport && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid #F59E0B'
              }}>
                <p style={{
                  fontSize: '0.85rem',
                  color: '#92400E',
                  marginBottom: '12px',
                  fontWeight: '500'
                }}>
                  ⚠️ As a moderator, you can override the bug report's severity, status, and forcefully grant rewards from the project pool.
                </p>

                {/* Current Bug Info */}
                <div style={{
                  backgroundColor: '#FEF3C7',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  fontSize: '0.85rem',
                  color: '#78350F'
                }}>
                  <strong>Current:</strong> {dispute.bugReport.severity.toUpperCase()} - {dispute.bugReport.status.toUpperCase()}
                </div>

                {/* Severity Override */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    New Severity (leave empty to keep current)
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="">Keep Current ({dispute.bugReport.severity})</option>
                    <option value="critical">Critical</option>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                  </select>
                </div>

                {/* Status Override */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    New Status (leave empty to keep current)
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="">Keep Current ({dispute.bugReport.status})</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Grant Reward Checkbox */}
                <div style={{
                  backgroundColor: '#D1FAE5',
                  border: '1px solid #10B981',
                  borderRadius: '6px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <input
                    type="checkbox"
                    id="grantReward"
                    checked={grantReward}
                    onChange={(e) => setGrantReward(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  <label
                    htmlFor="grantReward"
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#065F46',
                      cursor: 'pointer'
                    }}
                  >
                    💰 Grant Reward to Tester (from project's reward pool)
                  </label>
                </div>

                {grantReward && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#059669',
                    marginTop: '8px',
                    marginBottom: 0,
                    fontStyle: 'italic'
                  }}>
                    Reward amount will be based on the bug's severity (current or overridden).
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: '20px'
        }}>
          <button
            onClick={() => {
              setAction('investigate');
              handleSubmit('investigate');
            }}
            disabled={loading || dispute.status === 'investigating'}
            style={{
              padding: '12px',
              backgroundColor: dispute.status === 'investigating' ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: loading || dispute.status === 'investigating' ? 'not-allowed' : 'pointer',
              opacity: loading || dispute.status === 'investigating' ? 0.6 : 1
            }}
          >
            {loading && action === 'investigate' ? 'Processing...' : 'Mark as Investigating'}
          </button>

          <button
            onClick={() => {
              setAction('resolve');
              handleSubmit('resolve');
            }}
            disabled={loading || dispute.status === 'resolved'}
            style={{
              padding: '12px',
              backgroundColor: dispute.status === 'resolved' ? '#9CA3AF' : '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: loading || dispute.status === 'resolved' ? 'not-allowed' : 'pointer',
              opacity: loading || dispute.status === 'resolved' ? 0.6 : 1
            }}
          >
            {loading && action === 'resolve' ? 'Processing...' : 'Resolve Dispute'}
          </button>

          <button
            onClick={() => {
              setAction('dismiss');
              handleSubmit('dismiss');
            }}
            disabled={loading || dispute.status === 'dismissed'}
            style={{
              padding: '12px',
              backgroundColor: dispute.status === 'dismissed' ? '#9CA3AF' : '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: loading || dispute.status === 'dismissed' ? 'not-allowed' : 'pointer',
              opacity: loading || dispute.status === 'dismissed' ? 0.6 : 1
            }}
          >
            {loading && action === 'dismiss' ? 'Processing...' : 'Dismiss Dispute'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModeratorDashboard;