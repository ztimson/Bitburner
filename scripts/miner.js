import {ArgError, ArgParser} from './scripts/lib/arg-parser';

/**
 * Weaken, Grow, Hack loop to "mine" target machine for money.
 * @params ns {NS} - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const historyLength = 15;
	const messageHistory = Array(historyLength).fill('');
	let maxBalance, balance, minSecurity, security;
	const argParser = new ArgParser('miner.js', 'Weaken, Grow, Hack loop to "mine" target machine for money.', null, [
		{name: 'target', desc: 'Device to mine, defaults to current machine', optional: true, default: ns.getHostname(), type: 'string'}
	]);
	let args;
	try {
		args = argParser.parse(ns.args);
		maxBalance = await ns.getServerMaxMoney(args['target']);
		balance = await ns.getServerMoneyAvailable(args['target']);
		minSecurity = await ns.getServerMinSecurityLevel(args['target']) + 2;
		security = await ns.getServerSecurityLevel(args['target']);
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}

	/**
	 * Print header with logs
	 * @param message - message to append to logs
	 */
	function log(message) {
		const sec = `${Math.round(security)}/${minSecurity}`;
		ns.clearLog();
		ns.print('===================================================');
		ns.print(`Mining: ${args['target']}`);
		ns.print('===================================================');
		ns.print(`Security: ${sec}${sec.length < 6 ? '\t' : ''}\tBalance: $${Math.round(balance * 100) / 100}`);
		ns.print('===================================================');
		if(message != null) messageHistory.push(message);
		messageHistory.splice(0, messageHistory.length - historyLength);
		messageHistory.forEach(m => ns.print(m));
	}

	log();
	do {
		// Update information
		security = await ns.getServerSecurityLevel(args['target']);
		balance = await ns.getServerMoneyAvailable(args['target']);

		// Pick step
		if(security > minSecurity) { // Weaken
			log('Attacking Security...');
			const w = await ns.weaken(args['target']);
			log(`Security: -${w}`);
		} else if(balance < maxBalance) { // Grow
			log('Spoofing Balance...');
			const g = await ns.grow(args['target']);
			log(`Balance: +$${Math.round((g * balance - balance) * 100) / 100}`);
		} else { // Hack
			log('Hacking Account...');
			const h = await ns.hack(args['target']);
			log(`Balance: -$${h}`);
		}
	} while(true);
}

export function autocomplete(data) {
	return [...data.servers];
}
