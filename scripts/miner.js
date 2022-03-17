import {ArgError, ArgParser} from '/scripts/lib/arg-parser';
import {Logger} from "/scripts/lib/logger";

/**
 * BitBurner autocomplete
 * @param data {server: string[], txts: string[], scripts: string[], flags: string[]} - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
	return [...data.servers];
}

/**
 * Weaken, Grow, Hack loop to "mine" target machine for money.
 * @params ns {NS} - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('miner.js', 'Weaken, Grow, Hack loop to "mine" device for money. Tail for live updates.', null, [
		{name: 'device', desc: 'Device to mine, defaults to current machine', optional: true, default: ns.getHostname(), type: 'string'}
	]);

	try {
		// Run
		const args = argParser.parse(ns.args);
		let maxBalance, balance, minSecurity, security;
		maxBalance = await ns.getServerMaxMoney(args['device']);
		balance = await ns.getServerMoneyAvailable(args['device']);
		minSecurity = await ns.getServerMinSecurityLevel(args['device']) + 2;
		security = await ns.getServerSecurityLevel(args['device']);
		const logger = new Logger(ns, [
			() => `Mining: ${args['device']}`,
			() => `Security: ${Math.round(security)}/${minSecurity}\tBalance: \$${Math.round(balance * 100) / 100}`
		]);
		while(true) {
			// Update information
			security = await ns.getServerSecurityLevel(args['device']);
			balance = await ns.getServerMoneyAvailable(args['device']);

			// Pick step
			if(security > minSecurity) { // Weaken
				logger.log('Attacking Security...');
				const w = await ns.weaken(args['device']);
				logger.log(`Security: -${w}`);
			} else if(balance < maxBalance) { // Grow
				logger.log('Spoofing Balance...');
				const g = await ns.grow(args['device']);
				logger.log(`Balance: +$${Math.round((g * balance - balance) * 100) / 100}`);
			} else { // Hack
				logger.log('Hacking Account...');
				const h = await ns.hack(args['device']);
				logger.log(`Balance: -$${h}`);
			}
		}
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}
}
