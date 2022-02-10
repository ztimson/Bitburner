import {ArgParser} from './scripts/lib/arg-parser';

/**
 * Hack a server for it's money.
 */
export async function main(ns) {
	ns.disableLog('ALL');

	/**
	 * Print header with logs
	 * @param message - message to append to logs
	 */
	function log(message) {
		const sec = `${Math.round(security)}/${minSecurity}`;
		ns.clearLog();
		ns.print('===================================================');
		ns.print(`💎⛏️ Mining: ${target}`);
		ns.print('===================================================');
		ns.print(`Security: ${sec}${sec.length < 6 ? '\t' : ''}\tBalance: $${Math.round(balance * 100) / 100}`);
		ns.print('===================================================');
		if(message != null) messageHistory.push(message);
		messageHistory.splice(0, messageHistory.length - historyLength);
		messageHistory.forEach(m => ns.print(m));
	}

	// Initilize script arguments
	const argParser = new ArgParser({
		desc: 'Weaken, spoof & hack the target in a loop for money.',
		examples: [
			'run miner.js [OPTIONS] [TARGET]',
			'run miner.js --help',
		],
		args: [
			{key: 'TARGET', desc: 'Target to mine. Defaults to localhost'},
			{key: 'threads', alias: 't', optional: true, desc: 'Speed up script with more CPU power'},
			{key: 'help', alias: 'h', optional: true, desc: 'Display help message'},
		]
	});
	const args = argParser.parse(ns.args);
	if(args['help']) return ns.tprint(argParser.help());

	// Setup
	const historyLength = 15;
	const messageHistory = Array(historyLength).fill('');
	const threads = args['threads'] || 1;
	const target = args['TARGET'] && args['TARGET'] != 'localhost' ? args['TARGET'] : ns.getHostname();
	const minSecurity = ns.getServerMinSecurityLevel(target) + 2;
	let orgBalance, balance, security;

	log();
	while(true) {
		// Update information
		security = await ns.getServerSecurityLevel(target);
		balance = await ns.getServerMoneyAvailable(target);
		if(orgBalance == null) orgBalance = balance;

		// Pick step
		if(security > minSecurity) {
			log('Attacking Security...');
			const w = await ns.weaken(target, {threads});
			log(`Security: -${w}`);
		} else if(balance <= orgBalance) {
			log('Spoofing Balance...');
			const g = await ns.grow(target, {threads});
			log(`Balance: +$${Math.round((g * balance - balance) * 100) / 100}`);
		} else {
			log('Hacking Account...');
			const h = await ns.hack(target, {threads});
			log(`Balance: -$${h}`);
		}
	}
}

export function autocomplete(data) {
	return [...data.servers];
}
