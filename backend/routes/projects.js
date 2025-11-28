const express = require('express');
const Project = require('../models/project');
const { authenticateToken, requireDeveloper } = require('../middleware/auth');
const router = express.Router();

// Create new project
router.post('/', authenticateToken, requireDeveloper, async (req, res) => {
  try {
    const {
      name,
      platform,
      scope,
      objective,
      areasToTest,
      bugRewards,
      totalBounty,
      notes,
      projectLink,
      image
    } = req.body;

    // Validate required fields
    if (!name || !platform || !scope || !objective || !areasToTest || !totalBounty || !projectLink) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, platform, scope, objective, areasToTest, totalBounty, projectLink' 
      });
    }

    // Validate total bounty
    if (totalBounty <= 0) {
      return res.status(400).json({ message: 'Total bounty must be greater than 0' });
    }

    // Parse bug rewards if provided as string
    let parsedBugRewards = {};
    if (typeof bugRewards === 'string') {
      try {
        // Extract numbers from the bug rewards text
        const lines = bugRewards.split('\n');
        lines.forEach(line => {
          if (line.toLowerCase().includes('critical')) {
            const match = line.match(/\$?(\d+)/);
            if (match) parsedBugRewards.critical = parseInt(match[1]);
          } else if (line.toLowerCase().includes('major')) {
            const match = line.match(/\$?(\d+)/);
            if (match) parsedBugRewards.major = parseInt(match[1]);
          } else if (line.toLowerCase().includes('minor')) {
            const match = line.match(/\$?(\d+)/);
            if (match) parsedBugRewards.minor = parseInt(match[1]);
          }
        });
      } catch (error) {
        // If parsing fails, set defaults
        parsedBugRewards = { critical: 0, major: 0, minor: 0 };
      }
    } else {
      parsedBugRewards = bugRewards || { critical: 0, major: 0, minor: 0 };
    }

    const project = new Project({
      name,
      postedBy: req.user._id,
      platform,
      scope,
      objective,
      areasToTest,
      bugRewards: parsedBugRewards,
      totalBounty: parseFloat(totalBounty),
      notes: notes || '',
      projectLink,
      image: image || '',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await project.save();
    await project.populate('postedBy', 'name email');

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all projects (with filtering)
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const projects = await Project.find(filter)
      .populate('postedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(filter);

    res.json({
      projects,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('postedBy', 'name email avatar')
      .populate('approvedBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get projects by current user
router.get('/my/projects', authenticateToken, requireDeveloper, async (req, res) => {
  try {
    const projects = await Project.find({ postedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name email avatar');

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update project (only by owner)
router.put('/:id', authenticateToken, requireDeveloper, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project
    if (project.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own projects' });
    }

    // Don't allow updates if project is already approved or completed
    if (project.status === 'approved' || project.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update approved or completed projects' });
    }

    const allowedUpdates = ['name', 'platform', 'scope', 'objective', 'areasToTest', 'bugRewards', 'notes', 'projectLink', 'image'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('postedBy', 'name email avatar');

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete project (only by owner, only if pending)
router.delete('/:id', authenticateToken, requireDeveloper, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project
    if (project.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own projects' });
    }

    // Only allow deletion if project is still pending
    if (project.status !== 'pending') {
      return res.status(400).json({ message: 'Can only delete pending projects' });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;