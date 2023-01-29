import {ArgParser} from '/scripts/lib/arg-parser';
import {Logger} from '/scripts/lib/logger';
import {maxThreads, toCurrency} from '/scripts/lib/utils';
import {copyWithDependencies} from "/scripts/copy";

/**
 * Automate the buying & upgrading of servers.
 *
 * @param {NS} ns - BitBurner API
 */
export async function main(ns) {
    // Setup
    ns.disableLog('ALL');
    let servers = ns.getPurchasedServers();
    const logger = new Logger(ns, [
        () => `Server Manager: ${servers.length}`
    ]);
    const argParser = new ArgParser('server-manager.js', 'Automate the buying & upgrading of servers. Automatically starts script after purchase. Tail for live updates.', [
        {name: 'script', desc: 'Script to copy & execute', optional: true},
        {name: 'args', desc: 'Arguments for script. Forward the discovered server with: {{SERVER}}', optional: true, extras: true},
        {name: 'balance', desc: 'Prevent spending bellow point', flags: ['-b', '--balance'], default: 0},
        {name: 'cpu', desc: 'Number of CPU threads to start script with, will use maximum if not specified', flags: ['-c', '--cpu'], default: false},
        {name: 'limit', desc: 'Limit the number of servers that can be purchased, defaults to 25', flags: ['-l', '--limit'], default: 25},
        {name: 'ram', desc: 'Amount of RAM to purchase new servers with, defaults to 8 GB', flags: ['-r', '--ram'], default: 8},
        {name: 'sleep', desc: 'Amount of time to wait between purchases, defaults to 1 (second)', flags: ['-s', '--sleep'], default: 1}
    ]);
    const args = argParser.parse(ns.args);
    const serverPrefix = 'botnet_'
    const maxRam = ns.getPurchasedServerMaxRam();
    const minRamCost = ns.getPurchasedServerCost(args['ram']);

    async function startScript(server) {
        await copyWithDependencies(ns, args['script'], server);
        const threads = args['cpu'] || maxThreads(ns, args['script'], server) || 1;
        const pid = ns.exec(args['script'], server, threads, ...args['args']);
        logger.log(`Starting "${args['script']}" with ${threads} thread${threads > 1 ? 's' : ''}`);
        logger[pid == -1 ? 'warn' : 'log'](pid == -1 ? 'Done!' : 'Failed to start');
    }

    // Help
    if(args['help'] || args['_error'].length)
        return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

    // Main loop
    // noinspection InfiniteLoopJS
    while(true) {
        servers = ns.getPurchasedServers();
        const balance = ns.getServerMoneyAvailable('home');
        // Purchase new server if we can afford it
        if(servers.length < args['limit'] && balance - minRamCost > args['balance']) {
            logger.log(`Buying server (${args['ram']} GB): ${toCurrency(minRamCost)}`);
            ns.purchaseServer(`${serverPrefix}${servers.length}`, args['ram']);

            // Run the script if requested
            if(args['script']) await startScript(`${serverPrefix}${servers.length}`);
        } else { // Check for upgrades
            let upgrades = servers.map(server => {
                // Calculate next RAM upgrades (must be a power of two: 2, 4, 8, 16, 32...)
                let ram = Math.pow(2, Math.log2(ns.getServerMaxRam(server)) + 1);
                if(ram > maxRam) ram = null;
                return {
                    server,
                    ram,
                    cost: ram ? ns.getPurchasedServerCost(ram) : null
                }
            });
            upgrades = upgrades.sort((a, b) => { // Sort by price
                if(a.cost < b.cost) return 1;
                if(a.cost < b.cost) return -1;
                return 0;
            });

            // Do the cheapest upgrade if we can afford it
            const upgrade = upgrades[0];
            if(upgrade && !!upgrade.ram && balance - upgrade.cost > args['balance']) {
                logger.log(`Upgrading ${upgrade.server}: ${upgrade.ram} GB / ${toCurrency(upgrade.cost)}`);
                ns.killall(upgrade.server);
                ns.deleteServer(upgrade.server);
                ns.purchaseServer(upgrade.server, upgrade.ram);

                // Run the script if requested
                if(args['script']) await startScript(upgrade.server);
            }
        }
        await ns.sleep(args['sleep'] * 1000);
    }
}
