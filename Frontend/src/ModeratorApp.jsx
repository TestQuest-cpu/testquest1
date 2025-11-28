import React, { useState, useEffect } from 'react';
import ModeratorLogin from './ModeratorLogin';
import ModeratorDashboard from './ModeratorDashboard';

function ModeratorApp() {
  const [moderator, setModerator] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on app load
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const storedToken = localStorage.getItem('moderatorToken');
        const storedModerator = localStorage.getItem('moderatorInfo');

        if (storedToken && storedModerator) {
          // Verify token is still valid
          const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'moderator_verify'
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.valid) {
              setToken(storedToken);
              setModerator(JSON.parse(storedModerator));
            } else {
              // Token invalid, clear token but keep inModeratorMode flag
              localStorage.removeItem('moderatorToken');
              localStorage.removeItem('moderatorInfo');
              // Don't clear inModeratorMode - let them re-login
            }
          } else {
            // Token verification failed, clear token but keep inModeratorMode flag
            localStorage.removeItem('moderatorToken');
            localStorage.removeItem('moderatorInfo');
            // Don't clear inModeratorMode - let them re-login
          }
        }
      } catch (error) {
        console.error('Error checking existing auth:', error);
        // Clear token but keep inModeratorMode flag
        localStorage.removeItem('moderatorToken');
        localStorage.removeItem('moderatorInfo');
        // Don't clear inModeratorMode - let them re-login
      } finally {
        setLoading(false);
      }
    };

    checkExistingAuth();
  }, []);

  const handleLogin = (moderatorData, authToken) => {
    setModerator(moderatorData);
    setToken(authToken);
  };

  const handleLogout = () => {
    setModerator(null);
    setToken(null);
    localStorage.removeItem('moderatorToken');
    localStorage.removeItem('moderatorInfo');
    sessionStorage.removeItem('inModeratorMode');
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0E0F15'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #2A2A2A',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', color: 'white' }}>
            Loading Moderator Portal...
          </p>
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show dashboard if authenticated, otherwise show login
  return moderator && token ? (
    <ModeratorDashboard
      moderator={moderator}
      token={token}
      onLogout={handleLogout}
    />
  ) : (
    <ModeratorLogin onLogin={handleLogin} />
  );
}

export default ModeratorApp;