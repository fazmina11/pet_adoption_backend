const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a pet name'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['dogs', 'cats', 'birds', 'rabbits', 'hamsters', 'fish', 'turtles', 'guinea-pigs']
  },
  breed: {
    type: String,
    required: [true, 'Please add a breed']
  },
  age: {
    type: String,
    required: [true, 'Please add age']
  },
  weight: {
    type: String,
    required: [true, 'Please add weight']
  },
  gender: {
    type: String,
    required: [true, 'Please add gender'],
    enum: ['Male', 'Female']
  },
  description: {
    type: String,
    required: [true, 'Please add description']
  },
  location: {
    type: String,
    default: 'Not specified'
  },
  price: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    required: [true, 'Please add an image']
  },
  bgColor: {
    type: String,
    default: 'yellow',
    enum: ['yellow', 'purple']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'adopted'],
    default: 'available'
  }
}, {
  timestamps: true
});

// Create index for search
petSchema.index({ name: 'text', breed: 'text', description: 'text' });

module.exports = mongoose.model('Pet', petSchema);