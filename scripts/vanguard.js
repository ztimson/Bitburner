import {ArgError, ArgParser} from './scripts/lib/arg-parser';

/**
 * Weaken the device indefinitely.
 * @params ns {NS} - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	let args, counter = 0, orgSecurity, security;
	const historyLength = 17;
	const messageHistory = Array(historyLength).fill('');
	const argParser = new ArgParser('vanguard.js', 'Weaken the device indefinitely.', null, [
		{name: 'device', desc: 'Device to weaken, defaults to the current machine', optional: true, default: ns.getHostname(), type: 'string'},
		{name: 'limit', desc: 'Limit the number of times to run', flags: ['-l', '--limit'], default: Infinity, type: 'num'}
	]);
	try {
		args = argParser.parse(ns.args);
		orgSecurity = security = ns.getServerSecurityLevel(args['device']);
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}

	/**
	 * Print header with logs
	 * @param message - message to append to logs
	 */
	function log(message) {
		ns.clearLog();
		ns.print('===================================================');
		ns.print(`Vanguard: ${args['device']}`);
		ns.print('===================================================');
		ns.print(`Security: ${security}/${orgSecurity}`);
		ns.print('===================================================');
		if(message != null) messageHistory.push(message);
		messageHistory.splice(0, messageHistory.length - historyLength);
		messageHistory.forEach(m => ns.print(m));
	}
	
	// Run
	log();
	do {
		security = ns.getServerSecurityLevel(args['device']);
		log(`Attacking...`);
		log(await ns.weaken(args['device']));
		counter++;
	} while (counter < args['limit']);
	ns.print('Complete!');
}

export function autocomplete(data) {
	return [...data.servers];
}
