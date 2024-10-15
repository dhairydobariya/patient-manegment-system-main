const io = require('socket.io-client');

// Replace with your server URL
const socket = io('http://localhost:4000');

const doctorId = '67059eb616e6599ad1e9a223';
const patientId = '6705a453c803a44ae6c8c5a4';

// Join the room
socket.emit('joinRoom', { doctorId, patientId });

// Listen for incoming messages
socket.on('message', (message) => {
    console.log('New message:', message);
});

// Send a chat message
socket.emit('chatMessage', {
    doctorId,
    patientId,
    message: 'Hello, this is a test message!',
    senderId: doctorId,  // Use doctorId or patientId based on who is sending
    senderModel: 'Doctor', // or 'Patient'
});

// Handle any errors
socket.on('error', (error) => {
    console.error('Error:', error);
});
