    const express = require('express');
    const adminController = require('../controllers/adminController');
    const doctorController = require('../controllers/doctorController');
    const {authenticateUser , authorizeRoles} = require('../middleware/authMiddleware')
    const upload = require('../middleware/multer');

    const router = express.Router();    
    // Admin Registration
    router.post('/register', adminController.register);

    router.get('/defaults', adminController.defaults)
    //add hospital 
    // Create a new hospital
    router.post('/hospitals',authenticateUser,authorizeRoles('admin'), adminController.createHospital);
    // Get all hospitals
    router.get('/hospitals', adminController.getAllHospitals);  
    // Get a single hospital by ID
    router.get('/hospitals/:id',authenticateUser,authorizeRoles('admin'), adminController.getHospitalById);
    // Update a hospital by ID
    router.put('/hospitals/:id',authenticateUser,authorizeRoles('admin'), adminController.updateHospitalById);
    // Delete a hospital by ID
    router.delete('/hospitals/:id',authenticateUser,authorizeRoles('admin'), adminController.deleteHospitalById);



    //profile
    router.get('/profile' ,authenticateUser,authorizeRoles('admin'), adminController.getprofile )
    router.patch('/profile' ,authenticateUser,authorizeRoles('admin'),upload.single('profileImage'), adminController.updateProfile )
    router.post('/profile/changepass' , authenticateUser,authorizeRoles('admin'), adminController.changeAdminPassword)


    //doctor-manegment 
    router.get('/doctor-manegment', authenticateUser,authorizeRoles('admin') ,adminController.getDoctorsByHospital );
    router.get('/doctor-manegment/doctor/:id', authenticateUser,authorizeRoles('admin'), adminController.getDoctorById);
    router.post('/doctor-manegment/create-doctor',authenticateUser,authorizeRoles('admin'), adminController.createDoctor);
    router.delete('/doctor-manegment/doctor/:id', adminController.deleteDoctorById);


    //patient-manegment
    // GET Today's appointments
    router.get('/patient-manegment/appointments/today',authenticateUser,authorizeRoles('Doctor' ,'admin') , adminController.getTodayAppointments);
    // GET Previous appointments
    router.get('/patient-manegment/appointments/previous',authenticateUser,authorizeRoles('Doctor' , 'admin') , adminController.getPreviousAppointments);
    // GET Upcoming appointments
    router.get('/patient-manegment/appointments/upcoming',authenticateUser,authorizeRoles('Doctor' , 'admin') , adminController.getUpcomingAppointments);
    // GET Canceled appointments
    router.get('/patient-manegment/appointments/canceled',authenticateUser,authorizeRoles('Doctor' , 'admin') , adminController.getCanceledAppointments);
    // GET Appointment details by ID
    router.get('/patient-manegment/appointments/:appointmentId' ,authenticateUser,authorizeRoles('Doctor' , 'admin') , adminController.getAppointmentDetails);

    //report and analyist
    router.get('/report-analytics',authenticateUser,authorizeRoles('Doctor' , 'admin'), adminController.getReportAnalytics);



    // searching api   & deshboard - chages
    router.get('/jhn', adminController.getAppointmentsForUser);

    router.get('/patient', adminController.searchAppointments);

    router.get('/doctor' , adminController.getDoctorDetails)

    router.get('/admindata' ,authenticateUser,authorizeRoles('admin'), adminController.datadeshboard)

    //billing and payment
    router.get('/bills',authenticateUser,authorizeRoles('admin'), adminController.getBills);

    module.exports = router;
