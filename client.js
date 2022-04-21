require('dotenv').config();
const io = require('socket.io-client');

const SERVER = process.env.SERVER;
const PORT = process.env.PORT || 3000;

const socket = io(SERVER + PORT);
socket.on('connect', () => {
    console.log(socket.id);

    console.log('Handshaking with the server.');
    socket.emit('handshake', `${socket.id}`);
});
socket.on('info', data => {
    console.log(data);
});
