const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const {
  downloadStudentTemplate,
  previewStudentImport,
  commitStudentImport,
  downloadEmployeeTemplate,
  previewEmployeeImport,
  commitEmployeeImport
} = require('../controllers/importController');

// Multer memory storage configuration for spreadsheets
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

    if (!isExtAllowed && !isMimeAllowed) {
      return cb(new Error('Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed'));
    }
    cb(null, true);
  },
});

// Multer error handling wrapper for preview route
const handleMulterUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed. Please ensure file is a valid .xlsx or .csv spreadsheet.',
      });
    }
    next();
  });
};

// All import routes are restricted to Principal role
router.use(protect, roleCheck('principal'));

// Student import endpoints
router.get('/students/template', downloadStudentTemplate);
router.post('/students/preview', handleMulterUpload, previewStudentImport);
router.post('/students/commit', commitStudentImport);

// Employee import endpoints
router.get('/employees/template', downloadEmployeeTemplate);
router.post('/employees/preview', handleMulterUpload, previewEmployeeImport);
router.post('/employees/commit', commitEmployeeImport);

module.exports = router;
