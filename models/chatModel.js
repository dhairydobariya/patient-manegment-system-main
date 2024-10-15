const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    messageContent: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Doctor' },
    patientId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Patient' },
    mediaUrl: { type: String }, // Optional for media messages (images, videos, etc.)
    mediaType: { type: String }, // Optional to define the type of media (image, video, etc.)
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['read', 'unread'], default: 'unread' }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
