const express = require('express');
const router = express.Router();
const {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  updateAdmissionStatus, getStudentStats, getStudentMarks, getStudentTimeline
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/stats', protect, getStudentStats);
router.get('/', protect, getStudents);
router.get('/:id', protect, getStudent);
router.get('/:id/marks', protect, getStudentMarks);
router.get('/:id/timeline', protect, getStudentTimeline);
router.post('/', protect, createStudent);
router.put('/:id', protect, updateStudent);
router.delete('/:id', protect, roleCheck('principal', 'clerk'), deleteStudent);
router.patch('/:id/status', protect, roleCheck('principal', 'clerk'), updateAdmissionStatus);

module.exports = router;
