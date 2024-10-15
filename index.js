let express = require("express");
let app = express();
let port = process.env.PORT || 4000;

const http = require('http');
const socketIo = require('socket.io');
const chatRoutes = require('./route/chatRoute.js'); // Chat routes
const { saveChatMessage } = require('./controllers/chatcontroller.js');
const Chat = require("./models/chatModel.js")

let route = require('./route/route');
let billroute = require('./route/billroute.js');
let adminroute = require('./route/adminRoute');
let doctorroute = require('./route/doctorRoutes');
let patientroute = require('./route/patientRoutes');
let passwordroute = require('./route/passwordRoutes');
let apointmentroute = require('./route/appointmentRoute.js');
let prescriptionsroute = require('./route/prescriptionRoutes.js');
let teleconsultationroute = require('./route/teleconsulationRoute.js');
let patientrecordroute = require('./route/patientRecordRoute.js')

let bodyparser = require('body-parser');
let mongoose = require('./db/database');
let cookieparser = require('cookie-parser');
const { log } = require("console");

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
app.use('/patientrecords', patientrecordroute)

// Socket.io implementation
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', ({ doctorId, patientId }) => {
      
        const room = [doctorId, patientId].sort().join('-');
        console.log(room)        
        socket.join(room);
        socket.emit('joinRoom', { doctorId, patientId });
    });

    socket.on('message', async (data) => {
      console.log(data);
        const { doctorId , patientId, messageContent } = data;
        const chat = new Chat({ doctorId, patientId, messageContent });
        await chat.save();

        const room = [doctorId, patientId].sort().join('-');
        io.to(room).emit('message', chat);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(port, (req, res) => {
  console.log(`Server is running on port ${port}`);
});

