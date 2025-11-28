import React, { useState, useEffect } from "react";
import WithdrawalInterface from './WithdrawalInterface';
import SeverityGuideModal from './SeverityGuideModal';
import { getTesterTheme } from './themeConfig';

function BugReport({ onBack, projectId, onProfile, onLeaderboards }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showSeverityGuide, setShowSeverityGuide] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('testerLightMode');
    return saved === null ? false : saved === 'true';
  });

  const theme = getTesterTheme(isLightMode);

  useEffect(() => {
    const handleThemeChange = () => {
      setIsLightMode(localStorage.getItem('testerLightMode') === 'true');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  // Helper function to get auth token from either storage
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Helper function to fetch user balance
  const fetchUserBalance = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

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
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    severity: 'minor'
  });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
    fetchUserBalance();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/projects?id=${projectId}`);

      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
      } else {
        setError('Failed to fetch project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Error loading project');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      // Allow images, videos, and common document types
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} has an unsupported type. Only images, videos, and PDFs are allowed.`);
        return false;
      }
      return true;
    });

    // Limit to 5 files total
    if (attachments.length + validFiles.length > 5) {
      setError('You can upload a maximum of 5 files.');
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Please log in to submit a bug report');
        setSubmitLoading(false);
        return;
      }

      setUploading(true);

      // Convert attachments to base64 for JSON submission
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1]; // Remove data:image/png;base64, prefix
              resolve({
                data: base64,
                mimetype: file.type,
                originalName: file.name
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          stepsToReproduce: formData.stepsToReproduce,
          expectedBehavior: formData.expectedBehavior,
          actualBehavior: formData.actualBehavior,
          severity: formData.severity,
          projectId: projectId,
          attachments: processedAttachments
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to submit bug report';
        const contentType = response.headers.get('content-type');
        console.log('Response status:', response.status);
        console.log('Response content-type:', contentType);
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.error('Server error response:', data);
          errorMessage = data.message || errorMessage;
        } else {
          const text = await response.text();
          console.error('Server returned non-JSON response (status ' + response.status + '):', text);
          errorMessage = 'Server error: ' + (text.substring(0, 100) || 'Unknown error');
        }
        throw new Error(errorMessage);
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);

    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitLoading(false);
      setUploading(false);
    }
  };
  return (
    <>
      <style>
        {`
          .bug-report-input::placeholder,
          .bug-report-textarea::placeholder {
            color: rgba(255, 255, 255, 0.6) !important;
            opacity: 1 !important;
          }
        `}
      </style>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <nav style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
              }}
              onClick={onBack}>Dashboard</button>
              <button style={{
                background: theme.buttonLight,
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
                e.target.style.background = theme.buttonLightHover;
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = theme.buttonLight;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
              }}
              onClick={onLeaderboards}>Leaderboards</button>
            </nav>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                fontFamily: 'Sansita, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.05)';
                e.target.style.boxShadow = '0 6px 20px rgba(78, 205, 196, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
              }}
              title="Total earnings from approved bug reports">
                {(userBalance || 0).toLocaleString()} credits
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
          }}>Submit Bug Report</h1>
          <p style={{
            color: theme.textSecondary,
            fontSize: '1.1rem',
            marginBottom: 0,
            fontFamily: 'DM Sans, sans-serif',
            transition: 'color 0.3s ease'
          }}>Report security vulnerabilities and bugs for this project</p>
        </div>

        <div style={{ display: 'flex', gap: '25px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Left Section - Project Details */}
        <div style={{ width: '420px' }}>
          <div style={{
            background: theme.cardBackground,
            borderRadius: '20px',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease',
            padding: '32px',
            marginBottom: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
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
              {loading ? 'Loading...' : project ? project.name : '[Project Name]'}
            </h1>

            {/* Circular Project Image */}
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
                overflow: 'hidden',
                border: '4px solid rgba(76, 205, 196, 0.3)',
                background: 'linear-gradient(135deg, #2A2A2A 0%, #1F1F1F 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {project && project.image ? (
                  <img
                    src={project.image}
                    alt={project.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  />
                ) : null}
              </div>
            </div>

            {/* Bug Rewards */}
            <div style={{ marginBottom: '28px' }}>
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
                    color: theme.textPrimary,
                    fontSize: '1rem',
                    fontWeight: '700',
                    transition: 'color 0.3s ease'
                  }}>{project ? project.bugRewards?.critical || 0 : 0} credits</span>
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
                    color: theme.textPrimary,
                    fontSize: '1rem',
                    fontWeight: '700',
                    transition: 'color 0.3s ease'
                  }}>{project ? project.bugRewards?.major || 0 : 0} credits</span>
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
                    color: theme.textPrimary,
                    fontSize: '1rem',
                    fontWeight: '700',
                    transition: 'color 0.3s ease'
                  }}>{project ? project.bugRewards?.minor || 0 : 0} credits</span>
                </div>
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
                  {project ? project.platform : 'Web Application'}
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
                  {project ? project.totalBounty?.toLocaleString() || 0 : 0} credits
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
                  {project ? project.remainingBounty?.toLocaleString() || project.totalBounty?.toLocaleString() || 0 : 0} credits
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
                {project ? project.objective : '[Objective description will go here]'}
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
                {project ? project.areasToTest : '[Test areas will be listed here]'}
              </div>
            </div>

            {/* Project Link */}
            <div style={{
              marginBottom: '20px',
              position: 'relative',
              zIndex: 1
            }}>
              <a
                href={project ? project.projectLink : '#'}
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
        </div>

        {/* Right Section - Bug Report Form */}
        <div style={{ flex: 1 }}>
          {/* Show error/success messages */}
          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}
          {submitSuccess && (
            <div className="alert alert-success mb-3" role="alert">
              Bug report submitted successfully! Redirecting...
            </div>
          )}
          
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '16px',
            padding: '32px',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease'
          }}>
            <form onSubmit={handleSubmit}>
              {/* Report Title */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ color: theme.textPrimary, fontSize: '0.95rem', marginBottom: '10px', display: 'block', transition: 'color 0.3s ease' }}>
                  Report Title: <span style={{ color: '#DC3545' }}>*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-control bug-report-input"
                  placeholder="Enter a descriptive title for the bug"
                  required
                  style={{
                    backgroundColor: theme.statsCardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                    transition: 'all 0.3s ease',
                    padding: '10px 15px',
                    borderRadius: '6px'
                  }}
                />
              </div>

              {/* Bug Description */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ color: theme.textPrimary, fontSize: '0.95rem', marginBottom: '10px', display: 'block', transition: 'color 0.3s ease' }}>
                  Bug Description: <span style={{ color: '#DC3545' }}>*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-control bug-report-textarea"
                  placeholder="Describe the bug in detail"
                  rows="4"
                  required
                  style={{
                    backgroundColor: theme.statsCardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                    transition: 'all 0.3s ease',
                    padding: '15px',
                    borderRadius: '6px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Steps to Reproduce */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ color: theme.textPrimary, fontSize: '0.95rem', marginBottom: '10px', display: 'block', transition: 'color 0.3s ease' }}>
                  Steps to Reproduce: <span style={{ color: '#DC3545' }}>*</span>
                </label>
                <textarea
                  name="stepsToReproduce"
                  value={formData.stepsToReproduce}
                  onChange={handleInputChange}
                  className="form-control bug-report-textarea"
                  placeholder="Provide step-by-step instructions to reproduce the bug"
                  rows="5"
                  required
                  style={{
                    backgroundColor: theme.statsCardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                    transition: 'all 0.3s ease',
                    padding: '15px',
                    borderRadius: '6px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Two Column Section */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
                {/* Expected Behavior */}
                <div style={{ flex: 1 }}>
                  <label style={{ color: theme.textPrimary, fontSize: '0.95rem', marginBottom: '10px', display: 'block', transition: 'color 0.3s ease' }}>
                    Expected Behavior: <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <textarea
                    name="expectedBehavior"
                    value={formData.expectedBehavior}
                    onChange={handleInputChange}
                    className="form-control bug-report-textarea"
                    placeholder="What should happen?"
                    rows="6"
                    required
                    style={{
                      backgroundColor: theme.statsCardBg,
                      border: `1px solid ${theme.border}`,
                      color: theme.textPrimary,
                      transition: 'all 0.3s ease',
                      padding: '15px',
                      borderRadius: '6px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Actual Behavior */}
                <div style={{ flex: 1 }}>
                  <label style={{ color: theme.textPrimary, fontSize: '0.95rem', marginBottom: '10px', display: 'block', transition: 'color 0.3s ease' }}>
                    Actual Behavior: <span style={{ color: '#DC3545' }}>*</span>
                  </label>
                  <textarea
                    name="actualBehavior"
                    value={formData.actualBehavior}
                    onChange={handleInputChange}
                    className="form-control bug-report-textarea"
                    placeholder="What actually happens?"
                    rows="6"
                    required
                    style={{
                      backgroundColor: theme.statsCardBg,
                      border: `1px solid ${theme.border}`,
                      color: theme.textPrimary,
                      transition: 'all 0.3s ease',
                      padding: '15px',
                      borderRadius: '6px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* File Upload for Screenshots/Evidence */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ color: theme.textPrimary, fontSize: '0.95rem', marginBottom: '10px', display: 'block', transition: 'color 0.3s ease' }}>
                  Attach Screenshots or Evidence (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: '#2A2A2A',
                    border: '2px dashed #4ECDC4',
                    color: '#4ECDC4',
                    padding: '15px 25px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(78, 205, 196, 0.1)';
                    e.target.style.borderColor = '#5EDDD4';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = theme.statsCardBg;
                    e.target.style.borderColor = '#4ECDC4';
                  }}
                >
                  📎 Choose Files (Max 5 files, 10MB each)
                </label>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.85rem',
                  marginTop: '8px',
                  marginBottom: 0
                }}>
                  Supported formats: Images (JPG, PNG, GIF, WebP), Videos (MP4, WebM), PDF
                </p>

                {/* Display selected files */}
                {attachments.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'rgba(78, 205, 196, 0.1)',
                          border: '1px solid rgba(78, 205, 196, 0.3)',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          marginBottom: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '1.5rem' }}>
                            {file.type.startsWith('image/') ? '🖼️' :
                             file.type.startsWith('video/') ? '🎥' : '📄'}
                          </span>
                          <div>
                            <p style={{
                              color: theme.textPrimary,
                              margin: 0,
                              fontSize: '0.9rem',
                              fontWeight: '500',
                              transition: 'color 0.3s ease'
                            }}>
                              {file.name}
                            </p>
                            <p style={{
                              color: theme.textMuted,
                              margin: 0,
                              fontSize: '0.8rem',
                              transition: 'color 0.3s ease'
                            }}>
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#DC3545',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'rgba(220, 53, 69, 0.2)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Severity Selection */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ color: theme.textPrimary, fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.3s ease' }}>
                  Severity: <span style={{ color: '#DC3545' }}>*</span>
                  <button
                    type="button"
                    onClick={() => setShowSeverityGuide(true)}
                    style={{
                      background: 'rgba(78, 205, 196, 0.2)',
                      border: '1px solid rgba(78, 205, 196, 0.4)',
                      color: '#4ECDC4',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
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
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                  style={{
                    backgroundColor: theme.statsCardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                    transition: 'all 0.3s ease',
                    padding: '10px 15px',
                    borderRadius: '6px'
                  }}
                >
                  <option value="minor">Minor - {project ? project.bugRewards?.minor || 0 : 0} credits</option>
                  <option value="major">Major - {project ? project.bugRewards?.major || 0 : 0} credits</option>
                  <option value="critical">Critical - {project ? project.bugRewards?.critical || 0 : 0} credits</option>
                </select>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.85rem',
                  marginTop: '8px',
                  marginBottom: 0
                }}>
                  Not sure which severity to choose? Click the ℹ icon for guidelines
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onBack}
                  style={{
                    background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 32px',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(108, 117, 125, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px) scale(1.05)';
                    e.target.style.boxShadow = '0 6px 20px rgba(108, 117, 125, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = '0 4px 15px rgba(108, 117, 125, 0.4)';
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || loading}
                  style={{
                    background: submitLoading ?
                      'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)' :
                      'linear-gradient(135deg, #DC3545 0%, #C82333 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 32px',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: submitLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: submitLoading ?
                      '0 4px 15px rgba(108, 117, 125, 0.4)' :
                      '0 4px 15px rgba(220, 53, 69, 0.4)',
                    opacity: submitLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!submitLoading) {
                      e.target.style.transform = 'translateY(-2px) scale(1.05)';
                      e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitLoading) {
                      e.target.style.transform = 'translateY(0) scale(1)';
                      e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.4)';
                    }
                  }}
                >
                  {submitLoading ? 'SUBMITTING...' : 'SUBMIT REPORT'}
                </button>
              </div>
            </form>
          </div>
        </div>

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

        {/* Severity Guide Modal */}
        {showSeverityGuide && (
          <SeverityGuideModal onClose={() => setShowSeverityGuide(false)} />
        )}
        </div>
      </div>
    </div>
    </>
  );
}

export default BugReport;