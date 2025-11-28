const { PayPalApi, Environment } = require('@paypal/paypal-server-sdk');

// PayPal configuration
const createPayPalClient = () => {
  // Use sandbox environment for development
  const environment = process.env.NODE_ENV === 'production' 
    ? Environment.Live 
    : Environment.Sandbox;

  // Create PayPal client
  const client = new PayPalApi({
    clientCredentialsAuthCredentials: {
      oAuthClientId: process.env.PAYPAL_CLIENT_ID,
      oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    },
    environment: environment,
    logging: {
      logLevel: process.env.NODE_ENV === 'production' ? 'ERROR' : 'DEBUG',
      logRequest: process.env.NODE_ENV !== 'production',
      logResponse: process.env.NODE_ENV !== 'production'
    }
  });

  return client;
};

// PayPal configuration constants
const PAYPAL_CONFIG = {
  // Platform fee configuration
  PLATFORM_FEE: 100, // $100 platform fee
  
  // Withdrawal limits
  MIN_WITHDRAWAL: 100, // $100 minimum withdrawal
  MAX_WITHDRAWAL: 10000, // $10,000 maximum withdrawal per transaction
  
  // PayPal webhook events we want to listen to
  WEBHOOK_EVENTS: [
    'PAYMENT.CAPTURE.COMPLETED',
    'PAYMENT.CAPTURE.DENIED',
    'PAYMENT.CAPTURE.PENDING',
    'CHECKOUT.ORDER.APPROVED',
    'CHECKOUT.ORDER.COMPLETED',
    'BILLING.SUBSCRIPTION.CANCELLED',
    'BILLING.SUBSCRIPTION.SUSPENDED',
  ],
  
  // Currency
  CURRENCY: 'USD',
  
  // Return URLs for frontend
  RETURN_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  CANCEL_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};

module.exports = {
  createPayPalClient,
  PAYPAL_CONFIG
};