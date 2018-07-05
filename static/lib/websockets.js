window.websockets = (function() {
    class SocketWrapper {
        constructor(url) {
            this.socket = new WebSocket(url);
            this.listeners = {};

            this.socket.addEventListener('message', e => {
                const {name, data} = JSON.parse(e.data);
                this._localEmit(name, data);
            });
        }

        on(name, callback) {
            if (!this.listeners[name]) {
                this.listeners[name] = [];
            }
            this.listeners[name] = [...this.listeners[name], callback];
        }

        off(name, callback) {
            if (!this.listeners[name]) return;

            if (callback) {
                this.listeners[name] = this.listeners[name]
                    .filter(listener => listener !== callback);
            }
            if (!callback || !this.listeners[name].length) {
                delete this.listeners[name];
            }
        }

        emit(name, data) {
            this.socket.send(JSON.stringify({name, data}));
        }

        _localEmit(name, data) {
            if (!this.listeners[name]) return;

            this.listeners[name].forEach(callback => callback(data));
        }
    }

    function websocketFactory(url) {
        return new SocketWrapper(url);
    }

    return websocketFactory;
})();
