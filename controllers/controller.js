let mongoose = require('mongoose');
let Admin = require('../models/adminModel');
let Doctor = require('../models/doctorModel');
let Patient = require('../models/patientModel');
let bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

let login = async (req, res) => {
    const { identifier, password } = req.body;

    // Validate input
    if (!identifier || !password) {
        return res.status(400).json({ message: 'Email/phone number and password are required' });
    }

    try {
        let user;
        let userType;

        const query = { $or: [{ email: identifier }, { phoneNumber: identifier }] };
        
        console.log("Searching for user with identifier:", identifier); // Log identifier

        // Search in the Admin model
        user = await Admin.findOne(query);
        if (user) {
            userType = 'admin';
        } else {
            // Search in the Doctor model
            user = await Doctor.findOne(query);
            if (user) {
                userType = 'doctor';
            } else {
                // Search in the Patient model
                user = await Patient.findOne(query);
                if (user) {
                    userType = 'patient';
                }
            }
        }

        console.log("User found:", user); // Log user data if found

        // If no user is found, return an error
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match:", isMatch); // Log password match result
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, userType },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.json({ message: "User successfully logged in", token, userType });
    } catch (error) {
        console.error("Error during login:", error.message); // Log error details
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
