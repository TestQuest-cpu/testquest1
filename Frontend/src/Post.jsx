import React, { useState, useEffect } from "react";
import PayPalPayment from './PayPalPayment';
import SeverityGuideModal from './SeverityGuideModal';
import { getDeveloperTheme } from './themeConfig';

function Post({ onBack, onProfile }) {
  const [isLightMode, setIsLightMode] = useState(localStorage.getItem('developerLightMode') === 'true');
  const theme = getDeveloperTheme(isLightMode);

  useEffect(() => {
    const handleThemeChange = () => {
      setIsLightMode(localStorage.getItem('developerLightMode') === 'true');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    scope: '',
    objective: '',
    areasToTest: '',
    bugRewards: {
      critical: '',
      major: '',
      minor: ''
    },
    totalBounty: '',
    notes: '',
    projectLink: '',
    image: '',
    acceptedTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [projectCreated, setProjectCreated] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showSeverityGuide, setShowSeverityGuide] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested bugRewards fields
    if (name.startsWith('bugRewards.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bugRewards: {
          ...prev.bugRewards,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for raw file
        setError('Image size should be less than 2MB to avoid server limits');
        return;
      }
      
      // Create a canvas to resize/compress the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxDimension = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        
        // Check final size (base64 is ~1.37x larger than binary)
        const sizeInBytes = (compressedDataUrl.length * 3) / 4;
        if (sizeInBytes > 1.5 * 1024 * 1024) { // 1.5MB limit for base64
          setError('Image is too large even after compression. Please use a smaller image.');
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          image: compressedDataUrl
        }));
      };
      
      img.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.acceptedTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to post a project');
        setLoading(false);
        return;
      }

      // Validate form data before proceeding to payment
      if (!formData.name || !formData.platform || !formData.scope || !formData.objective ||
          !formData.areasToTest || !formData.totalBounty || !formData.projectLink) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate minimum budget
      if (parseFloat(formData.totalBounty) < 20) {
        setError('Minimum project budget is $20');
        setLoading(false);
        return;
      }

      // Store project data for payment - project will be created during payment process
      setProjectCreated({
        ...formData,
        _id: 'temp-' + Date.now() // temporary ID for payment
      });
      setShowPayment(true);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    setPaymentCompleted(true);
    setSuccess(true);
    setTimeout(() => {
      onBack();
    }, 2000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    setError('Payment failed: ' + error.message);
  };

  const handlePaymentCancel = (data) => {
    console.log('Payment cancelled:', data);
    setError('Payment was cancelled. You can retry payment or go back to edit your project.');
  };
  return (
    <>
      <style>
        {`
          .post-input::placeholder {
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
            }}>Leaderboards</button>
          </nav>
          
          <div className="d-flex align-items-center gap-3">
            <button style={{
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

      {/* Main Content */}
      <div style={{ padding: '0px 30px 40px 30px' }}>
        {/* Page Title */}
        <div className="mb-5">
          <h1 style={{
            color: theme.textPrimary,
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '8px',
            fontFamily: 'Sansita, sans-serif',
            transition: 'color 0.3s ease'
          }}>Post New Project</h1>
          <p style={{
            color: theme.textSecondary,
            fontSize: '1.1rem',
            marginBottom: 0,
            fontFamily: 'DM Sans, sans-serif',
            transition: 'color 0.3s ease'
          }}>Create a new security testing project for the community</p>
        </div>

        {/* Centered Container */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '25px',
          '@media (max-width: 1024px)': {
            flexDirection: 'column',
            gap: '20px'
          }
        }}>

        {/* Left Column */}
        <div style={{ flex: '1', minWidth: '0' }}>
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '20px',
            border: `1px solid ${theme.border}`,
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}>
            {/* Project Name Section */}
            <div className="mb-4">
              <label className="form-label mb-2" style={{ fontSize: '1rem', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Project Name:</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-control"
                style={{
                  backgroundColor: theme.statsCardBg,
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary,
                  height: '48px',
                  borderRadius: '12px',
                  padding: '0 18px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4ECDC4';
                  e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.border;
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }}
                required
              />
            </div>

            {/* Project Details Card */}
            <div className="mb-4" style={{
              background: theme.statsCardBg,
              borderRadius: '12px',
              border: `1px solid ${theme.border}`,
              padding: '16px',
              transition: 'all 0.3s ease'
            }}>
              <div className="d-flex align-items-start mb-3">
                <div 
                  className="rounded me-3" 
                  style={{
                    width: '140px',
                    height: '140px',
                    backgroundColor: theme.cardBackground,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: `2px dashed ${theme.border}`,
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onClick={() => document.getElementById('imageUpload').click()}
                  onMouseEnter={(e) => {
                    if (!formData.image) {
                      e.target.style.borderColor = '#4ECDC4';
                      e.target.style.backgroundColor = theme.buttonDarkHover;
                      e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!formData.image) {
                      e.target.style.borderColor = theme.border;
                      e.target.style.backgroundColor = theme.cardBackground;
                      e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                >
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  {formData.image ? (
                    <img 
                      src={formData.image} 
                      alt="Project preview" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        borderRadius: '6px'
                      }} 
                    />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-cloud-upload" viewBox="0 0 16 16" style={{ color: '#6c757d', position: 'absolute' }}>
                        <path fillRule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0a5.53 5.53 0 0 1 3.594 1.342 4.5 4.5 0 0 1 1.106 8.4A3 3 0 0 1 12.5 16h-9A3 3 0 0 1 .5 13a3 3 0 0 1 2.406-2.942c.017-.15.041-.3.069-.449a6.5 6.5 0 0 1 1.431-3.267zm3.086 2.178L7 4.5l.414-.914 1-1a.5.5 0 0 1 .672-.086l.5.5a.5.5 0 0 1 0 .707L8.5 5l.5.5a.5.5 0 0 1 0 .707l-.5.5a.5.5 0 0 1-.707 0L7 6l-.793.707a.5.5 0 0 1-.707 0l-.5-.5a.5.5 0 0 1 0-.707L6 5l-.5-.5a.5.5 0 0 1 0-.707l.5-.5a.5.5 0 0 1 .672-.086l.414.414z"/>
                        <path d="M10.5 8.5a.5.5 0 0 1-.5.5h-2.5V11a.5.5 0 0 1-1 0V9H4a.5.5 0 0 1 0-1h2.5V6.5a.5.5 0 0 1 1 0V8H10a.5.5 0 0 1 .5.5z"/>
                      </svg>
                    </>
                  )}
                </div>
                <div className="flex-grow-1">
                  <div className="mb-2">
                    <label style={{ fontSize: '0.9rem', color: theme.textPrimary, display: 'block', marginBottom: '4px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                      <strong>Posted by:</strong>
                    </label>
                    <input
                      type="text"
                      value={(() => {
                        try {
                          const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
                          return user.name || 'Current User';
                        } catch {
                          return 'Current User';
                        }
                      })()}
                      className="form-control"
                      style={{ 
                        backgroundColor: '#2A2D31', 
                        height: '32px',
                        borderRadius: '4px',
                        border: '1px solid #404040',
                        color: '#E0E0E0',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      }}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="mb-2">
                    <label style={{ fontSize: '0.9rem', color: theme.textPrimary, display: 'block', marginBottom: '4px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                      <strong>Platform:</strong>
                    </label>
                    <input
                      type="text"
                      name="platform"
                      value={formData.platform}
                      onChange={handleInputChange}
                      className="form-control"
                      style={{
                        backgroundColor: theme.statsCardBg,
                        border: `1px solid ${theme.border}`,
                        color: theme.textPrimary,
                        height: '48px',
                        borderRadius: '12px',
                        padding: '0 18px',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4ECDC4';
                        e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme.border;
                        e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: theme.textPrimary, display: 'block', marginBottom: '4px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                      <strong>Scope:</strong>
                    </label>
                    <textarea
                      name="scope"
                      value={formData.scope}
                      onChange={handleInputChange}
                      className="form-control"
                      style={{
                        backgroundColor: theme.statsCardBg,
                        border: `1px solid ${theme.border}`,
                        color: theme.textPrimary,
                        height: '96px',
                        borderRadius: '12px',
                        padding: '18px',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        resize: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#4ECDC4';
                        e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme.border;
                        e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <label className="form-label mb-2" style={{
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: theme.textPrimary,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'color 0.3s ease'
                }}>
                  Project URL:
                </label>
                <input
                  type="url"
                  name="projectLink"
                  value={formData.projectLink}
                  onChange={handleInputChange}
                  placeholder="https://your-project-url.com"
                  className="form-control post-input"
                  style={{
                    backgroundColor: theme.statsCardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                    height: '48px',
                    borderRadius: '12px',
                    padding: '0 18px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    fontFamily: 'DM Sans, sans-serif'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4ECDC4';
                    e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.border;
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                  }}
                  required
                />
              </div>
            </div>

            {/* Objective Section */}
            <div className="mb-3">
              <label className="form-label mb-2" style={{ fontSize: '1rem', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Objective:</label>
              <textarea
                name="objective"
                value={formData.objective}
                onChange={handleInputChange}
                className="form-control"
                style={{
                  backgroundColor: theme.statsCardBg,
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary,
                  height: '120px',
                  borderRadius: '12px',
                  padding: '18px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  resize: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4ECDC4';
                  e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.border;
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }}
                required
              />
            </div>

            {/* Areas to Test Section */}
            <div className="mb-0">
              <label className="form-label mb-2" style={{ fontSize: '1rem', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Areas to Test:</label>
              <textarea
                name="areasToTest"
                value={formData.areasToTest}
                onChange={handleInputChange}
                className="form-control"
                style={{
                  backgroundColor: theme.statsCardBg,
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary,
                  height: '120px',
                  borderRadius: '12px',
                  padding: '18px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  resize: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4ECDC4';
                  e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.border;
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }}
                required
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ flex: '1', minWidth: '0' }}>
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '20px',
            border: `1px solid ${theme.border}`,
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}>
            {/* Bug Severity Reward Breakdown */}
            <div className="mb-3">
              <label className="form-label mb-2" style={{ fontSize: '1rem', fontWeight: '500', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.3s ease' }}>
                Bug Severity Reward Breakdown (in Credits):
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

              <div className="mb-2">
                <label style={{ fontSize: '0.9rem', color: theme.textPrimary, display: 'block', marginBottom: '4px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                  <strong>Critical Bug Reward (Credits):</strong>
                </label>
                <input
                  type="number"
                  name="bugRewards.critical"
                  value={formData.bugRewards.critical}
                  onChange={handleInputChange}
                  placeholder="500"
                  min="0"
                  step="100"
                  className="form-control post-input"
                  style={{
                    backgroundColor: theme.statsCardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                    height: '48px',
                    borderRadius: '12px',
                    padding: '0 18px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4ECDC4';
                    e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.border;
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                  }}
                />
              </div>

              <div className="mb-2">
                <label style={{ fontSize: '0.9rem', color: theme.textPrimary, display: 'block', marginBottom: '4px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                  <strong>Major Bug Reward (Credits):</strong>
                </label>
                <input
                  type="number"
                  name="bugRewards.major"
                  value={formData.bugRewards.major}
                  onChange={handleInputChange}
                  placeholder="200"
                  min="0"
                  step="100"
                  className="form-control post-input"
                  style={{
                    backgroundColor: theme.statsCardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                    height: '48px',
                    borderRadius: '12px',
                    padding: '0 18px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4ECDC4';
                    e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.border;
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                  }}
                />
              </div>

              <div className="mb-2">
                <label style={{ fontSize: '0.9rem', color: theme.textPrimary, display: 'block', marginBottom: '4px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                  <strong>Minor Bug Reward (Credits):</strong>
                </label>
                <input
                  type="number"
                  name="bugRewards.minor"
                  value={formData.bugRewards.minor}
                  onChange={handleInputChange}
                  placeholder="50"
                  min="0"
                  step="100"
                  className="form-control post-input"
                  style={{
                    backgroundColor: theme.statsCardBg,
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                    height: '48px',
                    borderRadius: '12px',
                    padding: '0 18px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4ECDC4';
                    e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme.border;
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                  }}
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="mb-3">
              <label className="form-label mb-2" style={{ fontSize: '1rem', fontWeight: '500', color: theme.textPrimary, marginTop: '45px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>Notes:</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="form-control"
                style={{
                  backgroundColor: theme.statsCardBg,
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary,
                  height: '80px',
                  borderRadius: '12px',
                  padding: '18px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  resize: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4ECDC4';
                  e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.border;
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }}
              />
            </div>

            {/* Enter Total Budget */}
            <div className="mb-3">
              <label className="form-label mb-2" style={{ fontSize: '1rem', fontWeight: '500', color: theme.textPrimary, marginTop: '45px', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                Enter Total Budget: <span style={{ color: theme.textMuted, fontSize: '0.85rem' }}>(Minimum $20)</span>
              </label>
              <input
                type="number"
                name="totalBounty"
                value={formData.totalBounty}
                onChange={handleInputChange}
                min="20"
                step="0.01"
                placeholder="20.00"
                className="form-control"
                style={{
                  backgroundColor: theme.statsCardBg,
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary,
                  height: '48px',
                  borderRadius: '12px',
                  padding: '0 18px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4ECDC4';
                  e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.border;
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }}
                required
              />

              {/* Fee Breakdown Display */}
              {formData.totalBounty && parseFloat(formData.totalBounty) >= 20 && (
                <div style={{
                  backgroundColor: 'rgba(78, 205, 196, 0.1)',
                  border: '1px solid rgba(78, 205, 196, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginTop: '12px',
                  fontFamily: 'DM Sans, sans-serif'
                }}>
                  <div style={{ color: '#4ECDC4', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px' }}>
                    💰 Fee Breakdown
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textSecondary }}>
                      <span>Total Budget:</span>
                      <span style={{ fontWeight: '600', color: theme.textPrimary }}>${parseFloat(formData.totalBounty).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textSecondary }}>
                      <span>Platform Fee (15%):</span>
                      <span style={{ fontWeight: '600', color: '#FF6B6B' }}>
                        -${(parseFloat(formData.totalBounty) * 0.15).toFixed(2)}
                      </span>
                    </div>
                    <div style={{
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      margin: '4px 0'
                    }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ECDC4', fontWeight: '600' }}>
                      <span>Bounty Pool (85%):</span>
                      <span>${(parseFloat(formData.totalBounty) * 0.85).toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: 'rgba(78, 205, 196, 0.05)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: '1.4'
                  }}>
                    ℹ️ The bounty pool is the amount available for bug rewards. The 15% platform fee helps us maintain and improve TestQuest.
                  </div>
                </div>
              )}

              {formData.totalBounty && parseFloat(formData.totalBounty) < 20 && (
                <div style={{
                  marginTop: '8px',
                  color: '#FF6B6B',
                  fontSize: '0.85rem',
                  fontFamily: 'DM Sans, sans-serif'
                }}>
                  ⚠️ Minimum budget is $20
                </div>
              )}
            </div>

            {/* Checkbox */}
            <div className="d-flex align-items-center mb-3">
              <input
                type="checkbox"
                name="acceptedTerms"
                checked={formData.acceptedTerms}
                onChange={handleInputChange}
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: theme.statsCardBg,
                  borderRadius: '3px',
                  marginRight: '8px',
                  cursor: 'pointer'
                }}
                required
              />
              <label style={{ fontSize: '0.8rem', color: theme.textPrimary, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.3s ease' }}>
                I confirm that I have read and accept the terms and conditions and privacy policy.
              </label>
            </div>

            <div style={{ background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px', color: '#FF6B6B', fontSize: '0.85rem', lineHeight: '1.5', fontFamily: 'DM Sans, sans-serif' }}>
              <strong>Important:</strong> Projects rejected due to policy violations, prohibited content, or deliberately incomplete information will incur a $2 non-refundable processing fee deducted from your account balance.
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div style={{
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                color: '#FF6B6B',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'DM Sans, sans-serif'
              }}>
                ⚠️ {error}
              </div>
            )}
            
            {success && (
              <div style={{
                background: 'rgba(78, 205, 196, 0.1)',
                border: '1px solid rgba(78, 205, 196, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                color: '#4ECDC4',
                fontSize: '0.9rem'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  ✅ Project submitted successfully!
                </div>
                <div style={{ 
                  fontSize: '0.85rem',
                  opacity: 0.9,
                  lineHeight: '1.4'
                }}>
                  Your project has been submitted for admin review. You'll receive notification once it's approved and goes live.
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || success}
              className="btn w-100"
              style={{
                background: loading || success ?
                  'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)' :
                  'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                color: 'white',
                fontWeight: '600',
                fontSize: '1.1rem',
                height: '56px',
                borderRadius: '14px',
                marginTop: '32px',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                boxShadow: loading || success ?
                  '0 4px 15px rgba(108, 117, 125, 0.4)' :
                  '0 6px 20px rgba(78, 205, 196, 0.4)',
                transition: 'all 0.3s ease',
                fontFamily: 'Sansita, sans-serif'
              }}
              onMouseEnter={(e) => {
                if (!loading && !success) {
                  e.target.style.transform = 'translateY(-2px) scale(1.02)';
                  e.target.style.boxShadow = '0 8px 25px rgba(78, 205, 196, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !success) {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 6px 20px rgba(78, 205, 196, 0.4)';
                }
              }}
            >
              {loading ? 'Creating Project...' : success ? '✅ Success!' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* PayPal Payment Modal */}
      {showPayment && projectCreated && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(14, 15, 21, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)'
          }}>
            {/* Payment Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{
                color: 'white',
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'Sansita, sans-serif'
              }}>
                Complete Your Payment
              </h2>
              <div style={{
                background: 'rgba(102, 126, 234, 0.1)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '28px'
              }}>
                <h4 style={{
                  color: '#667eea',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  marginBottom: '12px',
                  fontFamily: 'Sansita, sans-serif'
                }}>
                  Project Created Successfully! ✅
                </h4>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem',
                  marginBottom: 0,
                  lineHeight: '1.5',
                  fontFamily: 'DM Sans, sans-serif'
                }}>
                  Your project <strong>"{projectCreated.name}"</strong> has been created.
                  Complete the payment below to fund your bounty and activate the project.
                </p>
              </div>
            </div>

            {/* Payment Component */}
            <PayPalPayment
              totalBounty={formData.totalBounty}
              projectData={projectCreated}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />

            {/* Error Display in Payment Modal */}
            {error && (
              <div style={{
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '20px',
                color: '#FF6B6B',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Success Display in Payment Modal */}
            {paymentCompleted && (
              <div style={{
                background: 'rgba(102, 126, 234, 0.1)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                marginTop: '24px',
                color: '#667eea',
                fontSize: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <div style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '12px',
                  fontFamily: 'Sansita, sans-serif'
                }}>
                  Payment Successful!
                </div>
                <div style={{
                  fontSize: '1rem',
                  opacity: 0.9,
                  lineHeight: '1.5',
                  fontFamily: 'DM Sans, sans-serif'
                }}>
                  Your project is now funded and will be reviewed by our admin team.
                  You'll receive notification once it's approved and goes live for testing.
                </div>
              </div>
            )}

            {/* Modal Actions */}
            {!paymentCompleted && (
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                marginTop: '32px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '24px'
              }}>
                <button
                  onClick={() => {
                    setShowPayment(false);
                    setError('');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '14px 28px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  ← Back to Edit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Severity Guide Modal */}
      {showSeverityGuide && (
        <SeverityGuideModal onClose={() => setShowSeverityGuide(false)} />
      )}
    </div>
    </>
  );
}

export default Post;