const express = require('express');
const { createTeleconsultation, joinTeleconsultation } = require('../controllers/teleconsultationController');

const router = express.Router();

// Route to create a teleconsultation session
router.post('/start', createTeleconsultation);

// Route to join an existing teleconsultation session
router.get('/join/:appointmentId', joinTeleconsultation);

module.exports = router;
