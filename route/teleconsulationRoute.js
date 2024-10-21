const express = require('express');
const router = express.Router();
const teleconsultationController = require('../controllers/teleconsulationcontroller');
const {authenticateUser , authorizeRoles} = require('../middleware/authMiddleware') // Middleware to check if user is authenticated

// Start teleconsultation (Creates a room)
router.post('/start/:appointmentId',authenticateUser,authorizeRoles('Doctor' , 'patient'), teleconsultationController.startTeleconsultation);

// Join teleconsultation
router.get('/join/:teleconsultationId',authenticateUser,authorizeRoles('Doctor' , 'patient'), teleconsultationController.joinTeleconsultation);

// End teleconsultation
router.post('/end/:teleconsultationId',authenticateUser,authorizeRoles('Doctor' , 'patient'), teleconsultationController.endTeleconsultation);

// Get teleconsultation status
router.get('/status/:teleconsultationId',authenticateUser,authorizeRoles('Doctor' , 'patient'), teleconsultationController.getTeleconsultationStatus);

module.exports = router;
