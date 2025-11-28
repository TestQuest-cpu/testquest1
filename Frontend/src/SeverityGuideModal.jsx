import React from 'react';

function SeverityGuideModal({ onClose, theme }) {
  // Default theme if not provided (for backward compatibility)
  const defaultTheme = {
    cardBackground: '#1F1F1F',
    textPrimary: 'white',
    border: 'rgba(255, 255, 255, 0.1)',
    buttonLight: 'rgba(255, 255, 255, 0.1)',
    buttonLightHover: 'rgba(255, 255, 255, 0.2)'
  };
  const modalTheme = theme || defaultTheme;

  return (
    <div
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
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: modalTheme.cardBackground,
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: `1px solid ${modalTheme.border}`,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: `1px solid ${modalTheme.border}`
        }}>
          <h2 style={{
            color: modalTheme.textPrimary,
            margin: 0,
            fontSize: '1.8rem',
            fontWeight: '700',
            transition: 'color 0.3s ease'
          }}>
            Severity Level Guidelines
          </h2>
          <button
            onClick={onClose}
            style={{
              background: modalTheme.buttonLight,
              border: `1px solid ${modalTheme.border}`,
              color: modalTheme.textPrimary,
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
              e.target.style.background = modalTheme.buttonLightHover;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = modalTheme.buttonLight;
            }}
          >
            ×
          </button>
        </div>

        {/* Critical Severity */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.2))',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#EF4444'
            }}></div>
            <h3 style={{
              color: '#EF4444',
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: '600'
            }}>
              Critical Bugs
            </h3>
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 12px 0',
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            Break core functionality, cause system crashes, or result in data loss.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '12px 16px',
            borderRadius: '8px',
            borderLeft: '3px solid #EF4444'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              <strong style={{ color: '#EF4444' }}>Examples:</strong>
            </p>
            <ul style={{
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '8px 0 0 0',
              paddingLeft: '20px',
              fontSize: '0.9rem',
              lineHeight: '1.8'
            }}>
              <li>App not launching</li>
              <li>User unable to log in</li>
              <li>Payment function not working</li>
            </ul>
          </div>
        </div>

        {/* Major Severity */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.2))',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#F59E0B'
            }}></div>
            <h3 style={{
              color: '#F59E0B',
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: '600'
            }}>
              Major Bugs
            </h3>
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 12px 0',
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            Impair significant features but do not halt primary operations.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '12px 16px',
            borderRadius: '8px',
            borderLeft: '3px solid #F59E0B'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              <strong style={{ color: '#F59E0B' }}>Examples:</strong>
            </p>
            <ul style={{
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '8px 0 0 0',
              paddingLeft: '20px',
              fontSize: '0.9rem',
              lineHeight: '1.8'
            }}>
              <li>UI layout failure on some screens</li>
              <li>Incorrect calculations</li>
              <li>Broken links</li>
            </ul>
          </div>
        </div>

        {/* Minor Severity */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.2))',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#3B82F6'
            }}></div>
            <h3 style={{
              color: '#3B82F6',
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: '600'
            }}>
              Minor Bugs
            </h3>
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 12px 0',
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            Cosmetic issues or non-disruptive bugs that do not affect primary use.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '12px 16px',
            borderRadius: '8px',
            borderLeft: '3px solid #3B82F6'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              <strong style={{ color: '#3B82F6' }}>Examples:</strong>
            </p>
            <ul style={{
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '8px 0 0 0',
              paddingLeft: '20px',
              fontSize: '0.9rem',
              lineHeight: '1.8'
            }}>
              <li>Spelling errors</li>
              <li>Icon misalignment</li>
              <li>Non-blocking tooltip glitches</li>
            </ul>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{
          background: 'rgba(78, 205, 196, 0.1)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(78, 205, 196, 0.3)',
          marginTop: '20px'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            fontSize: '0.9rem',
            lineHeight: '1.6'
          }}>
            <strong style={{ color: '#4ECDC4' }}>💡 Tip:</strong> Choose the severity level that best matches your bug's impact. Accurate classification helps developers prioritize fixes and ensures fair rewards.
          </p>
        </div>

        {/* Close Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 40px',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(78, 205, 196, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(78, 205, 196, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(78, 205, 196, 0.4)';
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

export default SeverityGuideModal;
