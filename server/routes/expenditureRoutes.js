const express = require('express');
const router = express.Router();
const {
  getExpenditures, getExpenditure, createExpenditure,
  updateExpenditure, deleteExpenditure
} = require('../controllers/expenditureController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getExpenditures);
router.get('/:id', protect, getExpenditure);
router.post('/', protect, createExpenditure);
router.put('/:id', protect, updateExpenditure);
router.delete('/:id', protect, deleteExpenditure);

module.exports = router;
