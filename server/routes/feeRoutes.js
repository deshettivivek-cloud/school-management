const express = require('express');
const router = express.Router();
const {
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  applyFeeToStudents,
} = require('../controllers/feeStructureController');
const {
  getFeeCollections,
  getStudentFeeCollection,
  commitFee,
  recordPayment,
  getPendingFees,
  getFeeStats,
  getReceipt,
} = require('../controllers/feeCollectionController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// Fee Structure routes
router.get('/structure', protect, getFeeStructures);
router.post('/structure', protect, roleCheck('principal'), createFeeStructure);
router.put('/structure/:id', protect, roleCheck('principal'), updateFeeStructure);
router.delete('/structure/:id', protect, roleCheck('principal'), deleteFeeStructure);
router.post('/structure/:id/apply', protect, roleCheck('principal', 'clerk'), applyFeeToStudents);

// Fee Collection routes
router.get('/collection', protect, getFeeCollections);
router.get('/collection/:studentId', protect, getStudentFeeCollection);
router.post('/collection/commit', protect, roleCheck('principal', 'clerk'), commitFee);
router.post('/collection/pay', protect, recordPayment);

// Pending fees
router.get('/pending', protect, getPendingFees);

// Stats
router.get('/stats', protect, getFeeStats);

// Receipt
router.get('/receipt/:collectionId/:paymentId', protect, getReceipt);

module.exports = router;
