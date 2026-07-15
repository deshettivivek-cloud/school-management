require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const studentRoutes = require('./routes/studentRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const feeRoutes = require('./routes/feeRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const tcRoutes = require('./routes/tcRoutes');
const blogRoutes = require('./routes/blogRoutes');
const expenditureRoutes = require('./routes/expenditureRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const salaryRoutes = require('./routes/salaryRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const clientUrl = process.env.CLIENT_URL || '';
    if (
      origin === clientUrl ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('classorbit.in')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schools', require('./routes/schoolRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/promotion', promotionRoutes);
app.use('/api/tc', require('./routes/tcRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/expenditures', require('./routes/expenditureRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/dashboard', dashboardRoutes);

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

// Debug endpoint to verify environment variables (temporary)
app.get('/api/debug-env', (req, res) => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  res.json({
    success: true,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      CLIENT_URL: process.env.CLIENT_URL,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SERVICE_KEY_PREFIX: serviceKey.substring(0, 15),
      SERVICE_KEY_SUFFIX: serviceKey.substring(serviceKey.length - 10),
      KEY_LENGTH: serviceKey.length,
      IS_ANON_KEY: serviceKey.includes('anon'),
      IS_SERVICE_KEY: serviceKey.includes('service_role')
    }
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
