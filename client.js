require('dotenv').config();
const io = require('socket.io-client');
const diskUsage = require('check-disk-space').default;
const fs = require('fs');

const SERVER = process.env.SERVER;
const PORT = process.env.PORT || 3000;

let storageSpaceState = 'LOW';
const THRESHOLD0 = 0.4;
const THRESHOLD1 = 0.8;
const getRatio = diskSpace => {
    // return { ratio: diskSpace.free / diskSpace.size }; // use this for production
    const randNum = Math.random(); // for testing purposes
    return { ratio: randNum }; // for testing purposes
};
const sendStorageStatusUpdate = () => {
    diskUsage(process.env.DISKPATH).then(diskSpace => {
        const ratio = getRatio(diskSpace).ratio;
        const storageInfo = {
            ...diskSpace,
            ratio: ratio,
        };

        if (ratio <= THRESHOLD0) {
            storageSpaceState = 'LOW';
            socket.emit('storage_info', {
                ...storageInfo,
                state: storageSpaceState,
            });
        } else if (THRESHOLD0 < ratio && ratio <= THRESHOLD1) {
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
};

const socket = io(SERVER + PORT);
socket.on('connect', () => {
    console.log(socket.id);
    sendStorageStatusUpdate();
});

socket.on('storage_info', () => {
    console.log('received storage request');
    diskUsage(process.env.DISKPATH).then(diskSpace => {
        socket.emit('storage_info', {
            ...diskSpace,
            ...getRatio(diskSpace),
        });
    });
});

socket.on('high_storage_send_data', () => {
    // console.log('server requesting data');
    const fileName = 'sent-big-dummy-data.txt';
    fs.readFile('./assets/dummy-data.txt', (err, buff) => {
        if (err) {
            console.log('file not found');
            return;
        }
        console.log('Data read successful');
        socket.emit('high_storage_send_data', {
            fileName: fileName,
            data: buff,
        });
    });
});

socket.on('receive_data', data => {
    console.log(`saving data to file`, data.fileName);
    fs.writeFile(
        __dirname + `/${data.fileName}`,
        new Buffer.from(data.data),
        err => {
            if (err) {
                console.log('Error in writing file');
                return;
            }

            console.log('Successfully saved file.', data.fileName);
        }
    );
});

setInterval(() => {
    sendStorageStatusUpdate();
}, process.env.DISKPOLLINTERVAL);
