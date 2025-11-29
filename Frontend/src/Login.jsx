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

const bounceIn = {
  animation: 'bounceIn 1s ease-out'
};

const pulseAnimation = {
  animation: 'pulse 2s infinite'
};

const slideInScale = {
  animation: 'slideInScale 0.6s ease-out'
};

// CSS keyframes (we'll add these as a style tag)
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

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-10deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.1) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(124, 58, 237, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
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

@keyframes fadeInContent {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOutContent {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
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

.content-transition {
  animation: fadeInContent 0.4s ease-out;
}
`;

function Login({ onLoginAsTester, onLoginAsDeveloper, onModeratorAccess }) {
  const [activeTab, setActiveTab] = useState('login');
  const [accountType, setAccountType] = useState('tester');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Add keyframes to document head and check mobile
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    
    // Add viewport meta tag if not exists
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(viewportMeta);
    }
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Trigger entrance animations
    setIsVisible(true);
    
    return () => {
      document.head.removeChild(style);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Check for OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');

    if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Navigate based on account type
        if (user.accountType === 'tester') {
          onLoginAsTester();
        } else {
          onLoginAsDeveloper();
        }
      } catch (error) {
        setError('OAuth login failed. Please try again.');
      }
    }
  }, [onLoginAsTester, onLoginAsDeveloper]);

  // Handle tab switching with smooth transitions
  const handleTabSwitch = (newTab) => {
    if (newTab === activeTab) return;
    
    setIsTransitioning(true);
    
    // Short delay to allow fade out, then switch content
    setTimeout(() => {
      setActiveTab(newTab);
      setError(''); // Clear any errors when switching tabs
      // Reset form fields when switching tabs
      setEmail('');
      setPassword('');
      setName('');
    }, 200);
    
    // Re-enable transitions after content change
    setTimeout(() => {
      setIsTransitioning(false);
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = activeTab === 'login' ? '/api/auth?action=login' : '/api/auth?action=register';
      const body = activeTab === 'login'
        ? { email, password, accountType }
        : { name, email, password, accountType };

      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);
      const fullUrl = `${apiUrl}${endpoint}`;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      let data;
      const responseText = await response.text();

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, the response is likely HTML/text
        console.error('Failed to parse JSON response:', responseText);

        // Check if it's a typical server error page
        if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
          throw new Error('Server configuration error. Please contact support.');
        } else {
          throw new Error(`Server error: ${responseText.substring(0, 100)}...`);
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Handle signup differently - no token/user returned, just email sent
      if (activeTab === 'signup') {
        setError(''); // Clear any errors
        alert(`Success! Check your email (${email}) to complete account creation.`);
        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        return;
      }

      // Login flow - store token and navigate
      if (rememberMe) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }

      // Navigate based on account type
      if (data.user.accountType === 'tester') {
        onLoginAsTester();
      } else {
        onLoginAsDeveloper();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);
    window.location.href = `${baseUrl}/api/auth/${provider}`;
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      overflow: isMobile ? 'auto' : 'hidden'
    }}>
      {/* Left Panel */}
      <div style={{ 
        width: isMobile ? '100%' : '40%', 
        minHeight: isMobile ? '200px' : 'auto',
        backgroundColor: '#0E1420',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '30px 20px' : '40px',
        color: 'white',
        ...(!isMobile ? fadeInLeft : {})
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '2rem' : '3rem', 
          fontWeight: 'bold',
          marginBottom: isMobile ? '15px' : '30px',
          letterSpacing: isMobile ? '2px' : '3px',
          textAlign: 'center',
          background: 'linear-gradient(45deg, #00D4FF, #00FF88)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          TESTQUEST
        </h1>
        
        <p style={{ 
          fontSize: isMobile ? '0.9rem' : '1rem', 
          marginBottom: isMobile ? '25px' : '50px',
          opacity: 0.9,
          textAlign: 'center'
        }}>
          Secure the digital world, one bug at a time
        </p>

        {!isMobile && (
          <div style={{ width: '100%', maxWidth: '350px' }}>
            <div style={{ alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.95rem', opacity: 0.8 }}>Enterprise-grade security testing</span>
            </div>
            
            <div style={{ alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.95rem', opacity: 0.8 }}>Connect with top security researchers</span>
            </div>
            
            <div style={{ alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', opacity: 0.8 }}>Competitive rewards and recognition</span>
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
          {/* Tab Buttons */}
          <div style={{ 
            display: 'flex', 
            marginBottom: isMobile ? '30px' : '40px', 
            justifyContent: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => handleTabSwitch('login')}
              style={{
                padding: '10px 30px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'login' ? '2px solid #7C3AED' : '2px solid transparent',
                color: activeTab === 'login' ? '#333' : '#999',
                fontSize: '1rem',
                fontWeight: activeTab === 'login' ? '600' : '400',
                cursor: 'pointer',
                marginRight: '40px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: activeTab === 'login' ? 'scale(1.05)' : 'scale(1)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'login') {
                  e.target.style.transform = 'scale(1.02) translateY(-1px)';
                  e.target.style.color = '#666';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'login') {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.color = '#999';
                }
              }}
            >
              Login
            </button>
            <button
              onClick={() => handleTabSwitch('signup')}
              style={{
                padding: '10px 30px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'signup' ? '2px solid #7C3AED' : '2px solid transparent',
                color: activeTab === 'signup' ? '#333' : '#999',
                fontSize: '1rem',
                fontWeight: activeTab === 'signup' ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: activeTab === 'signup' ? 'scale(1.05)' : 'scale(1)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'signup') {
                  e.target.style.transform = 'scale(1.02) translateY(-1px)';
                  e.target.style.color = '#666';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'signup') {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.color = '#999';
                }
              }}
            >
              Sign Up
            </button>
          </div>

          <div 
            className="content-transition"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
              transition: 'all 0.3s ease-out'
            }}
          >
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '10px',
              color: '#333'
            }}>
              {activeTab === 'login' ? 'Welcome back' : 'Create Account'}
            </h2>
            
            <p style={{ 
              textAlign: 'center',
              color: '#666',
              marginBottom: '30px',
              fontSize: '0.95rem'
            }}>
              Choose your account type to continue
            </p>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            {/* Account Type Selection */}
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '10px' : '15px', 
              marginBottom: '30px'
            }}>
              <button
              onClick={() => setAccountType('tester')}
              style={{
                flex: 1,
                padding: isMobile ? '12px' : '15px',
                backgroundColor: accountType === 'tester' ? '#F3F0FF' : 'white',
                border: accountType === 'tester' ? '2px solid #7C3AED' : '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: accountType === 'tester' ? 'scale(1.02) translateY(-2px)' : 'scale(1)',
                boxShadow: accountType === 'tester' ? '0 8px 25px rgba(124, 58, 237, 0.15)' : '0 2px 10px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02) translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.15)';
              }}
              onMouseLeave={(e) => {
                if (accountType !== 'tester') {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                }
              }}
            >
              <span style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🔍</span>
              <span style={{ 
                fontWeight: '600',
                color: accountType === 'tester' ? '#7C3AED' : '#666'
              }}>
                Tester
              </span>
              <span style={{ fontSize: '0.8rem', color: '#999' }}>Find and report bugs</span>
            </button>
            
            <button
              onClick={() => setAccountType('developer')}
              style={{
                flex: 1,
                padding: isMobile ? '12px' : '15px',
                backgroundColor: accountType === 'developer' ? '#F3F0FF' : 'white',
                border: accountType === 'developer' ? '2px solid #7C3AED' : '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: accountType === 'developer' ? 'scale(1.02) translateY(-2px)' : 'scale(1)',
                boxShadow: accountType === 'developer' ? '0 8px 25px rgba(124, 58, 237, 0.15)' : '0 2px 10px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02) translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.15)';
              }}
              onMouseLeave={(e) => {
                if (accountType !== 'developer') {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                }
              }}
            >
              <span style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{'</>'}</span>
              <span style={{ 
                fontWeight: '600',
                color: accountType === 'developer' ? '#7C3AED' : '#666'
              }}>
                Developer
              </span>
              <span style={{ fontSize: '0.8rem', color: '#999' }}>Secure your apps</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Name field for signup */}
            {activeTab === 'signup' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '0.9rem',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7C3AED';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '0.9rem',
                color: '#666',
                fontWeight: '500'
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7C3AED';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '0.9rem',
                color: '#666',
                fontWeight: '500'
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7C3AED';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

          {/* Remember Me & Forgot Password */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              Remember me
            </label>
            <a href="#" style={{ 
              color: '#7C3AED',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}>
              Forgot password?
            </a>
          </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className={loading ? 'loading-shimmer' : ''}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: loading ? '#9CA3AF' : '#7C3AED',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: '20px',
                position: 'relative',
                overflow: 'hidden',
                transform: loading ? 'scale(0.98)' : 'scale(1)',
                ...(loading ? {} : pulseAnimation)
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#6B2FD6';
                  e.target.style.transform = 'scale(1.02) translateY(-1px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#7C3AED';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
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
                  Processing...
                </div>
              ) : (
                activeTab === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
            </form>

            {/* Or Continue With */}
            <div style={{ 
              textAlign: 'center',
              color: '#999',
              fontSize: '0.9rem',
              marginBottom: '20px'
            }}>
              Or continue with
            </div>

            {/* Social Login Buttons */}
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '12px' : '15px'
            }}>
              <button 
              onClick={() => handleOAuthLogin('google')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(66, 133, 244, 0.15)';
                e.target.style.borderColor = '#4285F4';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = '#e0e0e0';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
              </button>
            
              <button 
              onClick={() => handleOAuthLogin('github')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(51, 51, 51, 0.15)';
                e.target.style.borderColor = '#333';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = '#e0e0e0';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#333">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
              </button>
            </div>
          </div>
        </div>

        {/* Moderator Access Link */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <button
            onClick={() => onModeratorAccess && onModeratorAccess()}
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(102, 126, 234, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '500',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.backgroundColor = 'rgba(102, 126, 234, 1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.backgroundColor = 'rgba(102, 126, 234, 0.9)';
            }}
          >
            🛡️ Moderator Portal
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;