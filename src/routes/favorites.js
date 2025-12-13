const express = require('express');
const router = express.Router();
const {
  toggleFavorite,
  getFavorites,
  checkFavorite
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getFavorites);
router.post('/:petId', protect, toggleFavorite);
router.get('/:petId/check', protect, checkFavorite);

module.exports = router;