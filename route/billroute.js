const express = require('express');
const router = express.Router();
const { createBillFromAppointment, manualCreateBill, updateBill } = require('../controllers/billcontroller');

// Route for creating a bill from an appointment
router.post('/create-from-appointment/:appointmentId', createBillFromAppointment);

// Route for manual bill creation by admin
router.post('/manual-create', manualCreateBill);

// Route for editing a bill
router.put('/update/:billId', updateBill);



module.exports = router;
