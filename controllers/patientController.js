const Patient = require('../models/patientModel');
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







module.exports = {
    register,
    getPatientProfile,
    updatePatientProfile,
}