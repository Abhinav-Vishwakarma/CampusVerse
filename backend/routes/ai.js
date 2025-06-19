const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require("@google/generative-ai")
const fs = require("fs")
const path = require("path");
const multer = require("multer")
const pdfParse = require("pdf-parse")
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
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

// Roadmap Schema with flexible "roadmap" field
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
  phases: {
    type: mongoose.Schema.Types.Mixed, 
    required: true
  },
  creditsUsed: {
    type: Number,
    default: 15
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Use disk storage with auto filename
const upload = multer({ dest: "uploads/" });
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

    // Build a detailed prompt for Gemini
    const prompt = `
You are a professional resume writer. Generate a modern, ATS-friendly resume in markdown format using the following data:
- Name: ${req.body.personalInfo.name}
- Email: ${req.body.personalInfo.email}
- Phone: ${req.body.personalInfo.phone}
- Location: ${req.body.personalInfo.location}
- LinkedIn: ${req.body.personalInfo.linkedin}
- GitHub: ${req.body.personalInfo.github}
- Summary: ${req.body.summary}
- Experience: ${req.body.experience.map(exp => `
  - Title: ${exp.title}
  - Company: ${exp.company}
  - Duration: ${exp.duration}
  - Description: ${exp.description}
`).join('\n')}
- Education: ${req.body.education.map(edu => `
  - Degree: ${edu.degree}
  - Institution: ${edu.institution}
  - Year: ${edu.year}
  - CGPA: ${edu.cgpa}
`).join('\n')}
- Skills: ${req.body.skills.join(', ')}
- Projects: ${req.body.projects ? req.body.projects.map(project => `
  - Name: ${project.name}
  - Description: ${project.description}
  - Technologies: ${project.technologies.join(', ')}
  - Link: ${project.link}
`).join('\n') : ''}
- Achievements: ${req.body.achievements?.join(', ')}

Format the resume with clear sections, bold headings, and bullet points where appropriate. Use only markdown.
    `;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(prompt)
    const generatedContent = result.response.text()

    // Create resume record
    const resume = new Resume({
      ...req.body,
      user: req.body.userId,
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

// // POST /api/ai/ats/check - Check resume against job description
router.post("/ats/check", upload.single("file"), async (req, res) => {
  console.log(req.body)
  const { userId, jobDescription } = req.body;
  const filePath = req.file?.path;

  if (!userId || !filePath || !jobDescription) {
    if (filePath) fs.unlink(filePath, () => {});
    return res.status(400).json({
      success: false,
      message: "User ID, resume file, and job description are required"
    });
  }

  try {
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(pdfBuffer);
    const resumeContent = pdfData.text;

    // Clean up temp file
    fs.unlink(filePath, (err) => {
      if (err) console.warn("File cleanup error:", err.message);
    });

    const creditsRequired = 5;

    // Check credits
    const credits = await AICredit.findOne({ user: userId });
    if (!credits || credits.remainingCredits < creditsRequired) {
      return res.status(400).json({
        success: false,
        message: "Insufficient AI credits"
      });
    }

    // Gemini prompt
    const prompt = `
You are an ATS (Applicant Tracking System) expert. Analyze the following resume (in plain text) against the provided job description. 
- Give an overall ATS compatibility score (0–100).
- List matched keywords, missing keywords, and provide at least 3 actionable suggestions for improvement.
- Also, provide a format score, content score, and keyword score (each 0–100).
Return the result as a JSON object with keys: score, analysis { matchedKeywords, missingKeywords, suggestions, formatScore, contentScore, keywordScore }.

Resume:
${resumeContent}

Job Description:
${jobDescription}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    let analysisResult;
    try {
      analysisResult = JSON.parse(result.response.text());
    } catch (e) {
      const match = result.response.text().match(/\{[\s\S]*\}/);
      analysisResult = match ? JSON.parse(match[0]) : null;
    }

    if (!analysisResult) throw new Error("Gemini response not in expected format");

    const atsReport = new ATSReport({
      user: userId,
      resumeContent,
      jobDescription,
      score: analysisResult.score,
      analysis: analysisResult.analysis,
      creditsUsed: creditsRequired
    });

    await atsReport.save();
    credits.usedCredits += creditsRequired;
    credits.remainingCredits -= creditsRequired;
    credits.history.push({
      action: "ats_check",
      creditsUsed: creditsRequired,
      details: `ATS analysis completed with score: ${analysisResult.score}`
    });
    await credits.save();

    res.status(201).json({
      success: true,
      message: "ATS analysis completed",
      data: {
        report: atsReport,
        creditsRemaining: credits.remainingCredits
      }
    });
  } catch (error) {
    if (filePath) fs.unlink(filePath, () => {});
    res.status(500).json({
      success: false,
      message: "Error performing ATS check",
      error: error.message
    });
  }
});
// router.post('/ats/check', [
//   body('userId').notEmpty().withMessage('User ID is required'),
//   body('resumeContent').notEmpty().withMessage('Resume content is required'),
//   body('jobDescription').notEmpty().withMessage('Job description is required')
// ], async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation errors',
//         errors: errors.array()
//       });
//     }

//     const { userId, resumeContent, jobDescription } = req.body;
//     const creditsRequired = 5;

//     // Check user credits
//     const credits = await AICredit.findOne({ user: userId });
//     if (!credits || credits.remainingCredits < creditsRequired) {
//       return res.status(400).json({
//         success: false,
//         message: 'Insufficient AI credits'
//       });
//     }

//     // Gemini prompt for ATS
//     const prompt = `
// You are an ATS (Applicant Tracking System) expert. Analyze the following resume (in plain text) against the provided job description. 
// - Give an overall ATS compatibility score (0-100).
// - List matched keywords, missing keywords, and provide at least 3 actionable suggestions for improvement.
// - Also, provide a format score, content score, and keyword score (each 0-100).
// Return the result as a JSON object with keys: score, analysis { matchedKeywords, missingKeywords, suggestions, formatScore, contentScore, keywordScore }.


// Resume:
// ${req.body.resumeContent}

// Job Description:
// ${req.body.jobDescription}
//     `
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
//     const result = await model.generateContent(prompt)
//     // Parse Gemini's JSON response
//     let analysisResult
//     try {
//       analysisResult = JSON.parse(result.response.text())
//     } catch (e) {
//       // fallback: try to extract JSON from text
//       const match = result.response.text().match(/\{[\s\S]*\}/)
//       analysisResult = match ? JSON.parse(match[0]) : null
//     }
//     if (!analysisResult) throw new Error("Gemini response not in expected format")

//     // Create ATS report
//     const atsReport = new ATSReport({
//       user: req.body.userId,
//       resumeContent: req.body.resumeContent,
//       jobDescription: req.body.jobDescription,
//       score: analysisResult.score,
//       analysis: analysisResult.analysis,
//       creditsUsed: creditsRequired
//     })
//     await atsReport.save()
//     credits.usedCredits += creditsRequired
//     credits.remainingCredits -= creditsRequired
//     credits.history.push({
//       action: 'ats_check',
//       creditsUsed: creditsRequired,
//       details: `ATS analysis completed with score: ${analysisResult.score}`
//     })
//     await credits.save()

//     res.status(201).json({
//       success: true,
//       message: 'ATS analysis completed',
//       data: {
//         report: atsReport,
//         creditsRemaining: credits.remainingCredits
//       }
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error performing ATS check',
//       error: error.message
//     })
//   }
// });

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

    // Gemini prompt for roadmap
    const prompt = `
You are a career coach. Generate a detailed learning roadmap as a JSON object for a student who wants to become a "${targetRole}".
The roadmap must strictly match this schema:
{
  "title": String,
  "targetRole": String,
  "currentLevel": String, // One of: "beginner", "intermediate", "advanced" (all lowercase)
  "duration": String,
  "phases": [
    {
      "title": String,
      "duration": String,
      "description": String,
      "topics": [String],
      "resources": [
        {
          "title": String,
          "type": String,
          "url": String
        }
      ],
      "milestones": [String]
    }
  ]
}

Example:
{
  "title": "Full Stack Developer Roadmap",
  "targetRole": "Full Stack Developer",
  "currentLevel": "beginner",
  "duration": "6 months",
  "phases": [
    {
      "title": "Phase 1: Basics of Web Development",
      "duration": "1 month",
      "description": "Learn HTML, CSS, and JavaScript fundamentals.",
      "topics": ["HTML", "CSS", "JavaScript Basics"],
      "resources": [
        { "title": "HTML Crash Course", "type": "video", "url": "https://example.com/html" }
      ],
      "milestones": ["Build a static website"]
    }
    // ...more phases...
  ]
}

Now, generate a roadmap for:
- Target Role: ${targetRole}
- Current Level: ${currentLevel.toLowerCase()}
- Duration: ${duration}

Return only the JSON object, nothing else.
`

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
const result = await model.generateContent(prompt)

let roadmapObj
try {
  roadmapObj = JSON.parse(result.response.text())
} catch (e) {
  const match = result.response.text().match(/\{[\s\S]*\}/)
  roadmapObj = match ? JSON.parse(match[0]) : null
}
if (!roadmapObj) throw new Error("Gemini response not in expected format")

// Ensure currentLevel is lowercase
roadmapObj.currentLevel = (roadmapObj.currentLevel || '').toLowerCase();

const roadmap = new Roadmap({
  user: req.body.userId,
  ...roadmapObj,
  creditsUsed: creditsRequired
})
await roadmap.save()
credits.usedCredits += creditsRequired
credits.remainingCredits -= creditsRequired
credits.history.push({
  action: 'roadmap_generate',
  creditsUsed: creditsRequired,
  details: `Generated roadmap for ${req.body.targetRole}`
})
await credits.save()

res.status(201).json({
  success: true,
  message: 'Learning roadmap generated successfully',
  data: {
    roadmap,
    creditsRemaining: credits.remainingCredits
  }
})
} catch (error) {
  res.status(500).json({
    success: false,
    message: 'Error generating roadmap',
    error: error.message
  })
}
});
// GET /api/ai/roadmap/ - Fetech User Roadmaps
router.get("/roadmaps", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const roadmaps = await Roadmap.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: roadmaps });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching roadmaps", error: error.message });
  }
});

// DELETE /api/ai/roadmap/roadmaps/:roadmapId - Delete User Roadmap
router.delete("/roadmaps/:roadmapId", async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const deleted = await Roadmap.findByIdAndDelete(roadmapId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Roadmap not found" });
    }

    res.status(200).json({ success: true, message: "Roadmap deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting roadmap", error: error.message });
  }
});

// GET /api/ai/resumes/ - Fetech User Roadmaps
router.get("/resumes", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const roadmaps = await Resume.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: roadmaps });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching resume", error: error.message });
  }
});

// DELETE /api/ai/roadmap/roadmaps/:roadmapId - Delete User Roadmap
router.delete("/resumes/:resumeId", async (req, res) => {
  try {
    const { resumeId } = req.params;
    const deleted = await Resume.findByIdAndDelete(resumeId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    res.status(200).json({ success: true, message: "Resume deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting resume", error: error.message });
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



// POST /api/ai/ats/upload
router.post('/ats/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" })
    }
    const dataBuffer = fs.readFileSync(req.file.path)
    const pdfData = await pdfParse(dataBuffer)
    fs.unlinkSync(req.file.path) // Clean up
    res.json({ success: true, text: pdfData.text })
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to extract PDF text", error: error.message })
  }
})

module.exports = router;