const Teleconsultation = require('../models/telecosulationmodel');
const Appointment = require('../models/appointmentmodel');

const createTeleconsultation = async (req, res) => {
  try {
    const { appointmentId, teleconsultationLink } = req.body;

    // Find the corresponding appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const teleconsultation = new Teleconsultation({
      appointment: appointmentId,
      doctor: appointment.doctor,
      patient: appointment.patient,
      teleconsultationLink,
      status: 'not_started',
    });

    await teleconsultation.save();

    res.status(201).json({ success: true, teleconsultation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateTeleconsultationStatus = async (req, res) => {
  try {
    const { teleconsultationId, status } = req.body;

    const teleconsultation = await Teleconsultation.findById(teleconsultationId);
    if (!teleconsultation) {
      return res.status(404).json({ success: false, message: 'Teleconsultation not found' });
    }

    teleconsultation.status = status;
    await teleconsultation.save();

    res.status(200).json({ success: true, teleconsultation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createTeleconsultation,
  updateTeleconsultationStatus,
};
