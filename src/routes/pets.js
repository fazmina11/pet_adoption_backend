const express = require('express');
const router = express.Router();
const {
  getAllPets,
  getPetById,
  addPet,
  updatePet,
  deletePet
} = require('../controllers/petController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (no auth required)
router.get('/', getAllPets);
router.get('/:id', getPetById);

// Protected routes (auth required)
router.post('/', protect, upload.single('image'), addPet);
router.put('/:id', protect, upload.single('image'), updatePet);
router.delete('/:id', protect, deletePet);

module.exports = router;