const express = require('express');
const router = express.Router();
const { getTeachers, updateTeacher } = require('../controllers/teacherController');
const { protect } = require('../middleware/auth');

// Get all teachers for the current school
router.get('/', protect, getTeachers);

// Update a teacher's details
router.put('/:id', protect, updateTeacher);

module.exports = router;
