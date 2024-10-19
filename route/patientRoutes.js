const express = require('express');

const patientController = require('../controllers/patientController');
const passwordController = require('../controllers/passwordController'); // Assuming you have a password controller for reset/forget functionalities
const {authenticateUser , authorizeRoles} = require('../middleware/authMiddleware')
const upload = require('../middleware/multer');

const router = express.Router();

// Patient Registration
router.post('/register', patientController.register);



// Get Patient Profile
router.get('/profile', authenticateUser,authorizeRoles("patient") ,patientController.getPatientProfile);

// Update Patient Profile
router.patch('/profile', authenticateUser,authorizeRoles("patient"),upload.single('profileImage'), patientController.updatePatientProfile);


//patient pannel

// patient health record page and its functionalty

router.get('/personal-health-record/profile', authenticateUser,authorizeRoles("patient") ,patientController.getPatientProfile);
router.get('/personal-health-record/medicalhistory', authenticateUser,authorizeRoles("patient") ,patientController.getMedicalHistory);
router.get('/personal-health-record/prescription', authenticateUser,authorizeRoles("patient") ,patientController.getPrescriptions);
router.get('/personal-health-record/prescription/:prescriptionId', authenticateUser,authorizeRoles("patient") ,patientController.getPrescriptionById);
router.get('/personal-health-record/medicalhistory/:appointmentId', authenticateUser,authorizeRoles("patient") ,patientController.getMedicalHistoryById);
router.get('/personal-health-record/AllAppointment', authenticateUser,authorizeRoles("patient") ,patientController.getAllAppointmentsForPatient);
router.get('/personal-health-record/patientRecords', authenticateUser,authorizeRoles("patient") ,patientController.getAllPatientRecords);


//appointment page routes
router.get('/appointment-page/scheduled', authenticateUser,authorizeRoles("patient") ,patientController.getScheduledAppointments);
router.get('/appointment-page/previous', authenticateUser,authorizeRoles("patient") ,patientController.getPreviousAppointments);
router.get('/appointment-page/canceled', authenticateUser,authorizeRoles("patient") ,patientController.getCanceledAppointments);
router.get('/appointment-page/pending', authenticateUser,authorizeRoles("patient") ,patientController.getPendingAppointments);
router.get('/appointment-page/one-appointment/:appointmentId', authenticateUser,authorizeRoles("patient") ,patientController.getAppointmentDetails);


//prescription page
router.get('/prescription-page/all-prescription', authenticateUser,authorizeRoles("patient") ,patientController.getAllPrescriptions);


//bill page routes
router.get('/bill-page', authenticateUser,authorizeRoles("patient") ,patientController.getBills);


module.exports = router;
