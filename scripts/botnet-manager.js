import {ArgError, ArgParser} from '/scripts/lib/arg-parser2';
import {Logger} from '/scripts/lib/logger';
import {copyWithDependencies} from '/scripts/lib/utils';

class Manager {
    running;
    workers = [];

    constructor(ns, device, port, config = '/conf/botnet.txt') {
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
    const hostname = ns.getHostname(), portNum = 1;
    const argParser = new ArgParser('botnet-manager.js', 'Connect & manage a network of devices to launch distributed attacks.', [
        new ArgParser('copy', 'Copy file & dependencies to swarm nodes', [
            {name: 'file', desc: 'File to copy', default: false},
            {name: 'manager', desc: 'Copy to manager node', flags: ['-m', '--manager'], default: false},
            {name: 'noDeps', desc: 'Skip copying dependencies', flags: ['-d', '--no-deps'], default: false},
            {name: 'workers', desc: 'Copy to worker nodes', flags: ['-w', '--workers'], default: false},
        ]),
        new ArgParser('join', 'Connect device as a worker node to the swarm', [
            {name: 'device', desc: 'Device to connect, defaults to the current machine', optional: true, default: hostname}
        ]),
        new ArgParser('kill', 'Kill any scripts running on worker nodes'),
        new ArgParser('leave', 'Disconnect worker node from swarm', [
            {name: 'device', desc: 'Device to disconnect, defaults to the current machine', optional: true, default: hostname}
        ]),
        new ArgParser('run', 'Copy & run script on all worker nodes', [
            {name: 'script', desc: 'Script to copy & execute', type: 'string'},
            {name: 'args', desc: 'Arguments for script. Forward the current target with: {{TARGET}}', optional: true, extras: true},
        ]),
        new ArgParser('start', 'Start this device as the swarm manager'),
        {name: 'silent', desc: 'Suppress program output', flags: ['-s', '--silent'], default: false},
    ]);
    const args = argParser.parse(ns.args);

    // Help
    if(args['help'] || args['_error'])
        ns.tprint(argParser.help(args['help'] ? null : args['_error'], args['_command']));

    // Run
    if(args['_command'] == 'start') { // Start botnet manager
        if(args['start']['help'] || args['start']['_error'])
            ns.tprint(argParser.help(args['start']['help'] ? null : args['start']['_error'], 'start'));
        ns.tprint(`Starting swarm manager: ${args['remote']}`);
        ns.tprint(`Connect a worker with: run swarm.js --join ${args['remote']}`);
        await new Manager(ns, hostname, portNum).start();
    } else if(args['_command'] == 'copy') { // Issue copy command
        if(args['copy']['help'] || args['copy']['_error'])
            ns.tprint(argParser.help(args['copy']['help'] ? null : args['copy']['_error'], 'copy'));
        await this.ns.writePort(portNum, JSON.stringify({
            manager: args['copy']['remote'],
            command: 'copy',
            value: args['copy']['file']
        }));
    } else if(args['_command'] == 'join') { // Issue join command
        if(args['join']['help'] || args['join']['_error'])
            ns.tprint(argParser.help(args['join']['help'] ? null : args['join']['_error'], 'join'));
        await this.ns.writePort(portNum, JSON.stringify({
            manager: args['join']['remote'],
            command: 'join',
            value: args['join']['device']
        }));
    } else if(args['_command'] == 'kill') { // Issue kill command
        if(args['kill']['help'] || args['kill']['_error'])
            ns.tprint(argParser.help(args['kill']['help'] ? null : args['kill']['_error'], 'kill'));
        await this.ns.writePort(portNum, JSON.stringify({
            manager: args['kill']['remote'],
            command: 'kill'
        }));
    } else if(args['_command'] == 'leave') { // Issue leave command
        if(args['leave']['help'] || args['leave']['_error'])
            ns.tprint(argParser.help(args['leave']['help'] ? null : args['leave']['_error'], 'leave'));
        await this.ns.writePort(portNum, JSON.stringify({
            manager: args['leave']['remote'],
            command: 'leave',
            value: args['leave']['device']
        }));
    } else if(args['_command'] == 'run') { // Issue run command
        if(args['run']['help'] || args['run']['_error'])
            ns.tprint(argParser.help(args['run']['help'] ? null : args['run']['_error'], 'run'));
        await this.ns.writePort(portNum, JSON.stringify({
            manager: args['run']['remote'],
            command: 'run',
            value: args['run']['script'],
            args: args['run']['args']
        }));
    }
}
