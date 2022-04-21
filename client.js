require('dotenv').config();
const io = require('socket.io-client');
const diskUsage = require('check-disk-space').default;

const SERVER = process.env.SERVER;
const PORT = process.env.PORT || 3000;
let storageSpaceState = 'LOW';

const socket = io(SERVER + PORT);
socket.on('connect', () => {
    console.log(socket.id);

    console.log('Handshaking with the server.');
    socket.emit('handshake', `${socket.id}`);
});

socket.on('storage_info', () => {
    console.log('received storage request');
    diskUsage(process.env.DISKPATH).then(diskSpace => {
        socket.emit('storage_info', { ...diskSpace, id: socket.id });
    });
});

setInterval(() => {
    diskUsage(process.env.DISKPATH).then(diskSpace => {
        let ratio = Math.random(); // diskSpace.free/diskSpace.size
        if (ratio > 0.5 && storageSpaceState === 'LOW') {
            storageSpaceState = 'HIGH';
            socket.emit('storage_info', {
                ...diskSpace,
                ratio: ratio,
                state: storageSpaceState,
                clientId: socket.id,
            });
        } else if (ratio < 0.5 && storageSpaceState === 'HIGH') {
            storageSpaceState = 'LOW';
            socket.emit('storage_info', {
                ...diskSpace,
                ratio: ratio,
                state: storageSpaceState,
                clientId: socket.id,
            });
        }
        // else lite bois
    });
}, 2000);
