require('dotenv').config();
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

const io = new Server(PORT);

let intervals = [];

io.on('connection', socket => {
    console.log('a user connected');

    socket.on('handshake', data => {
        console.log(`handshake with ${data}`);
    });
    socket.on('storage_info', data => {
        console.log('got storage info', data);
    });

    // let intervalId = setInterval(() => {
    //     if (!socket) return;

    //     console.log('Sending storage info request');
    //     socket.emit('storage_info');
    // }, 1000);
    // intervals.push(intervalId);
});

process.on('exit', () => {
    intervals.forEach(interval => clearInterval(interval));
});
