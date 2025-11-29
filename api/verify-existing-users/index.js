const mongoose = require('mongoose');

// User Schema
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
  totalEarnings: { type: Number, default: 0, min: 0 },
  totalCreditsAcquired: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    isConnected = true;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    // Update all existing users to verified
    const result = await User.updateMany(
      { isEmailVerified: false },
      { $set: { isEmailVerified: true } }
    );

    return res.json({
      success: true,
      message: `✓ Auto-verified ${result.modifiedCount} existing users`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error verifying users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying users',
      error: error.message
    });
  }
};
