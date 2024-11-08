const express = require("express");
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoose = require('./db/database'); // Mongoose config
const Chat = require("./models/chatModel.js"); // Chat model
const cors = require('cors')

const chatRoutes = require('./route/chatRoute.js'); // Chat routes
const route = require('./route/route');
const billroute = require('./route/billroute.js');
const adminroute = require('./route/adminRoute');
const doctorroute = require('./route/doctorRoutes');
const patientroute = require('./route/patientRoutes');
const passwordroute = require('./route/passwordRoutes');
const appointmentroute = require('./route/appointmentRoute.js');
const prescriptionsroute = require('./route/prescriptionRoutes.js');
const patientrecordroute = require('./route/patientRecordRoute.js');
// const teleconsulation = require('./route/teleconsulationroute.js')
const testreportroute = require('./route/testreportroute.js')
const morgan = require('morgan')

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })    
  );

  app.use(morgan())

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());



// Routes
app.use('/', route);
app.use('/bill', billroute);
app.use('/chats', chatRoutes); // Chat routes
app.use('/admin', adminroute); // Admin route
app.use('/doctor', doctorroute);
app.use('/patient', patientroute);
app.use('/password', passwordroute);
app.use('/appointment', appointmentroute);
app.use('/prescriptions', prescriptionsroute);
app.use('/patientrecords', patientrecordroute);
// app.use('/teleconsulation', teleconsulation)
app.use('/testreport', testreportroute)

  
// Socket.io server setup
const server = http.createServer(app);
const io = socketIo(server);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', ({ doctorId, patientId }) => {
        const room = [doctorId, patientId].sort().join('-');
        socket.join(room);
    });

    socket.on('message', async (data) => {
        const { senderId, receiverId, messageContent } = data;
        const chat = new Chat({ senderId, receiverId, messageContent });
        await chat.save();

        const room = [senderId, receiverId].sort().join('-');
        io.to(room).emit('message', chat);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


// Start the server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

