const express = require('express');
const router = express.Router();
const { getAttendance, markAttendance, getStudentAttendanceStats } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/', protect, roleCheck('principal', 'clerk', 'teacher'), getAttendance);
router.post('/', protect, roleCheck('principal', 'clerk', 'teacher'), markAttendance);
router.get('/stats/:studentId', protect, getStudentAttendanceStats);

module.exports = router;
