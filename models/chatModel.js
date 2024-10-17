// models/Chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    messageContent: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['read', 'unread'], default: 'unread' }
});

module.exports = mongoose.model('Chat', chatSchema);
