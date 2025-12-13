const User = require('../models/User');
const Pet = require('../models/Pet');

// @desc    Toggle favorite (add or remove)
// @route   POST /api/favorites/:petId
// @access  Private
exports.toggleFavorite = async (req, res) => {
  try {
    const petId = req.params.petId;
    const userId = req.user.id;

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Get user
    const user = await User.findById(userId);

    // Check if pet is already in favorites
    const isFavorite = user.favorites.includes(petId);

    if (isFavorite) {
      // Remove from favorites
      user.favorites = user.favorites.filter(id => id.toString() !== petId);
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Removed from favorites',
        isFavorite: false
      });
    } else {
      // Add to favorites
      user.favorites.push(petId);
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Added to favorites',
        isFavorite: true
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's favorite pets
// @route   GET /api/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');

    res.status(200).json({
      success: true,
      count: user.favorites.length,
      favorites: user.favorites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check if pet is favorite
// @route   GET /api/favorites/:petId/check
// @access  Private
exports.checkFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isFavorite = user.favorites.includes(req.params.petId);

    res.status(200).json({
      success: true,
      isFavorite
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};