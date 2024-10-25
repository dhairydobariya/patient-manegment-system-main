const Appointment = require('../models/appointmentmodel');
const Teleconsultation = require('../models/telecosulationmodel');
const { createTeleconsultationLink } = require('../services/teleconsultationService');

// Start teleconsultation (Creates the video room link)
exports.startTeleconsultation = async (req, res) => {
    const { appointmentId } = req.params;
nbv
    try {
        // Find the appointment
        const appointment = await Appointment.findById(appointmentId).populate('doctor patient');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }



        // Check if the appointment status allows for teleconsultation
        if (appointment.teleconsultationStatus !== 'not_started') {
            return res.status(400).json({ message: 'Teleconsultation has already been started or completed.' });
        }

        // Calculate the appointment date and time
        const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
        const currentDateTime = new Date();

        // Allow starting the teleconsultation if it's within 10 minutes before the appointment
        const tenMinutesBefore = new Date(appointmentDateTime.getTime() - 10 * 60 * 1000);
        
        // Check if the current time is within the allowable range
        if (currentDateTime < tenMinutesBefore) {
            return res.status(400).json({ message: 'Cannot start teleconsultation, it must be within 10 minutes before the appointment.' });
        }

        // Debugging: Log the appointment details and the current time
        console.log("Appointment Details:", appointment);
        console.log("Current DateTime:", currentDateTime);

        // Check for existing appointments for the doctor at the same appointment date and time,
        // but exclude the current appointment
        const existingAppointment = await Appointment.findOne({
            doctor: appointment.doctor._id,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            _id: { $ne: appointmentId }, // Exclude the current appointment
            status: { $ne: 'canceled' } // Ensure to only consider non-canceled appointments
        });

        // Debugging: Log the existing appointment check result
        console.log("Existing Appointment Check:", existingAppointment);

        if (existingAppointment) {
            console.log("Conflict found with existing appointment:", existingAppointment);
            return res.status(400).json({ message: 'Doctor already has an appointment at this time.' });
        }

        // Proceed to create teleconsultation link
        const { roomLink } = await createTeleconsultationLink(appointmentId);

        // Update appointment with teleconsultation details
        appointment.teleconsultationLink = roomLink;
        appointment.teleconsultationStatus = 'in_progress'; // Set status
        await appointment.save();

        res.status(200).json({ message: 'Teleconsultation started', roomLink });
    } catch (error) {
        console.error("Error starting teleconsultation:", error);
        res.status(500).json({ message: 'Error starting teleconsultation', error: error.message });
    }
};

// Join teleconsultation (Returns the teleconsultation room link)
exports.joinTeleconsultation = async (req, res) => {
    const { teleconsultationId } = req.params;
    const userId = req.user.id;

    try {
        // Find the teleconsultation entry
        const teleconsultation = await Teleconsultation.findById(teleconsultationId)
            .populate('doctor patient');

        if (!teleconsultation) {
            return res.status(404).json({ message: 'Teleconsultation not found' });
        }

        // Check if the requesting user is the doctor or patient
        if (userId !== String(teleconsultation.doctor._id) && userId !== String(teleconsultation.patient._id)) {
            return res.status(403).json({ message: 'Not authorized to join this teleconsultation' });
        }

        // Return the room link for joining
        return res.json({ message: 'Teleconsultation link', roomLink: teleconsultation.teleconsultationLink });
    } catch (error) {
        return res.status(500).json({ message: 'Error joining teleconsultation', error: error.message });
    }
};

// End teleconsultation
exports.endTeleconsultation = async (req, res) => {
    const { teleconsultationId } = req.params;

    try {
        // Find the teleconsultation entry
        const teleconsultation = await Teleconsultation.findById(teleconsultationId);

        if (!teleconsultation) {
            return res.status(404).json({ message: 'Teleconsultation not found' });
        }

        // Mark the teleconsultation as completed
        teleconsultation.status = 'completed';
        await teleconsultation.save();

        // Update the appointment status as completed
        await Appointment.findByIdAndUpdate(teleconsultation.appointment, {
            teleconsultationStatus: 'completed',
            status: 'completed'
        });

        return res.json({ message: 'Teleconsultation ended successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error ending teleconsultation', error: error.message });
    }
    
};

    

// Get teleconsultation status
exports.getTeleconsultationStatus = async (req, res) => {
    const { teleconsultationId } = req.params;

    try {
        // Find the teleconsultation entry
        const teleconsultation = await Teleconsultation.findById(teleconsultationId);

        if (!teleconsultation) {
            return res.status(404).json({ message: 'Teleconsultation not found' });
        }


        // Return the current status
        return res.json({ status: teleconsultation.status });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving teleconsultation status', error: error.message });
    }
};
