import React, { useEffect, useRef, useState } from 'react';

const PayPalPayment = ({
  totalBounty,
  projectData, // Changed from projectId to projectData
  onSuccess,
  onError,
  onCancel
}) => {
  const paypalRef = useRef();
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // totalBounty is now the full budget amount to charge
  // Platform fee (15%) will be calculated on the backend
  const totalAmount = parseFloat(totalBounty);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds maximum wait
    
    // Load PayPal SDK if not already loaded
    const loadPayPalSDK = () => {
      const clientId = "AUomH6-Nss3-THPUJO8XOlY0tIRFQgVf6VQqGM-Sxs9aclpuFRQWyi71HsXVi6VCdvfL7hPNmf0MQwue";
      const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
      
      if (!existingScript && !window.paypal) {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
        script.async = true;
        script.onload = () => {
          console.log('PayPal SDK loaded dynamically');
          setDebugInfo('PayPal SDK loaded dynamically');
        };
        script.onerror = () => {
          console.error('Failed to load PayPal SDK dynamically');
          setError('Failed to load PayPal SDK dynamically');
        };
        document.head.appendChild(script);
      }
    };
    
    // Check if PayPal SDK is loaded
    const checkPayPalSDK = () => {
      attempts++;
      console.log(`PayPal SDK check attempt ${attempts}`, {
        hasPaypal: !!window.paypal,
        paypalType: typeof window.paypal,
        scriptTags: document.querySelectorAll('script[src*="paypal"]').length
      });
      
      setDebugInfo(`Checking PayPal SDK... Attempt ${attempts}/${maxAttempts} - window.paypal: ${!!window.paypal}`);
      
      if (window.paypal) {
        setDebugInfo('PayPal SDK loaded successfully');
        setSdkReady(true);
        // Small delay to ensure DOM is ready
        setTimeout(() => renderPayPalButton(), 100);
      } else if (attempts < maxAttempts) {
        // Retry after a short delay
        setTimeout(checkPayPalSDK, 100);
      } else {
        setError('PayPal SDK failed to load. Check browser console for errors or network issues.');
        setDebugInfo(`PayPal SDK loading timeout after ${maxAttempts} attempts. Scripts found: ${document.querySelectorAll('script[src*="paypal"]').length}`);
      }
    };

    setDebugInfo('Starting PayPal SDK check...');
    loadPayPalSDK(); // Try to load SDK if missing
    checkPayPalSDK();
  }, [totalBounty, projectData]);

  const createPaymentOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'create-project-and-payment',
          projectData: projectData,
          totalBounty: totalBounty
        })
      });

      // Get response as text first, then try to parse as JSON
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Failed to parse create-payment-order JSON response:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 200) + '...'
        });
        throw new Error(`Payment API error: ${response.status} - ${responseText.substring(0, 100)}`);
      }
      
      if (response.ok) {
        return data.orderID;
      } else {
        throw new Error(data.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const capturePayment = async (orderID) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'capture-payment',
          orderID: orderID
        })
      });

      // Get response as text first, then try to parse as JSON
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Failed to parse capture-payment JSON response:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 200) + '...'
        });
        throw new Error(`Payment capture API error: ${response.status} - ${responseText.substring(0, 100)}`);
      }
      
      if (response.ok) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to capture payment');
      }
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw error;
    }
  };

  const renderPayPalButton = () => {
    console.log('renderPayPalButton called', {
      hasPayPal: !!window.paypal,
      hasContainer: !!paypalRef.current,
      containerElement: paypalRef.current
    });

    if (!window.paypal) {
      setError('PayPal SDK not loaded. Check if the PayPal script is blocked.');
      setDebugInfo('window.paypal is undefined');
      return;
    }
    
    if (!paypalRef.current) {
      setError('PayPal container not available. DOM reference issue.');
      setDebugInfo('paypalRef.current is null');
      return;
    }

    // Clear any existing PayPal button
    paypalRef.current.innerHTML = '';
    setDebugInfo('Rendering PayPal button...');

    try {
      window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
        height: 50
      },
      
      createOrder: async (data, actions) => {
        try {
          const orderID = await createPaymentOrder();
          return orderID;
        } catch (error) {
          console.error('Error in createOrder:', error);
          if (onError) onError(error);
          throw error;
        }
      },

      onApprove: async (data, actions) => {
        try {
          const captureResult = await capturePayment(data.orderID);
          
          if (captureResult.status === 'success') {
            if (onSuccess) {
              onSuccess({
                orderID: data.orderID,
                captureID: captureResult.captureID,
                amount: totalAmount
              });
            }
          } else {
            throw new Error('Payment capture failed');
          }
        } catch (error) {
          console.error('Error in onApprove:', error);
          if (onError) onError(error);
        }
      },

      onError: (err) => {
        console.error('PayPal Button Error:', err);
        if (onError) onError(err);
      },

      onCancel: (data) => {
        console.log('Payment cancelled:', data);
        if (onCancel) onCancel(data);
      }
    }).render(paypalRef.current);
    
    setDebugInfo('PayPal button rendered successfully');
    } catch (error) {
      console.error('Error rendering PayPal button:', error);
      setError('Failed to render PayPal button: ' + error.message);
      setDebugInfo('Error rendering PayPal button');
    }
  };

  if (!sdkReady) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          fontSize: '1rem',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          Loading PayPal...
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '24px'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: '600',
          marginBottom: '20px',
          fontFamily: 'Sansita, sans-serif'
        }}>
          Payment Summary
        </h4>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              Bug Bounty Amount:
            </span>
            <span style={{
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '500',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              ${totalBounty}
            </span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              Platform Fee (15%):
            </span>
            <span style={{
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '500',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              ${(totalAmount * 0.15).toFixed(2)}
            </span>
          </div>

          <hr style={{
            border: 'none',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            margin: '16px 0'
          }} />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              color: '#667eea',
              fontSize: '1.1rem',
              fontWeight: '600',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              Total Amount:
            </span>
            <span style={{
              color: '#667eea',
              fontSize: '1.3rem',
              fontWeight: '700',
              fontFamily: 'DM Sans, sans-serif'
            }}>
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div style={{
          background: 'rgba(102, 126, 234, 0.1)',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{
            color: '#667eea',
            fontSize: '0.9rem',
            margin: 0,
            lineHeight: '1.5',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            💡 <strong>How it works:</strong> Your ${totalAmount} payment will be converted to {(totalAmount * 100 * 0.85).toFixed(0)} credits for bug rewards.
            The ${(totalAmount * 0.15).toFixed(2)} platform fee (15%) helps us maintain and improve TestQuest.
          </p>
        </div>
      </div>

      <div ref={paypalRef} style={{ minHeight: '50px' }}></div>
      
      {/* Debug info */}
      {debugInfo && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          Debug: {debugInfo}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '12px',
          color: '#FF6B6B',
          fontSize: '0.9rem',
          fontFamily: 'DM Sans, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      )}
    </div>
  );
};

export default PayPalPayment;