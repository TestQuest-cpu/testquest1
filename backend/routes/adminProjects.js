const express = require('express');
const { authenticateAdmin, logAdminAction } = require('../middleware/adminAuth');
const Project = require('../models/project');
const router = express.Router();

// Get all projects with filtering (admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const projects = await Project.find(filter)
      .populate('postedBy', 'name email avatar')
      .populate('approvedBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(filter);

    res.json({
      projects,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Admin projects fetch error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Get project by ID (admin only)
router.get('/:projectId', authenticateAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('postedBy', 'name email avatar')
      .populate('approvedBy', 'username email');

    if (!project) {
      return res.status(404).json({ 
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    res.json({ project });
  } catch (error) {
    console.error('Admin project fetch error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Approve project (admin only)
router.patch('/:projectId/approve', authenticateAdmin, logAdminAction('APPROVE_PROJECT'), async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    if (project.status !== 'pending') {
      return res.status(400).json({ 
        message: `Project is already ${project.status}`,
        code: 'INVALID_STATUS'
      });
    }

    // Update project status
    project.status = 'approved';
    project.approvedBy = req.admin._id;
    project.approvedAt = new Date();
    await project.save();

    // Populate for response
    await project.populate('postedBy', 'name email');
    await project.populate('approvedBy', 'username email');

    console.log(`[ADMIN PROJECT APPROVAL] ${new Date().toISOString()} - Admin ${req.admin.username} approved project "${project.name}" (ID: ${project._id}) by ${project.postedBy.name}`);

    res.json({
      message: 'Project approved successfully',
      project
    });
  } catch (error) {
    console.error('Project approval error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Reject project (admin only)
router.patch('/:projectId/reject', authenticateAdmin, logAdminAction('REJECT_PROJECT'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { reason } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    if (project.status !== 'pending') {
      return res.status(400).json({ 
        message: `Project is already ${project.status}`,
        code: 'INVALID_STATUS'
      });
    }

    // Update project status
    project.status = 'rejected';
    project.approvedBy = req.admin._id; // Track who rejected it
    project.rejectedAt = new Date();
    project.rejectionReason = reason || 'No reason provided';
    await project.save();

    // Populate for response
    await project.populate('postedBy', 'name email');
    await project.populate('approvedBy', 'username email');

    console.log(`[ADMIN PROJECT REJECTION] ${new Date().toISOString()} - Admin ${req.admin.username} rejected project "${project.name}" (ID: ${project._id}) by ${project.postedBy.name}. Reason: ${project.rejectionReason}`);

    res.json({
      message: 'Project rejected successfully',
      project
    });
  } catch (error) {
    console.error('Project rejection error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Get project statistics (admin only)
router.get('/stats/overview', authenticateAdmin, async (req, res) => {
  try {
    const [
      totalProjects,
      pendingProjects,
      approvedProjects,
      rejectedProjects,
      completedProjects
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'pending' }),
      Project.countDocuments({ status: 'approved' }),
      Project.countDocuments({ status: 'rejected' }),
      Project.countDocuments({ status: 'completed' })
    ]);

    res.json({
      totalProjects,
      pendingProjects,
      approvedProjects,
      rejectedProjects,
      completedProjects
    });
  } catch (error) {
    console.error('Project stats error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;