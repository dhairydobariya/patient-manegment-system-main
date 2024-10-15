const Chat = require("../models/chatModel.js");
const Doctor = require("../models/doctorModel.js");
const Patient = require("../models/patientModel.js");

// Create a new message
const createMessage = async (req, res) => {
    const { senderId, receiverId, doctorId, patientId, messageContent, mediaUrl, mediaType } = req.body;
    try {
        const chat = new Chat({ senderId, receiverId, doctorId, patientId, messageContent, mediaUrl, mediaType });
        await chat.save();
        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retrieve chat history between a doctor and patient
const getChatHistory = async (req, res) => {
    const { doctorId, patientId } = req.params;
    try {
        const history = await Chat.find({ doctorId, patientId }).sort({ timestamp: 1 });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a message's status to "read"
const updateMessageStatus = async (req, res) => {
    const { chatId } = req.params;
    try {
        const updatedChat = await Chat.findByIdAndUpdate(chatId, { status: "read" }, { new: true });
        res.status(200).json(updatedChat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a message
const deleteMessage = async (req, res) => {
    const { chatId } = req.params;
    try {
        await Chat.findByIdAndDelete(chatId);
        res.status(200).json({ message: "Message deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retrieve list of doctors a patient has chatted with
const getDoctorContacts = async (req, res) => {
    const { patientId } = req.params;
    try {
        const doctorIds = await Chat.find({ patientId }).distinct("doctorId");
        const doctorContacts = await Doctor.find({ _id: { $in: doctorIds } }).select("-password");
        res.status(200).json(doctorContacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retrieve list of patients a doctor has chatted with
const getPatientContacts = async (req, res) => {
    const { doctorId } = req.params;
    try {
        const patientIds = await Chat.find({ doctorId }).distinct("patientId");
        const patientContacts = await Patient.find({ _id: { $in: patientIds } }).select("-password");
        res.status(200).json(patientContacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createMessage,
    getChatHistory,
    updateMessageStatus,
    deleteMessage,
    getDoctorContacts,
    getPatientContacts
};
