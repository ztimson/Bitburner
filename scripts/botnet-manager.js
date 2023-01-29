import {ArgParser} from '/scripts/lib/arg-parser';
import {Config} from '/scripts/lib/data-file';
import {Logger} from '/scripts/lib/logger';
import {copyWithDependencies} from '/scripts/copy';

const configPath = '/etc/botnet.txt';
const port = 1;

class Manager {
    running;
    workers = [];

    async constructor(ns, hostname) {
        ns.disableLog('ALL');
        this.ns = ns;
        this.config = new Config(configPath);
        this.hostname = hostname;
        this.logger = new Logger(this.ns, [
            () => `Botnet: ${device}`,
            () => `Workers: ${this.workers.length}\tCores: ${this.workers.reduce((acc, w) => acc + w.cpuCores, 0)}\tRAM: ${this.workers.reduce((acc, w) => acc + w.maxRam, 0)} GB`
        ]);

        // Port communication
        this.rx = () => {
            let payload = ns.readPort(port);
            return payload == 'NULL PORT DATA' ? null : payload;
        }
        this.tx = (payload) => ns.writePort(port + 10, JSON.stringify(payload));
    }

    isCommand(payload) { return ['copy', 'join', 'kill', 'leave', 'run'].includes(payload['command']); }

    async load() {
        const state = JSON.parse(await this.ns.read(this.config) || 'null');
        if(state) {
            this.running = state.running;
            this.workers = state.workers;
            if(this.running) await this.runCommand(this.running);
        }
    }

    async runCommand(request = null) {
        try {
            if (request['command'] == 'copy') {
                this.logger.log(`Copying: ${request['value']}`);
                await this.workerExec(async w => await copyWithDependencies(ns, request['value'], w));
            } else if (request['command'] == 'join') {
                if(request['value'] == this.device) throw 'Cannot connect manager as a worker';
                const exists = this.workers.findIndex(w => w.hostname == request['value']);
                if(exists != -1) this.workers.splice(exists, 1);
                this.workers.push(this.ns.getServer(request['value']));
                this.logger.log(`${exists != -1 ? 'Reconnected' : 'Connected'}: ${request['value']}`);
                if(this.running) await this.runCommand({
                    ...this.running,
                    device: request['value']
                });
            } else if (request['command'] == 'kill') {
                this.logger.log('Killing scripts');
                await this.workerExec(w => this.ns.killall(w.hostname));
                this.running = null;
            } else if (request['command'] == 'leave') {
                this.logger.log(`Disconnecting: ${request['value']}`);
                const worker = this.workers.splice(this.workers.findIndex(w => w.hostname == request['value']), 1);
                this.ns.killall(worker.hostname);
            } else if (request['command'] == 'run') {
                await this.runCommand('copy', {value: request['value']});
                await this.runCommand('kill');
                const run = (w) => {
                    const threads = ~~(w.maxRam / this.ns.getScriptRam(request['value'], this.ns.getHostname())) || 1;
                    this.ns.exec(request['value'], w, threads, ...(request['args'] || []));
                }
                if (request['device']) {
                    const w = this.workers.find(w => w.hostname == request['device']);
                    if (w) run(w);
                } else {
                    this.logger.log(`Starting script: ${request['value']}`);
                    await this.workerExec(run);
                    this.running = request;
                }
            }
        } catch (e) {
            this.logger.error(`${request['command']} - ${e}`);
        }
    }

    async save() {
        await this.ns.write(this.config, JSON.stringify({
            running: this.running,
            workers: this.workers
        }), 'w');
    }

    async start() {
        if(this.config) await this.load();
        let checkTick = 3600, runCheck = false;
        for(let tick = 1; true; tick = tick > 3600 ? 1 : tick + 1) {
            await this.ns.sleep(1000);
            this.logger.log();
            if(tick == checkTick) runCheck = true;
            let req = this.rx();

            // Check if we are idle
            if(!req) {
                // Check if we need to update the running command while we are idle
                if(runCheck && this.running['update']) {
                    runCheck = false;
                    await this.runCommand(this.running['command'], this.running);
                }
                continue;
            }

            // Run command
            if((req = JSON.parse(req)) && this.isCommand(req)) {
                await this.runCommand(req);
                await this.save();
            } else { // Invalid command
                this.logger.log(`Unknown command: ${JSON.stringify(req)}`);
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
    const config = await new Config(ns, configPath).load();
    const hostname = ns.getHostname();
    const argParser = new ArgParser('botnet-manager.js', 'Connect & manage a network of servers to launch distributed attacks.', [
        new ArgParser('copy', 'Copy file & dependencies to botnet', [
            {name: 'file', desc: 'File to copy', default: false},
            {name: 'control', desc: 'Copy to master server', flags: ['-c', '--control'], default: false},
            {name: 'noDeps', desc: 'Skip copying dependencies', flags: ['-d', '--no-deps'], default: false},
            {name: 'slave', desc: 'Copy to slave servers', flags: ['-s', '--slave'], default: false},
        ]),
        new ArgParser('join', 'Connect server as a botnet slave', [
            {name: 'device', desc: 'Device to connect, defaults to the current machine', optional: true, default: hostname}
        ]),
        new ArgParser('kill', 'Kill any scripts running on the botnet'),
        new ArgParser('leave', 'Disconnect worker node from swarm', [
            {name: 'device', desc: 'Device to disconnect, defaults to the current machine', optional: true, default: hostname}
        ]),
        new ArgParser('list', 'List connected worker nodes'),
        new ArgParser('run', 'Copy & run script on the botnet', [
            {name: 'script', desc: 'Script to copy & execute', type: 'string'},
            {name: 'args', desc: 'Arguments for script. Forward the current target with: {{TARGET}}', optional: true, extras: true},
        ]),
        new ArgParser('start', 'Start this server as the botnet manager'),
        {name: 'silent', desc: 'Suppress program output', flags: ['-s', '--silent'], default: false},
    ]);
    const args = argParser.parse(ns.args);

    // Help
    if(args['help'] || args['_error'].length || !args['_command'])
        return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

    // Run command
    if(args['_command'] == 'start') { // Start botnet manager
        ns.tprint(`Starting botnet controller on: ${hostname}`);
        ns.tprint(`Connect workers to botnet with: run botnet-manager.js join [SERVER]`);
        await new Manager(ns, hostname).start();
    } else if(args['_command'] == 'copy') { // Issue copy command
        await ns.writePort(portNum, JSON.stringify({
            command: 'copy',
            value: args['file']
        }));
    } else if(args['_command'] == 'join') { // Issue join command
        await ns.writePort(portNum, JSON.stringify({
            command: 'join',
            value: args['device']
        }));
    } else if(args['_command'] == 'kill') { // Issue kill command
        await ns.writePort(portNum, JSON.stringify({
            command: 'kill'
        }));
    } else if(args['_command'] == 'leave') { // Issue leave command
        await ns.writePort(portNum, JSON.stringify({
            command: 'leave',
            value: args['device']
        }));
    } else if(args['_command'] == 'list') {
        ns.tprint('Botnet workers:');
        ns.tprint(config['workers'].map(worker => worker.hostname).join(', '));
    } else if(args['_command'] == 'run') { // Issue run command
        await ns.writePort(portNum, JSON.stringify({
            command: 'run',
            value: args['script'],
            args: args['args']
        }));
    }
}
