var websockets = (function() {
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

const origin = "volcano-server-jdszpmajoj.now.sh";
const ws = websockets(`wss://${origin}/ws`);


var volcano = {
	database: {
		ref: function(path){
			// console.log(path);

			return {
				on: function(name, callback){
					ws.on('change', function(value){
						if(value.path == path){
							callback(value.value);
						}
					});
				},
				set: function(value){
					ws.emit('set', {path, value});
				}
			};
		}
	},

    ready: function(callback) {
        this.onReady = callback;
    },

    onReady: null
};

ws.socket.addEventListener("open", function() {
    if (typeof volcano.onReady === 'function') {
        volcano.onReady();
    }
});
