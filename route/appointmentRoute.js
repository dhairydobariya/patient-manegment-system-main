const express = require('express');
const router = express.Router();
const { createAppointment,
        getAppointment,
        updateAppointment,
        cancelAppointment,
        deleteAppointment,
        addUnavailableTime ,
        removeUnavailableTime,
        getTodayAppointments,
        getPreviousAppointments,
        getCanceledAppointments,
        getUpcomingAppointments,
        getAppointmentsByDoctor,
        getAppointmentsByPatient,
    } = require('../controllers/appointmentController.js');

const {authenticateUser , authorizeRoles} = require('../middleware/authMiddleware')

router.get('/doctor',authenticateUser,authorizeRoles('Doctor'), getAppointmentsByDoctor);
router.get('/patient',authenticateUser,authorizeRoles('patient'), getAppointmentsByPatient);



// Create a new appointment
router.post('/' ,authenticateUser,authorizeRoles('Doctor' , 'patient'), createAppointment);

// Get appointment details
router.get('/:id',authenticateUser,authorizeRoles('Doctor' , 'patient'), getAppointment);

// Update appointment (patient/doctor can change time)
router.patch('/:id' ,authenticateUser,authorizeRoles('Doctor' , 'patient') , updateAppointment);

// Cancel an appointment
router.patch('/:id/cancel' ,authenticateUser,authorizeRoles('Doctor','patient'), cancelAppointment);



// Delete appointment (doctor and patient  only)
router.delete('/:id' ,authenticateUser,authorizeRoles('Doctor' , 'patient'), deleteAppointment);




router.post('/doctors/unavailable-times',authenticateUser,authorizeRoles('Doctor'), addUnavailableTime);

// Route for removing unavailable time
router.delete('/doctors/unavailable-times',authenticateUser,authorizeRoles('Doctor'), removeUnavailableTime);



//patient-manegment
// GET Today's appointments
router.get('/appointments/today',authenticateUser,authorizeRoles('Doctor' ,'admin') , getTodayAppointments);

// GET Previous appointments
router.get('/appointments/previous',authenticateUser,authorizeRoles('Doctor' , 'admin') , getPreviousAppointments);

// GET Upcoming appointments
router.get('/appointments/upcoming',authenticateUser,authorizeRoles('Doctor' , 'admin') , getUpcomingAppointments);

// GET Canceled appointments
router.get('/appointments/canceled',authenticateUser,authorizeRoles('Doctor' , 'admin') , getCanceledAppointments);



module.exports = router;
