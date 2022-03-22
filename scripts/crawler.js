import {ArgError, ArgParser} from '/scripts/lib/arg-parser';
import {copyWithDependencies, scanNetwork} from '/scripts/lib/utils';

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
		{name: 'cpu', desc: 'Number of CPU threads to use with script', flags: ['-c', '--cpu'], type: 'num'},
		{name: 'depth', desc: 'Depth to scan to, defaults to 3', flags: ['-d', '--depth'], default: Infinity, type: 'num'},
		{name: 'kill', desc: 'Kill all scripts running on device', flags: ['-k', '--kill'], type: 'bool'},
		{name: 'level', desc: 'Exclude targets with higher hack level, defaults to current hack level', flags: ['--level'], default: ns.getHackingLevel(),  type: 'num'},
		{name: 'remoteExec', desc: 'Copy script to remote device & run there', flags: ['-e', '--remote-exec'], type: 'bool'},
		{name: 'rooted', desc: 'Filter to devices that have been rooted', flags: ['-r', '--rooted'], type: 'bool'},
		{name: 'notRooted', desc: 'Filter to devices that have not been rooted', flags: ['-n', '--not-rooted'], type: 'bool'},
		{name: 'ports', desc: 'Exclude targets with too many closed ports', flags: ['-p', '--ports'], default: Infinity, type: 'num'},
		{name: 'silent', desc: 'Suppress program output', flags: ['-s', '--silent'], type: 'bool'},
		{name: 'verbose', desc: 'Display the device names in the final report', flags: ['-v', '--verbose'], type: 'bool'},
	], true);

	try {
		// Run
		const localhost = ns.getHostname();
		const args = argParser.parse(ns.args);
		const [devices, network] = scanNetwork(ns);
		let complete = [], failed = [], skipped = [];
		for(let device of devices) {
			// Check root status if needed
			const rooted = ns.hasRootAccess(device);
			if(args['rooted'] && !rooted) continue;
			if(args['notRooted'] && rooted) continue;

			// Skip invalid devices
			if(device == 'home' || args['level'] < ns.getServerRequiredHackingLevel(device) || args['ports'] < ns.getServerNumPortsRequired(device)) {
				skipped.push(device);
				continue;
			}

			// Start script
			if(args['kill']) ns.killall(device);
			const scriptArgs = args['args'].map(arg => arg.toUpperCase() == '{{TARGET}}' ? device : arg);
			const [totalRam, usedRam] = ns.getServerRam(args['remoteExec'] ? device : localhost);
			const threads = args['cpu'] || ~~((totalRam - usedRam) / ns.getScriptRam(args['script'], localhost)) || 1;
			if(args['remoteExec']) await copyWithDependencies(ns, args['script'], device);
			const pid = ns.exec(args['script'], args['remoteExec'] ? device : localhost, threads, ...scriptArgs);
			if(pid == 0) {
				failed.push(device);
				continue;
			}

			// Wait for script to finish if local
			if(!args['remoteExec'])
				while(ns.scriptRunning(args['script'], localhost)) await ns.sleep(1000);
			complete.push(device);
		}

		// Output report
		if(!args['silent']) {
			ns.tprint('===================================================');
			ns.tprint(`Crawler Report: ${complete.length + failed.length + skipped.length} Devices`);
			ns.tprint('===================================================');
			if(args['verbose']) {
				ns.tprint(`Complete (${complete.length}):`);
				if(complete.length) ns.tprint(complete.join(', '));
				ns.tprint('');
				ns.tprint(`Failed (${failed.length}):`);
				if(failed.length) ns.tprint(failed.join(', '));
				ns.tprint('');
				ns.tprint(`Skipped (${skipped.length}):`);
				if(skipped.length) ns.tprint(skipped.join(', '));
				ns.tprint('');
			} else {
				ns.tprint(`Complete: ${complete.length}\tFailed: ${failed.length}\tSkipped: ${skipped.length}`);
				ns.tprint('');
			}
		}
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}
}
