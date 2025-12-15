const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  adopter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for adoption'],
    trim: true
  },
  experience: {
    type: String,
    required: [true, 'Please share your experience with pets'],
    trim: true
  },
  contactName: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true
  },
  contactEmail: {
    type: String,
    required: [true, 'Please provide your email'],
    trim: true
  },
  contactPhone: {
    type: String,
    required: [true, 'Please provide your phone number'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Adoption', adoptionSchema);