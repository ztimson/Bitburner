export class PortHelper {
    /**
     *
     * @param ns
     * @param port
     * @param host
     */
    constructor(ns, port, host) {
        this.ns = ns;
        this.host = host;
        this.portNum = port;
        this.port = ns.getPortHandle(port);
        this.callbacks = {};
    }

    check() {
        const pending = [];
        while(!this.port.empty()) pending.push(this.port.read());
        pending.filter(p => {
            try {
                const payload = JSON.parse(p);
                if(this.callbacks[payload.subject]) return !this.callbacks[payload.subject](payload.value);
                if(this.callbacks['*']) return !this.callbacks['*'](payload.value);
                return true;
            } catch {
                return true;
            }
        }).forEach(p => this.port.write(p));
    }

    subscribe(subject, callback) { if(typeof callback == 'function') this.callbacks[subject] = callback; }

    send(subject, value) {
        this.ns.writePort(this.portNum, JSON.stringify({
            from: this.host,
            subject,
            value
        }));
    }

    unsubscribe(subject) { delete this.callbacks[subject]; }
}
