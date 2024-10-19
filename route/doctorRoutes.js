const express = require('express');

const doctorController = require('../controllers/doctorController');
const {authenticateUser , authorizeRoles} = require('../middleware/authMiddleware')
const upload = require('../middleware/multer');

const router = express.Router();

router.get('/profile' ,authenticateUser,authorizeRoles('Doctor'), doctorController.profile)
router.patch('/profile', authenticateUser,authorizeRoles('Doctor'), upload.fields([{ name: 'profileImage' }, { name: 'signature' }]), doctorController.updateProfile);
router.patch('/profile/changepass', authenticateUser,authorizeRoles('Doctor'), doctorController.changeDoctorPassword);

//doctor manegment
//appointment manegment
router.get('/doctor-pannel/appointment/today' ,authenticateUser,authorizeRoles('Doctor'), doctorController.getTodaysAppointments)
router.get('/doctor-pannel/appointment/upcoming' ,authenticateUser,authorizeRoles('Doctor'), doctorController.getUpcomingAppointments)
router.get('/doctor-pannel/appointment/previous' ,authenticateUser,authorizeRoles('Doctor'), doctorController.getPreviousAppointments)
router.get('/doctor-pannel/appointment/canceld' ,authenticateUser,authorizeRoles('Doctor'), doctorController.getCanceledAppointments)

//patient records
router.get('/doctor-pannel/patient-records/:period' ,authenticateUser,authorizeRoles('Doctor'), doctorController.getPatientRecords)
router.get('/doctor-pannel/patient-records/patient/:id' ,authenticateUser,authorizeRoles('Doctor'), doctorController.getPatientDetails)
authenticateUser
//prescription-manegment
router.get('/doctor-pannel/prescription' ,authenticateUser,authorizeRoles('Doctor'), doctorController.getAppointments)
router.get('/doctor-pannel/prescription/manage' ,authenticateUser,authorizeRoles('Doctor'), doctorController.getPrescriptions)

//chat page 
router.get('/doctor-pannel/chat-app/patientdetail' ,authenticateUser,authorizeRoles('Doctor'), doctorController.getPatientsForDoctor)


module.exports = router;
