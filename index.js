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

ws.on('connection', socket => {
    socket.emit('connect', 'You are now connected to the volcano server.');

    socket.on('set', ({path, value}) => {
        const segments = path.split('/');
        const target = getObject(db, segments.slice(0, segments.length - 1));
        target[segments[segments.length - 1]] = value;

        socket.emit('change', db);
    });
});

function getObject(source, segments) {
    if (!segments.length) {
        return source;
    }

    const first = segments[0];
    console.log(first);
     if (!source.hasOwnProperty(first)) {
        source[first] = {};
    }

    return getObject(source[first], segments.slice(1));
}
