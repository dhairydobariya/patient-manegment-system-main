const express = require('express');
const passwordController = require('../controllers/passwordController');
const router = express.Router();

// Forgot Password - Step 1: Request OTP
router.post('/forgot-password', passwordController.sendOtpForPasswordReset);

// Forgot Password - Step 2: Verify OTP and Phone Number
router.post('/verify-otp', passwordController.verifyOtp);

// Reset Password - Step 3: Reset the password
router.post('/reset-password', passwordController.resetPassword);

module.exports = router;
 