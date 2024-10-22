// controllers/testReportController.js

const TestReport = require('../models/testReportModel.js');
const cloudinary = require('../middleware/cloudinaryConfig.js');

// Create Test Report
exports.createTestReport = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    // Check if a file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'test-reports', 
      public_id: `testReport-${Date.now()}`,
    });

    // Create test report with the uploaded image URL
    const testReport = new TestReport({
      appointmentId,
      imageUrl: result.secure_url,
      createdDate: new Date(),
    });

    await testReport.save();

    res.status(201).json({
      message: 'Test report created successfully',
      data: testReport,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating test report', error });
  }
};
