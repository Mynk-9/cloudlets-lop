require('dotenv').config();
const io = require('socket.io-client');
const diskUsage = require('check-disk-space').default;
const fs = require('fs');

const SERVER = process.env.SERVER;
const PORT = process.env.PORT || 3000;

let storageSpaceState = 'LOW';
const THRESHOLD0 = 0.4;
const THRESHOLD1 = 0.8;

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

socket.on('high_storage_send_data', () => {
    // console.log('server requesting data');
    const fileName = 'sent-big-dummy-data.txt';
    fs.readFile('./assets/big-dummy-data.txt', (err, buff) => {
        if (err) {
            console.log('file not found');
            return;
        }
        console.log('Data read successful');
        socket.emit('high_storage_send_data', { name: fileName, data: buff });
    });
});

setInterval(() => {
    diskUsage(process.env.DISKPATH).then(diskSpace => {
        let ratio = Math.random(); // diskSpace.free/diskSpace.size

        const storageInfo = {
            ...diskSpace,
            ratio: ratio,
            // state: storageSpaceState,
            clientId: socket.id,
        };

        if (ratio <= THRESHOLD0) {
            storageSpaceState = 'LOW';
            socket.emit('storage_info', {
                ...storageInfo,
                state: storageSpaceState,
            });
        } else if (THRESHOLD0 < ratio <= THRESHOLD1) {
            storageSpaceState = 'MID';
            socket.emit('storage_info', {
                ...storageInfo,
                state: storageSpaceState,
            });
        } else {
            storageSpaceState = 'HIG';
            socket.emit('storage_info', {
                ...storageInfo,
                state: storageSpaceState,
            });
        }
    });
}, 2000);
