const Patient = require('../models/patientModel');
const PatientRecord = require('../models/patientRecordsmodel');
const Doctor = require('../models/doctorModel');
const Prescription = require('../models/priscriptionmodel');
const Appointment = require('../models/appointmentmodel')
const Bill = require('../models/billmodel');

const fs = require('fs');
const path = require('path');
const cloudinary = require('../middleware/cloudinaryConfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Patient Registration
const register = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, age, height, weight, gender, bloodGroup, dateOfBirth, address, password } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !age || !height || !weight || !gender || !bloodGroup || !dateOfBirth || !address || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newPatient = new Patient({
            firstName, lastName, email, phoneNumber, age, height, weight,
            gender, bloodGroup, dateOfBirth, address, password: hashedPassword
        });
        await newPatient.save();
        res.json({ message: "Patient successfully registered", patient: newPatient });
    } catch (error) {
      console.log(error, "relate")
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Patient Profile
const getPatientProfile = async (req, res) => {
    try {
        const patientId = req.user.id; // Assuming user ID is stored in req.user by authentication middleware
        const patient = await Patient.findById(patientId).select('-password'); // Exclude password from response
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.status(200).json(patient);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Patient Profile
const updatePatientProfile = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        phoneNumber,
        age,
        height,
        weight,
        gender,
        bloodGroup,
        address,
    } = req.body;

    const patientId = req.user.id; // Get the patient ID from the authenticated user

    try {
        // Find the patient in the database
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const updateData = {
            firstName,
            lastName,
            email,
            phoneNumber,
            age,
            height,
            weight,
            gender,
            bloodGroup,
            address,
        };

        // Update profile image if a new file is uploaded
        if (req.file) {
            // The Cloudinary upload already handles the file
            const result = req.file; // Get the result directly from req.file after multer processes it

            // The URL for the uploaded image is already in req.file
            updateData.profileImage = result.path; // This is the URL provided by CloudinaryStorage

            // Log the URL for debugging
            console.log('New profile image URL:', updateData.profileImage);

            // Delete the old profile image from Cloudinary if it exists
            if (patient.profileImage) {
                const publicId = patient.profileImage.split('/').pop().split('.')[0]; // Get the public ID
                await cloudinary.uploader.destroy(`patient/profileImages/${publicId}`); // Remove the old image from Cloudinary
            }
        }

        // Update the patient information in the database
        const updatedPatient = await Patient.findByIdAndUpdate(patientId, updateData, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ message: 'Profile updated successfully', updatedPatient });
    } catch (error) {
        console.error('Error updating patient profile:', error); // Log the error for debugging
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//patinet helath record page controllers 
//medical history
const getMedicalHistory = async (req, res) => {
    try {
      const patientId = req.user.id; // Assuming the logged-in patient
  
      const appointments = await Appointment.find({ patient: patientId }) // Find appointments for the logged-in patient
        .populate({
          path: 'doctor', // Populate doctor name from Doctor model
          select: 'name' // Include only the doctor's name
        })
        .select('patientIssue appointmentDate doctor') // Select necessary appointment fields
        .exec();
  
      if (appointments.length === 0) {
        return res.status(404).json({ message: 'No appointments found for this patient' });
      }
  
      // Transform appointments to include doctor's name
      const transformedAppointments = appointments.map(appointment => ({
        appointment_id : appointment.id,
        appointmentDate: appointment.appointmentDate,
        patientIssue: appointment.patientIssue,
        doctorName: appointment.doctor.name // Get the doctor's name from the populated field
      }));
  
      res.status(200).json(transformedAppointments); // Return the transformed appointment data
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Prescriptions with empty array handling
const getPrescriptions = async (req, res) => {
    try {
        const patientId = req.user.id; // Assuming the logged-in patient

        const prescriptions = await Prescription.find({ patientId })
            .populate({
                path: 'appointmentId', // Ensure 'appointmentId' is in the Prescription schema
                select: 'diseaseName patientIssue' // Populate fields from the Appointment schema
            })
            .select('hospitalName prescriptionDate doctorName doctorSpecification note') // Select the required fields from the Prescription
            .exec();

        if (!prescriptions || prescriptions.length === 0) {
            return res.status(404).json({ message: 'No prescriptions found for this patient' });
        }

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 
  
//get one prescription
const getPrescriptionById = async (req, res) => {
    try {
      const patientId = req.user.id; // Get the logged-in patient's ID from the request
      const { prescriptionId } = req.params; // Get the prescription ID from the request parameters
  
      // Find the prescription by ID and ensure it belongs to the logged-in patient
      const prescription = await Prescription.findOne({ _id: prescriptionId, patientId })
        .populate('appointmentId', 'diseaseName patientIssue') // Populate appointment details
        .select('hospitalName prescriptionDate doctorName doctorSpecification note medicine') // Select relevant fields
  
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found for this patient' });
      }
  
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

//get one medical history image 
const getMedicalHistoryById = async (req, res) => {
    try {
      const patientId = req.user.id; // Get the logged-in patient's ID from the request
      const { appointmentId } = req.params; // Get the appointment ID from the request parameters
  
      // Find the appointment by ID and ensure it belongs to the logged-in patient
      const appointment = await Appointment.findOne({ _id: appointmentId, patient: patientId })
        .populate('doctor', 'name') // Populate doctor name from the Doctor model
        .select('patientIssue appointmentDate doctor') // Select necessary fields
        .exec();
  
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found for this patient' });
      }
  
      // Transform the response to include doctor's name
      const response = {
        appointmentDate: appointment.appointmentDate,
        patientIssue: appointment.patientIssue,
        doctorName: appointment.doctor.name // Get the doctor's name from the populated field
      };
  
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
//all appointment 
const getAllAppointmentsForPatient = async (req, res) => {
    try {
      const patientId = req.user.id; // Get the logged-in patient's ID from the request
  
      // Find all appointments for the logged-in patient, populating doctor and hospital information
      const appointments = await Appointment.find({ patient: patientId })
        .populate('doctor', 'name') // Populate doctor name from the Doctor model
        .populate('hospital', 'name') // Populate hospital name from the Hospital model
        .select('appointmentType appointmentDate patientIssue diseaseName doctor hospital') // Select necessary fields
        .exec();
  
      if (!appointments || appointments.length === 0) {
        return res.status(404).json({ message: 'No appointments found for this patient' });
      }
  
      // Transform the response to include required fields
      const response = appointments.map(appointment => ({
        appointmentId: appointment._id, // Appointment ID
        doctorName: appointment.doctor.name, // Doctor's name
        hospitalName: appointment.hospital.name, // Hospital's name
        appointmentType: appointment.appointmentType, // Appointment type
        appointmentDate: appointment.appointmentDate, // Appointment date
        patientIssue: appointment.patientIssue, // Patient issue
        diseaseName: appointment.diseaseName // Disease name
      }));
  
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };  

  // get medical certificate and in this with all description 
  const getAllPatientRecords = async (req, res) => {
    try {
      const patientId = req.user.id; // Get the logged-in patient's ID from the request
  
      // Find all patient records for the logged-in patient
      const records = await PatientRecord.find({ patientId })
        .populate('doctorId', 'name') // Optionally populate the doctor's name
        .exec();
  
      if (!records || records.length === 0) {
        return res.status(404).json({ message: 'No patient records found for this patient' });
      }
  
      res.status(200).json(records); // Return the patient records
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  //appointment page in this we are show scheduled and also pending cancled and privious data 

  //scheduled appointment
  const getScheduledAppointments = async (req, res) => {
    try {
      const patientId = req.user.id; // Get the logged-in patient's ID
      const { startDate, endDate } = req.query; // Get start and end date from query parameters
  
      const query = { patient: patientId, status: 'scheduled' };
      if (startDate && endDate) {
        query.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
  
      const appointments = await Appointment.find(query)
        .populate('doctor', 'name') // Populate doctor name
        .populate('hospital', 'name') // Populate hospital name
        .select('appointmentType appointmentDate appointmentTime patientIssue') // Select required fields
        .exec();
  
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  //previous appointment
  const getPreviousAppointments = async (req, res) => {
    try {
      const patientId = req.user.id; // Get the logged-in patient's ID
      const { startDate, endDate } = req.query; // Get start and end date from query parameters
  
      const query = { patient: patientId, status: 'completed' };
      if (startDate && endDate) {
        query.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }



      const appointments = await Appointment.find(query)
        .populate('doctor', 'name') // Populate doctor name
        .populate('hospital', 'name') // Populate hospital name
        .select('appointmentType appointmentDate appointmentTime patientIssue') // Select required fields
        .exec();
  
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  



  //cancled appointment
  const getCanceledAppointments = async (req, res) => {
    try {
      const patientId = req.user.id; // Get the logged-in patient's ID
      const { startDate, endDate } = req.query; // Get start and end date from query parameters
  
      const query = { patient: patientId, status: 'canceled' };
      if (startDate && endDate) {    
                                              
        query.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
  
      const appointments = await Appointment.find(query)
        .populate('doctor', 'name') // Populate doctor name
        .populate('hospital', 'name') // Populate hospital name
        .select('appointmentType appointmentDate appointmentTime patientIssue appointmentCancelDate') // Select required fields
        .exec();
  
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };



  //pending appointmemnt 

  const getPendingAppointments = async (req, res) => {
    try {
      const patientId = req.user.id; // Get the logged-in patient's ID
      const { startDate, endDate } = req.query; // Get start and end date from query parameters
  
      // Future appointments only
      const currentDate = new Date();
      const query = { patient: patientId, appointmentDate: { $gt: currentDate } }; // Only get appointments in the future
  
      // If start and end date are provided, filter accordingly
      if (startDate && endDate) {
        query.appointmentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
  
      const appointments = await Appointment.find(query)
        .populate('doctor', 'name') // Populate doctor name
        .populate('hospital', 'name') // Populate hospital name
        .select('appointmentType appointmentDate appointmentTime patientIssue') // Select required fields
        .exec();
  
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


  //get appointment detail only one 
  const getAppointmentDetails = async (req, res) => {
    try {
      const { appointmentId } = req.params; // Get appointment ID from request parameters
      const patientId = req.user.id; // Get the logged-in patient's ID
  
      // Find the appointment by ID and ensure it belongs to the logged-in patient
      const appointment = await Appointment.findOne({ _id: appointmentId, patient: patientId })
        .populate('doctor', 'name qualification breakTime workingHour experience emergencyContactNumber specialtyType description') // Populate doctor details
        .populate('hospital', 'name') // Populate hospital name
        .exec();
  
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found for this patient' });
      }
  
      // Return the appointment details along with doctor and hospital information
      res.status(200).json(appointment);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  

  //prescription page so its main commment 
  
  //get all prescription
  const getAllPrescriptions = async (req, res) => {
    try {
      const patientId = req.user.id; // Get the logged-in patient's ID from the request
      const { startDate, endDate } = req.query; // Get startDate and endDate from query parameters
  
      // Build the query object
      const query = { patientId }; // Use patientId from the schema
  
      // Add date filtering if provided
      if (startDate && endDate) {
        query.prescriptionDate = {
          $gte: new Date(startDate), // Greater than or equal to start date
          $lte: new Date(endDate),   // Less than or equal to end date
        };
      }
  
      // Fetch prescriptions based on the query
      const prescriptions = await Prescription.find(query)
        .populate('doctorId', 'name') // Populate doctor name from the Doctor model
        .exec();
  
      res.status(200).json(prescriptions); // Return prescriptions, even if the array is empty
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


  //bill page for this comment 
  //paid and unpaid bills

  const getBills = async (req, res) => {
    try {
      const { paymentStatus } = req.query; // Get paymentStatus (paid/unpaid) from query params
  
      // Build the query object
      const query = {};
      
      // Add payment status to the query if provided
      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }
  
      // Find the bills based on the query
      const bills = await Bill.find(query)
        .populate('doctorId', 'name')  // Populate doctor name from Doctor model
        .populate('hospitalId', 'name') // Populate hospital name from Hospital model
        .exec();
  
      // Transform the response to include only relevant fields
      const formattedBills = bills.map(bill => ({
        doctorName: bill.doctorName,
        hospitalName: bill.hospitalId.name, // Assuming the hospital name is stored as 'name'
        billDate: bill.billDate,
        billTime: bill.billTime,
        totalAmount: bill.totalAmount,
        billId: bill._id
      }));
  
      // Send response
      res.status(200).json(formattedBills);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


module.exports = {
    register,
    getPatientProfile,
    updatePatientProfile,
    getMedicalHistory,
    getPrescriptions,
    getPrescriptionById,
    getMedicalHistoryById,
    getAllAppointmentsForPatient,
    getAllPatientRecords,
    getScheduledAppointments,
    getPreviousAppointments,
    getCanceledAppointments,
    getPendingAppointments,
    getAppointmentDetails,
    getAllPrescriptions,
    getBills,
}