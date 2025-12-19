const Adoption = require('../models/Adoption');
const Pet = require('../models/Pet');
const Notification = require('../models/Notification');

// @desc    Request adoption
// @route   POST /api/adoptions
// @access  Private
exports.requestAdoption = async (req, res) => {
  try {
    const { petId, reason, experience, contactName, contactEmail, contactPhone } = req.body;

    // Validate all fields
    if (!petId || !reason || !experience || !contactName || !contactEmail || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

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
      status: { $in: ['pending', 'approved'] }
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
      reason,
      experience,
      contactName,
      contactEmail,
      contactPhone
    });

    // Update pet status to pending
    pet.status = 'pending';
    await pet.save();

    // Create notification for pet owner
    await Notification.create({
      user: pet.owner,
      type: 'adoption_request',
      pet: petId,
      adoption: adoption._id,
      message: `New adoption request received for ${pet.name}`,
      actionRequired: true
    });

    res.status(201).json({
      success: true,
      message: 'Adoption request submitted successfully! The owner will review your request.',
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

// @desc    Update adoption status (Approve/Reject)
// @route   PUT /api/adoptions/:id
// @access  Private
exports.updateAdoptionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const adoptionId = req.params.id;

    console.log('Update adoption status:', { adoptionId, status });

    // Validate status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    // Find adoption and populate pet
    let adoption = await Adoption.findById(adoptionId)
      .populate('pet')
      .populate('adopter', 'name email phone');

    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: 'Adoption request not found'
      });
    }

    console.log('Found adoption:', {
      adoptionId: adoption._id,
      owner: adoption.owner.toString(),
      userId: req.user.id,
      petName: adoption.pet?.name
    });

    // Check if user is the pet owner
    if (adoption.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this request'
      });
    }

    // Update adoption status
    adoption.status = status;
    
    if (status === 'approved') {
      adoption.approvedAt = new Date();
    } else if (status === 'rejected') {
      adoption.rejectedAt = new Date();
    }
    
    await adoption.save();

    console.log('Updated adoption status to:', status);

    // Update pet status and create notification
    if (status === 'approved') {
      await Pet.findByIdAndUpdate(adoption.pet._id, { status: 'pending' });
      
      // Create notification for adopter
      await Notification.create({
        user: adoption.adopter._id,
        type: 'adoption_approved',
        pet: adoption.pet._id,
        adoption: adoption._id,
        message: `Your adoption request for ${adoption.pet.name} has been approved! Click "Mark as Done" to complete the adoption.`,
        actionRequired: true
      });

      console.log('Created approval notification for adopter');
    } else if (status === 'rejected') {
      await Pet.findByIdAndUpdate(adoption.pet._id, { status: 'available' });
      
      // Create notification for adopter
      await Notification.create({
        user: adoption.adopter._id,
        type: 'adoption_rejected',
        pet: adoption.pet._id,
        adoption: adoption._id,
        message: `Your adoption request for ${adoption.pet.name} has been rejected.`,
        actionRequired: false
      });

      console.log('Created rejection notification for adopter');
    }

    res.status(200).json({
      success: true,
      message: `Adoption request ${status} successfully`,
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

// @desc    Complete adoption (by adopter)
// @route   PUT /api/adoptions/:id/complete
// @access  Private
exports.completeAdoption = async (req, res) => {
  try {
    const adoptionId = req.params.id;

    console.log('Complete adoption:', { adoptionId, userId: req.user.id });

    let adoption = await Adoption.findById(adoptionId).populate('pet');

    if (!adoption) {
      return res.status(404).json({
        success: false,
        message: 'Adoption request not found'
      });
    }

    // Check if user is the adopter
    if (adoption.adopter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if adoption is approved
    if (adoption.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Adoption must be approved before completion'
      });
    }

    // Update adoption status
    adoption.status = 'completed';
    await adoption.save();

    // Update pet status to adopted
    await Pet.findByIdAndUpdate(adoption.pet._id, { status: 'adopted' });

    // Create notification for owner
    await Notification.create({
      user: adoption.owner,
      type: 'adoption_completed',
      pet: adoption.pet._id,
      adoption: adoption._id,
      message: `Adoption completed for ${adoption.pet.name}`,
      actionRequired: false
    });

    console.log('Adoption completed successfully');

    res.status(200).json({
      success: true,
      message: 'Adoption completed successfully!',
      adoption
    });
  } catch (error) {
    console.error('Complete adoption error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete adoption'
    });
  }
};