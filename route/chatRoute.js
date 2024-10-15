const express = require('express');
const router = express.Router();
const {
    createMessage,
    getChatHistory,
    updateMessageStatus,
    deleteMessage,
    getDoctorContacts,
    getPatientContacts
} = require('../controllers/chatController.js');

// CRUD operations for chat messages
router.post('/', createMessage);
router.get('/:doctorId/:patientId', getChatHistory);
router.put('/:chatId', updateMessageStatus);
router.delete('/:chatId', deleteMessage);

// Endpoints to retrieve contacts list
router.get('/contacts/patient/:patientId', getDoctorContacts);
router.get('/contacts/doctor/:doctorId', getPatientContacts);

module.exports = router;
