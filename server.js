require('dotenv').config();
const { Server } = require('socket.io');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

const io = new Server(PORT);

let intervals = [];
let clients = {};

io.on('connection', socket => {
    console.log('user connected', socket.id);
    clients[socket.id] = {};

    socket.on('storage_info', data => {
        // console.log(
        //     'storage info update for',
        //     socket.id,
        //     'status:',
        //     data.state
        // );
        if (data.state === 'HIG') {
            console.log('HIG storage usage in ', socket.id);
            socket.emit('high_storage_send_data');
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
            console.log('Error: no information on client storage available');
        } else if (clients[lowestStorageClient].storageState === 'HIG') {
            console.log('Error: no client with LOW or MID storage available');
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
