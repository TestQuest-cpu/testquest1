const mongoose = require('mongoose');
const Project = require('../models/project');
require('dotenv').config();

// BugReport Schema (since it might not exist as a separate model file)
const bugReportSchema = new mongoose.Schema({
  title: String,
  description: String,
  stepsToReproduce: String,
  expectedBehavior: String,
  actualBehavior: String,
  severity: String,
  status: String,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    path: String,
    size: Number
  }],
  developerResponse: {
    message: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date
  },
  reward: {
    amount: Number,
    status: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },
  adminNotes: String
}, { timestamps: true });

const BugReport = mongoose.models.BugReport || mongoose.model('BugReport', bugReportSchema);

async function clearAllProjects() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connected to MongoDB');

    // Count existing records
    const projectCount = await Project.countDocuments();
    const bugReportCount = await BugReport.countDocuments();

    console.log(`📊 Found ${projectCount} projects and ${bugReportCount} bug reports in the database`);

    if (projectCount === 0 && bugReportCount === 0) {
      console.log('✅ No projects or bug reports to delete - database is clean');
      return;
    }

    // Delete all bug reports first (they reference projects)
    if (bugReportCount > 0) {
      console.log('🗑️  Deleting all bug reports...');
      const bugResult = await BugReport.deleteMany({});
      console.log(`✅ Successfully deleted ${bugResult.deletedCount} bug reports`);
    }

    // Delete all projects
    if (projectCount > 0) {
      console.log('🗑️  Deleting all projects...');
      const projectResult = await Project.deleteMany({});
      console.log(`✅ Successfully deleted ${projectResult.deletedCount} projects`);
    }

    // Verify deletion
    const remainingProjects = await Project.countDocuments();
    const remainingBugReports = await BugReport.countDocuments();

    console.log('📝 Cleanup Results:');
    console.log(`   - Projects remaining: ${remainingProjects}`);
    console.log(`   - Bug reports remaining: ${remainingBugReports}`);

    if (remainingProjects === 0 && remainingBugReports === 0) {
      console.log('🎉 Database cleanup completed successfully!');
    } else {
      console.log('⚠️  Warning: Some records may still remain');
    }

  } catch (error) {
    console.error('❌ Error clearing projects and bug reports:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

// Run the script
clearAllProjects();