// controllers/chatController.js
const Chat = require('../models/chatModel');

// Create a new message
exports.createMessage = async (req, res) => {
    const { senderId, receiverId, messageContent } = req.body;
    try {
        const chat = new Chat({ senderId, receiverId, messageContent });
        await chat.save();
        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retrieve chat history between a doctor and patient
exports.getChatHistory = async (req, res) => {
    const { doctorId, patientId } = req.params;
    try {
        const history = await Chat.find({
            $or: [
                { senderId: doctorId, receiverId: patientId },
                { senderId: patientId, receiverId: doctorId }
            ]
        }).sort({ timestamp: 1 });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a message's status
exports.updateMessageStatus = async (req, res) => {
    const { chatId } = req.params;
    try {
        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { status: 'read' },
            { new: true }
        );
        res.status(200).json(updatedChat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    const { chatId } = req.params;
    try {
        await Chat.findByIdAndDelete(chatId);
        res.status(200).json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retrieve list of doctors a patient has chatted with
exports.getDoctorContacts = async (req, res) => {
    const { patientId } = req.params;
    try {
        const doctorContacts = await Chat.find({ senderId: patientId })
            .distinct('receiverId');
        res.status(200).json(doctorContacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retrieve list of patients a doctor has chatted with
exports.getPatientContacts = async (req, res) => {
    const { doctorId } = req.params;
    try {
        const patientContacts = await Chat.find({ senderId: doctorId })
            .distinct('receiverId');
        res.status(200).json(patientContacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
