// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatcontroller');

// CRUD operations for chat messages
router.post('/api/chat', chatController.createMessage);
router.get('/api/chat/:doctorId/:patientId', chatController.getChatHistory);
router.put('/api/chat/:chatId', chatController.updateMessageStatus);
router.delete('/api/chat/:chatId', chatController.deleteMessage);

// Endpoints to retrieve contacts list
router.get('/api/chat/contacts/patient/:patientId', chatController.getDoctorContacts);
router.get('/api/chat/contacts/doctor/:doctorId', chatController.getPatientContacts);

module.exports = router;
