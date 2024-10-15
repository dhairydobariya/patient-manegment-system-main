// const Chat = require('../models/chatModel');

// // Fetch chat between doctor and patient
// exports.getChat = async (req, res) => {
//   const { doctorId, patientId } = req.params;
//   try {
//     const chat = await Chat.findOne({ doctor: doctorId, patient: patientId })
//       .populate('doctor', 'name') // Populate doctor name
//       .populate('patient', 'name'); // Populate patient name

//     if (!chat) {
//       return res.status(404).json({ msg: 'No chat history found' });
//     }

//     res.json(chat);
//   } catch (error) {
//     res.status(500).json({ msg: 'Server error' });
//   }
// };

// // Save new chat message
// exports.saveChatMessage = async (doctorId, patientId, message, senderId, senderModel) => {
//   try {
//     let chat = await Chat.findOne({ doctor: doctorId, patient: patientId });

//     if (!chat) {
//       chat = new Chat({ doctor: doctorId, patient: patientId });
//     }

//     const newMessage = {
//       sender: senderId,
//       senderModel,
//       message,
//       type: 'text', // You can modify this to handle file attachments
//     };

//     chat.messages.push(newMessage);
//     chat.lastUpdated = Date.now();
//     await chat.save();

//     return newMessage;
//   } catch (error) {
//     console.error('Error saving message:', error);
//   }
// };


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
        const history = await Chat.find({ doctorId, patientId}).sort({ timestamp: 1 });
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
        const doctorContacts = await Chat.find({  patientId })
            .distinct('doctorId');
        res.status(200).json(doctorContacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retrieve list of patients a doctor has chatted with
exports.getPatientContacts = async (req, res) => {
    const { doctorId } = req.params;
    try {
        const patientContacts = await Chat.find({  doctorId })
            .distinct('patientId');
        res.status(200).json(patientContacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
