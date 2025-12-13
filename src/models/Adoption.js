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
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Adoption', adoptionSchema);