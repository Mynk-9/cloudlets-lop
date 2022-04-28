require('dotenv').config();
const { Server } = require('socket.io');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

const io = new Server(PORT);

let intervals = [];
let clients = {};
let dataQueue = [];
const checkLowStorageUsageClients = () => {
    let lowStorageUsageClients = [];
    for (const clientId in clients) {
        const ratio = clients[clientId].storageRatio;
        if (ratio != null) lowStorageUsageClients.push(ratio);
    }
    return lowStorageUsageClients;
};

io.on('connection', socket => {
    console.log('user connected', socket.id);
    clients[socket.id] = {};

    socket.on('storage_info', data => {
        if (data.state === 'HIG') {
            console.log('HIG storage usage in', socket.id);
            if (checkLowStorageUsageClients().length > 0)
                socket.emit('high_storage_send_data');
        } else if (dataQueue.length !== 0) {
            const queuedData = dataQueue[0].data;
            const queuedFromClient = dataQueue[0].fromClient;
            console.log(
                `LOW/MID storage usage in ${socket.id}, sending queued data of ${queuedFromClient}`
            );
            socket.emit('receive_data', queuedData);
            dataQueue = dataQueue.slice(1);
        }
        clients[socket.id] = {
            storageState: data.state,
            storageRatio: data.ratio,
            socket: socket,
        };
    });
    socket.on('high_storage_send_data', data => {
        let lowestStorageClient = null;
        let lowestStorageRatio = 1;
        for (const clientId in clients) {
            const ratio = clients[clientId].storageRatio;
            if (ratio != null && ratio < lowestStorageRatio) {
                lowestStorageRatio = ratio;
                lowestStorageClient = clientId;
            }
        }

        if (lowestStorageClient === null) {
            console.log(
                'Error: no information on client storage available. Adding data to data queue.'
            );
            dataQueue.push({
                data: data,
                fromClient: socket.id,
            });
        } else if (clients[lowestStorageClient].storageState === 'HIG') {
            console.log(
                'Error: no client with LOW or MID storage available. Adding data to data queue.'
            );
            dataQueue.push({
                data: data,
                fromClient: socket.id,
            });
        } else {
            console.log(
                'Transferring files from',
                socket.id,
                'to',
                lowestStorageClient
            );
            clients[lowestStorageClient].socket.emit('receive_data', data);
        }
    });
});

process.on('exit', () => {
    intervals.forEach(interval => clearInterval(interval));
});
