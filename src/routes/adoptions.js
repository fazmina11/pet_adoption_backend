const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  requestAdoption,
  getMyRequests,
  getReceivedRequests,
  updateAdoptionStatus,
  completeAdoption
} = require('../controllers/adoptionController');

// All routes require authentication
router.post('/', protect, requestAdoption);
router.get('/my-requests', protect, getMyRequests);
router.get('/received', protect, getReceivedRequests);
router.put('/:id', protect, updateAdoptionStatus);
router.put('/:id/complete', protect, completeAdoption);

module.exports = router;