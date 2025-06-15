const express = require('express');
const router = express.Router();
const { Note, PYQ } = require('../models/Note');
const { body, validationResult } = require('express-validator');

// GET /api/notes - Get all notes with filters
router.get('/', async (req, res) => {
  try {
    const { 
      course, 
      semester, 
      branch, 
      subject, 
      tags, 
      search,
      page = 1, 
      limit = 10 
    } = req.query;
    
    let filter = { isActive: true };
    
    if (course) filter.course = course;
    if (semester) filter.semester = parseInt(semester);
    if (branch) filter.branch = { $regex: branch, $options: 'i' };
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const notes = await Note.find(filter)
      .populate('uploadedBy', 'name email')
      .populate('course', 'name')
      .populate('likes', 'name')
      .populate('comments.user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Note.countDocuments(filter);

    res.json({
      success: true,
      data: notes,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notes',
      error: error.message
    });
  }
});

// GET /api/notes/:id - Get single note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('course', 'name')
      .populate('likes', 'name')
      .populate('comments.user', 'name');

    if (!note || !note.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching note',
      error: error.message
    });
  }
});

// POST /api/notes - Create new note
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('course').notEmpty().withMessage('Course is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1-8'),
  body('branch').notEmpty().withMessage('Branch is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('uploadedBy').notEmpty().withMessage('Uploaded by user ID is required')
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

    const note = new Note(req.body);
    await note.save();

    const populatedNote = await Note.findById(note._id)
      .populate('uploadedBy', 'name email')
      .populate('course', 'name');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: populatedNote
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating note',
      error: error.message
    });
  }
});

// PUT /api/notes/:id - Update note
router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email')
     .populate('course', 'name');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: note
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating note',
      error: error.message
    });
  }
});

// DELETE /api/notes/:id - Delete note (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting note',
      error: error.message
    });
  }
});

// GET /api/notes/pyqs - Get Previous Year Questions
router.get('/pyqs', async (req, res) => {
  try {
    const { 
      course, 
      semester, 
      branch, 
      year, 
      examType,
      page = 1, 
      limit = 10 
    } = req.query;
    
    let filter = {};
    
    if (course) filter.course = course;
    if (semester) filter.semester = parseInt(semester);
    if (branch) filter.branch = { $regex: branch, $options: 'i' };
    if (year) filter.year = parseInt(year);
    if (examType) filter.examType = examType;

    const pyqs = await PYQ.find(filter)
      .populate('uploadedBy', 'name email')
      .populate('course', 'name')
      .sort({ year: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PYQ.countDocuments(filter);

    res.json({
      success: true,
      data: pyqs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching PYQs',
      error: error.message
    });
  }
});

// POST /api/notes/pyqs - Create new PYQ
router.post('/pyqs', [
  body('title').notEmpty().withMessage('Title is required'),
  body('year').isInt({ min: 2000, max: 2030 }).withMessage('Valid year is required'),
  body('examType').isIn(['mid-term', 'end-term', 'quiz', 'assignment']).withMessage('Invalid exam type'),
  body('course').notEmpty().withMessage('Course is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1-8'),
  body('branch').notEmpty().withMessage('Branch is required'),
  body('fileUrl').notEmpty().withMessage('File URL is required'),
  body('uploadedBy').notEmpty().withMessage('Uploaded by user ID is required')
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

    const pyq = new PYQ(req.body);
    await pyq.save();

    const populatedPYQ = await PYQ.findById(pyq._id)
      .populate('uploadedBy', 'name email')
      .populate('course', 'name');

    res.status(201).json({
      success: true,
      message: 'PYQ created successfully',
      data: populatedPYQ
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating PYQ',
      error: error.message
    });
  }
});

// GET /api/notes/:id/download - Download note/increment download count
router.get('/:id/download', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note || !note.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Increment download count
    note.downloads += 1;
    await note.save();

    res.json({
      success: true,
      message: 'Download count updated',
      data: {
        fileUrl: note.fileUrl,
        downloads: note.downloads
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing download',
      error: error.message
    });
  }
});

// POST /api/notes/:id/like - Like/Unlike note
router.post('/:id/like', [
  body('userId').notEmpty().withMessage('User ID is required')
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

    const note = await Note.findById(req.params.id);

    if (!note || !note.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const userId = req.body.userId;
    const isLiked = note.likes.includes(userId);

    if (isLiked) {
      // Unlike
      note.likes = note.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      note.likes.push(userId);
    }

    await note.save();

    res.json({
      success: true,
      message: isLiked ? 'Note unliked' : 'Note liked',
      data: {
        likes: note.likes.length,
        isLiked: !isLiked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing like',
      error: error.message
    });
  }
});

// POST /api/notes/:id/comments - Add comment to note
router.post('/:id/comments', [
  body('comment').notEmpty().withMessage('Comment is required'),
  body('userId').notEmpty().withMessage('User ID is required')
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

    const note = await Note.findById(req.params.id);

    if (!note || !note.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const newComment = {
      user: req.body.userId,
      comment: req.body.comment
    };

    note.comments.push(newComment);
    await note.save();

    // Populate the new comment
    const populatedNote = await Note.findById(note._id)
      .populate('comments.user', 'name')
      .select('comments');

    const addedComment = populatedNote.comments[populatedNote.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: addedComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
});

module.exports = router;