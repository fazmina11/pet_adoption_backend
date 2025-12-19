const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

// All routes require authentication
// Specific routes FIRST to avoid conflicts with ID parameters
router.put('/read-all', protect, markAllAsRead);

// Dynamic routes LAST
router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;