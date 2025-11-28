import React, { useState, useEffect } from 'react';
import { getTesterTheme } from './themeConfig';

const WithdrawalInterface = ({ userBalance, onClose }) => {
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('withdraw');
  const [isLightMode] = useState(() => {
    const saved = localStorage.getItem('testerLightMode');
    return saved === null ? false : saved === 'true';
  });

  const theme = getTesterTheme(isLightMode);

  const CREDITS_PER_USD = 100; // 100 credits = 1 USD
  const MIN_WITHDRAWAL_CREDITS = 500; // 500 credits = $5 USD
  const MIN_WITHDRAWAL_USD = MIN_WITHDRAWAL_CREDITS / CREDITS_PER_USD;

  useEffect(() => {
    fetchWithdrawalHistory();
  }, []);

  const fetchWithdrawalHistory = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('moderatorToken');

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/payments?type=withdrawals`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWithdrawalHistory(data.withdrawals || []);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal history:', error);
    }
  };

  const handleWithdrawalRequest = async (e) => {
    e.preventDefault();

    const amountInCredits = parseFloat(withdrawalAmount);

    // Validation
    if (!amountInCredits || amountInCredits < MIN_WITHDRAWAL_CREDITS) {
      setError(`Minimum withdrawal is ${MIN_WITHDRAWAL_CREDITS.toLocaleString()} credits`);
      return;
    }

    if (amountInCredits > userBalance) {
      setError(`Insufficient balance. Available: ${userBalance.toLocaleString()} credits`);
      return;
    }

    if (!paypalEmail) {
      setError('PayPal email is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('moderatorToken');

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'request-withdrawal',
          amount: amountInCredits, // Send credits to backend
          paypalEmail: paypalEmail
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Withdrawal request submitted successfully! Our team will process it within 1-2 business days.');
        setWithdrawalAmount('');
        // Refresh withdrawal history
        fetchWithdrawalHistory();
      } else {
        setError(data.message || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      setError('Error submitting withdrawal request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: 'Pending', icon: '⏳' },
      processing: { bg: '#E0E7FF', color: '#3730A3', text: 'Processing', icon: '⚙️' },
      completed: { bg: '#D1FAE5', color: '#065F46', text: 'Completed', icon: '✅' },
      failed: { bg: '#FEE2E2', color: '#991B1B', text: 'Failed', icon: '❌' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: theme.cardBackground,
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: `1px solid ${theme.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div>
            <h2 style={{
              color: theme.textPrimary,
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '8px',
              fontFamily: 'Sansita, sans-serif',
              transition: 'color 0.3s ease'
            }}>
              Withdrawal Center
            </h2>
            <p style={{
              color: theme.textSecondary,
              transition: 'color 0.3s ease',
              fontSize: '14px',
              marginBottom: 0,
              fontFamily: 'DM Sans, sans-serif'
            }}>
              Available Balance: <span style={{ color: '#4ECDC4', fontWeight: '600', fontSize: '16px' }}>
                {userBalance.toLocaleString()} credits
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '18px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '25px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '15px'
        }}>
          <button
            onClick={() => setActiveTab('withdraw')}
            style={{
              background: activeTab === 'withdraw'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : theme.statsCardBg,
              color: theme.textPrimary,
              transition: 'all 0.3s ease',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Sansita, sans-serif',
              transition: 'all 0.3s ease',
              transform: activeTab === 'withdraw' ? 'translateY(-2px)' : 'none',
              boxShadow: activeTab === 'withdraw' ? '0 8px 25px rgba(102, 126, 234, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'withdraw') {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'withdraw') {
                e.target.style.transform = 'none';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            💰 Request Withdrawal
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: activeTab === 'history'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : theme.statsCardBg,
              color: theme.textPrimary,
              transition: 'all 0.3s ease',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Sansita, sans-serif',
              transition: 'all 0.3s ease',
              transform: activeTab === 'history' ? 'translateY(-2px)' : 'none',
              boxShadow: activeTab === 'history' ? '0 8px 25px rgba(102, 126, 234, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'history') {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'history') {
                e.target.style.transform = 'none';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            📋 Withdrawal History
          </button>
        </div>

        {activeTab === 'withdraw' ? (
          /* Withdrawal Form */
          <div>
            <form onSubmit={handleWithdrawalRequest}>
              <div style={{
                backgroundColor: theme.statsCardBg,
                borderRadius: '12px',
                padding: '25px',
                marginBottom: '20px',
                border: `1px solid ${theme.border}`,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    color: theme.textPrimary,
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'color 0.3s ease'
                  }}>
                    Withdrawal Amount (Credits)
                  </label>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    min={MIN_WITHDRAWAL_CREDITS}
                    max={userBalance}
                    step="1"
                    placeholder={`Min: ${MIN_WITHDRAWAL_CREDITS.toLocaleString()} credits`}
                    style={{
                      backgroundColor: theme.statsCardBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '10px',
                      padding: '12px',
                      color: theme.textPrimary,
                      transition: 'all 0.3s ease',
                      fontSize: '16px',
                      width: '100%',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#3A3A3A';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    color: theme.textPrimary,
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'color 0.3s ease'
                  }}>
                    PayPal Email Address
                  </label>
                  <input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="your.paypal@email.com"
                    style={{
                      backgroundColor: theme.statsCardBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '10px',
                      padding: '12px',
                      color: theme.textPrimary,
                      transition: 'all 0.3s ease',
                      fontSize: '16px',
                      width: '100%',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#3A3A3A';
                      e.target.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>

                <div style={{
                  backgroundColor: 'rgba(76, 205, 196, 0.1)',
                  border: '1px solid rgba(76, 205, 196, 0.3)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <p style={{
                    color: '#4ECDC4',
                    fontSize: '12px',
                    margin: 0,
                    lineHeight: '1.4',
                    fontFamily: 'DM Sans, sans-serif'
                  }}>
                    💡 <strong>Processing Time:</strong> Withdrawals are typically processed within 1-2 business days. 
                    You'll receive the funds directly to your PayPal account.
                  </p>
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(255, 107, 107, 0.1)',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '20px',
                    color: '#FF6B6B',
                    fontSize: '14px'
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                {success && (
                  <div style={{
                    background: 'rgba(78, 205, 196, 0.1)',
                    border: '1px solid rgba(78, 205, 196, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '20px',
                    color: '#4ECDC4',
                    fontSize: '14px'
                  }}>
                    ✅ {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || userBalance < MIN_WITHDRAWAL_CREDITS}
                  style={{
                    background: loading || userBalance < MIN_WITHDRAWAL_CREDITS
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading || userBalance < MIN_WITHDRAWAL_CREDITS ? 'not-allowed' : 'pointer',
                    width: '100%',
                    opacity: loading || userBalance < MIN_WITHDRAWAL_CREDITS ? 0.6 : 1,
                    fontFamily: 'Sansita, sans-serif',
                    transition: 'all 0.3s ease',
                    transform: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && userBalance >= MIN_WITHDRAWAL_CREDITS) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && userBalance >= MIN_WITHDRAWAL_CREDITS) {
                      e.target.style.transform = 'none';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  {loading ? 'Processing...' : `Request Withdrawal`}
                </button>

                {userBalance < MIN_WITHDRAWAL_CREDITS && (
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px',
                    textAlign: 'center',
                    marginTop: '10px',
                    marginBottom: 0,
                    fontFamily: 'DM Sans, sans-serif'
                  }}>
                    You need at least {MIN_WITHDRAWAL_CREDITS.toLocaleString()} credits to request a withdrawal
                  </p>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* Withdrawal History */
          <div>
            <div style={{
              backgroundColor: theme.statsCardBg,
              borderRadius: '12px',
              padding: '20px',
              minHeight: '300px',
              border: `1px solid ${theme.border}`,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              {withdrawalHistory.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: theme.textSecondary,
                  transition: 'color 0.3s ease'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
                  <h3 style={{ color: theme.textPrimary, marginBottom: '8px', fontFamily: 'Sansita, sans-serif', transition: 'color 0.3s ease' }}>No Withdrawals Yet</h3>
                  <p style={{ fontFamily: 'DM Sans, sans-serif' }}>Your withdrawal history will appear here once you make your first request.</p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {withdrawalHistory.map((withdrawal) => (
                    <div
                      key={withdrawal._id}
                      style={{
                        backgroundColor: theme.buttonDark,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '10px',
                        padding: '16px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme.buttonDarkHover;
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = theme.buttonDark;
                        e.target.style.transform = 'none';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          color: '#4ECDC4',
                          fontSize: '18px',
                          fontWeight: '600',
                          fontFamily: 'Sansita, sans-serif'
                        }}>
                          {withdrawal.amount.toLocaleString()} credits
                        </div>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      
                      <div style={{
                        color: theme.textSecondary,
                        fontSize: '12px',
                        marginBottom: '4px',
                        fontFamily: 'DM Sans, sans-serif',
                        transition: 'color 0.3s ease'
                      }}>
                        PayPal: {withdrawal.paypalEmail}
                      </div>

                      <div style={{
                        color: theme.textMuted,
                        transition: 'color 0.3s ease',
                        fontSize: '11px',
                        fontFamily: 'DM Sans, sans-serif'
                      }}>
                        Requested: {formatDate(withdrawal.createdAt)}
                        {withdrawal.completedAt && (
                          <span> • Completed: {formatDate(withdrawal.completedAt)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalInterface;
