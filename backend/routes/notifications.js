const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { body, validationResult } = require('express-validator');

// GET /api/notifications - Get all notifications with filters
router.get('/', async (req, res) => {
  try {
    const { 
      targetAudience, 
      type, 
      priority, 
      read,
      page = 1, 
      limit = 10 
    } = req.query;
    
    let filter = { isActive: true };
    
    if (targetAudience) filter.targetAudience = targetAudience;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    
    // Filter by read status (if userId is provided)
    if (read !== undefined && req.query.userId) {
      const userId = req.query.userId;
      if (read === 'true') {
        filter['readBy.user'] = userId;
      } else {
        filter['readBy.user'] = { $ne: userId };
      }
    }

    const notifications = await Notification.find(filter)
      .populate('createdBy', 'name email')
      .populate('targetUsers', 'name email')
      .populate('readBy.user', 'name')
      .sort({ scheduledFor: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// GET /api/notifications/:id - Get single notification
router.get('/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('targetUsers', 'name email')
      .populate('readBy.user', 'name');

    if (!notification || !notification.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notification',
      error: error.message
    });
  }
});

// POST /api/notifications - Create new notification
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['announcement', 'reminder', 'alert', 'update', 'event'])
    .withMessage('Invalid notification type'),
  body('targetAudience').isIn(['all', 'students', 'faculty', 'admin', 'individual'])
    .withMessage('Invalid target audience'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('createdBy').notEmpty().withMessage('Created by user ID is required')
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

    // Validate targetUsers if targetAudience is 'individual'
    if (req.body.targetAudience === 'individual' && 
        (!req.body.targetUsers || req.body.targetUsers.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Target users are required for individual notifications'
      });
    }

    const notification = new Notification(req.body);
    await notification.save();

    const populatedNotification = await Notification.findById(notification._id)
      .populate('createdBy', 'name email')
      .populate('targetUsers', 'name email');

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: populatedNotification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id - Update notification
router.put('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('targetUsers', 'name email');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
});

// DELETE /api/notifications/:id - Delete notification (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', [
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

    const notification = await Notification.findById(req.params.id);

    if (!notification || !notification.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const userId = req.body.userId;
    const alreadyRead = notification.readBy.some(
      read => read.user.toString() === userId
    );

    if (!alreadyRead) {
      notification.readBy.push({
        user: userId,
        readAt: new Date()
      });
      await notification.save();
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// PUT /api/notifications/users/:userId/notifications/read-all - Mark all notifications as read for user
router.put('/users/:userId/notifications/read-all', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find all notifications that the user hasn't read yet
    const unreadNotifications = await Notification.find({
      isActive: true,
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students' }, // Assuming most users are students
        { targetUsers: userId }
      ],
      'readBy.user': { $ne: userId }
    });

    // Mark all as read
    const bulkOps = unreadNotifications.map(notification => ({
      updateOne: {
        filter: { _id: notification._id },
        update: {
          $push: {
            readBy: {
              user: userId,
              readAt: new Date()
            }
          }
        }
      }
    }));

    if (bulkOps.length > 0) {
      await Notification.bulkWrite(bulkOps);
    }

    res.json({
      success: true,
      message: `${bulkOps.length} notifications marked as read`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
});

// GET /api/notifications/users/:userId/notifications - Get notifications for specific user
router.get('/users/:userId/notifications', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;

    let filter = {
      isActive: true,
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students' }, // Assuming most users are students
        { targetUsers: userId }
      ]
    };

    // Filter for unread notifications only
    if (unreadOnly === 'true') {
      filter['readBy.user'] = { $ne: userId };
    }

    const notifications = await Notification.find(filter)
      .populate('createdBy', 'name email')
      .sort({ scheduledFor: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);

    // Add read status for each notification
    const notificationsWithReadStatus = notifications.map(notification => {
      const isRead = notification.readBy.some(
        read => read.user.toString() === userId
      );
      
      return {
        ...notification.toObject(),
        isRead,
        readAt: isRead ? notification.readBy.find(
          read => read.user.toString() === userId
        ).readAt : null
      };
    });

    res.json({
      success: true,
      data: notificationsWithReadStatus,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user notifications',
      error: error.message
    });
  }
});

// POST /api/notifications/bulk - Create multiple notifications
router.post('/bulk', [
  body('notifications').isArray().withMessage('Notifications must be an array'),
  body('notifications.*.title').notEmpty().withMessage('Title is required for each notification'),
  body('notifications.*.message').notEmpty().withMessage('Message is required for each notification'),
  body('createdBy').notEmpty().withMessage('Created by user ID is required')
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

    const { notifications, createdBy } = req.body;

    // Add createdBy to each notification
    const notificationsWithCreator = notifications.map(notification => ({
      ...notification,
      createdBy
    }));

    const createdNotifications = await Notification.insertMany(notificationsWithCreator);

    res.status(201).json({
      success: true,
      message: `${createdNotifications.length} notifications created successfully`,
      data: createdNotifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating bulk notifications',
      error: error.message
    });
  }
});

module.exports = router;