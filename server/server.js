require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const studentRoutes = require('./routes/studentRoutes');
const feeRoutes = require('./routes/feeRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const tcRoutes = require('./routes/tcRoutes');
const blogRoutes = require('./routes/blogRoutes');
const expenditureRoutes = require('./routes/expenditureRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/promotion', promotionRoutes);
app.use('/api/tc', tcRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/expenditures', expenditureRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'School Management API is running 🏫',
    database: 'Supabase (PostgreSQL)',
  });
});
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'School Management API is running',
    status: 'OK'
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏫 School Management Server running on port ${PORT}`);
  console.log(`📡 Database: Supabase (PostgreSQL)`);
  console.log(`🔐 Auth: Supabase Auth + Google OAuth`);
});
