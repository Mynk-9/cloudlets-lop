require('dotenv').config();
const { Server } = require('socket.io');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

const io = new Server(PORT);

let intervals = [];

io.on('connection', socket => {
    console.log('a user connected');

    socket.on('handshake', data => {
        console.log(`handshake with ${data}`);
    });
    socket.on('storage_info', data => {
        if (data.state === 'HIG') console.log('got storage info', data);
        if (data.state === 'HIG') socket.emit('high_storage_send_data');
    });
    socket.on('high_storage_send_data', data => {
        console.log(data);
        fs.writeFile(
            __dirname + `/${data.fileName}`,
            new Buffer.from(data.data),
            err => {
                if (err) {
                    console.log('Error in writing file');
                    return;
                }

                console.log('Successfully saved file.');
            }
        );
    });
});

process.on('exit', () => {
    intervals.forEach(interval => clearInterval(interval));
});
