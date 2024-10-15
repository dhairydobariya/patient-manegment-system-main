// middleware/verifyOtp.js

// This should match the one in your controller
let otpStore = {}; // This will be replaced by the same otpStore in the controller

const verifyOtpMiddleware = (req, res, next) => {
    const { email, otp } = req.body;

    // Check if there's a stored OTP for the email
    const storedOtpDetails = otpStore[email];

    if (!storedOtpDetails) {
        return res.status(400).json({ message: 'No OTP found for this email, or OTP expired' });
    }

    const { otp: storedOtp, expiresAt } = storedOtpDetails;

    // Check if the OTP is expired
    if (Date.now() > expiresAt) {
        delete otpStore[email]; // Remove expired OTP
        return res.status(400).json({ message: 'OTP has expired' });
    }

    // Validate the OTP
    if (storedOtp !== parseInt(otp, 10)) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    // If OTP is valid, proceed to the next middleware/controller
    next();
};

module.exports = verifyOtpMiddleware;
