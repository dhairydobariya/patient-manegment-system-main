const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  doctorName: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientName: { type: String, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: false }, // Optional
  billNo: { type: String, required: true, unique: true },
  billDate: { type: Date, default: Date.now },
  billTime: { type: String, required: true },
  gender: { type: String, required: false },  // Optional
  age: { type: Number, required: false },     // Optional
  address: { type: String, required: false }, // Optional
  diseaseName: { type: String, required: false }, // Optional
  phoneNumber: { type: String, required: true },
  paymentType: { type: String, enum: ['insurance', 'online', 'cash'], required: true },
  insuranceDetails: {
    insuranceCompany: { type: String },
    insurancePlan: { type: String },
    claimAmount: { type: Number },
    claimedAmount: { type: Number }
  },
  paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  description: [
    {
      name: { type: String, required: true },
      amount: { type: Number, required: true },
      qty: { type: Number, required: true },
      total: { type: Number, required: true }
    }
  ],
  amount: { type: Number, required: true },
  discount: { type: Number },
  tax: { type: Number },
  totalAmount: { type: Number, required: true },
  email: { type: String, required: true },
  // Dynamic fields that admin can add or remove
  additionalFields: { type: mongoose.Schema.Types.Mixed, required: false }, // Flexible storage
}, { timestamps: true });

const Bill = mongoose.model('Bill', billSchema);
module.exports = Bill;
