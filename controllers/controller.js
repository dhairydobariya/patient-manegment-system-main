let mongoose = require('mongoose');
let Admin = require('../models/adminModel');
let Doctor = require('../models/doctorModel');
let Patient = require('../models/patientModel');
let bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// User Login
let login = async (req, res) => {
    const { email, password } = req.body; // Only email and password are required

    // Validate the input
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Check if the user exists across all models
        let user;
        let userType;

        user = await Admin.findOne({ email });
        if (user) {
            userType = 'admin';
        } else {
            user = await Doctor.findOne({ email });
            if (user) {
                userType = 'doctor';
            } else {
                user = await Patient.findOne({ email });
                if (user) {
                    userType = 'patient';
                }
            }
        }

        // If no user is found, return an error
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare the password
        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, userType },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Set the token in an HTTP-only cookie
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        res.json({ message: "User successfully logged in", token, userType });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// User Logout
let logout = (req, res) => {
    // Clear the token cookie
    res.clearCookie('token');
    res.json({ message: "User successfully logged out" });
};

module.exports = {
    login,
    logout,
};
