const express = require('express');
const router = express.Router();
const {
  submitBugReport,
  getBugReports,
  updateBugReportStatus
} = require('../controllers/bugReportController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const {
  createBugReportSchema,
  updateBugReportStatusSchema
} = require('../validators/bugReportSchemas');

// Require authentication for all bug report endpoints
router.use(protect);

// Any logged-in user can submit a bug report
router.post('/', validate(createBugReportSchema), submitBugReport);

// Principal-only endpoints
router.get('/', roleCheck('principal'), getBugReports);
router.put('/:id/status', roleCheck('principal'), validate(updateBugReportStatusSchema), updateBugReportStatus);

module.exports = router;
