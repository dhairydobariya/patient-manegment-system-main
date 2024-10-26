const Appointment = require('../models/appointmentmodel');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');

const getTimeDate = (date, time) => {
  const [hours, minutes] = time.split(':');
  const appointmentDate = new Date(date);
  appointmentDate.setHours(hours);
  appointmentDate.setMinutes(minutes);
  return appointmentDate;
};

const createAppointment = async (req, res) => {
  try {
    const { 
      specialty, country, state, city,
      hospital, doctor, appointmentType, appointmentDate, appointmentTime, 
      patientIssue, diseaseName 
    } = req.body;

    // Log the incoming appointment date for debugging
    console.log("Incoming appointment date:", appointmentDate);
    console.log("Incoming appointment time:", appointmentTime);

    // Ensure the input date is valid before proceeding
    const parsedDate = new Date(appointmentDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid appointment date.' });
    }

    // Set time to the requested time in the local time zone
    const [hours, minutes] = appointmentTime.split(':');
    const appointmentDateTime = new Date(parsedDate.setHours(hours, minutes));
    
    // Log the appointment date and time for debugging
    console.log("Calculated appointment date and time:", appointmentDateTime);

    // Check if the appointment date is in the past
    const currentDateTime = new Date();
    if (appointmentDateTime < currentDateTime) {
      return res.status(400).json({ error: 'Cannot create an appointment for a past date.' });
    }

    // Check if the doctor is available at the requested time
    const conflictingAppointments = await Appointment.find({
      doctor,
      appointmentDate: appointmentDateTime // Check against full date-time
    });

    if (conflictingAppointments.length > 0) {
      return res.status(400).json({ error: 'Doctor is already booked at this time.' });
    }

    // Fetch doctor's details, including unavailable times
    const doctorDetails = await Doctor.findById(doctor);
    if (!doctorDetails) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    // Ensure unavailableTimes exists, otherwise default to an empty array
    const unavailableTimes = doctorDetails.unavailableTimes || [];

    // Check doctor's availability for the specified time
    const isDoctorUnavailable = unavailableTimes.some((unavailableTime) => {
      const unavailableStart = unavailableTime.timeRange.start;
      const unavailableEnd = unavailableTime.timeRange.end;
      const unavailableStartDateTime = new Date(parsedDate.setHours(...unavailableStart.split(':')));
      const unavailableEndDateTime = new Date(parsedDate.setHours(...unavailableEnd.split(':')));

      // Log values for debugging
      console.log('Checking against unavailable period:', unavailableStartDateTime, unavailableEndDateTime, 'for appointmentTime:', appointmentDateTime);

      // Check if appointmentTime falls within the unavailable period
      return (
        appointmentDateTime >= unavailableStartDateTime && 
        appointmentDateTime < unavailableEndDateTime &&
        appointmentDateTime.toDateString() === unavailableTime.date.toDateString()
      );
    });

    if (isDoctorUnavailable) {
      return res.status(400).json({ error: 'Doctor is unavailable during this time.' });
    }

    // Create new appointment
    const newAppointment = new Appointment({
      specialty,
      country,
      state,
      city,
      hospital,
      doctor,
      patient: req.user.id,
      appointmentType,
      appointmentDate: appointmentDateTime,
      appointmentTime,
      patientIssue,
      diseaseName,
      paymentStatus: req.body.paymentStatus || 'pending',
      updatedBy: 'patient'
    });

    await newAppointment.save();
    res.status(201).json({ message: 'Appointment successfully created.', appointment: newAppointment });
  } catch (error) {
    console.error('Error creating appointment:', error.message);
    res.status(500).json({ error: 'Server error while creating appointment.' });
  }
};

const getAppointment = async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id).populate('hospital doctor patient');
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }
      res.status(200).json(appointment);
    } catch (error) {
      res.status(500).json({ error: 'Server error while fetching appointment.' });
    }
  };

  const updateAppointment = async (req, res) => {
    try {
      const { appointmentDate, appointmentTime } = req.body;
  
      console.log('Received appointmentDate:', appointmentDate);
      console.log('Received appointmentTime:', appointmentTime);
  
      // Check if appointmentDate and appointmentTime are valid
      if (!appointmentDate || !appointmentTime) {
        return res.status(400).json({ error: 'Appointment date and time must be provided.' });
      }
  
      const loggedInUserId = req.user.id;  
      const loggedInUserRole = req.user.role; 
  
      const appointment = await Appointment.findById(req.params.id);
  
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }
  
      // Check if the logged-in user is the patient or doctor of the appointment
      const isPatient = loggedInUserRole === 'patient';
      const isDoctor = loggedInUserRole === 'doctor';
  
      // Check if the logged-in user is either the patient or the doctor for this appointment
      if (appointment.patient.toString() !== loggedInUserId && appointment.doctor.toString() !== loggedInUserId) {
        return res.status(403).json({ error: 'You do not have permission to update this appointment.' });
      }
  
      // If the user is a doctor, check for conflicts and availability
      if (isDoctor) {
        const doctorDetails = await Doctor.findById(appointment.doctor);
        if (!doctorDetails) {
          return res.status(404).json({ error: 'Doctor not found.' });
        }
  
        // Check for conflicting appointments
        const conflictingAppointments = await Appointment.find({
          doctor: appointment.doctor,
          appointmentDate: new Date(appointmentDate),
          appointmentTime
        });
  
        if (conflictingAppointments.length > 0) {
          return res.status(400).json({ error: 'Doctor is already booked at this new time.' });
        }
  
        const unavailableTimes = doctorDetails.unavailableTimes || [];
        const isDoctorUnavailable = unavailableTimes.some((unavailableTime) => {
          const unavailableStart = getTimeDate(new Date(appointmentDate), unavailableTime.timeRange.start);
          const unavailableEnd = getTimeDate(new Date(appointmentDate), unavailableTime.timeRange.end);
          const requestedAppointmentTime = getTimeDate(new Date(appointmentDate), appointmentTime);
  
          return (
            requestedAppointmentTime >= unavailableStart && 
            requestedAppointmentTime < unavailableEnd &&
            new Date(appointmentDate).toDateString() === unavailableTime.date.toDateString()
          );
        });
  
        if (isDoctorUnavailable) {
          return res.status(400).json({ error: 'Doctor is unavailable during this new time.' });
        }
      }
  
      // Properly format the appointmentDate and appointmentTime
      const formattedDate = `${appointmentDate}T${appointmentTime}:00Z`; // Ensure appointmentTime is in "HH:mm" format
      const utcDate = new Date(formattedDate); // Create UTC date
  
      console.log('Formatted date for UTC:', formattedDate);
      console.log('Constructed UTC date:', utcDate);
  
      // Check for invalid date
      if (isNaN(utcDate.getTime())) {
        return res.status(400).json({ error: 'Invalid appointment date or time format.' });
      }
  
      // Update the appointment
      appointment.appointmentDate = utcDate; // Store as UTC
      appointment.appointmentTime = appointmentTime;
      await appointment.save();
  
      res.status(200).json({ message: 'Appointment successfully updated.', appointment });
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ error: 'Server error while updating appointment.' });
    }
  };
  
  const cancelAppointment = async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }
  
      const loggedInUserId = req.user.id;
      const loggedInUserRole = req.user.role;
  
      // Check if the logged-in user is either the patient or the doctor for this appointment
      if (appointment.patient.toString() !== loggedInUserId && appointment.doctor.toString() !== loggedInUserId) {
        return res.status(403).json({ error: 'You do not have permission to cancel this appointment.' });
      }
  
      // Set the appointment as canceled
      appointment.appointmentCancelDate = new Date();
      appointment.status = 'canceled'; // Change status to canceled
  
      // Save without triggering pre-save validation
      await appointment.updateOne({ 
        appointmentCancelDate: appointment.appointmentCancelDate, 
        status: appointment.status 
      });
  
      res.status(200).json({ message: 'Appointment successfully canceled.', appointment });
    } catch (error) {
      console.error('Error canceling appointment:', error);
      res.status(500).json({ error: 'Server error while canceling appointment.' });
    }
  };
  
  const deleteAppointment = async (req, res) => {
    try {
      // Find and delete the appointment by ID
      const appointment = await Appointment.findByIdAndDelete(req.params.id);
  
      // Check if appointment exists
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }
  
      res.status(200).json({ message: 'Appointment successfully deleted.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error while deleting appointment.' });
    }
  };
  

  
// Add unavailable time
const addUnavailableTime = async (req, res) => {
  try {
    const { startTime, endTime, date } = req.body; // Ensure date is also extracted from the request body

    // Get doctorId from the logged-in user's information
    const doctorId = req.user.id;

    // Check if the doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    // Create new unavailable time object
    const newUnavailableTime = {
      date: new Date(date), // Ensure date is a Date object
      timeRange: {
        start: startTime,
        end: endTime,
      },
    };

    // Add the new unavailable time to the doctor's list
    doctor.unavailableTimes.push(newUnavailableTime);
    await doctor.save();

    res.status(201).json({ message: 'Unavailable time successfully added.', doctor });
  } catch (error) {
    console.error('Error adding unavailable time:', error.message);
    res.status(500).json({ error: 'Server error while adding unavailable time.' });
  }
};

// Remove unavailable time
const removeUnavailableTime = async (req, res) => {
  try {
    const { unavailableTimeId } = req.body; // Get unavailableTimeId from request body

    // Get doctorId from the logged-in user's information
    const doctorId = req.user.id;

    // Check if the doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    // Find the unavailable time by id
    const unavailableTime = doctor.unavailableTimes.id(unavailableTimeId);
    if (!unavailableTime) {
      return res.status(404).json({ error: 'Unavailable time not found.' });
    }

    // Remove the unavailable time using `pull()` method
    doctor.unavailableTimes.pull({ _id: unavailableTimeId });
    await doctor.save();

    res.status(200).json({ message: 'Unavailable time successfully removed.', doctor });
  } catch (error) {
    console.error('Error removing unavailable time:', error.message);
    res.status(500).json({ error: 'Server error while removing unavailable time.' });
  }
};



// Get scheduled appointments


// Fetch all appointments for the authenticated doctor
const getAppointmentsByDoctor = async (req, res) => {
  console.log("Fetching appointments for authenticated doctor...");
  const doctorId = req.user.id; // Get doctor ID from authenticated user

  try {
    const doctorAppointments = await Appointment.find({ doctor: doctorId })
      .populate('doctor patient hospital')
      .sort({ appointmentDate: -1 }); // Sort by appointment date, latest first

    if (!doctorAppointments || doctorAppointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found for this doctor' });
    }

    res.status(200).json(doctorAppointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Server error while fetching doctor appointments.' });
  }
};

// Fetch all appointments for the authenticated patient
const getAppointmentsByPatient = async (req, res) => {
  console.log("Fetching appointments for authenticated patient...");
  const patientId = req.user.id; // Get patient ID from authenticated user

  try {
    const patientAppointments = await Appointment.find({ patient: patientId })
      .populate('doctor patient hospital')
      .sort({ appointmentDate: -1 }); // Sort by appointment date, latest first

    if (!patientAppointments || patientAppointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found for this patient' });
    }

    res.status(200).json(patientAppointments);
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ error: 'Server error while fetching patient appointments.' });
  }
};



//patient-manegment

const getTodayAppointments = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'scheduled'
    })
      .populate('patient doctor', 'name issue diseaseName')
      .exec();

    res.status(200).json({ appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Get previous appointments
const getPreviousAppointments = async (req, res) => {
  try {
    const today = new Date();

    const appointments = await Appointment.find({
      appointmentDate: { $lt: today },
      status: { $ne: 'canceled' }
    })
      .populate('patient doctor', 'name issue diseaseName')
      .exec();

    res.status(200).json({ appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Get upcoming appointments
const getUpcomingAppointments = async (req, res) => {
  try {
    const today = new Date();

    const appointments = await Appointment.find({
      appointmentDate: { $gt: today },
      status: 'scheduled'
    })
      .populate('patient doctor', 'name issue diseaseName')
      .exec();

    res.status(200).json({ appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Get canceled appointments
const getCanceledAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      status: 'canceled'
    })
      .populate('patient doctor', 'name issue diseaseName')
      .exec();

    res.status(200).json({ appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error });
  }
};



  module.exports = {
    createAppointment,
    getAppointment,
    updateAppointment,
    cancelAppointment,
    deleteAppointment,
    addUnavailableTime,
    removeUnavailableTime,
    getAppointmentsByDoctor,
    getAppointmentsByPatient,
    getTodayAppointments,
    getPreviousAppointments,
    getUpcomingAppointments,
    getCanceledAppointments
  }




 