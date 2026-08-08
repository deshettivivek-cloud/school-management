const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(csv|xlsx|xls)$/)) {
      return cb(new Error('Only .csv or .xlsx files are allowed'));
    }
    cb(null, true);
  }
});

router.use(protect);

// GET /api/dashboard/widgets
router.get('/widgets', dashboardController.getDashboardWidgets);

// POST /api/dashboard/calendar/events
router.post('/calendar/events', roleCheck('principal', 'super_admin'), dashboardController.createCalendarEvent);

// POST /api/dashboard/calendar/import
router.post('/calendar/import', roleCheck('principal', 'super_admin'), upload.single('file'), dashboardController.importCalendar);

module.exports = router;
