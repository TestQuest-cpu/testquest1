import React, { useState, useEffect } from "react";
import SeverityGuideModal from './SeverityGuideModal';
import { getDeveloperTheme, CREDITS_TO_USD } from './themeConfig';

function ProjectView({ project, onBack, onLeaderboards, onPost, onProfile }) {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [processingAction, setProcessingAction] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [showSeverityGuide, setShowSeverityGuide] = useState(false);
  const [overriddenSeverity, setOverriddenSeverity] = useState(null);
  const [isLightMode, setIsLightMode] = useState(localStorage.getItem('developerLightMode') === 'true');

  const theme = getDeveloperTheme(isLightMode);

  useEffect(() => {
    if (project) {
      fetchBugReports();
    }

    const handleThemeChange = () => {
      setIsLightMode(localStorage.getItem('developerLightMode') === 'true');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, [project, filter]);

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        setError('Please log in to view bug reports');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports?projectId=${project._id}&limit=1000`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Bug reports fetched:', data);
        setBugReports(data.bugReports || []);
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', response.status, errorData);
        // Show error message for non-404 errors
        if (response.status !== 404) {
          setError(errorData.message || `Error loading bug reports (${response.status})`);
        }
        setBugReports([]);
      }
    } catch (error) {
      console.error('Error fetching bug reports:', error);
      setError('Network error loading bug reports');
      setBugReports([]);
    } finally {
      setLoading(false);
    }
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
        fontSize: '11px',
        fontWeight: '600',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        {config.text}
      </span>
    );
  };

  const getSeverityBadge = (severity) => {
    const severityConfig = {
      critical: { bg: '#FEE2E2', color: '#991B1B', text: 'Critical' },
      major: { bg: '#FEF3C7', color: '#92400E', text: 'Major' },
      minor: { bg: '#E0F2FE', color: '#0369A1', text: 'Minor' }
    };
    const config = severityConfig[severity] || severityConfig.minor;

    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        fontFamily: 'DM Sans, sans-serif'
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

  const handleBugReportAction = async (action) => {
    if (!selectedReport || processingAction) return;

    // Show rating modal before processing
    setPendingAction(action);
    setShowRatingModal(true);
  };

  const submitActionWithRating = async () => {
    if (!selectedReport || !pendingAction) return;

    setProcessingAction(true);
    setShowRatingModal(false);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        alert('Please log in to perform this action');
        setProcessingAction(false);
        return;
      }

      const requestBody = {
        bugReportId: selectedReport._id,
        action: pendingAction,
        developerResponse: pendingAction === 'reject' ? 'Bug report has been reviewed and rejected.' : 'Bug report has been approved and reward has been credited.'
      };

      // Add severity override if provided
      if (overriddenSeverity && overriddenSeverity !== selectedReport.severity) {
        requestBody.overrideSeverity = overriddenSeverity;
      }

      // Add rating if provided (optional)
      if (rating > 0) {
        requestBody.rating = rating;
        requestBody.ratingComment = ratingComment;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        // Update the project's remaining bounty if this was an approval
        if (pendingAction === 'approve') {
          project.remainingBounty = data.updatedProjectBounty;
        }

        // Re-fetch bug reports to get updated blur status
        await fetchBugReports();

        setSelectedReport(null);
        setRating(0);
        setRatingComment('');
        setPendingAction(null);
        alert(`Bug report ${pendingAction}d successfully!`);
      } else {
        alert(data.message || `Failed to ${pendingAction} bug report`);
      }
    } catch (error) {
      console.error(`Error ${pendingAction}ing bug report:`, error);
      alert(`Error ${pendingAction}ing bug report. Please try again.`);
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredReports = bugReports.filter(report => {
    // Filter by status
    const statusMatch = filter === 'all' || report.status === filter;
    // Filter by severity
    const severityMatch = severityFilter === 'all' || report.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  if (!project) {
    return (
      <div style={{ padding: '20px', color: 'white' }}>
        <h3>Project not found</h3>
        <button onClick={onBack}>← Back to Dashboard</button>
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
              <button onClick={onBack} style={{
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

        {/* Page Title */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            color: theme.textPrimary,
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '8px',
            fontFamily: 'Sansita, sans-serif',
            transition: 'color 0.3s ease'
          }}>Project Details</h1>
          <p style={{
            color: theme.textSecondary,
            fontSize: '1.1rem',
            marginBottom: 0,
            fontFamily: 'DM Sans, sans-serif',
            transition: 'color 0.3s ease'
          }}>Manage and review bug reports for this project</p>
        </div>

      {/* Main Content - Side by Side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '420px 1fr',
        gap: '30px',
        maxWidth: '1600px',
        margin: '0 auto',
        alignItems: 'start'
      }}>

        {/* Left Side - Project Information */}
        <div style={{
          width: '100%',
          background: theme.cardBackground,
          borderRadius: '20px',
          border: `1px solid ${theme.border}`,
          padding: '32px',
          height: 'fit-content',
          boxShadow: isLightMode ? '0 20px 40px rgba(0, 0, 0, 0.1)' : '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          {/* Subtle background glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'radial-gradient(circle at 50% 0%, rgba(76, 205, 196, 0.08) 0%, transparent 60%)',
            borderRadius: '20px 20px 0 0',
            pointerEvents: 'none',
            zIndex: 0
          }}></div>

          <h1 style={{
            color: theme.textPrimary,
            fontSize: '1.6rem',
            fontWeight: '700',
            marginBottom: '24px',
            position: 'relative',
            zIndex: 1,
            lineHeight: '1.3',
            transition: 'color 0.3s ease'
          }}>
            {project.name}
          </h1>

          {/* Circular Square Project Image */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '32px',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Main Circular Square Image */}
            <div style={{
              width: '160px',
              height: '160px',
              borderRadius: '32px',
              background: project.image ?
                `url(${project.image})` :
                'linear-gradient(135deg, #2A2A2A 0%, #1F1F1F 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '4px solid rgba(76, 205, 196, 0.3)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 20px rgba(76, 205, 196, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Image overlay for better contrast */}
              {project.image && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(76, 205, 196, 0.05) 50%, rgba(0,0,0,0.2) 100%)',
                  borderRadius: '28px'
                }}></div>
              )}

              {/* Rotating border effect */}
              <div style={{
                position: 'absolute',
                top: '-6px',
                left: '-6px',
                right: '-6px',
                bottom: '-6px',
                borderRadius: '38px',
                background: 'conic-gradient(from 0deg, transparent, rgba(76, 205, 196, 0.3), transparent, rgba(76, 205, 196, 0.1), transparent)',
                zIndex: -1,
                animation: 'rotate 10s linear infinite'
              }}></div>
            </div>

            {/* Status Badge */}
            <div style={{
              marginTop: '16px',
              background: project.status === 'approved' ?
                'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))' :
                project.status === 'pending' ?
                'linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9))' :
                project.status === 'completed' ?
                'linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9))' :
                'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              {project.status === 'approved' ? 'Active Project' :
               project.status === 'pending' ? 'Under Review' :
               project.status === 'completed' ? 'Completed' : 'Rejected'}
            </div>
          </div>

          {/* Project Details */}
          <div style={{
            marginBottom: '28px',
            position: 'relative',
            zIndex: 1,
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>Platform</span>
              <div style={{
                background: 'linear-gradient(135deg, rgba(76, 205, 196, 0.2), rgba(68, 160, 141, 0.3))',
                color: '#4ECDC4',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                border: '1px solid rgba(76, 205, 196, 0.3)'
              }}>
                {project.platform}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <span style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>Total Bounty</span>
              <div style={{
                background: 'linear-gradient(135deg, rgba(76, 205, 196, 0.2), rgba(68, 160, 141, 0.3))',
                color: '#4ECDC4',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '1.1rem',
                fontWeight: '700',
                border: '1px solid rgba(76, 205, 196, 0.3)'
              }}>
                {(project.totalBounty || 0).toLocaleString()} credits
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>
                  (${((project.totalBounty || 0) / CREDITS_TO_USD).toFixed(2)})
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>Remaining</span>
              <div style={{
                background: 'linear-gradient(135deg, rgba(76, 205, 196, 0.2), rgba(68, 160, 141, 0.3))',
                color: '#4ECDC4',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '1.1rem',
                fontWeight: '700',
                border: '1px solid rgba(76, 205, 196, 0.3)'
              }}>
                {(project.remainingBounty || project.totalBounty || 0).toLocaleString()} credits
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>
                  (${((project.remainingBounty || project.totalBounty || 0) / CREDITS_TO_USD).toFixed(2)})
                </div>
              </div>
            </div>
          </div>

          {/* Bug Rewards */}
          <div style={{
            marginBottom: '28px',
            position: 'relative',
            zIndex: 1
          }}>
            <h4 style={{
              color: theme.textPrimary,
              fontSize: '1.1rem',
              marginBottom: '18px',
              fontWeight: '600',
              transition: 'color 0.3s ease'
            }}>
              Bug Rewards
            </h4>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Critical */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.2))',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#EF4444'
                  }}></div>
                  <span style={{
                    color: '#EF4444',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>Critical</span>
                </div>
                <span style={{
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '700'
                }}>{(project.bugRewards?.critical || 0).toLocaleString()} credits</span>
              </div>

              {/* Major */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.2))',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#F59E0B'
                  }}></div>
                  <span style={{
                    color: '#F59E0B',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>Major</span>
                </div>
                <span style={{
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '700'
                }}>{(project.bugRewards?.major || 0).toLocaleString()} credits</span>
              </div>

              {/* Minor */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.2))',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3B82F6'
                  }}></div>
                  <span style={{
                    color: '#3B82F6',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>Minor</span>
                </div>
                <span style={{
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '700'
                }}>{(project.bugRewards?.minor || 0).toLocaleString()} credits</span>
              </div>
            </div>
          </div>

          {/* Objective */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: theme.textPrimary, fontSize: '1rem', marginBottom: '10px', transition: 'color 0.3s ease' }}>Objective</h4>
            <p style={{
              color: theme.textSecondary,
              fontSize: '0.85rem',
              lineHeight: '1.6',
              marginBottom: '0',
              transition: 'color 0.3s ease'
            }}>
              {project.objective}
            </p>
          </div>

          {/* Areas to Test */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: theme.textPrimary, fontSize: '1rem', marginBottom: '10px', transition: 'color 0.3s ease' }}>Areas to Test</h4>
            <div style={{
              color: theme.textSecondary,
              fontSize: '0.85rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
              transition: 'color 0.3s ease'
            }}>
              {project.areasToTest}
            </div>
          </div>

          {/* Project Link */}
          <div style={{
            marginBottom: '20px',
            position: 'relative',
            zIndex: 1
          }}>
            <a
              href={project.projectLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(76, 205, 196, 0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 24px rgba(76, 205, 196, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(76, 205, 196, 0.4)';
              }}
            >
              View Project

              {/* Subtle shine effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                transition: 'left 0.5s ease'
              }}></div>
            </a>
          </div>
        </div>

        {/* Right Side - Bug Reports */}
        <div style={{ width: '100%', minWidth: 0 }}>
          {/* Bug Reports Header */}
          <div style={{
            backgroundColor: theme.cardBackground,
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            padding: '25px',
            marginBottom: '20px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{
                color: theme.textPrimary,
                fontSize: '1.4rem',
                fontWeight: '700',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'color 0.3s ease'
              }}>
                Bug Reports ({filteredReports.length})
                <button
                  type="button"
                  onClick={() => setShowSeverityGuide(true)}
                  style={{
                    background: 'rgba(78, 205, 196, 0.2)',
                    border: '1px solid rgba(78, 205, 196, 0.4)',
                    color: '#4ECDC4',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(78, 205, 196, 0.3)';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(78, 205, 196, 0.2)';
                    e.target.style.transform = 'scale(1)';
                  }}
                  title="View severity level guidelines"
                >
                  ℹ
                </button>
              </h2>
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
              {[
                { key: 'all', label: 'All Reports', count: bugReports.length },
                { key: 'pending', label: 'Pending Review', count: bugReports.filter(r => r.status === 'pending').length },
                { key: 'approved', label: 'Approved', count: bugReports.filter(r => r.status === 'approved').length },
                { key: 'rejected', label: 'Rejected', count: bugReports.filter(r => r.status === 'rejected').length },
                { key: 'resolved', label: 'Resolved', count: bugReports.filter(r => r.status === 'resolved').length }
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

            {/* Severity Filter */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                color: theme.textSecondary,
                fontSize: '13px',
                fontWeight: '600',
                marginRight: '5px',
                transition: 'color 0.3s ease'
              }}>
                Severity:
              </span>
              {[
                { key: 'all', label: 'All', color: '#667eea', count: bugReports.length },
                { key: 'critical', label: 'Critical', color: '#EF4444', count: bugReports.filter(r => r.severity === 'critical').length },
                { key: 'major', label: 'Major', color: '#F59E0B', count: bugReports.filter(r => r.severity === 'major').length },
                { key: 'minor', label: 'Minor', color: '#3B82F6', count: bugReports.filter(r => r.severity === 'minor').length }
              ].map(sev => (
                <button
                  key={sev.key}
                  onClick={() => setSeverityFilter(sev.key)}
                  style={{
                    background: severityFilter === sev.key
                      ? sev.color
                      : 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    border: severityFilter === sev.key ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontFamily: 'DM Sans, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (severityFilter !== sev.key) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (severityFilter !== sev.key) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {sev.label}
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '1px 5px',
                    fontSize: '11px'
                  }}>
                    {sev.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bug Reports List */}
          <div style={{
            backgroundColor: theme.cardBackground,
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            padding: '20px',
            minHeight: '400px',
            transition: 'all 0.3s ease'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(255,255,255,0.1)',
                  borderTop: '3px solid #4ECDC4',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }}></div>
                Loading bug reports...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#FF6B6B' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ marginBottom: '8px' }}>Error Loading Bug Reports</h3>
                <p style={{ marginBottom: '20px', opacity: 0.8 }}>{error}</p>
                <button 
                  onClick={fetchBugReports}
                  style={{
                    background: '#FF6B6B',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : filteredReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🐛</div>
                <h3 style={{
                  color: theme.textPrimary,
                  fontSize: '20px',
                  marginBottom: '8px',
                  transition: 'color 0.3s ease'
                }}>
                  No {filter !== 'all' ? filter + ' ' : ''}Bug Reports Yet
                </h3>
                <p style={{
                  color: theme.textSecondary,
                  fontSize: '14px',
                  transition: 'color 0.3s ease'
                }}>
                  {filter === 'all'
                    ? 'Waiting for testers to submit bug reports for this project.'
                    : `No ${filter} bug reports found. Try a different filter.`
                  }
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredReports.map((report) => (
                  <div
                    key={report._id}
                    onClick={() => !report.isBlurred && setSelectedReport(report)}
                    style={{
                      backgroundColor: theme.cardBackground,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '12px',
                      padding: '20px',
                      cursor: report.isBlurred ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!report.isBlurred) {
                        e.currentTarget.style.backgroundColor = theme.buttonDarkHover;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!report.isBlurred) {
                        e.currentTarget.style.backgroundColor = theme.cardBackground;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* Content wrapper with blur applied only to content, not overlay */}
                    <div style={{
                      filter: report.isBlurred ? 'blur(5px)' : 'none',
                      opacity: report.isBlurred ? 0.5 : 1,
                      pointerEvents: report.isBlurred ? 'none' : 'auto'
                    }}
                    >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h4 style={{
                        color: theme.textPrimary,
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '0',
                        flex: 1,
                        marginRight: '15px',
                        transition: 'color 0.3s ease'
                      }}>
                        {report.title}
                      </h4>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {getSeverityBadge(report.severity)}
                        {getStatusBadge(report.status)}
                      </div>
                    </div>

                    <p style={{
                      color: theme.textSecondary,
                      fontSize: '14px',
                      marginBottom: '15px',
                      lineHeight: '1.5',
                      transition: 'color 0.3s ease'
                    }}>
                      {report.description.length > 120 ? report.description.substring(0, 120) + '...' : report.description}
                    </p>

                    {/* Attachments Display */}
                    {report.attachments && report.attachments.length > 0 && (
                      <div style={{
                        marginBottom: '15px',
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap'
                      }}>
                        {report.attachments.slice(0, 3).map((attachment, idx) => (
                          <div
                            key={idx}
                            style={{
                              position: 'relative',
                              width: '60px',
                              height: '60px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '2px solid rgba(78, 205, 196, 0.3)'
                            }}
                            title={attachment.originalName}
                          >
                            {attachment.mimetype.startsWith('image/') ? (
                              <img
                                src={`data:${attachment.mimetype};base64,${attachment.data}`}
                                alt={attachment.originalName}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(78, 205, 196, 0.1)',
                                fontSize: '24px'
                              }}>
                                {attachment.mimetype.startsWith('video/') ? '🎥' : '📄'}
                              </div>
                            )}
                          </div>
                        ))}
                        {report.attachments.length > 3 && (
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(78, 205, 196, 0.1)',
                            border: '2px solid rgba(78, 205, 196, 0.3)',
                            color: '#4ECDC4',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            +{report.attachments.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: theme.textMuted, transition: 'color 0.3s ease' }}>
                        By {'Anonymous Tester'} • {formatTimeAgo(report.createdAt)}
                      </div>
                      <div style={{
                        color: '#4ECDC4',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {(project.bugRewards?.[report.severity] || 0).toLocaleString()} credits
                      </div>
                    </div>
                    </div>
                    {/* End of content wrapper */}

                    {/* Blur Overlay Warning - NOT blurred */}
                    {report.isBlurred && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        zIndex: 10
                      }}>
                        <div style={{
                          fontSize: '48px',
                          marginBottom: '15px'
                        }}>
                          🔒
                        </div>
                        <div style={{
                          color: '#FFA500',
                          fontSize: '18px',
                          fontWeight: '700',
                          marginBottom: '10px'
                        }}>
                          Report Locked
                        </div>
                        <div style={{
                          color: 'rgba(255, 255, 255, 0.95)',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          maxWidth: '320px'
                        }}>
                          {report.blurReason || `Please review the first pending ${report.severity} bug report before accessing this one`}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Bug Report Modal */}
      {selectedReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '25px'
            }}>
              <div style={{ flex: 1, marginRight: '20px' }}>
                <h2 style={{
                  color: theme.textPrimary,
                  fontSize: '24px',
                  fontWeight: '700',
                  marginBottom: '12px',
                  transition: 'color 0.3s ease'
                }}>
                  {selectedReport.title}
                </h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  {getSeverityBadge(selectedReport.severity)}
                  {getStatusBadge(selectedReport.status)}
                </div>
                <div style={{ fontSize: '14px', color: theme.textSecondary, transition: 'color 0.3s ease' }}>
                  Submitted by {selectedReport.submittedBy?.name || 'Unknown'} • {formatTimeAgo(selectedReport.createdAt)}
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                style={{
                  background: theme.buttonLight,
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary,
                  fontSize: '24px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  cursor: 'pointer',
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

            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Description */}
              <div>
                <h4 style={{ color: theme.textPrimary, fontSize: '16px', marginBottom: '10px', transition: 'color 0.3s ease' }}>Description</h4>
                <div style={{
                  backgroundColor: theme.statsCardBg,
                  padding: '15px',
                  borderRadius: '8px',
                  color: theme.textPrimary,
                  fontSize: '14px',
                  lineHeight: '1.6',
                  transition: 'all 0.3s ease'
                }}>
                  {selectedReport.description}
                </div>
              </div>

              {/* Steps to Reproduce */}
              <div>
                <h4 style={{ color: theme.textPrimary, fontSize: '16px', marginBottom: '10px', transition: 'color 0.3s ease' }}>Steps to Reproduce</h4>
                <div style={{
                  backgroundColor: theme.statsCardBg,
                  padding: '15px',
                  borderRadius: '8px',
                  color: theme.textPrimary,
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-line',
                  transition: 'all 0.3s ease'
                }}>
                  {selectedReport.stepsToReproduce}
                </div>
              </div>

              {/* Expected vs Actual */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ color: theme.textPrimary, fontSize: '16px', marginBottom: '10px', transition: 'color 0.3s ease' }}>Expected Behavior</h4>
                  <div style={{
                    backgroundColor: theme.statsCardBg,
                    padding: '15px',
                    borderRadius: '8px',
                    color: theme.textPrimary,
                    fontSize: '14px',
                    lineHeight: '1.6',
                    transition: 'all 0.3s ease'
                  }}>
                    {selectedReport.expectedBehavior}
                  </div>
                </div>
                <div>
                  <h4 style={{ color: theme.textPrimary, fontSize: '16px', marginBottom: '10px', transition: 'color 0.3s ease' }}>Actual Behavior</h4>
                  <div style={{
                    backgroundColor: theme.statsCardBg,
                    padding: '15px',
                    borderRadius: '8px',
                    color: theme.textPrimary,
                    fontSize: '14px',
                    lineHeight: '1.6',
                    transition: 'all 0.3s ease'
                  }}>
                    {selectedReport.actualBehavior}
                  </div>
                </div>
              </div>

              {/* Attachments Display in Modal */}
              {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                <div>
                  <h4 style={{ color: theme.textPrimary, fontSize: '16px', marginBottom: '10px', transition: 'color 0.3s ease' }}>Attachments</h4>
                  <div style={{
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap',
                    backgroundColor: theme.statsCardBg,
                    padding: '15px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}>
                    {selectedReport.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: '120px',
                          height: '120px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid rgba(78, 205, 196, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => {
                          // Create a blob from base64 data
                          const byteCharacters = atob(attachment.data);
                          const byteNumbers = new Array(byteCharacters.length);
                          for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                          }
                          const byteArray = new Uint8Array(byteNumbers);
                          const blob = new Blob([byteArray], { type: attachment.mimetype });

                          // Create a URL for the blob
                          const url = URL.createObjectURL(blob);

                          // Open in new tab
                          const newWindow = window.open(url, '_blank');

                          // Cleanup URL after a delay
                          setTimeout(() => URL.revokeObjectURL(url), 100);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.border = '2px solid #4ECDC4';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.border = '2px solid rgba(78, 205, 196, 0.3)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title={`${attachment.originalName} (Click to open)`}
                      >
                        {attachment.mimetype.startsWith('image/') ? (
                          <img
                            src={`data:${attachment.mimetype};base64,${attachment.data}`}
                            alt={attachment.originalName}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(78, 205, 196, 0.1)',
                            padding: '10px'
                          }}>
                            <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                              {attachment.mimetype.startsWith('video/') ? '🎥' : '📄'}
                            </div>
                            <div style={{
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: '10px',
                              textAlign: 'center',
                              wordBreak: 'break-word'
                            }}>
                              {attachment.originalName.length > 15
                                ? attachment.originalName.substring(0, 12) + '...'
                                : attachment.originalName}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Severity Override Section */}
              {selectedReport.status === 'pending' && (
                <div style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '15px',
                  borderRadius: '8px'
                }}>
                  <h4 style={{ color: '#F59E0B', fontSize: '16px', marginBottom: '10px' }}>⚠️ Override Severity (Developer Authority)</h4>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', marginBottom: '12px' }}>
                    If you believe the tester's severity assessment is incorrect, you can override it. This will affect the reward amount.
                  </p>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                      Current Severity: <strong style={{ color: '#F59E0B' }}>{selectedReport.severity.toUpperCase()}</strong>
                    </label>
                    <select
                      value={overriddenSeverity || selectedReport.severity}
                      onChange={(e) => setOverriddenSeverity(e.target.value === selectedReport.severity ? null : e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: theme.statsCardBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        color: theme.textPrimary,
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <option value={selectedReport.severity}>Keep Original ({selectedReport.severity})</option>
                      <option value="critical">Critical</option>
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                    </select>
                  </div>
                  {overriddenSeverity && overriddenSeverity !== selectedReport.severity && (
                    <div style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#FCD34D'
                    }}>
                      ℹ️ Severity will be changed from <strong>{selectedReport.severity}</strong> to <strong>{overriddenSeverity}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Reward Info */}
              <div style={{
                backgroundColor: 'rgba(76, 205, 196, 0.1)',
                border: '1px solid rgba(76, 205, 196, 0.3)',
                padding: '15px',
                borderRadius: '8px'
              }}>
                <h4 style={{ color: '#4ECDC4', fontSize: '16px', marginBottom: '5px' }}>
                  {overriddenSeverity && overriddenSeverity !== selectedReport.severity ? 'Updated Reward' : 'Potential Reward'}
                </h4>
                <div style={{ color: '#4ECDC4', fontSize: '20px', fontWeight: '700' }}>
                  {(project.bugRewards?.[overriddenSeverity || selectedReport.severity] || 0).toLocaleString()} credits
                </div>
                {overriddenSeverity && overriddenSeverity !== selectedReport.severity && (
                  <div style={{ fontSize: '12px', color: 'rgba(78, 205, 196, 0.7)', marginTop: '5px' }}>
                    Original: {(project.bugRewards?.[selectedReport.severity] || 0).toLocaleString()} credits
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedReport.status === 'pending' && (
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  justifyContent: 'flex-end',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '20px'
                }}>
                  <button
                    onClick={() => handleBugReportAction('reject')}
                    disabled={processingAction}
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: processingAction ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: processingAction ? 0.6 : 1
                    }}
                  >
                    {processingAction ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleBugReportAction('approve')}
                    disabled={processingAction}
                    style={{
                      backgroundColor: '#4ECDC4',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: processingAction ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: processingAction ? 0.6 : 1
                    }}
                  >
                    {processingAction ? 'Processing...' : 'Approve & Pay'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            border: '2px solid rgba(76, 205, 196, 0.3)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            transition: 'all 0.3s ease'
          }}>
            <h3 style={{ color: theme.textPrimary, fontSize: '20px', marginBottom: '10px', fontWeight: '700', transition: 'color 0.3s ease' }}>
              Rate This Bug Report (Optional)
            </h3>
            <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '25px', transition: 'color 0.3s ease' }}>
              Help improve tester quality by rating this report. You can skip this step.
            </p>

            {/* Star Rating */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: theme.textPrimary, fontSize: '14px', marginBottom: '10px', fontWeight: '600', transition: 'color 0.3s ease' }}>
                Quality Rating
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      background: star <= rating ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 'rgba(255, 255, 255, 0.1)',
                      border: star <= rating ? '2px solid #FFD700' : '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      width: '50px',
                      height: '50px',
                      fontSize: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: star <= rating ? '0 4px 15px rgba(255, 215, 0, 0.4)' : 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginTop: '8px' }}>
                {rating === 0 ? 'Click to rate' :
                 rating === 1 ? '⭐ Poor' :
                 rating === 2 ? '⭐⭐ Fair' :
                 rating === 3 ? '⭐⭐⭐ Good' :
                 rating === 4 ? '⭐⭐⭐⭐ Very Good' :
                 '⭐⭐⭐⭐⭐ Excellent'}
              </div>
            </div>

            {/* Comment (Optional) */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ color: theme.textPrimary, fontSize: '14px', marginBottom: '8px', fontWeight: '600', transition: 'color 0.3s ease' }}>
                Feedback (Optional)
              </div>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your thoughts on this bug report..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  backgroundColor: theme.statsCardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '8px',
                  padding: '12px',
                  color: theme.textPrimary,
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={submitActionWithRating}
                style={{
                  flex: 1,
                  background: pendingAction === 'approve' ? 'linear-gradient(135deg, #4ECDC4, #44A08D)' : 'linear-gradient(135deg, #FF6B6B, #EE5A6F)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {pendingAction === 'approve' ? 'Approve & Rate' : 'Reject & Rate'}
              </button>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setRatingComment('');
                  setPendingAction(null);
                }}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Severity Guide Modal */}
      {showSeverityGuide && (
        <SeverityGuideModal onClose={() => setShowSeverityGuide(false)} theme={theme} />
      )}
      </div>
    </div>
  );
}

export default ProjectView;