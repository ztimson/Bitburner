import {ArgError, ArgParser} from '/scripts/lib/arg-parser';
import {Logger} from '/scripts/lib/logger';
import {copyWithDependencies} from '/scripts/lib/utils';

class Manager {
    running;
    workers = [];

    constructor(ns, device, port, config = '/conf/swarm.txt') {
        this.ns = ns;
        this.config = config;
        this.device = device;
        this.logger = new Logger(this.ns, [
            () => `Swarm Manager: ${device}`,
            () => `Workers: ${this.workers.length}\tCores: ${this.workers.reduce((acc, w) => acc + w.cpuCores, 0)}\tRAM: ${this.workers.reduce((acc, w) => acc + w.maxRam, 0)} GB`
        ]);
        this.port = port;
    }

    isCommand(payload) { return payload['manager'] == this.device && payload['command'] != null; }

    async load() {
        const state = JSON.parse(await this.ns.read(this.config) || 'null');
        if(state) {
            this.running = state.running;
            if(this.running) await this.runCommand(this.running['command'], this.running);
            this.workers = state.workers;
        }
    }

    async runCommand(command, extra = null) {
        if (command == 'copy') {
            this.logger.log(`Copying: ${extra['value']}`);
            await this.workerExec(async w => await copyWithDependencies(ns, extra['value'], w));
        } else if (command == 'join') {
            const exists = this.workers.findIndex(w => w.hostname == extra['value']);
            this.workers.splice(exists, 1);
            this.workers.push(this.ns.getServer(extra['value']));
            this.logger.log(`${exists != -1 ? 'Reconnected' : 'Connected:'}: ${extra['value']}`);
            if(this.running) await this.runCommand(this.running['command'], {...this.running, device: extra['value']});
        } else if (command == 'kill') {
            this.logger.log('Killing scripts');
            await this.workerExec(w => this.ns.killall(w.hostname));
            this.running = null;
        } else if (command == 'leave') {
            this.logger.log(`Disconnecting: ${extra['value']}`);
            const worker = this.workers.splice(this.workers.findIndex(w => w.hostname == extra['value']), 1);
            this.ns.killall(worker.hostname);
        } else if (command == 'run') {
            await this.runCommand('copy', {value: extra['value']});
            await this.runCommand('kill');
            const run = (w) => {
                const threads = ~~(w.maxRam / this.ns.getScriptRam(extra['value'], this.ns.getHostname())) || 1;
                this.ns.exec(extra['value'], w, threads, ...(extra['args'] || []));
            }
            if(extra['device']) {
                const w = this.workers.find(w => w.hostname == extra['device']);
                if(w) run(w);
            } else {
                this.logger.log(`Starting script: ${extra['value']}`);
                await this.workerExec(run);
                this.running = {[command]: command, ...extra};
            }
        }
    }

    async save() {
        await this.ns.write(this.config, JSON.stringify({
            running: this.running,
            workers: this.workers
        }), 'w');
    }

    async start(load = true) {
        if(load) await this.load();
        let checkTick = -1, runCheck = false;
        for(let tick = 1; true; tick = tick == 3600 ? 1 : tick + 1) {
            if(tick == checkTick) runCheck = true;
            await this.ns.sleep(1000);

            // Check for new commands
            const payload = this.ns.readPort(this.port);

            // Check if we need to update the running command every hour
            if(payload == 'NULL PORT DATA' && runCheck && this.running['update']) {
                runCheck = false;
                await this.runCommand(this.running['command'], this.running);
                continue;
            }

            // Run command
            if(this.isCommand(payload)) {
                checkTick = tick;
                await this.runCommand(payload['command'], payload);
                await this.save();
            } else { // Invalid command
                this.logger.log(`Unknown command: ${JSON.stringify(payload)}`);
            }
        }
    }

    async workerExec(fn) { for(let w of this.workers) await fn(w); }
}

/**
 * @param ns {NS} - BitBurner API
 */
export async function main(ns) {
    // Setup
    ns.disableLog('ALL');
    const argParser = new ArgParser('swarm.js', 'Manage a swarm of devices.', [
        'COPY [--HELP] [OPTIONS] FILE [DEST]',
        'JOIN [--HELP] MANAGER [DEVICE]',
        'KILL [--HELP]',
        'LEAVE [--HELP]',
        'MINE [--HELP] [OPTIONS] DEVICE',
        'RUN [--HELP] [OPTIONS] SCRIPT [ARGS]...',
        'START [--HELP] [OPTIONS]'
    ], [
        new ArgParser('copy', 'Copy file & dependencies to swarm nodes', null, [
            {name: 'file', desc: 'File to copy', type: 'bool'},
            {name: 'dest', desc: 'File destination on nodes', optional: true, type: 'bool'},
            {name: 'manager', desc: 'Copy to manager node', flags: ['-m', '--manager'], type: 'bool'},
            {name: 'noDeps', desc: 'Skip copying dependencies', flags: ['-d', '--no-deps'], type: 'bool'},
            {name: 'workers', desc: 'Copy to worker nodes', flags: ['-w', '--workers'], type: 'bool'},
        ]),
        new ArgParser('join', 'Connect device as a worker node to the swarm', null, [
            {name: 'device', desc: 'Device to connect, defaults to the current machine', optional: true, default: ns.getHostname(), type: 'string'}
        ]),
        new ArgParser('kill', 'Kill any scripts running on worker nodes'),
        new ArgParser('leave', 'Disconnect worker node from swarm', null, [
            {name: 'device', desc: 'Device to disconnect, defaults to the current machine', optional: true, default: ns.getHostname(), type: 'string'}
        ]),
        new ArgParser('run', 'Copy & run script on all worker nodes', null, [
            {name: 'script', desc: 'Script to copy & execute', type: 'string'},
            {name: 'args', desc: 'Arguments for script. Forward the current target with: {{TARGET}}', optional: true, extras: true, type: 'string'},
        ]),
        new ArgParser('start', 'Start this device as the swarm manager')
    ]);

    try {
        // Run
        const portNum = 1;
        const args = argParser.parse(ns.args);
        if(args['command'].toLowerCase() == 'start') { // Start swarm manager
            ns.tprint(`Starting swarm manager: ${args['remote']}`);
            ns.tprint(`Connect a worker with: run swarm.js --join ${args['remote']}`);
            await new Manager(ns, ns.getHostname(), portNum).start();
        } else { // Send a command to the swarm
            if(args['command'] == 'copy') {
                await this.ns.writePort(portNum, JSON.stringify({
                    manager: args['remote'],
                    command: 'copy',
                    value: args['file']
                }));
            } else if(args['command'] == 'join') {
                await this.ns.writePort(portNum, JSON.stringify({
                    manager: args['remote'],
                    command: 'join',
                    value: args['device']
                }));
            } else if(args['command'] == 'kill') {
                await this.ns.writePort(portNum, JSON.stringify({
                    manager: args['remote'],
                    command: 'kill'
                }));
            } else if(args['command'] == 'leave') {
                await this.ns.writePort(portNum, JSON.stringify({
                    manager: args['remote'],
                    command: 'leave',
                    value: args['device']
                }));
            } else if(args['command'] == 'run') {
                await this.ns.writePort(portNum, JSON.stringify({
                    manager: args['remote'],
                    command: 'run',
                    value: args['script'],
                    args: args['args']
                }));
            }
        }
    } catch(err) {
        if(err instanceof ArgError) return ns.tprint(parser.help(err.message));
        throw err;
    }
}
