let express = require("express");
let app = express();
let port = process.env.PORT || 4000;

const http = require('http');
const socketIo = require('socket.io');
const chatRoutes = require('./route/chatRoute.js'); // Chat routes
const Chat = require("./models/chatModel.js"); 

let route = require('./route/route');
let billroute = require('./route/billroute.js');
let adminroute = require('./route/adminRoute');
let doctorroute = require('./route/doctorRoutes');
let patientroute = require('./route/patientRoutes');
let passwordroute = require('./route/passwordRoutes');
let apointmentroute = require('./route/appointmentRoute.js');
let prescriptionsroute = require('./route/prescriptionRoutes.js');
let teleconsultationroute = require('./route/teleconsulationRoute.js');
let patientrecordroute = require('./route/patientRecordRoute.js');

let bodyparser = require('body-parser');
let mongoose = require('./db/database');
let cookieparser = require('cookie-parser');

require('dotenv').config();

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieparser());

app.use('/', route);
app.use('/bill', billroute);
app.use('/chats', chatRoutes); // Chat routes
app.use('/admin', adminroute);
app.use('/doctor', doctorroute);
app.use('/patient', patientroute);
app.use('/password', passwordroute);
app.use('/appointment', apointmentroute);
app.use('/prescriptions', prescriptionsroute);
app.use('/teleconsultation', teleconsultationroute);
app.use('/patientrecords', patientrecordroute);

// Socket.io implementation
const server = http.createServer(app);
const io = socketIo(server);

// Socket.IO connection and handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a chat room based on doctorId and patientId
    socket.on('joinRoom', ({ doctorId, patientId }) => {
        const room = [doctorId, patientId].sort().join('-'); // Unique room identifier
        console.log(`Joining room: ${room}`);
        socket.join(room);
        socket.emit('joinRoom', { doctorId, patientId });
    });

    // Handle chat messages and save them to the database
    socket.on('message', async (data) => {
        try {
            const { doctorId, patientId, senderId, receiverId, messageContent, mediaUrl, mediaType } = data;
            const chat = new Chat({ doctorId, patientId, senderId, receiverId, messageContent, mediaUrl, mediaType });
            await chat.save();

            const room = [doctorId, patientId].sort().join('-');
            io.to(room).emit('message', chat); // Broadcasting the message to the room
        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('error', { message: 'Could not save message.' });
        }
    });

    // Handle WebRTC offer (for video chat)
    socket.on('offer', (data) => {
        const { offer, room } = data;
        console.log(`Offer sent to room: ${room}`, offer);
        socket.to(room).emit('offer', { offer, room });
    });

    // Handle WebRTC answer
    socket.on('answer', (data) => {
        const { answer, room } = data;
        console.log(`Answer sent to room: ${room}`, answer);
        socket.to(room).emit('answer', { answer, room });
    });

    // Handle ICE candidates
    socket.on('candidate', (data) => {
        const { candidate, room } = data;
        console.log(`Candidate sent to room: ${room}`, candidate);
        socket.to(room).emit('candidate', { candidate, room });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Listen on the specified port
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});