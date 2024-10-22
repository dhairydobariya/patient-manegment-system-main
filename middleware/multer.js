const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig'); // Cloudinary config

// Define the storage engine using Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = '';

    // Determine the correct Cloudinary folder based on the file field name
    if (file.fieldname === 'profileImage' && req.user.role === 'admin') {
      folder = 'admin/profileImages';
    } else if (file.fieldname === 'profileImage' && req.user.role === 'Doctor') {
      folder = 'doctor/profileImages';
    } else if (file.fieldname === 'signature' && req.user.role === 'Doctor') {
      folder = 'doctor/signatures';
    } else if (file.fieldname === 'profileImage' && req.user.role === 'patient') {
      folder = 'patient/profileImages';
    } else if (file.fieldname === 'medicalCertificate' && req.user.role === 'Doctor') {
      folder = 'patient/medicalCertificates';
    } else if (file.fieldname === 'testReport') {
      // Adding the test report upload logic
      folder = 'test-reports';
    }

    return {
      folder: folder,
      allowed_formats: ['jpg', 'png', 'jpeg'],
      public_id: `${file.fieldname}-${Date.now()}`, // Unique identifier for the uploaded file
    };
  },
});

// Create upload instance
const upload = multer({ storage });

module.exports = upload;
