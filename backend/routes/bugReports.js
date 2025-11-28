const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const BugReport = require('../models/bugreport');
const Project = require('../models/project');
const User = require('../models/user');

// Create a new bug report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      projectId
    } = req.body;

    // Validate required fields
    if (!title || !description || !stepsToReproduce || !expectedBehavior || !actualBehavior || !severity || !projectId) {
      return res.status(400).json({
        message: 'All fields are required: title, description, stepsToReproduce, expectedBehavior, actualBehavior, severity, projectId'
      });
    }

    // Verify the project exists and is approved
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status !== 'approved') {
      return res.status(400).json({ message: 'Can only submit bug reports for approved projects' });
    }

    // Create the bug report
    const bugReport = new BugReport({
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      submittedBy: req.user.id,
      project: projectId
    });

    await bugReport.save();

    // Add bug report to project's bug reports array
    project.bugReports.push(bugReport._id);
    await project.save();

    // Populate the bug report with user and project data
    const populatedBugReport = await BugReport.findById(bugReport._id)
      .populate('submittedBy', 'name email')
      .populate('project', 'name');

    res.status(201).json({
      message: 'Bug report submitted successfully',
      bugReport: populatedBugReport
    });

  } catch (error) {
    console.error('Error creating bug report:', error);
    res.status(500).json({ message: 'Server error while creating bug report' });
  }
});

// Get bug reports for a project
router.get('/', async (req, res) => {
  try {
    const { projectId, status, severity, page = 1, limit = 10 } = req.query;

    // Build filter query
    const filter = {};
    if (projectId) filter.project = projectId;
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const bugReports = await BugReport.find(filter)
      .populate('submittedBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BugReport.countDocuments(filter);

    res.json({
      bugReports,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({ message: 'Server error while fetching bug reports' });
  }
});

// Get user's bug reports
router.get('/my-reports', authenticateToken, async (req, res) => {
  try {
    const { status, severity, page = 1, limit = 10 } = req.query;

    // Build filter query
    const filter = { submittedBy: req.user.id };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const bugReports = await BugReport.find(filter)
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BugReport.countDocuments(filter);

    res.json({
      bugReports,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching user bug reports:', error);
    res.status(500).json({ message: 'Server error while fetching bug reports' });
  }
});

// Get a specific bug report
router.get('/:bugReportId', async (req, res) => {
  try {
    const bugReport = await BugReport.findById(req.params.bugReportId)
      .populate('submittedBy', 'name email')
      .populate('project', 'name')
      .populate('developerResponse.respondedBy', 'name');

    if (!bugReport) {
      return res.status(404).json({ message: 'Bug report not found' });
    }

    res.json({ bugReport });

  } catch (error) {
    console.error('Error fetching bug report:', error);
    res.status(500).json({ message: 'Server error while fetching bug report' });
  }
});

// Update bug report status (approve/reject) - for project owners/admins
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { bugReportId, action, developerResponse } = req.body;

    if (!bugReportId || !action) {
      return res.status(400).json({ message: 'Bug report ID and action are required' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either approve or reject' });
    }

    const bugReport = await BugReport.findById(bugReportId).populate('project');
    if (!bugReport) {
      return res.status(404).json({ message: 'Bug report not found' });
    }

    // Check if user is the project owner
    if (bugReport.project.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only project owner can approve/reject bug reports' });
    }

    if (bugReport.status !== 'pending') {
      return res.status(400).json({ message: 'Bug report has already been processed' });
    }

    // Update bug report
    bugReport.status = action === 'approve' ? 'approved' : 'rejected';
    bugReport.developerResponse = {
      message: developerResponse || `Bug report has been ${action}d.`,
      respondedBy: req.user.id,
      respondedAt: new Date()
    };

    if (action === 'approve') {
      // Calculate reward amount based on project's bug rewards
      const project = bugReport.project;
      const rewardAmount = project.bugRewards[bugReport.severity] || 0;

      bugReport.reward = {
        amount: rewardAmount,
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date()
      };

      // Update project's remaining bounty
      project.remainingBounty = Math.max(0, project.remainingBounty - rewardAmount);
      await project.save();

      // Update user's balance and total earnings
      const user = await User.findById(bugReport.submittedBy);
      if (user) {
        user.balance = (user.balance || 0) + rewardAmount;
        user.totalEarnings = (user.totalEarnings || 0) + rewardAmount;
        await user.save();
      }
    }

    await bugReport.save();

    res.json({
      message: `Bug report ${action}d successfully`,
      bugReport,
      updatedProjectBounty: bugReport.project.remainingBounty
    });

  } catch (error) {
    console.error('Error updating bug report:', error);
    res.status(500).json({ message: 'Server error while updating bug report' });
  }
});

module.exports = router;