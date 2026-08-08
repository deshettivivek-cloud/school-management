const express = require('express');
const router = express.Router();
const {
  getExpenditures, getExpenditure, createExpenditure,
  updateExpenditure, deleteExpenditure, getExpenditureStats
} = require('../controllers/expenditureController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createExpenditureSchema, updateExpenditureSchema } = require('../validators/moneySchemas');

router.get('/', protect, getExpenditures);
router.get('/stats', protect, getExpenditureStats);
router.get('/:id', protect, getExpenditure);
router.post('/', protect, validate(createExpenditureSchema), createExpenditure);
router.put('/:id', protect, validate(updateExpenditureSchema), updateExpenditure);
router.delete('/:id', protect, deleteExpenditure);

module.exports = router;