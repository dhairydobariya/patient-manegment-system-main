const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer'); // Import updated multer config for Cloudinary
const testReportController = require('../controllers/testreportController');

// Route for creating a test report
router.post('/test-report', upload.single('testReport'), testReportController.createTestReport);

module.exports = router;
