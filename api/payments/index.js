const mongoose = require('mongoose');

// PayPal configuration - using direct HTTP API calls to avoid SDK version issues
const createPayPalClient = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  console.log('PayPal Environment Variables Check:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId ? clientId.length : 0,
    clientSecretLength: clientSecret ? clientSecret.length : 0,
    clientIdPrefix: clientId ? clientId.substring(0, 10) : 'N/A',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('PAYPAL'))
  });

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials missing: PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not set');
  }

  const baseURL = 'https://api-m.sandbox.paypal.com'; // Force sandbox for testing

  return { clientId, clientSecret, baseURL };
};

// Get PayPal access token
async function getPayPalAccessToken(clientId, clientSecret, baseURL) {
  console.log('PayPal Auth Debug:', {
    clientIdLength: clientId?.length,
    clientSecretLength: clientSecret?.length,
    baseURL: baseURL
  });

  const auth = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');
  console.log('Generated auth header (first 50 chars):', auth.substring(0, 50));

  const response = await fetch(`${baseURL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal Auth Error:', {
      status: response.status,
      statusText: response.statusText,
      errorText: errorText,
      headers: Object.fromEntries(response.headers.entries())
    });
    throw new Error(`PayPal auth failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('PayPal auth successful, token length:', data.access_token?.length);
  return data.access_token;
}

// Create PayPal order
async function createPayPalOrder(orderData, accessToken, baseURL) {
  const response = await fetch(`${baseURL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal order creation failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// Capture PayPal order
async function capturePayPalOrder(orderID, accessToken, baseURL) {
  const response = await fetch(`${baseURL}/v2/checkout/orders/${orderID}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal order capture failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// Send PayPal payout (for platform fee transfer)
async function sendPayPalPayout(payoutData, accessToken, baseURL) {
  const response = await fetch(`${baseURL}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payoutData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal payout failed:', errorText);
    throw new Error(`PayPal payout failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

const PAYPAL_CONFIG = {
  CREDITS_PER_USD: 1, // 1 credits = 1 USD
  MIN_WITHDRAWAL_CREDITS: 500, // 500 credits = $5 USD minimum withdrawal
  MAX_WITHDRAWAL_CREDITS: 1000000, // 1000000 credits = $10000 USD
  CURRENCY: 'USD',
  RETURN_URL: (process.env.FRONTEND_URL || 'https://test-quest-seven.vercel.app').trim(),
  CANCEL_URL: (process.env.FRONTEND_URL || 'https://test-quest-seven.vercel.app').trim()
};

// Temporary Project Storage Schema (for pending payments)
const tempProjectSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectData: { type: mongoose.Schema.Types.Mixed, required: true },
  totalBounty: { type: Number, required: true },
  expiresAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete after 1 hour
}, { timestamps: true });

const TempProject = mongoose.models.TempProject || mongoose.model('TempProject', tempProjectSchema);

// User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  accountType: { type: String, required: true, enum: ['tester', 'developer'] },
  isEmailVerified: { type: Boolean, default: false },
  googleId: { type: String, sparse: true },
  githubId: { type: String, sparse: true },
  avatar: { type: String },
  balance: { type: Number, default: 0, min: 0 },
  paypalEmail: { type: String } // For withdrawals
}, { timestamps: true });

// Project model
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, required: true, trim: true },
  scope: { type: String, required: true },
  objective: { type: String, required: true },
  areasToTest: { type: String, required: true },
  bugRewards: {
    critical: { type: Number, default: 0 },
    major: { type: Number, default: 0 },
    minor: { type: Number, default: 0 }
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 20 // Minimum $20 budget
  },
  platformFee: {
    type: Number,
    default: 0 // 15% of totalBudget
  },
  platformFeePercentage: {
    type: Number,
    default: 15 // 15% platform fee
  },
  totalBounty: {
    type: Number,
    default: 0,
    min: 0 // 85% of totalBudget after platform fee
  },
  remainingBounty: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: { type: String, default: '' },
  projectLink: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Project link must be a valid URL'
    }
  },
  image: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paypalOrderId: { type: String },
  paypalPaymentId: { type: String },
  platformFeePayoutId: { type: String }, // PayPal payout batch ID for platform fee
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  completedAt: { type: Date },
  bugReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BugReport' }]
}, { timestamps: true });

// Calculate platform fee and bounty pool when creating new project
projectSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('totalBudget')) {
    // Calculate 15% platform fee
    this.platformFee = Math.round(this.totalBudget * (this.platformFeePercentage / 100) * 100) / 100;

    // Calculate 85% bounty pool (totalBudget - platformFee)
    this.totalBounty = Math.round((this.totalBudget - this.platformFee) * 100) / 100;

    // Set remaining bounty to total bounty for new projects
    if (this.isNew) {
      this.remainingBounty = this.totalBounty;
    }
  }
  next();
});

// Index for better query performance
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ postedBy: 1 });

// Withdrawal request model
const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: PAYPAL_CONFIG.MIN_WITHDRAWAL_CREDITS }, // In credits
  paypalEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  paypalPayoutId: { type: String }, // PayPal payout batch ID
  paypalItemId: { type: String }, // PayPal payout item ID
  processedAt: { type: Date },
  completedAt: { type: Date },
  failureReason: { type: String }
}, { timestamps: true });

// Create models only once
let User, Project, Withdrawal;

function getModels() {
  if (!User) {
    User = mongoose.models.User || mongoose.model('User', userSchema);
  }
  if (!Project) {
    Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
  }
  if (!Withdrawal) {
    Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);
  }
  return { User, Project, Withdrawal, TempProject };
}

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return getModels();
  }
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    return getModels();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// JWT verification (same as other endpoints)
const jwt = require('jsonwebtoken');

const authenticateToken = async (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Access token required');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const { User } = await connectToDatabase();
  const user = await User.findById(decoded.userId).select('-password');
  
  if (!user) {
    throw new Error('Invalid token - user not found');
  }

  user.accountType = decoded.accountType;
  return user;
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Allow current deployment URLs and localhost for development
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://test-quest-seven.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ];

  if (origin) {
    // Allow any origin that contains test-quest and vercel.app (for preview deployments)
    if ((origin.includes('test-quest') && origin.includes('vercel.app')) || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://test-quest-seven.vercel.app');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://test-quest-seven.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('PayPal API: Starting request processing', {
      method: req.method,
      action: req.body?.action,
      hasPayPalClientId: !!process.env.PAYPAL_CLIENT_ID,
      hasPayPalClientSecret: !!process.env.PAYPAL_CLIENT_SECRET,
      clientIdPrefix: process.env.PAYPAL_CLIENT_ID?.substring(0, 10),
      nodeEnv: process.env.NODE_ENV
    });

    // Special debug action
    if (req.body?.action === 'debug') {
      const paypalClient = createPayPalClient();

      // Test auth immediately
      try {
        const accessToken = await getPayPalAccessToken(paypalClient.clientId, paypalClient.clientSecret, paypalClient.baseURL);
        return res.json({
          status: 'success',
          message: 'PayPal authentication working!',
          tokenLength: accessToken.length,
          environment: process.env.NODE_ENV,
          baseURL: paypalClient.baseURL
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: error.message,
          environment: process.env.NODE_ENV,
          baseURL: paypalClient.baseURL
        });
      }
    }

    const { User, Project, Withdrawal, TempProject } = await connectToDatabase();
    console.log('PayPal API: Database connected successfully');

    const paypalClient = createPayPalClient();
    console.log('PayPal API: PayPal client created successfully');

    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'create-project-and-payment') {
        // Create PayPal order with project data (NO database save until payment confirmed)
        const user = await authenticateToken(req);

        if (user.accountType !== 'developer') {
          return res.status(403).json({ message: 'Developer account required' });
        }

        const { projectData, totalBounty } = req.body;

        if (!projectData || !totalBounty) {
          return res.status(400).json({ message: 'Project data and total bounty required' });
        }

        console.log('Creating PayPal order for project:', projectData.name);

        // totalBounty is now totalBudget - charge only this amount
        // Platform fee (15%) is already included and will be calculated after payment
        const totalAmount = parseFloat(totalBounty);
        const platformFeePercentage = 15;
        const platformFee = Math.round(totalAmount * (platformFeePercentage / 100) * 100) / 100;
        const bountyPool = Math.round((totalAmount - platformFee) * 100) / 100;

        const returnUrl = `${PAYPAL_CONFIG.RETURN_URL}/payment-success`;
        const cancelUrl = `${PAYPAL_CONFIG.CANCEL_URL}/payment-cancelled`;

        // First create PayPal order to get order ID
        const orderRequest = {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: PAYPAL_CONFIG.CURRENCY,
              value: totalAmount.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: PAYPAL_CONFIG.CURRENCY,
                  value: totalAmount.toFixed(2)
                }
              }
            },
            items: [{
              name: `Bug Bounty Project: ${projectData.name}`,
              description: `Total Budget: $${totalAmount} (Bounty Pool: $${bountyPool}, Platform Fee: $${platformFee})`,
              unit_amount: {
                currency_code: PAYPAL_CONFIG.CURRENCY,
                value: totalAmount.toFixed(2)
              },
              quantity: '1'
            }],
            custom_id: `project_${Date.now()}` // Short unique identifier
          }],
          application_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl,
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW'
          }
        };

        // Create PayPal order using direct API call
        const accessToken = await getPayPalAccessToken(paypalClient.clientId, paypalClient.clientSecret, paypalClient.baseURL);
        const response = await createPayPalOrder(orderRequest, accessToken, paypalClient.baseURL);

        // Store project data temporarily in database with PayPal order ID
        const tempProject = new TempProject({
          orderId: response.id,
          userId: user._id,
          projectData: projectData,
          totalBounty: parseFloat(totalBounty)
        });

        await tempProject.save();
        console.log('PayPal order created and project data stored temporarily. Order ID:', response.id);

        return res.json({
          orderID: response.id,
          totalAmount: totalAmount,
          platformFee: platformFee,
          message: 'Payment required before project creation'
        });

      } else if (action === 'create-payment-order') {
        // Create PayPal order for project payment
        const user = await authenticateToken(req);
        
        if (user.accountType !== 'developer') {
          return res.status(403).json({ message: 'Developer account required' });
        }

        const { projectId, totalBounty } = req.body;
        
        if (!projectId || !totalBounty) {
          return res.status(400).json({ message: 'Project ID and total bounty required' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }

        if (project.postedBy.toString() !== user._id.toString()) {
          return res.status(403).json({ message: 'Not authorized to pay for this project' });
        }

        if (project.paymentStatus === 'paid') {
          return res.status(400).json({ message: 'Project payment already completed' });
        }

        // Use totalBudget (or totalBounty for legacy) - no additional fees
        const totalAmount = parseFloat(totalBounty);
        const platformFeePercentage = 15;
        const platformFee = Math.round(totalAmount * (platformFeePercentage / 100) * 100) / 100;

        // Create PayPal order
        const returnUrl = `${PAYPAL_CONFIG.RETURN_URL}/payment-success`;
        const cancelUrl = `${PAYPAL_CONFIG.CANCEL_URL}/payment-cancelled`;

        const orderRequest = {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: PAYPAL_CONFIG.CURRENCY,
              value: totalAmount.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: PAYPAL_CONFIG.CURRENCY,
                  value: totalAmount.toFixed(2)
                }
              }
            },
            items: [{
              name: `Bug Bounty Project: ${project.name}`,
              description: `Bounty: $${totalBounty}, Platform Fee: $${platformFee}`,
              unit_amount: {
                currency_code: PAYPAL_CONFIG.CURRENCY,
                value: totalAmount.toFixed(2)
              },
              quantity: '1'
            }],
            custom_id: projectId // Store project ID for reference
          }],
          application_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl,
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW'
          }
        };

        // Create PayPal order using direct API call
        const accessToken = await getPayPalAccessToken(paypalClient.clientId, paypalClient.clientSecret, paypalClient.baseURL);
        const response = await createPayPalOrder(orderRequest, accessToken, paypalClient.baseURL);

        // Update project with PayPal order ID
        await Project.findByIdAndUpdate(projectId, {
          paypalOrderId: response.id,
          totalAmountPaid: totalAmount,
          platformFee: platformFee
        });

        return res.json({
          orderID: response.id,
          totalAmount: totalAmount,
          platformFee: platformFee
        });

      } else if (action === 'capture-payment') {
        // Capture PayPal payment after approval and CREATE project in database
        const { orderID } = req.body;

        if (!orderID) {
          return res.status(400).json({ message: 'Order ID required' });
        }

        // Capture PayPal order using direct API call
        const accessToken = await getPayPalAccessToken(paypalClient.clientId, paypalClient.clientSecret, paypalClient.baseURL);
        const response = await capturePayPalOrder(orderID, accessToken, paypalClient.baseURL);

        if (response.status === 'COMPLETED') {
          try {
            // Retrieve project data from temporary storage using order ID
            const tempProject = await TempProject.findOne({ orderId: orderID });

            if (!tempProject) {
              throw new Error('Project data not found for order ID: ' + orderID);
            }

            console.log('Retrieved project data from temporary storage for order:', orderID);
            const { userId, projectData, totalBounty } = tempProject;

            console.log('Project Data Debug:', {
              userId,
              name: projectData.name,
              platform: projectData.platform,
              scope: projectData.scope?.substring(0, 50),
              objective: projectData.objective?.substring(0, 50),
              areasToTest: projectData.areasToTest?.substring(0, 50),
              projectLink: projectData.projectLink,
              totalBounty,
              bugRewards: projectData.bugRewards
            });

            // Keep everything in USD - let the pre-save hook handle calculations
            const totalBudgetUSD = parseFloat(totalBounty);
            const platformFeePercentage = 15;
            const platformFeeUSD = Math.round(totalBudgetUSD * (platformFeePercentage / 100) * 100) / 100;

            // NOW create the project in database after successful payment
            // Only set totalBudget - the pre-save hook will calculate platformFee, totalBounty, and remainingBounty
            const project = new Project({
              name: projectData.name,
              postedBy: userId,
              platform: projectData.platform,
              scope: projectData.scope,
              objective: projectData.objective,
              areasToTest: projectData.areasToTest,
              bugRewards: {
                critical: parseInt(projectData.bugRewards?.critical) || 0,
                major: parseInt(projectData.bugRewards?.major) || 0,
                minor: parseInt(projectData.bugRewards?.minor) || 0
              },
              totalBudget: totalBudgetUSD, // Pre-save hook will calculate platformFee & totalBounty
              notes: projectData.notes || '',
              projectLink: projectData.projectLink,
              image: projectData.image || '',
              status: 'pending', // Will be reviewed by admin
              paymentStatus: 'paid', // Payment already completed!
              paypalOrderId: orderID,
              paypalPaymentId: response.purchase_units[0].payments.captures[0].id,
            });

            console.log('Attempting to save project with data:', {
              name: project.name,
              platform: project.platform,
              totalBudget: project.totalBudget,
              projectLink: project.projectLink,
              hasScope: !!project.scope,
              hasObjective: !!project.objective,
              hasAreasToTest: !!project.areasToTest
            });

            await project.save();
            console.log('Project created AFTER successful payment with ID:', project._id);

            // Auto-transfer platform fee to separate PayPal account
            const platformFeeEmail = process.env.PLATFORM_FEE_PAYPAL_EMAIL;

            if (platformFeeEmail && platformFeeUSD > 0) {
              try {
                console.log(`Transferring platform fee $${platformFeeUSD} to ${platformFeeEmail}`);

                // Create payout request
                const payoutRequest = {
                  sender_batch_header: {
                    sender_batch_id: `PLATFORM_FEE_${orderID}_${Date.now()}`,
                    email_subject: 'TestQuest Platform Fee',
                    email_message: `Platform fee for project: ${projectData.name}`
                  },
                  items: [{
                    recipient_type: 'EMAIL',
                    amount: {
                      value: platformFeeUSD.toFixed(2),
                      currency: 'USD'
                    },
                    receiver: platformFeeEmail,
                    note: `15% platform fee for project ${project._id}`,
                    sender_item_id: `FEE_${project._id}`
                  }]
                };

                // Send payout
                const payoutResponse = await sendPayPalPayout(
                  payoutRequest,
                  accessToken,
                  paypalClient.baseURL
                );

                console.log('Platform fee transferred successfully:', payoutResponse.batch_header.payout_batch_id);

                // Store payout ID in project
                await Project.findByIdAndUpdate(project._id, {
                  platformFeePayoutId: payoutResponse.batch_header.payout_batch_id
                });

              } catch (payoutError) {
                // Don't fail the entire payment if payout fails
                console.error('Platform fee transfer failed (continuing anyway):', payoutError.message);
              }
            }

            // Clean up temporary project data
            await TempProject.findByIdAndDelete(tempProject._id);
            console.log('Temporary project data cleaned up');

            return res.json({
              status: 'success',
              captureID: response.purchase_units[0].payments.captures[0].id,
              projectId: project._id,
              message: 'Payment completed and project created successfully'
            });

          } catch (error) {
            console.error('Error creating project after payment:', error);
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name,
              code: error.code
            });
            return res.status(500).json({
              status: 'error',
              message: 'Payment successful but project creation failed',
              error: error.message,
              details: error.stack,
              captureID: response.purchase_units[0].payments.captures[0].id
            });
          }
        } else {
          return res.status(400).json({
            status: 'error',
            message: 'Payment capture failed'
          });
        }

      } else if (action === 'request-withdrawal') {
        // Request withdrawal (tester)
        const user = await authenticateToken(req);

        if (user.accountType !== 'tester') {
          return res.status(403).json({ message: 'Tester account required' });
        }

        const { amount, paypalEmail } = req.body;

        if (!amount || !paypalEmail) {
          return res.status(400).json({ message: 'Amount and PayPal email required' });
        }

        // Amount is in credits
        const amountInCredits = parseFloat(amount);

        if (amountInCredits < PAYPAL_CONFIG.MIN_WITHDRAWAL_CREDITS) {
          const minUSD = PAYPAL_CONFIG.MIN_WITHDRAWAL_CREDITS / PAYPAL_CONFIG.CREDITS_PER_USD;
          return res.status(400).json({
            message: `Minimum withdrawal is ${PAYPAL_CONFIG.MIN_WITHDRAWAL_CREDITS} credits ($${minUSD})`
          });
        }

        if (amountInCredits > user.balance) {
          const balanceUSD = (user.balance / PAYPAL_CONFIG.CREDITS_PER_USD).toFixed(2);
          return res.status(400).json({
            message: `Insufficient balance. Available: ${user.balance} credits ($${balanceUSD})`
          });
        }

        // Create withdrawal request (amount stored in credits)
        const withdrawal = new Withdrawal({
          userId: user._id,
          amount: amountInCredits,
          paypalEmail: paypalEmail,
          status: 'pending'
        });

        await withdrawal.save();

        // Update user's PayPal email for future use
        await User.findByIdAndUpdate(user._id, { paypalEmail: paypalEmail });

        const amountUSD = (amountInCredits / PAYPAL_CONFIG.CREDITS_PER_USD).toFixed(2);

        return res.json({
          message: 'Withdrawal request submitted successfully',
          withdrawalId: withdrawal._id,
          amount: amountInCredits,
          amountUSD: amountUSD
        });

      }

    } else if (req.method === 'GET') {
      // Get payment/withdrawal history
      const user = await authenticateToken(req);
      const { type } = req.query;

      if (type === 'withdrawals') {
        // Get user's withdrawal history
        const withdrawals = await Withdrawal.find({ userId: user._id })
          .sort({ createdAt: -1 });

        return res.json({ withdrawals });

      } else if (type === 'payments') {
        // Get user's payment history (projects they paid for)
        const payments = await Project.find({ 
          postedBy: user._id,
          paymentStatus: 'paid' 
        }).select('name totalBounty platformFee totalAmountPaid paymentStatus createdAt');

        return res.json({ payments });
      }

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Payment API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    return res.status(500).json({ 
      message: error.message,
      error: process.env.NODE_ENV !== 'production' ? error.stack : 'Server error'
    });
  }
};
