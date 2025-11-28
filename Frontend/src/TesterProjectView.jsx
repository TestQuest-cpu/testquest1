import React, { useState, useEffect } from "react";
import ProjectDisputeModal from './ProjectDisputeModal';
import DisputesList from './DisputesList';
import { getTesterTheme } from './themeConfig';

function TesterProjectView({ project: initialProject, projectId, onBack, onLeaderboards, onProfile, onBugReport }) {
  const [project, setProject] = useState(initialProject);
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bugReportsLoading, setBugReportsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showDisputesList, setShowDisputesList] = useState(false);
  const [showProjectDispute, setShowProjectDispute] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('testerLightMode');
    return saved === null ? false : saved === 'true';
  });

  const theme = getTesterTheme(isLightMode);

  // Helper function to get auth token from either storage
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    const handleThemeChange = () => {
      setIsLightMode(localStorage.getItem('testerLightMode') === 'true');
    };
    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  useEffect(() => {
    console.log('TesterProjectView useEffect:', { initialProject, projectId });
    if (initialProject) {
      setProject(initialProject);
      fetchBugReports();
    } else if (projectId) {
      fetchProject();
    }
  }, [initialProject, projectId]);

  const fetchProject = async () => {
    try {
      console.log('Fetching project with ID:', projectId);
      const apiUrl = `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/projects?id=${projectId}`;
      console.log('API URL:', apiUrl);

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(apiUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);

      if (response.ok) {
        const projectData = await response.json();
        console.log('Project data received:', projectData);
        setProject(projectData);
        fetchBugReports();
      } else {
        console.error('Failed to fetch project, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setError('Failed to fetch project details');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      if (error.name === 'AbortError') {
        setError('Project loading timed out. Please try again.');
      } else {
        setError('Error loading project details');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project) {
      fetchBugReports();
    }
  }, [project]);

  const fetchBugReports = async () => {
    try {
      setBugReportsLoading(true);
      const token = getAuthToken();

      if (!token) {
        setError('Please log in to view bug reports');
        return;
      }

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports?myReports=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Filter bug reports for this specific project
        const projectBugReports = (data.bugReports || []).filter(report => {
          if (!report.project || !project) return false;
          return report.project._id === project._id || report.project === project._id;
        });
        setBugReports(projectBugReports);
        setError(''); // Clear any previous errors
      } else {
        // Don't show error for 404 or empty responses - just set empty array
        setBugReports([]);
        setError('');
      }
    } catch (error) {
      console.error('Error fetching bug reports:', error);
      if (error.name === 'AbortError') {
        setError('Request timed out. Please refresh to try again.');
      } else {
        // Only show error for actual network/server issues
        setBugReports([]);
        setError('');
      }
    } finally {
      setBugReportsLoading(false);
    }
  };


  const handleSubmitProjectDispute = async (disputeData) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(disputeData)
      });

      if (response.ok) {
        alert('Project report submitted successfully! An admin will review it shortly.');
        setShowProjectDispute(false);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to submit project report');
      }
    } catch (error) {
      console.error('Error submitting project report:', error);
      alert('Error submitting project report. Please try again.');
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
        fontWeight: '600'
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
        fontWeight: '600'
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

  const filteredReports = bugReports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  if (!project && !loading) {
    console.log('Project not found - Debug info:', {
      project,
      initialProject,
      projectId,
      loading,
      error
    });
    return (
      <div style={{ padding: '20px', color: theme.textPrimary, transition: 'all 0.3s ease' }}>
        <h3>Project not found</h3>
        <p>Debug: projectId = {projectId}, initialProject = {initialProject ? 'exists' : 'null'}</p>
        {error && <p>Error: {error}</p>}
        <button onClick={onBack}>← Back to Dashboard</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        color: theme.textPrimary,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #4ECDC4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading project...</p>
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
      transition: 'all 0.3s ease'
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
                transition: 'all 0.3s ease'
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
              {/* View Reports Button */}
              <button
                onClick={() => setShowDisputesList(true)}
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Sansita, sans-serif',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px) scale(1.05)';
                  e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
                }}
              >
                View Reports
              </button>

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
            transition: 'all 0.3s ease'
          }}>Testing: {project.name}</h1>
          <p style={{
            color: theme.textSecondary,
            fontSize: '1.1rem',
            marginBottom: 0,
            transition: 'all 0.3s ease'
          }}>Submit bug reports and track your progress</p>
        </div>

        {/* Main Content - Side by Side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr 380px',
          gap: '20px',
          maxWidth: '1600px',
          margin: '0 auto',
          height: 'calc(100vh - 100px)',
          overflow: 'hidden'
        }}>

          {/* Left Side - Project Information */}
          <div style={{
            background: theme.cardBackground,
            borderRadius: '20px',
            border: `1px solid ${theme.border}`,
            padding: '25px',
            overflowY: 'auto',
            height: '100%',
            transition: 'all 0.3s ease'
          }}>
            <h1 style={{
              color: theme.textPrimary,
              fontSize: '1.6rem',
              fontWeight: '700',
              marginBottom: '24px',
              transition: 'all 0.3s ease'
            }}>
              {project.name}
            </h1>

            {/* Project Image */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <div style={{
                width: '160px',
                height: '160px',
                borderRadius: '32px',
                background: project.image ?
                  `url(${project.image})` :
                  'linear-gradient(135deg, #2A2A2A 0%, #1F1F1F 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '4px solid rgba(76, 205, 196, 0.3)'
              }}></div>
            </div>

            {/* Bug Rewards */}
            <div style={{ marginBottom: '28px' }}>
              <h4 style={{
                color: theme.textPrimary,
                fontSize: '1.1rem',
                marginBottom: '18px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
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
                  <span style={{ color: '#EF4444', fontSize: '0.9rem', fontWeight: '600' }}>Critical</span>
                  <span style={{ color: theme.textPrimary, fontSize: '1rem', fontWeight: '700', transition: 'all 0.3s ease' }}>
                    {(project.bugRewards?.critical || 0).toLocaleString()} credits
                  </span>
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
                  <span style={{ color: '#F59E0B', fontSize: '0.9rem', fontWeight: '600' }}>Major</span>
                  <span style={{ color: theme.textPrimary, fontSize: '1rem', fontWeight: '700', transition: 'all 0.3s ease' }}>
                    {(project.bugRewards?.major || 0).toLocaleString()} credits
                  </span>
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
                  <span style={{ color: '#3B82F6', fontSize: '0.9rem', fontWeight: '600' }}>Minor</span>
                  <span style={{ color: theme.textPrimary, fontSize: '1rem', fontWeight: '700', transition: 'all 0.3s ease' }}>
                    {(project.bugRewards?.minor || 0).toLocaleString()} credits
                  </span>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: theme.textPrimary, fontSize: '1rem', marginBottom: '10px', transition: 'all 0.3s ease' }}>Objective</h4>
              <p style={{
                color: theme.textSecondary,
                fontSize: '0.85rem',
                lineHeight: '1.6',
                marginBottom: '0',
                transition: 'all 0.3s ease'
              }}>
                {project.objective}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: theme.textPrimary, fontSize: '1rem', marginBottom: '10px', transition: 'all 0.3s ease' }}>Areas to Test</h4>
              <div style={{
                color: theme.textSecondary,
                fontSize: '0.85rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-line',
                transition: 'all 0.3s ease'
              }}>
                {project.areasToTest}
              </div>
            </div>

            {/* Project Link */}
            <div style={{ marginBottom: '20px' }}>
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
                  boxShadow: '0 4px 16px rgba(78, 205, 196, 0.4)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 24px rgba(78, 205, 196, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(78, 205, 196, 0.4)';
                }}
              >
                Open Project to Test
              </a>
            </div>
          </div>

          {/* Middle - Bug Reports */}
          <div style={{
            overflowY: 'auto',
            height: '100%'
          }}>
            {/* Bug Reports Header */}
            <div style={{
              backgroundColor: theme.cardBackground,
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
                  transition: 'all 0.3s ease'
                }}>
                  Your Bug Reports ({filteredReports.length})
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => onBugReport && onBugReport(project._id)}
                    style={{
                      background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '14px 24px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Sansita, sans-serif',
                      boxShadow: '0 4px 15px rgba(78, 205, 196, 0.4)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px) scale(1.05)';
                      e.target.style.boxShadow = '0 6px 20px rgba(78, 205, 196, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0) scale(1)';
                      e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.4)';
                    }}
                  >
                    + Submit Bug Report
                  </button>
                  <button
                    onClick={() => setShowProjectDispute(true)}
                    style={{
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '14px 24px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontFamily: 'Sansita, sans-serif',
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px) scale(1.05)';
                      e.target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0) scale(1)';
                      e.target.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.4)';
                    }}
                  >
                    ⚠️ Report Project
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'All Reports', count: bugReports.length },
                  { key: 'pending', label: 'Pending', count: bugReports.filter(r => r.status === 'pending').length },
                  { key: 'approved', label: 'Approved', count: bugReports.filter(r => r.status === 'approved').length },
                  { key: 'rejected', label: 'Rejected', count: bugReports.filter(r => r.status === 'rejected').length }
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

            {/* Bug Reports List */}
            <div style={{
              backgroundColor: theme.cardBackground,
              borderRadius: '16px',
              border: `1px solid ${theme.border}`,
              padding: '20px',
              minHeight: '400px',
              transition: 'all 0.3s ease'
            }}>
              {bugReportsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary, transition: 'all 0.3s ease' }}>
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
                      background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A52 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
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
                    transition: 'all 0.3s ease'
                  }}>
                    No {filter !== 'all' ? filter + ' ' : ''}Bug Reports Yet
                  </h3>
                  <p style={{
                    color: theme.textSecondary,
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}>
                    {filter === 'all'
                      ? 'Start testing this project and submit your first bug report!'
                      : `No ${filter} bug reports found. Try a different filter.`
                    }
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {filteredReports.map((report) => (
                    <div
                      key={report._id}
                      onClick={() => setSelectedReport(report)}
                      style={{
                        backgroundColor: theme.buttonLight,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '12px',
                        padding: '20px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.buttonLightHover;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme.buttonLight;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
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
                          transition: 'all 0.3s ease'
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
                        transition: 'all 0.3s ease'
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
                          {report.attachments.map((attachment, idx) => (
                            <div
                              key={idx}
                              style={{
                                position: 'relative',
                                width: '80px',
                                height: '80px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '2px solid rgba(78, 205, 196, 0.3)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                              }}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click
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
                                window.open(url, '_blank');

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
                                  fontSize: '32px'
                                }}>
                                  {attachment.mimetype.startsWith('video/') ? '🎥' : '📄'}
                                </div>
                              )}
                            </div>
                          ))}
                          <div style={{
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            alignSelf: 'center'
                          }}>
                            {report.attachments.length} file{report.attachments.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                          Submitted {formatTimeAgo(report.createdAt)}
                        </div>
                        <div style={{
                          color: '#4ECDC4',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {(project.bugRewards?.[report.severity] || 0).toLocaleString()} credits
                        </div>
                      </div>

                      {report.developerResponse && (
                        <div style={{
                          marginTop: '15px',
                          padding: '12px',
                          background: theme.statsCardBg,
                          borderRadius: '8px',
                          border: `1px solid ${theme.border}`,
                          transition: 'all 0.3s ease'
                        }}>
                          <h5 style={{ color: theme.textPrimary, fontSize: '12px', marginBottom: '6px', transition: 'all 0.3s ease' }}>
                            Developer Response:
                          </h5>
                          <p style={{ color: theme.textSecondary, fontSize: '12px', marginBottom: 0, transition: 'all 0.3s ease' }}>
                            {report.developerResponse.message}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Approved Bugs */}
          <div style={{
            overflowY: 'auto',
            height: '100%'
          }}>
            <ApprovedBugsSection project={project} />
          </div>
        </div>

        {/* Disputes List Modal */}
        {showDisputesList && (
          <DisputesList
            projectId={project._id}
            onClose={() => setShowDisputesList(false)}
          />
        )}

        {/* Project Dispute Modal */}
        {showProjectDispute && (
          <ProjectDisputeModal
            project={project}
            onClose={() => setShowProjectDispute(false)}
            onSubmit={handleSubmitProjectDispute}
          />
        )}

        {/* Bug Report Details Modal */}
        {selectedReport && (
          <BugReportDetailsModal
            report={selectedReport}
            project={project}
            onClose={() => setSelectedReport(null)}
            getSeverityBadge={getSeverityBadge}
            getStatusBadge={getStatusBadge}
            formatTimeAgo={formatTimeAgo}
          />
        )}

      </div>
    </div>
  );
}

// Bug Report Details Modal Component
function BugReportDetailsModal({ report, project, onClose, getSeverityBadge, getStatusBadge, formatTimeAgo }) {
  const [isLightMode] = React.useState(() => {
    const saved = localStorage.getItem('testerLightMode');
    return saved === null ? false : saved === 'true';
  });
  const theme = getTesterTheme(isLightMode);

  return (
    <div
      onClick={onClose}
      style={{
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          padding: '30px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              color: theme.textPrimary,
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '10px',
              transition: 'all 0.3s ease'
            }}>
              {report.title}
            </h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {getSeverityBadge(report.severity)}
              {getStatusBadge(report.status)}
              <span style={{
                color: theme.textMuted,
                fontSize: '13px',
                transition: 'all 0.3s ease'
              }}>
                Submitted {formatTimeAgo(report.createdAt)}
              </span>
              {report.reward && (
                <span style={{
                  color: '#4ECDC4',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Reward: {(typeof report.reward === 'object' ? report.reward.amount || 0 : report.reward).toLocaleString()} credits
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: theme.buttonLight,
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary,
              fontSize: '24px',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
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

        {/* Bug Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Description */}
          <div>
            <h4 style={{
              color: theme.textSecondary,
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease'
            }}>
              Description
            </h4>
            <p style={{
              color: theme.textPrimary,
              fontSize: '15px',
              lineHeight: '1.6',
              margin: 0,
              whiteSpace: 'pre-wrap',
              transition: 'all 0.3s ease'
            }}>
              {report.description}
            </p>
          </div>

          {/* Steps to Reproduce */}
          {report.stepsToReproduce && (
            <div>
              <h4 style={{
                color: theme.textSecondary,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease'
              }}>
                Steps to Reproduce
              </h4>
              <p style={{
                color: theme.textPrimary,
                fontSize: '15px',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap',
                transition: 'all 0.3s ease'
              }}>
                {report.stepsToReproduce}
              </p>
            </div>
          )}

          {/* Expected Behavior */}
          {report.expectedBehavior && (
            <div>
              <h4 style={{
                color: theme.textSecondary,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease'
              }}>
                Expected Behavior
              </h4>
              <p style={{
                color: theme.textPrimary,
                fontSize: '15px',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap',
                transition: 'all 0.3s ease'
              }}>
                {report.expectedBehavior}
              </p>
            </div>
          )}

          {/* Actual Behavior */}
          {report.actualBehavior && (
            <div>
              <h4 style={{
                color: theme.textSecondary,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease'
              }}>
                Actual Behavior
              </h4>
              <p style={{
                color: theme.textPrimary,
                fontSize: '15px',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap',
                transition: 'all 0.3s ease'
              }}>
                {report.actualBehavior}
              </p>
            </div>
          )}

          {/* Attachments */}
          {report.attachments && report.attachments.length > 0 && (
            <div>
              <h4 style={{
                color: theme.textSecondary,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease'
              }}>
                Attachments ({report.attachments.length})
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {report.attachments.map((attachment, idx) => (
                  <div
                    key={idx}
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
                      window.open(url, '_blank');

                      // Cleanup URL after a delay
                      setTimeout(() => URL.revokeObjectURL(url), 100);
                    }}
                    style={{
                      position: 'relative',
                      width: '100px',
                      height: '100px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid rgba(78, 205, 196, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.border = '2px solid #4ECDC4';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border = '2px solid rgba(78, 205, 196, 0.3)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {attachment.mimetype?.startsWith('image/') ? (
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
                        fontSize: '32px'
                      }}>
                        {attachment.mimetype?.startsWith('video/') ? '🎥' : '📄'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Developer Response */}
          {report.developerResponse && report.developerResponse.message && (
            <div style={{
              background: report.status === 'approved'
                ? 'rgba(78, 205, 196, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
              border: report.status === 'approved'
                ? '1px solid rgba(78, 205, 196, 0.3)'
                : '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '15px',
              marginTop: '10px'
            }}>
              <h4 style={{
                color: report.status === 'approved' ? '#4ECDC4' : '#EF4444',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Developer Response
              </h4>
              <p style={{
                color: theme.textPrimary,
                fontSize: '14px',
                margin: 0,
                lineHeight: '1.5',
                transition: 'all 0.3s ease'
              }}>
                {report.developerResponse.message}
              </p>
              {report.developerResponse.respondedAt && (
                <p style={{
                  color: theme.textMuted,
                  fontSize: '12px',
                  margin: '8px 0 0 0',
                  transition: 'all 0.3s ease'
                }}>
                  Responded {formatTimeAgo(report.developerResponse.respondedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Approved Bugs Section Component
function ApprovedBugsSection({ project }) {
  const [approvedBugs, setApprovedBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedBug, setSelectedBug] = useState(null);
  const [isLightMode] = useState(() => {
    const saved = localStorage.getItem('testerLightMode');
    return saved === null ? false : saved === 'true';
  });
  const theme = getTesterTheme(isLightMode);

  useEffect(() => {
    fetchApprovedBugs();
  }, [project]);

  const fetchApprovedBugs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports?projectId=${project._id}&status=approved`);

      if (response.ok) {
        const data = await response.json();
        setApprovedBugs(data.bugReports || []);
      }
    } catch (error) {
      console.error('Error fetching approved bugs:', error);
    } finally {
      setLoading(false);
    }
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
        fontWeight: '600'
      }}>
        {config.text}
      </span>
    );
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  return (
    <div style={{
      backgroundColor: theme.cardBackground,
      borderRadius: '16px',
      border: `1px solid ${theme.border}`,
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease'
    }}>
      {/* Warning Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '15px',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <h3 style={{
            color: 'white',
            fontSize: '14px',
            fontWeight: '700',
            margin: 0
          }}>
            Check Before Submitting
          </h3>
        </div>
        <p style={{
          color: 'rgba(255, 255, 255, 0.95)',
          fontSize: '12px',
          lineHeight: '1.5',
          margin: 0
        }}>
          <strong>Duplicates will result in:</strong>
          <br />
          • Reputation deduction
          <br />
          • No reward
          <br />
          • Account restrictions
        </p>
      </div>

      {/* Approved Bugs Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h2 style={{
          color: theme.textPrimary,
          fontSize: '1.1rem',
          fontWeight: '700',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease'
        }}>
          <span>✅</span> Approved ({approvedBugs.length})
        </h2>
        {approvedBugs.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Loading State */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '15px', color: theme.textMuted, fontSize: '12px', transition: 'all 0.3s ease' }}>
            Loading...
          </div>
        ) : approvedBugs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '15px', color: theme.textMuted, fontSize: '12px', transition: 'all 0.3s ease' }}>
            No approved bugs yet!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(expanded ? approvedBugs : approvedBugs.slice(0, 5)).map((bug) => (
              <div
                key={bug._id}
                onClick={() => setSelectedBug(bug)}
                style={{
                  backgroundColor: theme.buttonDark,
                  border: '1px solid rgba(78, 205, 196, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.buttonDarkHover;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(78, 205, 196, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.buttonDark;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <h4 style={{
                    color: theme.textPrimary,
                    fontSize: '13px',
                    fontWeight: '600',
                    margin: 0,
                    flex: 1,
                    marginRight: '8px',
                    lineHeight: '1.3',
                    transition: 'all 0.3s ease'
                  }}>
                    {bug.title.length > 50 ? bug.title.substring(0, 50) + '...' : bug.title}
                  </h4>
                  {getSeverityBadge(bug.severity)}
                </div>
                <p style={{
                  color: theme.textSecondary,
                  fontSize: '11px',
                  lineHeight: '1.4',
                  margin: '0 0 8px 0',
                  transition: 'all 0.3s ease'
                }}>
                  {bug.description.length > 80 ? bug.description.substring(0, 80) + '...' : bug.description}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: theme.textMuted,
                  transition: 'all 0.3s ease'
                }}>
                  <span>{bug.submittedBy?.name || 'Anonymous'}</span>
                  <span>{formatTimeAgo(bug.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bug Details Modal */}
      {selectedBug && (
        <div
          onClick={() => setSelectedBug(null)}
          style={{
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
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: '16px',
              border: `1px solid ${theme.border}`,
              padding: '30px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '20px'
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  color: theme.textPrimary,
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '10px',
                  transition: 'all 0.3s ease'
                }}>
                  {selectedBug.title}
                </h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {getSeverityBadge(selectedBug.severity)}
                  <span style={{
                    color: theme.textMuted,
                    fontSize: '13px',
                    transition: 'all 0.3s ease'
                  }}>
                    Found by: {selectedBug.submittedBy?.name || 'Anonymous'}
                  </span>
                  <span style={{
                    color: theme.textMuted,
                    fontSize: '13px',
                    transition: 'all 0.3s ease'
                  }}>
                    • {formatTimeAgo(selectedBug.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBug(null)}
                style={{
                  background: theme.buttonLight,
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary,
                  fontSize: '24px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
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

            {/* Bug Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Description */}
              <div>
                <h4 style={{
                  color: theme.textSecondary,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'all 0.3s ease'
                }}>
                  Description
                </h4>
                <p style={{
                  color: theme.textPrimary,
                  fontSize: '15px',
                  lineHeight: '1.6',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  transition: 'all 0.3s ease'
                }}>
                  {selectedBug.description}
                </p>
              </div>

              {/* Steps to Reproduce */}
              <div>
                <h4 style={{
                  color: theme.textSecondary,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'all 0.3s ease'
                }}>
                  Steps to Reproduce
                </h4>
                <p style={{
                  color: theme.textPrimary,
                  fontSize: '15px',
                  lineHeight: '1.6',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  transition: 'all 0.3s ease'
                }}>
                  {selectedBug.stepsToReproduce}
                </p>
              </div>

              {/* Expected Behavior */}
              <div>
                <h4 style={{
                  color: theme.textSecondary,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'all 0.3s ease'
                }}>
                  Expected Behavior
                </h4>
                <p style={{
                  color: theme.textPrimary,
                  fontSize: '15px',
                  lineHeight: '1.6',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  transition: 'all 0.3s ease'
                }}>
                  {selectedBug.expectedBehavior}
                </p>
              </div>

              {/* Actual Behavior */}
              <div>
                <h4 style={{
                  color: theme.textSecondary,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'all 0.3s ease'
                }}>
                  Actual Behavior
                </h4>
                <p style={{
                  color: theme.textPrimary,
                  fontSize: '15px',
                  lineHeight: '1.6',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  transition: 'all 0.3s ease'
                }}>
                  {selectedBug.actualBehavior}
                </p>
              </div>

              {/* Attachments */}
              {selectedBug.attachments && selectedBug.attachments.length > 0 && (
                <div>
                  <h4 style={{
                    color: theme.textSecondary,
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'all 0.3s ease'
                  }}>
                    Attachments ({selectedBug.attachments.length})
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedBug.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
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
                          window.open(url, '_blank');

                          // Cleanup URL after a delay
                          setTimeout(() => URL.revokeObjectURL(url), 100);
                        }}
                        style={{
                          position: 'relative',
                          width: '80px',
                          height: '80px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid rgba(78, 205, 196, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
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
                        {attachment.mimetype?.startsWith('image/') ? (
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
                            {attachment.mimetype?.startsWith('video/') ? '🎥' : '📄'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '15px',
                marginTop: '10px'
              }}>
                <p style={{
                  color: '#EF4444',
                  fontSize: '13px',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  ⚠️ <strong>Warning:</strong> This bug has already been reported and approved. Submitting a similar bug report will result in reputation deduction and no reward.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TesterProjectView;