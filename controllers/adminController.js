const { body, validationResult } = require('express-validator');
const cloudinary = require('../middleware/cloudinaryConfig');
const fs = require('fs');
const path = require('path');
const usermodel = require('../models/adminModel');
const Doctor = require('../models/doctorModel');
const Hospital = require('../models/hospitalModel');
const Patient = require('../models/patientModel');
const Appointment = require('../models/appointmentmodel');
const Admin = require('../models/adminModel');
const Bill = require('../models/billmodel');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
// Default route
const defaults = (req, res) => {
    res.send("It's default routes");
};

// User Registration with validation
const register = async (req, res) => {
    // Validation checks
    await body('firstName').notEmpty().withMessage('First name is required').run(req);
    await body('lastName').notEmpty().withMessage('Last name is required').run(req);
    await body('email').isEmail().withMessage('Invalid email format').run(req);
    await body('phoneNumber').notEmpty().withMessage('Phone number is required').run(req);
    await body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').run(req);
    await body('country').notEmpty().withMessage('Country is required').run(req);
    await body('state').notEmpty().withMessage('State is required').run(req);
    await body('city').notEmpty().withMessage('City is required').run(req);
    await body('hospital').notEmpty().withMessage('Hospital is required').run(req);
    // await body('role').notEmpty().withMessage('Role is required').run(req);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phoneNumber, password, country, state, city, hospital, role, profileImage } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await usermodel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const userdata = new usermodel({
            firstName,
            lastName,
            email,
            phoneNumber,
            password: hashedPassword,
            country,
            state,
            city,
            hospital,
            role : role ? role : "admin",
            profileImage
        });

        // Save the user to the database
        await userdata.save();
        res.status(201).json({ message: "User successfully registered", user: userdata });
    } catch (error) {
      console.error(error);  // Log the error for debugging
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createDoctor = async (req, res) => {
  // Validation checks
  await body('name').notEmpty().withMessage('Name is required').run(req);
  await body('email').isEmail().withMessage('Invalid email format').run(req);
  await body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').run(req);
  await body('specialtyType').notEmpty().withMessage('Specialty Type is required').run(req);
  await body('phoneNumber').notEmpty().withMessage('Phone number is required').run(req);
  await body('age').isInt({ min: 18 }).withMessage('Age must be at least 18').run(req);
  await body('onlineConsultationRate').isNumeric().withMessage('Consultation rate must be a number').run(req);

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  const {
      name, qualification, specialtyType, gender, experience, checkupTime, workon, workingTime,
      breakTime, phoneNumber, email, password, age, address, onlineConsultationRate, 
      hospitalWebsite, emergencyContactNumber, doctorAddress, description
  } = req.body;

  try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Get the logged-in admin's ID (assuming req.user is populated via authentication middleware)
      const adminId = req.user.id;

      // Find the admin by ID to get their associated hospital ID
      const admin = await Admin.findById(adminId);
      if (!admin) {
          return res.status(404).json({ message: 'Admin not found' });
      }

      // Ensure the admin is associated with a hospital
      const hospitalId = admin.hospital; // Retrieve the hospital ID from the admin's data
      if (!hospitalId) {
          return res.status(400).json({ message: 'Admin is not associated with a hospital' });
      }

      // Find the hospital by ID to ensure it exists
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
          return res.status(404).json({ message: 'Hospital not found' });
      }

      // Prepare the new doctor object
      const newDoctorData = {
          name,
          qualification,
          specialtyType,
          gender,
          experience,
          checkupTime,
          workon,
          workingTime,
          breakTime,
          phoneNumber,
          email,
          password: hashedPassword,
          age,
          address,
          onlineConsultationRate,
          currentHospital: hospital._id, // Automatically attach the hospital ID from the admin
          hospitalWebsite,
          emergencyContactNumber,
          doctorAddress,
          description,
      };

      // Handle image uploads if present
      if (req.files) {
          // Upload profile image
          if (req.files['profileImage'] && req.files['profileImage'][0]) {
              const profileImageFile = req.files['profileImage'][0]; // Assuming single file upload for profile image
              const profileImageResult = await cloudinary.uploader.upload(profileImageFile.path, {
                  folder: 'doctor_profile_images',
              });
              newDoctorData.profileImage = profileImageResult.secure_url; // Add image URL to the new doctor object
          }

          // Upload signature image
          if (req.files['signature'] && req.files['signature'][0]) {
              const signatureFile = req.files['signature'][0]; // Assuming single file upload for signature
              const signatureResult = await cloudinary.uploader.upload(signatureFile.path, {
                  folder: 'doctor_signatures',
              });
              newDoctorData.signature = signatureResult.secure_url; // Add signature URL to the new doctor object
          }
      }

      // Create a new doctor with the gathered data
      const newDoctor = new Doctor(newDoctorData);

      // Save doctor to the database
      await newDoctor.save();

      // Respond with the created doctor info
      res.status(201).json({ message: "Doctor successfully created", doctor: newDoctor });
  } catch (error) {
      console.error('Error creating doctor:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const deleteDoctorById = async (req, res) => {
    try {
        // Find the doctor by ID and delete
        const deletedDoctor = await Doctor.findByIdAndDelete(req.params.id);
        
        // If no doctor is found, return a 404
        if (!deletedDoctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Successfully deleted
        res.status(200).json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        // Server error handling
        res.status(500).json({ message: 'Error deleting doctor', error: error.message });
    }
};

// Create a new hospital with validation
const createHospital = async (req, res) => {
    await body('name').notEmpty().withMessage('Hospital name is required').run(req);
    await body('address.country').notEmpty().withMessage('Country is required').run(req);
    await body('address.state').notEmpty().withMessage('State is required').run(req);
    await body('address.city').notEmpty().withMessage('City is required').run(req);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const hospital = new Hospital(req.body);
        const savedHospital = await hospital.save();
        res.status(201).json({ message: 'Hospital created successfully', hospital: savedHospital });
    } catch (error) {
        res.status(500).json({ message: 'Error creating hospital', error: error.message });
    }
};

// Get all hospitals with error handling
const getAllHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find();
        res.status(200).json(hospitals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching hospitals', error: error.message });
    }
};

// Get hospital by ID with error handling
const getHospitalById = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        res.status(200).json(hospital);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching hospital', error: error.message });
    }
};

// Update hospital by ID with error handling
const updateHospitalById = async (req, res) => {
    try {
        const updatedHospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedHospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        res.status(200).json(updatedHospital);
    } catch (error) {
        res.status(500).json({ message: 'Error updating hospital', error: error.message });
    }
};

// Delete hospital by ID with error handling
const deleteHospitalById = async (req, res) => {
    try {
        const deletedHospital = await Hospital.findByIdAndDelete(req.params.id);
        if (!deletedHospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        res.status(200).json({ message: 'Hospital deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting hospital', error: error.message });
    }
};


let getprofile = async (req, res) => {
    const adminId = req.user.id; // Get the admin ID from the authenticated user's token

    try {
        const adminProfile = await usermodel.findById(adminId).select('-password'); // Fetch the admin profile and exclude the password field

        if (!adminProfile) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ adminProfile });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin Profile Update
let updateProfile = async (req, res) => {
  const adminId = req.user.id;
  const { firstName, lastName, email, phoneNumber, country, state, city, hospital } = req.body;

  try {
    const adminProfile = await usermodel.findById(adminId);
    if (!adminProfile) return res.status(404).json({ message: 'Admin not found' });

    let newImagePath = null;

    // If a new image is uploaded
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'admin/profileImages',
      });

      newImagePath = result.secure_url; // Cloudinary URL for image

      // Delete the old image from Cloudinary if it exists
      if (adminProfile.profileImage) {
        const publicId = adminProfile.profileImage.split('/').pop().split('.')[0]; // Extract public ID from image URL
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // Update the admin profile with new data and/or new image
    const updatedAdmin = await usermodel.findByIdAndUpdate(
      adminId,
      {
        firstName,
        lastName,
        email,
        phoneNumber,
        country,
        state,
        city,
        hospital,
        profileImage: newImagePath || adminProfile.profileImage, // Use new image path or keep existing one
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Profile updated successfully', updatedAdmin });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};



const changeAdminPassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    try {
        const admin = await usermodel.findById(userId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Compare current password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match' });
        }

        // Hash and update new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedNewPassword;

        await admin.save();
        res.status(200).json({ message: 'Admin password changed successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin Dashboard API with Search Functionality
  let datadeshboard =async (req, res) => {
    try {
        // Fetch total patients, doctors, and appointments
        const totalPatients = await Patient.countDocuments();
        const totalDoctors = await Doctor.countDocuments();
        const totalAppointments = await Appointment.countDocuments();

        // Fetch bills (pending)
        const pendingBills = await Bill.find({ paymentStatus: 'pending' }).populate('patientId').populate('doctorId');

        // Fetch patient statistics (yearly, monthly, weekly)
        const patientStats = await getPatientStatistics(); // Create a helper function for this

        // Fetch today's appointments
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));     
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const todayAppointments = await Appointment.find({
            appointmentDate: { $gte: startOfDay, $lte: endOfDay }
        }).populate('patient').populate('doctor');

        // Summary of patients
        const newPatientsCount = await Patient.countDocuments({ createdAt: { $gte: new Date(new Date() - 30*24*60*60*1000) } }); // Last 30 days
        const totalPatientsCount = await Patient.countDocuments();
        const oldPatientsCount = totalPatientsCount - newPatientsCount;

        // Prepare the response
        const dashboardData = {
            totalPatients,
            totalDoctors,
            totalAppointments,
            pendingBills,
            patientStats,
            todayAppointments,
            patientSummary: {
                newPatients: newPatientsCount,
                oldPatients: oldPatientsCount,
                totalPatients: totalPatientsCount
            }
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};



// Helper function to calculate patient statistics
const getPatientStatistics = async (hospitalId) => {
  const now = new Date();

  // For the past year
  const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
  const yearlyPatients = await Patient.countDocuments({
    hospital: hospitalId,
    createdAt: { $gte: oneYearAgo },
  });

  // For the past month
  const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
  const monthlyPatients = await Patient.countDocuments({
    hospital: hospitalId,
    createdAt: { $gte: oneMonthAgo },
  });

  // For the past week
  const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
  const weeklyPatients = await Patient.countDocuments({
    hospital: hospitalId,
    createdAt: { $gte: oneWeekAgo },
  });

  return { yearlyPatients, monthlyPatients, weeklyPatients };
};


const getDoctorsByHospital = async (req, res) => {
  try {
    const adminId = req.user.id; // Extract the admin ID from the request
    // Fetch the admin to get their hospital ID
    const admin = await Admin.findById(adminId).populate('hospital');

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const hospitalId = admin.hospital._id; // Get the hospital ID

    // Fetch all doctors associated with the hospital
    const doctors = await Doctor.find({ currentHospital: hospitalId });

    // Count total number of doctors
    const totalDoctors = doctors.length;

    // Respond with the list of doctors and the count
    return res.status(200).json({
      totalDoctors,
      doctors
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error', error });
  }
};

const getDoctorById = async (req, res) => {
    try {
      const adminId = req.user.id; // Extract the admin ID from the request
      const doctorId = req.params.id; // Get the doctor ID from the request parameters
  
      // Fetch the admin to get their hospital ID
      const admin = await Admin.findById(adminId).populate('hospital');
  
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      const hospitalId = admin.hospital._id; // Get the hospital ID
  
      // Fetch the doctor by ID and ensure they belong to the same hospital
      const doctor = await Doctor.findOne({
        _id: doctorId,
        currentHospital: hospitalId,
      });
  
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found in this hospital' });
      }
  
      // Respond with the doctor details
      return res.status(200).json({
        doctor,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server Error', error });
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

  // Fetch appointment details by ID
const getAppointmentDetails = async (req, res) => {
    try {
      const { appointmentId } = req.params;
  
      const appointment = await Appointment.findById(appointmentId)
        .populate('patient doctor', 'name phoneNumber age gender address') // Populating required fields from patient and doctor
        .exec();
  
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
  
      // Extract the required data
      const appointmentDetails = {
        appointmentType: appointment.appointmentType,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        patientName: appointment.patient.name,
        patientPhoneNumber: appointment.patient.phoneNumber,
        patientAge: appointment.patient.age,
        patientGender: appointment.patient.gender,
        patientIssue: appointment.patientIssue,
        diseaseName: appointment.diseaseName,
        doctorName: appointment.doctor.name,
        patientAddress: appointment.patient.address, // Assuming address is a string; adjust as needed
        // Add any other fields you want to include
      };
  
      res.status(200).json({ appointmentDetails });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error', error });
    }
  };
  
 
  const getReportAnalytics = async (req, res) => {
    try {
      // Total patients
      const totalPatients = await Patient.countDocuments();
  
      // Repeat patients (those with more than one appointment)
      const repeatPatientsCount = await Appointment.aggregate([
        {
          $group: {
            _id: "$patient", // Group by patient ID
            appointmentCount: { $sum: 1 }
          }
        },
        {
          $match: {
            appointmentCount: { $gt: 1 } // Only include patients with more than one appointment
          }
        },
        {
          $count: "repeatPatientsCount" // Count the number of repeat patients
        }
      ]);
  
      const repeatPatients = repeatPatientsCount.length > 0 ? repeatPatientsCount[0].repeatPatientsCount : 0;
  
      // Appointments monthly and yearly
      const monthlyAppointments = await Appointment.aggregate([
        {
          $group: {
            _id: { $month: "$appointmentDate" }, // Group by month
            count: { $sum: 1 }
          }
        }
      ]);
  
      const yearlyAppointments = await Appointment.aggregate([
        {
          $group: {
            _id: { $year: "$appointmentDate" }, // Group by year
            count: { $sum: 1 }
          }
        }
      ]);
  
      // Patient summary for new and old patients
      const newPatientsDaily = await Patient.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } });
      const newPatientsWeekly = await Patient.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) } });
  
      // Patient age distribution
      const ageDistribution = await Patient.aggregate([
        {
          $bucket: {
            groupBy: "$age", // Age field
            boundaries: [0, 2, 13, 20, 40, 60, Infinity], // Age ranges
            default: "60+", // Default for ages above 60
            output: {
              count: { $sum: 1 } // Count patients in each range
            }
          }
        }
      ]);
  
      // Count of patients by specialty type
      const specialtyCounts = await Appointment.aggregate([
        {
          $lookup: {
            from: 'doctors', // Collection name of the Doctor model
            localField: 'doctor',
            foreignField: '_id',
            as: 'doctorInfo'
          }
        },
        {
          $unwind: '$doctorInfo' // Flatten the array
        },
        {
          $group: {
            _id: '$doctorInfo.specialtyType', // Group by specialty type
            patientCount: { $sum: 1 }
          }
        }
      ]);
  
      // Count of doctors by specialty type
      const doctorCounts = await Doctor.aggregate([
        {
          $group: {
            _id: '$specialtyType', // Group by specialty type
            count: { $sum: 1 }
          }
        }
      ]);
  
      // Assemble the report data
      const reportData = {
        totalPatients,
        repeatPatients,
        monthlyAppointments,
        yearlyAppointments,
        newPatients: {
          daily: newPatientsDaily,
          weekly: newPatientsWeekly
        },
        ageDistribution,
        specialtyCounts,
        doctorCounts
      };
  
      res.status(200).json(reportData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error', error });
    }
  };  

  // Search appointments by patient name
  const searchAppointments = async (req, res) => {
    try {
      const searchQuery = req.query.name; // Get search query from request query parameters
  
      // Validate search query
      if (!searchQuery) {
        return res.status(400).json({ message: 'Please provide a valid search query.' });
      }
  
      // Find appointments where the patient's first name starts with the given search query
      const appointments = await Appointment.find()
        .populate({
          path: 'patient',
          select: 'firstName lastName', // Selecting patient's first and last name
          match: { firstName: { $regex: `^${searchQuery}`, $options: 'i' } } // Case-insensitive search for names starting with searchQuery
        })
        .populate({
          path: 'doctor',
          select: 'name', // Selecting doctor's name
        });
  
      // Filter out appointments where the patient doesn't match the search query
      const filteredAppointments = appointments.filter(appointment => appointment.patient !== null);
  
      // If no matching appointments found
      if (filteredAppointments.length === 0) {
        return res.status(404).json({ message: 'No appointments found for the given query.' });
      }
  
      // Format the response to include the necessary fields
      const responseData = filteredAppointments.map(appointment => ({
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        patientIssue: appointment.patientIssue,
        doctorName: appointment.doctor.name,
        diseaseName: appointment.diseaseName,
        appointmentType: appointment.appointmentType,
        appointmentTime: appointment.appointmentTime,
      }));
  
      res.status(200).json(responseData);
    } catch (error) {
      console.error('Error searching appointments:', error);
      res.status(500).json({ message: 'Server error while searching appointments.' });
    }
  };

// Get appointments for both doctor and patient views
let getAppointmentsForUser = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: 'Name query parameter is required.' });
    }

    // Find doctors whose name matches the query
    const matchingDoctors = await Doctor.find({ name: new RegExp(name, 'i') }).select('_id');
    const doctorIds = matchingDoctors.map(doctor => doctor._id);

    // Find patients whose name matches the query (first or last name)
    const matchingPatients = await Patient.find({
      $or: [
        { firstName: new RegExp(name, 'i') },
        { lastName: new RegExp(name, 'i') }
      ]
    }).select('_id');
    const patientIds = matchingPatients.map(patient => patient._id);

    // Find appointments where the doctor matches the found doctor IDs
    const doctorAppointments = await Appointment.find({
      doctor: { $in: doctorIds }
    })
    .populate({
      path: 'patient',
      select: 'firstName lastName', // Selecting patient's first and last name
    })
    .populate({
      path: 'doctor',
      select: 'name', // Selecting doctor's name
    });

    // Find appointments where the patient matches the found patient IDs
    const patientAppointments = await Appointment.find({
      patient: { $in: patientIds }
    })
    .populate({
      path: 'patient',
      select: 'firstName lastName', // Selecting patient's first and last name
    })
    .populate({
      path: 'doctor',
      select: 'name', // Selecting doctor's name
    });

    // Format doctor-side data
    const doctorData = doctorAppointments.map(appointment => ({
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      patientIssue: appointment.patientIssue,
      doctorName: appointment.doctor.name,
      diseaseName: appointment.diseaseName,
      appointmentType: appointment.appointmentType,
      appointmentTime: appointment.appointmentTime,
    }));

    // Format patient-side data
    const patientData = patientAppointments.map(appointment => ({
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      patientIssue: appointment.patientIssue,
      doctorName: appointment.doctor.name,
      diseaseName: appointment.diseaseName,
      appointmentType: appointment.appointmentType,
      appointmentTime: appointment.appointmentTime,
    }));

    // Combine both arrays in the response
    res.status(200).json({
      doctorData,  // Appointments where doctor name matches
      patientData  // Appointments where patient name matches
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error while fetching appointments.' });
  }
};

let getDoctorDetails = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: 'Doctor name query parameter is required.' });
    }

    // Find doctors whose name matches the query
    const doctors = await Doctor.find({ name: new RegExp(name, 'i') }).select(
      'name gender qualification specialtyType workingTime checkupTime breakTime'
    );

    if (!doctors.length) {
      return res.status(404).json({ message: 'No doctors found with the provided name.' });
    }

    // Respond with the matched doctor details
    res.status(200).json({
      doctorData: doctors
    });
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    res.status(500).json({ message: 'Server error while fetching doctor details.' });
  }
};

// Get all bills with filter on patient name
let getBills = async (req, res) => {
  try {
    const { patientName } = req.query; // Fetch the search query for filtering by patient name

    // Build the query object
    const query = {};

    // If a patient name is provided, search for bills by that patient's name
    if (patientName) {
      query.patientName = { $regex: patientName, $options: 'i' }; // Case-insensitive search
    }

    // Fetch bills with populated patient and doctor details
    const bills = await Bill.find(query)
      .populate({
        path: 'patientId',
        select: 'firstName lastName phoneNumber' // Only populate firstName, lastName, and phoneNumber from Patient model
      })
      .populate({
        path: 'doctorId',
        select: 'doctorName' // Fetch the doctor's name using doctorId
      })
      .select('billNo patientId doctorId diseaseName phoneNumber paymentStatus billDate billTime paymentType insuranceDetails'); // Select necessary fields

    // Map data for "Monitor" array
    const monitorData = bills.map(bill => ({
      billId: bill._id,
      billNo: bill.billNo,
      patientName: `${bill.patientId?.firstName || ''} ${bill.patientId?.lastName || ''}`.trim(),
      diseaseName: bill.diseaseName || 'N/A',
      phoneNumber: bill.patientId?.phoneNumber || bill.phoneNumber,
      status: bill.paymentStatus,
      date: bill.billDate.toDateString(),
      time: bill.billTime
    }));

    // Map data for "Insurance" array (with insurance details)
    const insuranceData = bills
      .filter(bill => bill.paymentType === 'insurance') // Only include bills with 'insurance' payment type
      .map(bill => ({
        billId: bill._id,
        billNo: bill.billNo,
        doctorName: bill.doctorId?.doctorName || 'N/A', // Fetch the doctor's name
        patientName: `${bill.patientId?.firstName || ''} ${bill.patientId?.lastName || ''}`.trim(),
        diseaseName: bill.diseaseName || 'N/A',
        insuranceCompany: bill.insuranceDetails?.insuranceCompany || 'N/A',
        insurancePlan: bill.insuranceDetails?.insurancePlan || 'N/A', 
        billDate: bill.billDate.toDateString() // Bill date
      }));


    // Map data for "Payment Process" array
    const paymentProcessData = bills.map(bill => ({
      billId: bill._id,
      billNo: bill.billNo,
      patientName: `${bill.patientId?.firstName || ''} ${bill.patientId?.lastName || ''}`.trim(),
      diseaseName: bill.diseaseName || 'N/A',
      phoneNumber: bill.patientId?.phoneNumber || bill.phoneNumber,
      status: bill.paymentStatus,
      date: bill.billDate.toDateString(),
      time: bill.billTime
    }));

    // Return all three arrays in the response
    res.status(200).json({
      success: true,
      monitorData,
      insuranceData,
      paymentProcessData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving bills',
      error: error.message
    });
  }
};

module.exports = {
    defaults,
    register,
    createDoctor,
    createHospital,
    getAllHospitals,
    getHospitalById,
    updateHospitalById,
    deleteHospitalById,
    deleteDoctorById,
    getprofile,
    updateProfile,
    changeAdminPassword,
    datadeshboard,
    getDoctorsByHospital,
    getDoctorById,
    getTodayAppointments,
    getPreviousAppointments,
    getUpcomingAppointments,
    getCanceledAppointments,
    getAppointmentDetails,
    getReportAnalytics,
    searchAppointments,
    getAppointmentsForUser,
    getDoctorDetails,
    getBills,
};
