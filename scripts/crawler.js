import {ArgError, ArgParser} from '/scripts/lib/arg-parser';
import {scanNetwork} from '/scripts/lib/utils';

/**
 * BitBurner autocomplete
 * @param data {server: string[], txts: string[], scripts: string[], flags: string[]} - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
	return [...data.scripts, '{{TARGET}}'];
}

/**
 * Search the network for targets to execute a script against.
 * @param ns {NS} - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('crawler.js', 'Search the network for targets to execute a script against.', null, [
		{name: 'script', desc: 'Script to copy & execute', type: 'string'},
		{name: 'args', desc: 'Arguments for script. Forward the current target with: {{TARGET}}', optional: true, extras: true, type: 'string'},
		{name: 'cpu', desc: 'Number of CPU threads to use with script', flags: ['-c', '--cpu'], default: 1, type: 'num'},
		{name: 'depth', desc: 'Depth to scan to, defaults to 3', flags: ['-d', '--depth'], default: Infinity, type: 'num'},
		{name: 'level', desc: 'Exclude targets with higher hack level, defaults to current hack level', flags: ['-l', '--level'], default: ns.getHackingLevel(),  type: 'num'},
		{name: 'ports', desc: 'Exclute targets with too many closed ports', flags: ['-p', '--ports'], default: Infinity, type: 'num'},
		{name: 'silent', desc: 'Surpress program output', flags: ['-s', '--silent'], type: 'bool'}
	], true);

	try {
		// Run
		const args = argParser.parse(ns.args);
		const [devices, network] = scanNetwork(ns);
		let complete = 0, failed = 0, skipped = 0;
		for(let device of devices) {
			// Skip invalid devices
			if(device == 'home' || args['level'] < ns.getServerRequiredHackingLevel(device) || args['ports'] < ns.getServerNumPortsRequired(device)) {
				skipped++;
				continue;
			}

			// Start script
			const scriptArgs = args['args'].map(arg => arg.toUpperCase() == '{{TARGET}}' ? device : arg);
			const pid = ns.run(args['script'], args['cpu'], ...scriptArgs);
			if(pid == 0) {
				failed++;
				continue;
			}

			// Wait for script to finish
			while(ns.scriptRunning(args['script'], 'home'))
				await ns.sleep(1000);
			complete++;
		}

		// Output report
		if(!args['silent']) {
			ns.tprint('===================================================');
			ns.tprint(`Crawler Report: ${devices.length} Device${devices.length > 1 ? 's' : ''}`);
			ns.tprint('===================================================');
			ns.tprint(`Complete: ${complete}\tFailed: ${failed}\tSkipped: ${skipped}`);
			ns.tprint('');
		}
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}
}
