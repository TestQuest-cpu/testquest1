const mongoose = require('mongoose');
const crypto = require('crypto');
const { createPayPalClient } = require('../../backend/config/paypal');

// Project model (same as payments endpoint)
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
  totalBounty: { type: Number, required: true, min: 0 },
  remainingBounty: { type: Number, required: true, min: 0 },
  platformFee: { type: Number, default: 100 },
  totalAmountPaid: { type: Number },
  notes: { type: String, default: '' },
  projectLink: { type: String, required: true },
  image: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paypalOrderId: { type: String },
  paypalPaymentId: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  completedAt: { type: Date },
  bugReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BugReport' }]
}, { timestamps: true });

// Withdrawal model (same as payments endpoint)
const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 100 },
  paypalEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  paypalPayoutId: { type: String },
  paypalItemId: { type: String },
  processedAt: { type: Date },
  completedAt: { type: Date },
  failureReason: { type: String }
}, { timestamps: true });

// Webhook log model for debugging
const webhookLogSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  resource: { type: Object },
  processed: { type: Boolean, default: false },
  error: { type: String }
}, { timestamps: true });

let Project, Withdrawal, WebhookLog;

function getModels() {
  if (!Project) {
    Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
  }
  if (!Withdrawal) {
    Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);
  }
  if (!WebhookLog) {
    WebhookLog = mongoose.models.WebhookLog || mongoose.model('WebhookLog', webhookLogSchema);
  }
  return { Project, Withdrawal, WebhookLog };
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

// Verify PayPal webhook signature
function verifyWebhookSignature(headers, body, webhookId) {
  const authAlgo = headers['paypal-auth-algo'];
  const transmission = headers['paypal-transmission-id'];
  const certId = headers['paypal-cert-id'];
  const signature = headers['paypal-transmission-sig'];
  const timestamp = headers['paypal-transmission-time'];

  if (!authAlgo || !transmission || !certId || !signature || !timestamp || !webhookId) {
    return false;
  }

  // This is a simplified verification - in production you should implement full signature verification
  // using PayPal's webhook verification API
  return true; // For now, always return true for sandbox
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { Project, Withdrawal, WebhookLog } = await connectToDatabase();
    
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const eventBody = req.body;

    console.log('PayPal Webhook received:', {
      eventType: eventBody.event_type,
      eventId: eventBody.id,
      timestamp: new Date().toISOString()
    });

    // Verify webhook signature (simplified for sandbox)
    if (!verifyWebhookSignature(req.headers, eventBody, webhookId)) {
      console.log('Webhook signature verification failed');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Log webhook event
    try {
      await WebhookLog.create({
        eventId: eventBody.id,
        eventType: eventBody.event_type,
        resource: eventBody.resource || eventBody
      });
    } catch (logError) {
      // Duplicate webhook event - already processed
      if (logError.code === 11000) {
        console.log('Duplicate webhook event, ignoring');
        return res.status(200).json({ message: 'Event already processed' });
      }
    }

    // Handle different webhook events
    switch (eventBody.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(eventBody, Project);
        break;
        
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(eventBody, Project);
        break;
        
      case 'CHECKOUT.ORDER.APPROVED':
        // Order approved, waiting for capture
        console.log('PayPal order approved:', eventBody.resource.id);
        break;
        
      case 'CHECKOUT.ORDER.COMPLETED':
        // Order completed (same as capture completed)
        await handlePaymentCaptureCompleted(eventBody, Project);
        break;
        
      default:
        console.log('Unhandled webhook event type:', eventBody.event_type);
    }

    // Mark webhook as processed
    await WebhookLog.findOneAndUpdate(
      { eventId: eventBody.id },
      { processed: true }
    );

    return res.status(200).json({ message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('PayPal Webhook Error:', error);
    
    // Log the error in the webhook log
    try {
      await WebhookLog.findOneAndUpdate(
        { eventId: req.body.id },
        { error: error.message }
      );
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// Handle successful payment capture
async function handlePaymentCaptureCompleted(eventBody, Project) {
  const captureId = eventBody.resource.id;
  const orderId = eventBody.resource.supplementary_data?.related_ids?.order_id;
  
  console.log('Processing payment capture completed:', {
    captureId,
    orderId,
    amount: eventBody.resource.amount
  });

  if (orderId) {
    // Update project payment status
    const project = await Project.findOne({ paypalOrderId: orderId });
    
    if (project) {
      await Project.findByIdAndUpdate(project._id, {
        paymentStatus: 'paid',
        paypalPaymentId: captureId
      });
      
      console.log('Project payment status updated to paid:', project._id);
    } else {
      console.log('No project found for PayPal order:', orderId);
    }
  }
}

// Handle payment capture denied/failed
async function handlePaymentCaptureDenied(eventBody, Project) {
  const orderId = eventBody.resource.supplementary_data?.related_ids?.order_id;
  
  console.log('Processing payment capture denied:', {
    orderId,
    amount: eventBody.resource.amount,
    reason: eventBody.resource.status_details
  });

  if (orderId) {
    // Update project to reflect failed payment
    const project = await Project.findOne({ paypalOrderId: orderId });
    
    if (project) {
      await Project.findByIdAndUpdate(project._id, {
        paymentStatus: 'pending', // Reset to pending for retry
        paypalPaymentId: null
      });
      
      console.log('Project payment status reset due to failed capture:', project._id);
    }
  }
}