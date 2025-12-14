import React, { useState, useEffect } from "react";

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState("tester");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/auth?action=forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            accountType,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message,
        });
        setEmail("");
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to send reset link",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
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
        color: 'white'
      }}>
        <img
          src="/favicon.png"
          alt="TestQuest Logo"
          style={{
            width: isMobile ? '80px' : '120px',
            height: isMobile ? '80px' : '120px',
            marginBottom: isMobile ? '15px' : '25px',
            objectFit: 'contain'
          }}
        />
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
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.95rem', opacity: 0.8 }}>Reset your password securely</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.95rem', opacity: 0.8 }}>Get back to testing in minutes</span>
            </div>

            <div>
              <span style={{ fontSize: '0.95rem', opacity: 0.8 }}>24/7 account recovery support</span>
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
        paddingTop: isMobile ? '30px' : '40px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '450px'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '10px',
            color: '#333'
          }}>
            Forgot Password
          </h2>

          <p style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '30px',
            fontSize: '0.95rem'
          }}>
            Enter your email to receive a password reset link
          </p>

          {message.text && (
            <div style={{
              backgroundColor: message.type === "success" ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${message.type === "success" ? '#BBF7D0' : '#FECACA'}`,
              color: message.type === "success" ? '#15803D' : '#B91C1C',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem'
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.9rem',
                color: '#666',
                fontWeight: '500'
              }}>
                Account Type
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: 'white'
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
              >
                <option value="tester">Tester</option>
                <option value="developer">Developer</option>
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.9rem',
                color: '#666',
                fontWeight: '500'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
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

            <button
              type="submit"
              disabled={loading}
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
                marginBottom: '15px',
                transform: loading ? 'scale(0.98)' : 'scale(1)'
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
                  Sending...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                color: '#666',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f9f9f9';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
