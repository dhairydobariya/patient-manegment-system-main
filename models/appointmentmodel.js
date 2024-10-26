const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  specialty: {
    type: String,
    required: true,
  },
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
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  appointmentType: {
    type: String,
    enum: ['online', 'onsite'],
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
  },
  patientIssue: {
    type: String,
  },
  diseaseName: {
    type: String,
  },
  updatedBy: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'clear', 'failed'],
    default: 'pending',
  },
  status: {
    type: String,
    enum: [
      'scheduled', // Appointment is confirmed
      'canceled',  // Appointment is canceled
      'completed', // Appointment has been completed
      'pending',   // Appointment is pendin
    ],
    default: 'scheduled',
  },
  appointmentCancelDate: {
    type: Date,
  },
  teleconsultationLink: { type: String }, // Link for video session
  teleconsultationStatus: { type: String, enum: ['not_started', 'in_progress', 'completed', 'failed'], default: 'not_started' }
}, { timestamps: true });

// Custom validation for availability of the doctor
appointmentSchema.pre('save', async function (next) {
  // Skip validation if the appointment is being canceled
   if (this.status === 'canceled') {
    return next();
  }

  const { doctor, appointmentDate, appointmentTime } = this;

  // Combine appointmentDate and appointmentTime into a single Date object
  const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

  // Check if the requested appointment date is in the past
  const currentDateTime = new Date();
  if (appointmentDateTime < currentDateTime) {
    return next(new Error('Appointments cannot be created for past dates.'));
  }
   
  // Check if the doctor already has an appointment at the same time
  const existingAppointment = await mongoose.model('Appointment').findOne({
    doctor,
    appointmentDate,
    appointmentTime,
    status: { $ne: 'canceled' } // Ensure to only consider n-canceled appointments
  });

  if (existingAppointment) {
    return next(new Error('Doctor already has an appointment at this time.'));
  }
  

  // Check if the doctor is available at the requested time
  const doctorModel = await mongoose.model('Doctor').findById(doctor);
  if (doctorModel) {
    const unavailableTimes = doctorModel.unavailableTimes || [];
    for (let period of unavailableTimes) {
      const start = period.timeRange.start; // e.g., "10:00"
      const end = period.timeRange.end; // e.g., "12:00"

      const startTime = new Date(`${appointmentDate}T${start}`);
      const endTime = new Date(`${appointmentDate}T${end}`);

      // Check if the requested appointment time falls within the unavailable period
      if (appointmentDateTime >= startTime && appointmentDateTime < endTime) {
        return next(new Error('Doctor is unavailable during this time.'));
      }
    }
  }

  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
