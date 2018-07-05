const EventEmitter = require('events');
const ws = require('ws');

class SocketWrapper extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;
        this._localEmit = EventEmitter.prototype.emit.bind(this);

        socket.on('message', message => {
            const {name, data} = JSON.parse(message);
            this._localEmit(name, data);
        });

        socket.on('close', () => {
            this._localEmit('close');
        });
    }

    emit(name, data) {
        this.socket.send(JSON.stringify({name, data}));
    }
}

class ServerWrapper extends EventEmitter {
    constructor(server) {
        super();
        this.server = server;

        server.on('connection', socket => {
            const socketWrapper = new SocketWrapper(socket);
            this.emit('connection', socketWrapper);
        });
    }
}

function websocketFactory(config) {
    const websocket = new ws.Server(config);
    const serverWrapper = new ServerWrapper(websocket);

    return serverWrapper;
}

module.exports = websocketFactory;
