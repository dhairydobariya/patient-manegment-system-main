const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  specialtyType: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  experience: {
    type: Number, // years of experience
    required: true,
  },
  checkupTime: {
    type: String, // you can adjust this to a date/time format if needed
    required: true,
  },
  workon: {
    type: String, // working hours or shift details
    enum: ['online', 'onsite', 'both'],
    required: true,
  },
  workingTime: {
    type: String, // working hours or shift details
    required: true,
  },
  breakTime: {
    type: String, // break time details
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },    
  age: {
    type: Number,
    required: true,
  },
  address: {
    country: String,
    state: String,
    city: String,
    zipCode: String,
    street: String,
  },
  onlineConsultationRate: {
    type: Number,
    required: true,
  },
  currentHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital', // Reference to Hospital model
  },
  hospitalWebsite: {
    type: String,
  },
  emergencyContactNumber: {
    type: String,
  },
  doctorAddress: {
    type: String,
  },
  description: {
    type: String,
  },
  profileImage: { type: String, default: 'uploads/doctor/default.png' }, // Set default image path
  signature: { type: String, default: 'uploads/doctor/default_signature.png' }, // Set default signature path
  signature: {
    type: String, // URL or file path to signature image
  },
  patientsHandled: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', // Reference to Patient model
  }],
  role: { 
    type: String, 
    default: "Doctor" 
  },

  // Unavailable Times should not be required, since not every doctor has unavailable times initially
  unavailableTimes: [
    {
      date: {
        type: Date, // Date of unavailability
        required: true, // Each unavailable time must have a date
      },
      timeRange: {
        start: {
          type: String, // Start time (e.g., "10:00")
          required: true, // Start time is required
        },
        end: {
          type: String, // End time (e.g., "12:00")
          required: true, // End time is required
        },
      }
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
