const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  medicine: [
    {
      name: { type: String, required: true },
      strength: { type: String, required: true },
      dose: { type: String, required: true },
      duration: { type: String, required: true },
      whenToTake: { 
        type: String, 
        enum: ['Before Food', 'After Food', 'With Food'],
        required: true
      },
      additionalNote: { type: String }
    }
  ],
  doctorSignature: { type: String},
  hospitalName: { type: String, required: true },
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },
  doctorSpecification: { type: String, required: true },
  gender: { type: String, required: true },
  patientAddress: { type: String, required: true },
  prescriptionDate: { type: Date, default: Date.now },
  age: { type: Number, required: true },
  note: { type: String }
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
