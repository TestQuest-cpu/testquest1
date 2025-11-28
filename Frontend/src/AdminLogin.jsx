import React, { useState, useEffect } from "react";

// CSS animations as JavaScript objects
const fadeInUp = {
  animation: 'fadeInUp 0.8s ease-out'
};

const fadeInLeft = {
  animation: 'fadeInLeft 0.8s ease-out'
};

const fadeInRight = {
  animation: 'fadeInRight 0.8s ease-out 0.2s both'
};

const pulseAnimation = {
  animation: 'pulse 2s infinite'
};

const slideInScale = {
  animation: 'slideInScale 0.6s ease-out'
};

// CSS keyframes
const keyframes = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
  }
}

@keyframes slideInScale {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.loading-shimmer {
  position: relative;
  overflow: hidden;
}

.loading-shimmer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 1.5s infinite;
}
`;

function AdminLogin({ onAdminLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Add keyframes to document head and check mobile
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      document.head.removeChild(style);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)}/api/admin?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.code === 'ACCOUNT_LOCKED') {
          throw new Error('Account locked due to multiple failed attempts. Please contact a super admin.');
        } else if (data.code === 'ACCOUNT_DEACTIVATED') {
          throw new Error('Admin account has been deactivated. Please contact a super admin.');
        } else if (data.code === 'RATE_LIMIT_EXCEEDED') {
          throw new Error('Too many login attempts. Please wait 15 minutes before trying again.');
        } else {
          throw new Error(data.message || 'Authentication failed');
        }
      }

      // Store admin token separately from user tokens
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.admin));

      // Navigate to admin dashboard
      onAdminLogin();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh', 
      backgroundColor: '#0E0F15',
      overflow: isMobile ? 'auto' : 'hidden'
    }}>
      {/* Left Panel */}
      <div style={{ 
        width: isMobile ? '100%' : '40%', 
        minHeight: isMobile ? '200px' : 'auto',
        backgroundColor: '#1F1F1F',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '30px 20px' : '40px',
        color: 'white',
        borderRight: !isMobile ? '1px solid #2A2A2A' : 'none',
        ...(!isMobile ? fadeInLeft : {})
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.8rem' : '2.5rem', 
          fontWeight: 'bold',
          marginBottom: isMobile ? '15px' : '30px',
          letterSpacing: isMobile ? '2px' : '3px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'Sansita, sans-serif'
        }}>
          ADMIN ACCESS
        </h1>
        
        <p style={{ 
          fontSize: isMobile ? '0.9rem' : '1rem', 
          marginBottom: isMobile ? '25px' : '50px',
          opacity: 0.9,
          textAlign: 'center',
          maxWidth: '300px',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          Secure administrative portal for TestQuest platform management
        </p>

        {!isMobile && (
          <div style={{ width: '100%', maxWidth: '350px' }}>
            <div style={{textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.95rem', fontFamily: 'DM Sans, sans-serif', color: 'rgba(255, 255, 255, 0.7)', }}>Enhanced security protocols</span>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.95rem', fontFamily: 'DM Sans, sans-serif', color: 'rgba(255, 255, 255, 0.7)', }}>Role-based access control</span>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.95rem', fontFamily: 'DM Sans, sans-serif', color: 'rgba(255, 255, 255, 0.7)', }}>Comprehensive audit logging</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div style={{ 
        width: isMobile ? '100%' : '60%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: isMobile ? 'flex-start' : 'center',
        padding: isMobile ? '20px' : '40px',
        paddingTop: isMobile ? '30px' : '40px',
        ...(!isMobile ? fadeInRight : {})
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: isMobile ? '100%' : '450px',
          ...(!isMobile ? slideInScale : {})
        }}>
          <div style={{ 
            textAlign: 'center',
            marginBottom: isMobile ? '30px' : '40px'
          }}>
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold',
              marginBottom: '10px',
              color: 'white',
              fontFamily: 'Sansita, sans-serif'
            }}>
              Administrator Login
            </h2>
            
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.95rem',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              Enter your administrative credentials
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              color: '#FF6B6B',
              padding: '12px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              textAlign: 'left',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '500',
                fontFamily: 'DM Sans, sans-serif'
              }}>
                Username or Email
              </label>
              <input
                type="text"
                placeholder="Enter admin username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #2A2A2A',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: '#1F1F1F',
                  color: 'white',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2A2A2A';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '500',
                fontFamily: 'DM Sans, sans-serif'
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #2A2A2A',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: '#1F1F1F',
                  color: 'white',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2A2A2A';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className={loading ? 'loading-shimmer' : ''}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#2A2A2A' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '600',
                fontFamily: 'Sansita, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: '20px',
                position: 'relative',
                overflow: 'hidden',
                transform: loading ? 'scale(0.98)' : 'scale(1)',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
                ...(loading ? {} : pulseAnimation)
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'scale(1.02) translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Authenticating...
                </div>
              ) : (
                'Sign In as Admin'
              )}
            </button>
          </form>

          {/* Warning Notice */}
          <div style={{
            backgroundColor: 'rgba(253, 187, 45, 0.1)',
            border: '1px solid rgba(253, 187, 45, 0.3)',
            color: '#FDBB2D',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            textAlign: 'center',
            marginTop: '20px',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            ⚠️ This is a secure administrative area. All access attempts are logged and monitored.
          </div>

          {/* Back to Main Site */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <a 
              href="/"
              style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}
            >
              ← Back to TestQuest
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;