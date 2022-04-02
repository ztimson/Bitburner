import {ArgParser} from '/scripts/lib/arg-parser2';
import {Logger} from '/scripts/lib/logger';

/**
 * Automate the buying & upgrading of servers.
 * @param ns {NS} - BitBurner API
 */
export async function main(ns) {
    // Setup
    ns.disableLog('ALL');
    let servers = ns.getPurchasedServers();
    const logger = new Logger(ns, [
        () => `Server Manager: ${servers.length}`
    ]);
    const argParser = new ArgParser(ns, 'server-manager.js', 'Automate the buying & upgrading of servers.', [
        {name: 'balance', desc: 'Prevent spending bellow point', flags: ['-b', '--balance'], default: 0},
        {name: 'limit', desc: 'Limit the number of servers that can be purchased, defaults to 25', flags: ['-l', '--limit'], default: 25},
        {name: 'ram', desc: 'Amount of RAM to purchase new servers with, defaults to 8 GB', flags: ['-r', '--ram'], default: 8},
        {name: 'sleep', desc: 'Amount of time to wait between purchases, defaults to 1 (second)', flags: ['-s', '--sleep'], default: 1}
    ]);
    const args = argParser.parse();
    const serverPrefix = 'botnet_'
    const maxRam = ns.getPurchasedServerMaxRam();
    const minRamCost = ns.getPurchasedServerCost(args['ram']);

    // Help
    if(args['help'] || args['_error'])
        return argParser.help(args['help'] ? null : args['_error'], args['_command']);

    // Run
    while(true) {
        servers = ns.getPurchasedServers();
        const balance = ns.getServerMoneyAvailable('home');
        let targ
        // Purchase new server if we can afford it
        if(servers.length < args['limit'] && balance - minRamCost > args['balance']) {
            logger.log(`Buying server (${args['ram']} GB): ${minRamCost.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}`);
            ns.purchaseServer(`${serverPrefix}${servers.length}`, args['ram']);
        } else { // Check for upgrades
            const upgrades = servers.map(server => {
                // Calculate next RAM upgrades (must be a power of two: 2, 4, 8, 16, 32...)
                let ram = Math.pow(2, Math.log2(ns.getServerRam(server)[0]) + 1);
                if(ram > maxRam) ram = null;
                return {
                    server,
                    ram,
                    cost: ram ? ns.getPurchasedServerCost(ram) : null
                }
            });
            upgrades.sort((a, b) => { // Sort by price
                if(a.cost < b.cost) return 1;
                if(a.cost < b.cost) return -1;
                return 0;
            });

            // Do the cheapest upgrade if we can afford it
            const upgrade = upgrades[0];
            if(upgrade && !!upgrade.ram && balance - upgrade.cost > args['balance']) {
                logger.log(`Upgrading ${upgrade.server}: ${upgrade.ram} GB/${upgrade.cost.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}`);
                ns.killall(upgrade.server);
                ns.deleteServer(upgrade.server);
                ns.purchaseServer(upgrade.server, upgrade.ram);
            }
        }
        await ns.sleep(args['sleep'] * 1000);
    }
}
