const Pet = require('../models/Pet');
const fs = require('fs');

// Import uploadToCloudinary correctly
const { uploadToCloudinary } = require('../middleware/upload');

// @desc    Get all pets
// @route   GET /api/pets
// @access  Public
exports.getAllPets = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = { status: 'available' };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pets = await Pet.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pets.length,
      pets
    });
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single pet
// @route   GET /api/pets/:id
// @access  Public
exports.getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate('owner', 'name email');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    res.status(200).json({
      success: true,
      pet
    });
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add new pet
// @route   POST /api/pets
// @access  Private
exports.addPet = async (req, res) => {
  try {
    const { name, category, breed, age, weight, gender, description, location, price } = req.body;

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a pet image'
      });
    }

    // Upload image to Cloudinary
    let imageUrl;
    try {
      imageUrl = await uploadToCloudinary(req.file.path);
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image'
      });
    }

    // Delete local file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Create pet
    const pet = await Pet.create({
      name,
      category,
      breed,
      age,
      weight,
      gender,
      description,
      location: location || 'Not specified',
      price: price || 0,
      image: imageUrl,
      bgColor: Math.random() > 0.5 ? 'yellow' : 'purple',
      owner: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Pet added successfully!',
      pet
    });
  } catch (error) {
    console.error('Add pet error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update pet
// @route   PUT /api/pets/:id
// @access  Private
exports.updatePet = async (req, res) => {
  try {
    let pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    if (pet.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (req.file) {
      const imageUrl = await uploadToCloudinary(req.file.path);
      req.body.image = imageUrl;
      fs.unlinkSync(req.file.path);
    }

    pet = await Pet.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Pet updated successfully',
      pet
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete pet
// @route   DELETE /api/pets/:id
// @access  Private
exports.deletePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    if (pet.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await pet.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};