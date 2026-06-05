const express = require('express');
const router = express.Router();
const {
  getStudents, getStudent, createStudent, updateStudent,
  updateAdmissionStatus, getStudentStats,
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/stats', protect, getStudentStats);
router.get('/', protect, getStudents);
router.get('/:id', protect, getStudent);
router.post('/', protect, createStudent);
router.put('/:id', protect, updateStudent);
router.patch('/:id/status', protect, roleCheck('principal', 'clerk'), updateAdmissionStatus);

module.exports = router;
