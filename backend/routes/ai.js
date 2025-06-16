const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Since AI models aren't provided, I'll create them here
const mongoose = require('mongoose');

// AI Credit Schema
const aiCreditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalCredits: {
    type: Number,
    default: 100
  },
  usedCredits: {
    type: Number,
    default: 0
  },
  remainingCredits: {
    type: Number,
    default: 100
  },
  lastReset: {
    type: Date,
    default: Date.now
  },
  history: [{
    action: {
      type: String,
      enum: ['resume_generate', 'ats_check', 'roadmap_generate', 'credit_allocation'],
      required: true
    },
    creditsUsed: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Resume Generation Schema
const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  template: {
    type: String,
    required: true
  },
  personalInfo: {
    name: String,
    email: String,
    phone: String,
    location: String,
    linkedin: String,
    github: String
  },
  summary: String,
  experience: [{
    title: String,
    company: String,
    duration: String,
    description: String
  }],
  education: [{
    degree: String,
    institution: String,
    year: String,
    cgpa: String
  }],
  skills: [String],
  projects: [{
    name: String,
    description: String,
    technologies: [String],
    link: String
  }],
  achievements: [String],
  generatedContent: {
    type: String,
    required: true
  },
  creditsUsed: {
    type: Number,
    default: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ATS Report Schema
const atsReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeContent: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  analysis: {
    matchedKeywords: [String],
    missingKeywords: [String],
    suggestions: [String],
    formatScore: Number,
    contentScore: Number,
    keywordScore: Number
  },
  creditsUsed: {
    type: Number,
    default: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Roadmap Schema
const roadmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  targetRole: {
    type: String,
    required: true
  },
  currentLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  phases: [{
    title: String,
    duration: String,
    description: String,
    topics: [String],
    resources: [{
      title: String,
      type: String,
      url: String
    }],
    milestones: [String]
  }],
  creditsUsed: {
    type: Number,
    default: 15
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AICredit = mongoose.model('AICredit', aiCreditSchema);
const Resume = mongoose.model('Resume', resumeSchema);
const ATSReport = mongoose.model('ATSReport', atsReportSchema);
const Roadmap = mongoose.model('Roadmap', roadmapSchema);

// GET /api/ai/credits/:userId - Get user's AI credits
router.get('/credits/:userId', async (req, res) => {
  try {
    let credits = await AICredit.findOne({ user: req.params.userId });
    
    if (!credits) {
      // Create initial credits for user
      credits = new AICredit({
        user: req.params.userId,
        totalCredits: 100,
        usedCredits: 0,
        remainingCredits: 100
      });
      await credits.save();
    }

    res.json({
      success: true,
      data: credits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching AI credits',
      error: error.message
    });
  }
});

// PUT /api/ai/credits/:userId - Update user's AI credits
router.put('/credits/:userId', [
  body('creditsToAdd').isInt({ min: 0 }).withMessage('Credits to add must be a positive number')
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

    const { creditsToAdd } = req.body;
    
    let credits = await AICredit.findOne({ user: req.params.userId });
    
    if (!credits) {
      credits = new AICredit({
        user: req.params.userId,
        totalCredits: creditsToAdd,
        remainingCredits: creditsToAdd
      });
    } else {
      credits.totalCredits += creditsToAdd;
      credits.remainingCredits += creditsToAdd;
    }

    credits.history.push({
      action: 'credit_allocation',
      creditsUsed: -creditsToAdd, // Negative because it's adding credits
      details: `Added ${creditsToAdd} credits`
    });

    await credits.save();

    res.json({
      success: true,
      message: 'Credits updated successfully',
      data: credits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating AI credits',
      error: error.message
    });
  }
});

// POST /api/ai/resume/generate - Generate resume using AI
router.post('/resume/generate', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('template').notEmpty().withMessage('Template is required'),
  body('personalInfo').isObject().withMessage('Personal info is required'),
  body('experience').isArray().withMessage('Experience must be an array'),
  body('education').isArray().withMessage('Education must be an array'),
  body('skills').isArray().withMessage('Skills must be an array')
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

    const { userId } = req.body;
    const creditsRequired = 10;

    // Check user credits
    const credits = await AICredit.findOne({ user: userId });
    if (!credits || credits.remainingCredits < creditsRequired) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient AI credits'
      });
    }

    // Mock AI resume generation (replace with actual AI service)
    const generatedContent = `
# ${req.body.personalInfo.name}
${req.body.personalInfo.email} | ${req.body.personalInfo.phone}

## Professional Summary
${req.body.summary || 'Motivated professional with strong technical skills and passion for innovation.'}

## Experience
${req.body.experience.map(exp => `
### ${exp.title} at ${exp.company}
${exp.duration}
${exp.description}
`).join('')}

## Education
${req.body.education.map(edu => `
### ${edu.degree}
${edu.institution} (${edu.year}) - CGPA: ${edu.cgpa}
`).join('')}

## Skills
${req.body.skills.join(', ')}

## Projects
${req.body.projects ? req.body.projects.map(project => `
### ${project.name}
${project.description}
Technologies: ${project.technologies.join(', ')}
`).join('') : ''}
    `;

    // Create resume record
    const resume = new Resume({
      ...req.body,
      user: userId,
      generatedContent,
      creditsUsed: creditsRequired
    });
    await resume.save();

    // Deduct credits
    credits.usedCredits += creditsRequired;
    credits.remainingCredits -= creditsRequired;
    credits.history.push({
      action: 'resume_generate',
      creditsUsed: creditsRequired,
      details: `Generated resume using ${req.body.template} template`
    });
    await credits.save();

    res.status(201).json({
      success: true,
      message: 'Resume generated successfully',
      data: {
        resume,
        creditsRemaining: credits.remainingCredits
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating resume',
      error: error.message
    });
  }
});

// POST /api/ai/ats/check - Check resume against job description
router.post('/ats/check', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('resumeContent').notEmpty().withMessage('Resume content is required'),
  body('jobDescription').notEmpty().withMessage('Job description is required')
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

    const { userId, resumeContent, jobDescription } = req.body;
    const creditsRequired = 5;

    // Check user credits
    const credits = await AICredit.findOne({ user: userId });
    if (!credits || credits.remainingCredits < creditsRequired) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient AI credits'
      });
    }

    // Mock ATS analysis (replace with actual AI service)
    const jobKeywords = jobDescription.toLowerCase().split(' ')
      .filter(word => word.length > 3)
      .slice(0, 20);
    
    const resumeWords = resumeContent.toLowerCase().split(' ');
    const matchedKeywords = jobKeywords.filter(keyword => 
      resumeWords.some(word => word.includes(keyword))
    );
    
    const missingKeywords = jobKeywords.filter(keyword => 
      !resumeWords.some(word => word.includes(keyword))
    );

    const keywordScore = Math.round((matchedKeywords.length / jobKeywords.length) * 100);
    const formatScore = Math.floor(Math.random() * 20) + 80; // Mock format score
    const contentScore = Math.floor(Math.random() * 30) + 70; // Mock content score
    const overallScore = Math.round((keywordScore + formatScore + contentScore) / 3);

    const analysis = {
      matchedKeywords: matchedKeywords.slice(0, 10),
      missingKeywords: missingKeywords.slice(0, 10),
      suggestions: [
        'Include more relevant keywords from the job description',
        'Add quantifiable achievements and metrics',
        'Optimize section headings for ATS readability',
        'Use standard formatting and avoid graphics'
      ],
      formatScore,
      contentScore,
      keywordScore
    };

    // Create ATS report
    const atsReport = new ATSReport({
      user: userId,
      resumeContent,
      jobDescription,
      score: overallScore,
      analysis,
      creditsUsed: creditsRequired
    });
    await atsReport.save();

    // Deduct credits
    credits.usedCredits += creditsRequired;
    credits.remainingCredits -= creditsRequired;
    credits.history.push({
      action: 'ats_check',
      creditsUsed: creditsRequired,
      details: `ATS analysis completed with score: ${overallScore}`
    });
    await credits.save();

    res.status(201).json({
      success: true,
      message: 'ATS analysis completed',
      data: {
        report: atsReport,
        creditsRemaining: credits.remainingCredits
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error performing ATS check',
      error: error.message
    });
  }
});

// POST /api/ai/roadmap/generate - Generate learning roadmap
router.post('/roadmap/generate', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('targetRole').notEmpty().withMessage('Target role is required'),
  body('currentLevel').isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Current level must be beginner, intermediate, or advanced'),
  body('duration').notEmpty().withMessage('Duration is required')
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

    const { userId, targetRole, currentLevel, duration } = req.body;
    const creditsRequired = 15;

    // Check user credits
    const credits = await AICredit.findOne({ user: userId });
    if (!credits || credits.remainingCredits < creditsRequired) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient AI credits'
      });
    }

    // Mock roadmap generation (replace with actual AI service)
    const phases = [
      {
        title: 'Foundation Phase',
        duration: '2-3 months',
        description: 'Build fundamental skills and understanding',
        topics: ['Basic Concepts', 'Core Technologies', 'Development Environment'],
        resources: [
          { title: 'Documentation', type: 'docs', url: '#' },
          { title: 'Online Course', type: 'course', url: '#' }
        ],
        milestones: ['Complete basic projects', 'Pass certification exam']
      },
      {
        title: 'Intermediate Phase',
        duration: '3-4 months',
        description: 'Develop practical skills and experience',
        topics: ['Advanced Concepts', 'Best Practices', 'Real Projects'],
        resources: [
          { title: 'Advanced Tutorial', type: 'tutorial', url: '#' },
          { title: 'Practice Platform', type: 'platform', url: '#' }
        ],
        milestones: ['Build portfolio projects', 'Contribute to open source']
      },
      {
        title: 'Advanced Phase',
        duration: '2-3 months',
        description: 'Master advanced topics and prepare for roles',
        topics: ['System Design', 'Leadership', 'Industry Standards'],
        resources: [
          { title: 'System Design Course', type: 'course', url: '#' },
          { title: 'Industry Blog', type: 'blog', url: '#' }
        ],
        milestones: ['Complete capstone project', 'Interview preparation']
      }
    ];

    const roadmap = new Roadmap({
      user: userId,
      title: `${targetRole} Learning Roadmap`,
      targetRole,
      currentLevel,
      duration,
      phases,
      creditsUsed: creditsRequired
    });
    await roadmap.save();

    // Deduct credits
    credits.usedCredits += creditsRequired;
    credits.remainingCredits -= creditsRequired;
    credits.history.push({
      action: 'roadmap_generate',
      creditsUsed: creditsRequired,
      details: `Generated roadmap for ${targetRole}`
    });
    await credits.save();

    res.status(201).json({
      success: true,
      message: 'Learning roadmap generated successfully',
      data: {
        roadmap,
        creditsRemaining: credits.remainingCredits
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating roadmap',
      error: error.message
    });
  }
});

// GET /api/ai/credits/:userId/history - Get user's credit usage history
router.get('/credits/:userId/history', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const credits = await AICredit.findOne({ user: req.params.userId });
    
    if (!credits) {
      return res.status(404).json({
        success: false,
        message: 'No credit history found'
      });
    }

    const history = credits.history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: {
        history,
        totalCredits: credits.totalCredits,
        usedCredits: credits.usedCredits,
        remainingCredits: credits.remainingCredits
      },
      pagination: {
        current: page,
        total: credits.history.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching credit history',
      error: error.message
    });
  }
});

// POST /api/ai/credits/bulk-allocate - Bulk allocate credits to multiple users
router.post('/credits/bulk-allocate', [
  body('users').isArray().withMessage('Users must be an array'),
  body('credits').isInt({ min: 1 }).withMessage('Credits must be a positive number')
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

    const { users, credits: creditsToAdd } = req.body;
    const results = [];

    for (const userId of users) {
      try {
        let userCredits = await AICredit.findOne({ user: userId });
        
        if (!userCredits) {
          userCredits = new AICredit({
            user: userId,
            totalCredits: creditsToAdd,
            remainingCredits: creditsToAdd
          });
        } else {
          userCredits.totalCredits += creditsToAdd;
          userCredits.remainingCredits += creditsToAdd;
        }

        userCredits.history.push({
          action: 'credit_allocation',
          creditsUsed: -creditsToAdd,
          details: `Bulk allocation: Added ${creditsToAdd} credits`
        });

        await userCredits.save();
        results.push({ userId, success: true });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Credits allocated to ${successCount}/${users.length} users`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error bulk allocating credits',
      error: error.message
    });
  }
});

module.exports = router;