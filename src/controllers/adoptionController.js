const Adoption = require('../models/Adoption');
const Pet = require('../models/Pet');

// @desc    Request adoption
// @route   POST /api/adoptions
// @access  Private
exports.requestAdoption = async (req, res) => {
  try {
    const { petId, message } = req.body;

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if pet is available
    if (pet.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Pet is not available for adoption'
      });
    }

    // Check if user already requested adoption for this pet
    const existingRequest = await Adoption.findOne({
      pet: petId,
      adopter: req.user.id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested adoption for this pet'
      });
    }

    // Create adoption request
    const adoption = await Adoption.create({
      pet: petId,
      adopter: req.user.id,
      owner: pet.owner,
      message: message || `I'm interested in adopting ${pet.name}`
    });

    // Update pet status to pending
    pet.status = 'pending';
    await pet.save();

    res.status(201).json({
      success: true,
      message: 'Adoption request submitted successfully! The owner will contact you soon.',
      adoption
    });
  } catch (error) {
    console.error('Request adoption error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to request adoption'
    });
  }
};

// @desc    Get user's adoption requests
// @route   GET /api/adoptions/my-requests
// @access  Private
exports.getMyRequests = async (req, res) => {
  try {
    const adoptions = await Adoption.find({ adopter: req.user.id })
      .populate('pet')
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: adoptions.length,
      adoptions
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch requests'
    });
  }
};

// @desc    Get adoption requests for user's pets
// @route   GET /api/adoptions/received
// @access  Private
exports.getReceivedRequests = async (req, res) => {
  try {
    const adoptions = await Adoption.find({ owner: req.user.id })
      .populate('pet')
      .populate('adopter', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: adoptions.length,
      adoptions
    });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch requests'
    });
  }
};

// @desc    Update adoption status
// @route   PUT /api/adoptions/:id
// @access  Private
exports.updateAdoptionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    let adoption = await Adoption.findById(req.params.id);

    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: 'Adoption request not found'
      });
    }

    // Check if user is the pet owner
    if (adoption.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this request'
      });
    }

    adoption.status = status;
    await adoption.save();

    // Update pet status if approved
    if (status === 'approved') {
      await Pet.findByIdAndUpdate(adoption.pet, { status: 'adopted' });
    } else if (status === 'rejected') {
      await Pet.findByIdAndUpdate(adoption.pet, { status: 'available' });
    }

    res.status(200).json({
      success: true,
      message: `Adoption request ${status}`,
      adoption
    });
  } catch (error) {
    console.error('Update adoption status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update status'
    });
  }
};