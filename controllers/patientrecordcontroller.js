const PatientRecord = require('../models/patientRecordsmodel');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../middleware/cloudinaryConfig');


exports.createPatientRecord = async (req, res) => {
  try {
      const { description } = req.body;
      const patientId = req.params.patientId;
      const doctorId = req.user.id;

      // Ensure the file is present
      if (!req.file) {
          return res.status(400).json({ message: 'Medical certificate image is required' });
      }

      // Accessing the uploaded file's URL directly from req.file
      const medicalCertificateUrl = req.file.path; // This URL comes from Cloudinary

      const record = new PatientRecord({
          doctorId,
          patientId,
          description,
          medicalCertificate: medicalCertificateUrl // Set the URL as the medical certificate
      });

      // No need to unlink the file as it is handled by Cloudinary
      // fs.unlinkSync(req.file.path); // Remove this line

      await record.save();
      res.status(201).json({ message: 'Patient record created successfully', record });
  } catch (error) {
      console.error('Error creating patient record:', error); // Log the error for debugging
      res.status(500).json({ message: 'Error creating patient record', error: error.message });
  }
};


// Get patient record by ID
exports.getPatientRecordById = async (req, res) => {
  try {
    const { recordId } = req.params;
    const record = await PatientRecord.findById(recordId)
      .populate('doctorId', 'name')
      .populate('patientId', 'firstName lastName');
tt 
    if (!record) {
      return res.status(404).json({ message: 'Patient record not found' });
    }

    res.status(200).json({ message: 'Patient record retrieved successfully', record });
  } catch (error) {
    console.error('Error retrieving patient record:', error);
    res.status(500).json({ message: 'Error retrieving patient record', error: error.message });
  }
};



// Update patient record
exports.updatePatientRecord = async (req, res) => {
  try {
      const { recordId } = req.params;
      const updates = req.body;

      if (req.file) {
          // If a new file is uploaded, directly set the Cloudinary URL
          updates.medicalCertificate = req.file.path; // This comes from Cloudinary    
      }

      const updatedRecord = await PatientRecord.findByIdAndUpdate(recordId, updates, { new: true });

      if (!updatedRecord) {
          return res.status(404).json({ message: 'Patient record not found' });
      }

      res.status(200).json({ message: 'Patient record updated successfully', updatedRecord });
  } catch (error) {
      console.error('Error updating patient record:', error); // Log the error for debugging
      res.status(500).json({ message: 'Error updating patient record', error: error.message });
  }
};



// Delete patient record


exports.deletePatientRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const record = await PatientRecord.findByIdAndDelete(recordId);

    if (!record) {
      return res.status(404).json({ message: 'Patient record not found' });
    }

    // Delete the medical certificate file
    fs.unlinkSync(record.medicalCertificate);

    res.status(200).json({ message: 'Patient record deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient record:', error);
    res.status(500).json({ message: 'Error deleting patient record', error: error.message });
  }
};




