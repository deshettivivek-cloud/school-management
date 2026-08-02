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
const whatsappRoutes = require('./routes/whatsappRoutes');

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

// Serve static files from the 'public' directory
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

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
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/sms', require('./routes/smsRoutes'));
app.use('/api/communications', require('./routes/communicationRoutes'));
app.use('/api/bug-reports', require('./routes/bugReportRoutes'));
app.use('/api/import', require('./routes/importRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'School Management API is running 🏫',
    database: 'MySQL',
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
const multer = require('multer');

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('allowed')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const { getMasterPool } = require('./config/database');

const startServer = async () => {
  try {
    await getMasterPool();
    app.listen(PORT, () => {
      console.log(`🏫 School Management Server running on port ${PORT}`);
      console.log(`📡 Database: MySQL (Multi-Tenant)`);
      console.log(`🔐 Auth: Native JWT Auth`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
