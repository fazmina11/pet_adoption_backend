const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const dotenv = require('dotenv');
const path = require('path');

// Load env vars (EXPLICIT PATH)
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('MONGO_URI loaded:', process.env.MONGODB_URI);

// Connect to database
connectDB();


const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware - Allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://petadpotionapp.vercel.app',
  /https:\/\/.*\.vercel\.app$/ // Allow all Vercel preview URLs
];

console.log('CORS configured for:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/adoptions', require('./routes/adoptions'));
app.use('/api/notifications', require('./routes/notifications'));

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Pet Adoption API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      pets: '/api/pets',
      favorites: '/api/favorites',
      adoptions: '/api/adoptions',
      notifications: '/api/notifications'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// Set port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
