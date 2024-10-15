const express = require('express');
const router = express.Router();
const { login , logout } = require('../controllers/controller'); // Adjust the path as needed

// User Login Route
router.post('/login', login);
router.post('/logout',logout)

// Export the router
module.exports = router;
