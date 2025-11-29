import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('creating'); // creating, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid account creation link');
      return;
    }

    createAccount(token);
  }, [searchParams]);

  const createAccount = async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);
      const response = await fetch(`${apiUrl}/api/auth?action=verify-email&token=${token}`, {
        method: 'GET'
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred during verification');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        {status === 'creating' && (
          <>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #7C3AED',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Creating Your Account...</h2>
            <p style={{ color: '#666' }}>Please wait while we set up your TestQuest account</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              fontSize: '50px',
              marginBottom: '20px'
            }}>✓</div>
            <h2 style={{ color: '#10B981', marginBottom: '10px' }}>Account Created!</h2>
            <p style={{ color: '#666' }}>{message}</p>
            <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '20px' }}>
              Redirecting to login...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              fontSize: '50px',
              marginBottom: '20px'
            }}>✗</div>
            <h2 style={{ color: '#EF4444', marginBottom: '10px' }}>Account Creation Failed</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#7C3AED',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Back to Sign Up
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default VerifyEmail;
