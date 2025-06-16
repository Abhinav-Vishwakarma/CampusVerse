const express = require('express');
const router = express.Router();
const Placement = require('../models/Placement');
const { body, validationResult } = require('express-validator');

// GET /api/placements - Get all placements with filters
router.get('/', async (req, res) => {
  try {
    const { company, location, salary, active, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (company) filter.company = { $regex: company, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (active !== undefined) filter.isActive = active === 'true';
    if (salary) {
      filter['salary.min'] = { $lte: parseInt(salary) };
    }

    const placements = await Placement.find(filter)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Placement.countDocuments(filter);

    res.json({
      success: true,
      data: placements,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching placements',
      error: error.message
    });
  }
});

// GET /api/placements/stats - Get placement statistics
router.get('/stats', async (req, res) => {
  try {
    const totalPlacements = await Placement.countDocuments({ isActive: true });
    const totalApplications = await Placement.aggregate([
      { $match: { isActive: true } },
      { $project: { applicationCount: { $size: '$applications' } } },
      { $group: { _id: null, total: { $sum: '$applicationCount' } } }
    ]);

    const placementsByCompany = await Placement.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const applicationStats = await Placement.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$applications' },
      { $group: { _id: '$applications.status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalPlacements,
        totalApplications: totalApplications[0]?.total || 0,
        placementsByCompany,
        applicationStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching placement statistics',
      error: error.message
    });
  }
});

// GET /api/placements/:id - Get single placement
router.get('/:id', async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id)
      .populate('postedBy', 'name email')
      .populate('applications.student', 'name email branch');

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: 'Placement not found'
      });
    }

    res.json({
      success: true,
      data: placement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching placement',
      error: error.message
    });
  }
});

// POST /api/placements - Create new placement
router.post('/', [
  body('jobTitle').notEmpty().withMessage('Job title is required'),
  body('company').notEmpty().withMessage('Company is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('salary.min').isNumeric().withMessage('Minimum salary must be a number'),
  body('salary.max').isNumeric().withMessage('Maximum salary must be a number'),
  body('applicationDeadline').isISO8601().withMessage('Valid deadline date is required'),
  body('postedBy').notEmpty().withMessage('Posted by user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const placement = new Placement(req.body);
    await placement.save();

    const populatedPlacement = await Placement.findById(placement._id)
      .populate('postedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Placement created successfully',
      data: populatedPlacement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating placement',
      error: error.message
    });
  }
});

// PUT /api/placements/:id - Update placement
router.put('/:id', async (req, res) => {
  try {
    const placement = await Placement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('postedBy', 'name email');

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: 'Placement not found'
      });
    }

    res.json({
      success: true,
      message: 'Placement updated successfully',
      data: placement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating placement',
      error: error.message
    });
  }
});

// DELETE /api/placements/:id - Delete placement
router.delete('/:id', async (req, res) => {
  try {
    const placement = await Placement.findByIdAndDelete(req.params.id);

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: 'Placement not found'
      });
    }

    res.json({
      success: true,
      message: 'Placement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting placement',
      error: error.message
    });
  }
});

// POST /api/placements/:id/apply - Student applies to placement
router.post('/:id/apply', [
  body('student').notEmpty().withMessage('Student ID is required'),
  body('coverLetter').notEmpty().withMessage('Cover letter is required'),
  body('resume').notEmpty().withMessage('Resume is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const placement = await Placement.findById(req.params.id);
    if (!placement) {
      return res.status(404).json({
        success: false,
        message: 'Placement not found'
      });
    }

    // Check if student already applied
    const existingApplication = placement.applications.find(
      app => app.student.toString() === req.body.student
    );

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Student has already applied to this placement'
      });
    }

    // Check if deadline has passed
    if (new Date() > placement.applicationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed'
      });
    }

    placement.applications.push({
      student: req.body.student,
      coverLetter: req.body.coverLetter,
      resume: req.body.resume
    });

    await placement.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
});

// PUT /api/placements/:id/applications/:applicationId - Update application status
router.put('/:id/applications/:applicationId', [
  body('status').isIn(['pending', 'shortlisted', 'rejected', 'selected'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const placement = await Placement.findById(req.params.id);
    if (!placement) {
      return res.status(404).json({
        success: false,
        message: 'Placement not found'
      });
    }

    const application = placement.applications.id(req.params.applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = req.body.status;
    application.updatedAt = new Date();

    await placement.save();

    res.json({
      success: true,
      message: 'Application status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
});

// GET /api/placements/students/:studentId/placement-applications
router.get('/students/:studentId/placement-applications', async (req, res) => {
  try {
    const placements = await Placement.find({
      'applications.student': req.params.studentId
    }).populate('postedBy', 'name email');

    const applications = [];
    placements.forEach(placement => {
      const studentApplication = placement.applications.find(
        app => app.student.toString() === req.params.studentId
      );
      
      if (studentApplication) {
        applications.push({
          _id: studentApplication._id,
          placement: {
            _id: placement._id,
            jobTitle: placement.jobTitle,
            company: placement.company,
            location: placement.location,
            salary: placement.salary
          },
          status: studentApplication.status,
          appliedAt: studentApplication.appliedAt,
          updatedAt: studentApplication.updatedAt
        });
      }
    });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student applications',
      error: error.message
    });
  }
});

// GET /api/placements/:id/applications - Get all applications for a placement
router.get('/:id/applications', async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id)
      .populate('applications.student', 'name email branch cgpa');

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: 'Placement not found'
      });
    }

    res.json({
      success: true,
      data: placement.applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

module.exports = router;