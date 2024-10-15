const mongoose = require('mongoose');

// Schema for Patient Record
const patientRecordSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  description: { type: String, required: true },
  medicalCertificate: { type: String, required: true }, // URL or path to the uploaded image
  createdDate: { type: Date, default: Date.now },
}, { timestamps: true });

const PatientRecord = mongoose.model('PatientRecord', patientRecordSchema);
module.exports = PatientRecord;
