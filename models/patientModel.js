const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  height: {
    type: Number, // Height in centimeters
    required: true,
  },
  weight: {
    type: Number, // Weight in kilograms
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  bloodGroup: {
    type: String, // Blood group type
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  address: {
    country: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    street: {
      type: String,
    },
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: { type: String, default: 'uploads/patient/default.png' }, // Default image path
  role: { type: String, default: "patient" },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
