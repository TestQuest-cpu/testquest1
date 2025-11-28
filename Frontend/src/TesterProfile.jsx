import React, { useState, useEffect } from "react";
import { getTesterTheme } from './themeConfig';

function TesterProfile({ onBack, onLogout }) {
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

  const toggleTheme = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    localStorage.setItem('testerLightMode', newMode.toString());
    window.dispatchEvent(new Event('themeChange'));
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: theme.background, padding: '20px', transition: 'background-color 0.3s ease' }}>
      {/* Top Nav */}
      <div className="d-flex justify-content-between mb-4">
        <div>
          <button
            className="btn me-2 border-0"
            style={{ backgroundColor: theme.buttonDark, color: theme.textPrimary, padding: '10px', paddingRight: '30px', paddingLeft: '30px', fontFamily: 'Sansita', transition: 'all 0.3s ease' }}
            onClick={onBack}
          >
            Dashboard
          </button>
          <button
            className="btn border-0"
            style={{ backgroundColor: theme.buttonDark, color: theme.textPrimary, padding: '10px', paddingRight: '30px', paddingLeft: '30px', fontFamily: 'Sansita', transition: 'all 0.3s ease' }}
          >
            Leaderboards
          </button>
        </div>
        <button
          className="btn btn-outline-danger"
          onClick={onLogout}
          style={{ padding: '10px 25px' }}
        >
          Log Out
        </button>
      </div>

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
            height: '250px',
            transition: 'background-color 0.3s ease'
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: theme.statsCardBg,
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.3s ease'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" fill={theme.textMuted} viewBox="0 0 16 16">
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
              </svg>
            </div>

            <h5 style={{ color: theme.textPrimary, marginBottom: '8px', fontSize: '1.2rem', transition: 'color 0.3s ease' }}>[Name]</h5>
            <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginBottom: '20px', transition: 'color 0.3s ease' }}>Bug Tester</p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '15px'
            }}>
              <span style={{ color: '#4ECDC4', fontSize: '0.9rem' }}>● Active</span>
            </div>

            <button
              onClick={toggleTheme}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '8px 16px',
                color: 'white',
                fontSize: '0.9rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              {isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            </button>
          </div>

          {/* Role & Permissions */}
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '20px',
            transition: 'background-color 0.3s ease'
          }}>
            <h6 style={{ color: theme.textPrimary, marginBottom: '20px', fontSize: '1rem', transition: 'color 0.3s ease' }}>Role & Permissions</h6>

            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: theme.textSecondary, fontSize: '0.9rem', transition: 'color 0.3s ease' }}>Bug Testing</span>
              <span style={{ color: '#4ECDC4', fontSize: '1.3rem' }}>✓</span>
            </div>

            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: theme.textSecondary, fontSize: '0.9rem', transition: 'color 0.3s ease' }}>Project Access</span>
              <span style={{ color: '#4ECDC4', fontSize: '1.3rem' }}>✓</span>
            </div>

            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: theme.textSecondary, fontSize: '0.9rem', transition: 'color 0.3s ease' }}>Admin Panel</span>
              <span style={{ color: '#FF4757', fontSize: '1.3rem' }}>✕</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: theme.textSecondary, fontSize: '0.9rem', transition: 'color 0.3s ease' }}>User Management</span>
              <span style={{ color: '#FF4757', fontSize: '1.3rem' }}>✕</span>
            </div>
          </div>

          {/* Contact Information */}
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '12px',
            padding: '25px',
            transition: 'background-color 0.3s ease'
          }}>
            <h6 style={{ color: theme.textPrimary, marginBottom: '20px', fontSize: '1rem', transition: 'color 0.3s ease' }}>Contact Information</h6>

            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: theme.textSecondary, fontSize: '1rem', transition: 'color 0.3s ease' }}>✉</span>
              <span style={{ color: theme.textSecondary, fontSize: '0.9rem', transition: 'color 0.3s ease' }}>[email]</span>
            </div>

            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: theme.textSecondary, fontSize: '1rem', transition: 'color 0.3s ease' }}>📞</span>
              <span style={{ color: theme.textSecondary, fontSize: '0.9rem', transition: 'color 0.3s ease' }}>[phone]</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: theme.textSecondary, fontSize: '1rem', transition: 'color 0.3s ease' }}>📅</span>
              <span style={{ color: theme.textSecondary, fontSize: '0.9rem', transition: 'color 0.3s ease' }}>Joined [date]</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div style={{ flex: 1 }}>
          {/* Stats Cards */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{
              flex: 1,
              backgroundColor: theme.cardBackground,
              borderRadius: '12px',
              padding: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              height: '100px',
              transition: 'background-color 0.3s ease'
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
                <span style={{ fontSize: '1.8rem' }}>🐛</span>
              </div>
              <div>
                <div style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '5px', transition: 'color 0.3s ease' }}>Total Bugs</div>
                <div style={{ color: theme.textPrimary, fontSize: '1.8rem', fontWeight: 'bold', transition: 'color 0.3s ease' }}>0</div>
              </div>
            </div>

            <div style={{
              flex: 1,
              backgroundColor: theme.cardBackground,
              borderRadius: '12px',
              padding: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              height: '100px',
              transition: 'background-color 0.3s ease'
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
                <span style={{ fontSize: '1.8rem', color: '#4ECDC4' }}>✓</span>
              </div>
              <div>
                <div style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '5px', transition: 'color 0.3s ease' }}>Resolved</div>
                <div style={{ color: theme.textPrimary, fontSize: '1.8rem', fontWeight: 'bold', transition: 'color 0.3s ease' }}>0</div>
              </div>
            </div>

            <div style={{
              flex: 1,
              backgroundColor: theme.cardBackground,
              borderRadius: '12px',
              padding: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              height: '100px',
              transition: 'background-color 0.3s ease'
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
                <span style={{ fontSize: '1.8rem' }}>⏱️</span>
              </div>
              <div>
                <div style={{ color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '5px', transition: 'color 0.3s ease' }}>Pending</div>
                <div style={{ color: theme.textPrimary, fontSize: '1.8rem', fontWeight: 'bold', transition: 'color 0.3s ease' }}>0</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '20px',
            height: '300px',
            transition: 'background-color 0.3s ease'
          }}>
            <h6 style={{ color: theme.textPrimary, marginBottom: '25px', fontSize: '1.1rem', transition: 'color 0.3s ease' }}>Recent Activity</h6>

            <div style={{
              padding: '65px',
              textAlign: 'center',
              color: theme.textMuted,
              transition: 'color 0.3s ease'
            }}>
              No recent activity
            </div>
          </div>

          {/* Current Projects */}
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '12px',
            padding: '30px',
            height: '300px',
            transition: 'background-color 0.3s ease'
          }}>
            <h6 style={{ color: theme.textPrimary, marginBottom: '25px', fontSize: '1.1rem', transition: 'color 0.3s ease' }}>Current Projects</h6>

            <div style={{
              padding: '60px',
              textAlign: 'center',
              color: theme.textMuted,
              transition: 'color 0.3s ease'
            }}>
              No active projects
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TesterProfile;