// models/testReportModel.js

const mongoose = require('mongoose');

const testReportSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

const TestReport = mongoose.model('TestReport', testReportSchema);

module.exports = TestReport;
