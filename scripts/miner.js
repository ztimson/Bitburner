import {ArgParser} from '/scripts/lib/arg-parser';
import {Logger} from '/scripts/lib/logger';
import {toCurrency} from '/scripts/lib/utils';

/**
 * Hack, Grow, Weaken loop to "mine" a server for money. Tail for live updates.
 *
 * @params {NS} ns - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('miner.js', 'Hack, Grow, Weaken loop to "mine" a server for money. Tail for live updates.', [
		{name: 'server', desc: 'Server to mine, defaults to the local server', optional: true, default: ns.getHostname()}
	]);
	const args = argParser.parse(ns.args);
	let maxBalance, balance, minSecurity, security;
	maxBalance = ns.getServerMaxMoney(args['server']);
	balance = ns.getServerMoneyAvailable(args['server']);
	minSecurity = ns.getServerMinSecurityLevel(args['server']) + 2;
	security = ns.getServerSecurityLevel(args['server']);

	// Help
	if(args['help'] || args['_error'].length)
		return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

	// Logger
	const logger = new Logger(ns, [
		() => `Mining: ${args['server']}`,
		() => `Security: ${Math.round(security)}/${minSecurity}\tBalance: \$${Math.round(balance * 100) / 100}`
	]);

	// Main loop
	// noinspection InfiniteLoopJS
	while(true) {
		// Update information
		security = ns.getServerSecurityLevel(args['server']);
		balance = ns.getServerMoneyAvailable(args['server']);

		// Pick step
		if(security > minSecurity) { // Weaken
			logger.log('Attacking Security...');
			const w = await ns.weaken(args['server']);
			logger.log(`Security: -${w}`);
		} else if(balance < maxBalance) { // Grow
			logger.log('Spoofing Balance...');
			const g = await ns.grow(args['server']);
			logger.log(`Balance: +${toCurrency(g * balance - balance)}`);
		} else { // Hack
			logger.log('Hacking Account...');
			const h = await ns.hack(args['server']);
			logger.log(`Balance: -$${h}`);
		}
	}
}

/**
 * BitBurner autocomplete.
 *
 * @param {{servers: string[], txts: string[], scripts: string[], flags: string[]}} data - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
	return [...data.servers];
}
