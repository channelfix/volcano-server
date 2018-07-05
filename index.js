const path = require('path');
const express = require('express');
const consolidate = require('consolidate');
const config = require('./config');
const websockets = require('./websockets');

const app = express();

app.engine('html', consolidate.nunjucks);
app.set('views', path.resolve(__dirname, 'views'));

app.use('/static', express.static(path.resolve(__dirname, 'static')));
app.get('/', (req, res) => res.render('index.html'));

const server = app.listen(config.app.PORT, () => {
    console.log(`Server running at port ${config.app.PORT}`);
});

const ws = websockets({
    server,
    path: '/ws'
});

let db = {};
let clients = [];

ws.on('connection', socket => {
    clients.push(socket);

    socket.on('close', () => {
        clients = clients.filter(client => client !== socket);
    });

    socket.emit('connect', 'You are now connected to the volcano server.');

    socket.on('set', ({path, value}) => {
        const segments = path.split('/');
        const target = getObject(db, segments.slice(0, segments.length - 1));
        target[segments[segments.length - 1]] = value;

        clients.forEach(client => {
            client.emit('change', {
                path: '',
                value: db
            });

            for (let i = 1; i <= segments.length; i++) {
                const subpath = segments.slice(0, i);
                client.emit('change', {
                    path: subpath.join('/'),
                    value: getObject(db, subpath)
                });
            }

            if (typeof value === 'object') {
                notifyChange(client, segments, value);
            }
        });
    });
});

function getObject(source, segments) {
    if (!segments.length) {
        return source;
    }

    const first = segments[0];
     if (!source.hasOwnProperty(first)) {
        source[first] = {};
    }

    return getObject(source[first], segments.slice(1));
}

function notifyChange(socket, segments, value) {
    if (typeof value === 'object') {
        Object.keys(value).forEach(key => {
            const keyValue = value[key];
            notifyChange(socket, [...segments, key], keyValue);
        });
    } else {
        socket.emit('change', {
            path: segments.join('/'),
            value: value
        });
    }
}
