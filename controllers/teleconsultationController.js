const Appointment = require('../models/appointmentmodel');
const teleconsultationService = require('../services/teleconsultationService');

// Create a video room for the teleconsultation
const createTeleconsultation = async (req, res) => {
  const { appointmentId } = req.body;

  try {
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Use the service to create or get the teleconsultation link
    const { message, roomLink } = await teleconsultationService.createTeleconsultationLink(appointmentId);

    // Update the appointment with teleconsultation link
    appointment.teleconsultationLink = roomLink; // roomLink is the unique ID for the room
    appointment.teleconsultationStatus = 'in_progress';
    await appointment.save();

    return res.status(200).json({ message, roomLink });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Join an existing teleconsultation room
const joinTeleconsultation = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (!appointment.teleconsultationLink) {
      return res.status(400).json({ message: 'Teleconsultation not started yet' });
    }

    return res.status(200).json({ message: 'Join the teleconsultation', roomLink: appointment.teleconsultationLink });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { createTeleconsultation, joinTeleconsultation };