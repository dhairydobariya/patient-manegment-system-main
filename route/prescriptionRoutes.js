const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/priscriptioncontroller');
const {authenticateUser , authorizeRoles} = require('../middleware/authMiddleware')

// POST: Create prescription based on appointmentId
router.post('/:appointmentId',authenticateUser,authorizeRoles('Doctor'), prescriptionController.createPrescription);

// GET: Get all prescriptions
router.get('/',authenticateUser,authorizeRoles('Doctor','patient'), prescriptionController.getAllPrescriptions);

// GET: Get prescription by appointmentId
router.get('/:appointmentId',authenticateUser,authorizeRoles('Doctor','patient'), prescriptionController.getPrescriptionByAppointment);

// PUT: Update prescription by appointmentId
router.patch('/:prescriptionId',authenticateUser,authorizeRoles('Doctor'), prescriptionController.updatePrescription);

// DELETE: Delete prescription by appointmentId
router.delete('/:appointmentId',authenticateUser,authorizeRoles('Doctor'), prescriptionController.deletePrescription);

module.exports = router;
