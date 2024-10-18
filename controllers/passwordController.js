// const Admin = require('../models/adminModel');
// const Doctor = require('../models/doctorModel');
// const Patient = require('../models/patientModel');
// const bcrypt = require('bcrypt');
// const nodemailer = require('nodemailer');
// const jwt = require('jsonwebtoken');
// require('dotenv').config();
// const JWT_SECRET =  process.env.JWT_SECRET
// const OTP_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

// // To store OTP temporarily (can use Redis or a DB field for production)
// let otpStore = {};

// // Generate a 6-digit OTP
// const generateOtp = () => {
//     return Math.floor(100000 + Math.random() * 900000);
// };

// // Generate JWT
// const generateJwt = (email) => {
//     return jwt.sign({ email }, JWT_SECRET, { expiresIn: '10m' }); // Token expires in 10 minutes
// };

// // Step 1: Send OTP to email and create JWT
// exports.sendOtpForPasswordReset = async (req, res) => {
//     const { email } = req.body; // Only email is provided

//     try {
//         const user = await Admin.findOne({ email }) ||
//                      await Doctor.findOne({ email }) ||
//                      await Patient.findOne({ email });

//         if (!user) {
//             return res.status(400).json({ message: 'No user found with this email' });
//         }

//         const otp = generateOtp();
//         console.log(`Generated OTP: ${otp} for email: ${email}`);

//         otpStore[email] = { otp, expiresAt: Date.now() + OTP_EXPIRATION_TIME };
//         console.log(`Stored OTP: ${JSON.stringify(otpStore[email])}`);

//         // Generate JWT and store it in a cookie
//         const token = generateJwt(email);
//         res.cookie('otptoken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' }); // Set cookie

//         const transporter = nodemailer.createTransport({
//             service: 'Gmail',
//             auth: {
//                 user: process.env.EMAIL,
//                 pass: process.env.EMAIL_PASSWORD,
//             },
//             tls: {
//                 rejectUnauthorized: false,
//             },
//         });

//         const mailOptions = {
//             from: process.env.EMAIL,
//             to: user.email,
//             subject: 'Your Password Reset OTP',
//             text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`,
//         };

//         await transporter.sendMail(mailOptions);

//         res.json({ message: 'OTP sent to your email address'  ,generateJwt } , );
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// // Step 2: Verify OTP and JWT
// exports.verifyOtp = async (req, res) => {
//     const { otp } = req.body; // Only OTP is provided

//     try {
//         const token = req.cookies.otptoken; // Retrieve the JWT from the cookie
//         if (!token) {
//             return res.status(401).json({ message: 'No OTP token found, please request a new OTP' });
//         }

//         // Verify the JWT
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const { email } = decoded;

//         const storedOtpDetails = otpStore[email];

//         if (!storedOtpDetails) {
//             return res.status(400).json({ message: 'No OTP found for this email, or OTP expired' });
//         }

//         const { otp: storedOtp, expiresAt } = storedOtpDetails;

//         if (Date.now() > expiresAt) {
//             delete otpStore[email]; // Expired OTP, remove it
//             return res.status(400).json({ message: 'OTP has expired' });
//         }

//         if (storedOtp !== parseInt(otp, 10)) {
//             return res.status(400).json({ message: 'Invalid OTP' });
//         }

//         // Successfully verified OTP
//         res.json({ message: 'OTP verified successfully', email });
//     } catch (error) {
//         if (error.name === 'JsonWebTokenError') {
//             return res.status(401).json({ message: 'Invalid OTP token' });
//         }
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// // Step 3: Reset Password after OTP verification
// exports.resetPassword = async (req, res) => {
//     const { newPassword, confirmPassword } = req.body; // New password and confirm password provided

//     // Validate new password and confirm password
//     if (newPassword !== confirmPassword) {
//         return res.status(400).json({ message: 'Passwords do not match' });
//     }

//     try {
//         const token = req.cookies.otptoken; // Retrieve the JWT from the cookie
//         if (!token) {
//             return res.status(401).json({ message: 'No OTP token found, please request a new OTP' });
//         }

//         // Verify the JWT
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const { email } = decoded;

//         const user = await Admin.findOne({ email }) ||
//                      await Doctor.findOne({ email }) ||
//                      await Patient.findOne({ email });

//         if (!user) {
//             return res.status(400).json({ message: 'User does not exist' });
//         }

//         const hashedPassword = await bcrypt.hash(newPassword, 10);
//         user.password = hashedPassword;

//         await user.save();
//         delete otpStore[email]; // Remove OTP once password is reset

//         res.clearCookie('otptoken'); // Clear the OTP token cookie after use
//         res.json({ message: 'Password successfully reset' });
//     } catch (error) {
//         if (error.name === 'JsonWebTokenError') {
//             return res.status(401).json({ message: 'Invalid OTP token' });
//         }
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };


const express = require('express');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Admin = require('../models/adminModel');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
require('dotenv').config();

// Twilio credentials
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const JWT_SECRET = process.env.JWT_SECRET;
const OTP_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

// Temporary storage for OTPs (in production, consider using a persistent store)
let otpStore = {};

// Helper function to generate a 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

// Generate JWT for OTP token
const generateJwt = (identifier) => {
    return jwt.sign({ identifier }, JWT_SECRET, { expiresIn: '10m' }); // Token expires in 10 minutes
};

// Step 1: Send OTP to email or phone
exports.sendOtpForPasswordReset = async (req, res) => {
    const { email, phoneNumber } = req.body;

    try {
        let user;
        let identifier;
        let isPhone = false;

        // Check if an email is provided
        if (email) {
            user = await Admin.findOne({ email }) ||
                await Doctor.findOne({ email }) ||
                await Patient.findOne({ email });

            if (!user) {
                return res.status(400).json({ message: 'No user found with this email' });
            }

            identifier = email;
        }
        // Check if a phone number is provided
        else if (phoneNumber) {
            user = await Admin.findOne({ phoneNumber }) ||
                await Doctor.findOne({ phoneNumber }) ||
                await Patient.findOne({ phoneNumber });

            if (!user) {
                return res.status(400).json({ message: 'No user found with this phone number' });
            }

            identifier = phoneNumber;
            isPhone = true;
        } else {
            return res.status(400).json({ message: 'Please provide an email or phone number' });
        }

        // Generate and store OTP
        const otp = generateOtp();
        otpStore[identifier] = { otp, expiresAt: Date.now() + OTP_EXPIRATION_TIME };

        // Generate JWT and store it in a cookie
        const token = generateJwt(identifier);
        res.cookie('otptoken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        // Send OTP via email or SMS
        if (isPhone) {
            // Send OTP via SMS
            await twilioClient.messages.create({
                body: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber,
            });
            res.json({ message: 'OTP sent to your phone number' });
        } else {
            // Send OTP via Email
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'Your Password Reset OTP',
                text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`,
            };

            await transporter.sendMail(mailOptions);
            res.json({ message: 'OTP sent to your email address' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Step 2: Verify OTP and JWT
exports.verifyOtp = async (req, res) => {
    const { otp } = req.body; // Only OTP is provided

    try {
        const token = req.cookies.otptoken; // Retrieve the JWT from the cookie
        if (!token) {
            return res.status(401).json({ message: 'No OTP token found, please request a new OTP' });
        }

        // Verify the JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { identifier } = decoded;

        const storedOtpDetails = otpStore[identifier];

        if (!storedOtpDetails) {
            return res.status(400).json({ message: 'No OTP found, or OTP expired' });
        }

        const { otp: storedOtp, expiresAt } = storedOtpDetails;

        if (Date.now() > expiresAt) {
            delete otpStore[identifier]; // Expired OTP, remove it
            return res.status(400).json({ message: 'OTP has expired' });
        }

        if (storedOtp !== parseInt(otp, 10)) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Successfully verified OTP
        res.json({ message: 'OTP verified successfully', identifier });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid OTP token' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Step 3: Reset Password after OTP verification
exports.resetPassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body; // New password and confirm password provided

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const token = req.cookies.otptoken; // Retrieve the JWT from the cookie
        if (!token) {
            return res.status(401).json({ message: 'No OTP token found, please request a new OTP' });
        }

        // Verify the JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { identifier } = decoded;

        const user = await Admin.findOne({ email: identifier }) ||
                     await Doctor.findOne({ email: identifier }) ||
                     await Patient.findOne({ email: identifier }) ||
                     await Admin.findOne({ phoneNumber: identifier }) ||
                     await Doctor.findOne({ phoneNumber: identifier }) ||
                     await Patient.findOne({ phoneNumber: identifier });

        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();
        delete otpStore[identifier]; // Remove OTP once password is reset

        res.clearCookie('otptoken'); // Clear the OTP token cookie after use
        res.json({ message: 'Password successfully reset' });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid OTP token' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
