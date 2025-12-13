const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Import controller functions
const {
  requestAdoption,
  getMyRequests,
  getReceivedRequests,
  updateAdoptionStatus
} = require('../controllers/adoptionController');

// All routes require authentication
router.post('/', protect, requestAdoption);
router.get('/my-requests', protect, getMyRequests);
router.get('/received', protect, getReceivedRequests);
router.put('/:id', protect, updateAdoptionStatus);

module.exports = router;