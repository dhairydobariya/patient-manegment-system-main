const express = require('express');
const router = express.Router();
const { createPatientRecord, getPatientRecordById, updatePatientRecord, deletePatientRecord } = require('../controllers/patientrecordcontroller');
const upload = require('../middleware/multer'); // Assuming multer is used for file uploads
const {authenticateUser , authorizeRoles} = require('../middleware/authMiddleware')

// Create a new patient record
router.post('/:patientId',authenticateUser,authorizeRoles('Doctor'), upload.single('medicalCertificate'), createPatientRecord);

// Get a patient record by ID
router.get('/:recordId',authenticateUser,authorizeRoles('Doctor'), getPatientRecordById);

// Update a patient record by ID
router.put('/:recordId',authenticateUser,authorizeRoles('Doctor'), upload.single('medicalCertificate'), updatePatientRecord);

// Delete a patient record by ID
router.delete('/:recordId',authenticateUser,authorizeRoles('Doctor'), deletePatientRecord);

module.exports = router;
