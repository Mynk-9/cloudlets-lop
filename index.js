require('dotenv').config();
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

const io = new Server(PORT);

io.on('connection', socket => {
    console.log('a user connected', socket);
});
