import {ArgError, ArgParser} from './scripts/lib/arg-parser';

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
		{name: 'ports', desc: 'Exclute targets with too many closed ports', flags: ['-p', '--ports'], optional: true, default: Infinity, type: 'num'},
	]);
	let args;
	try {
		args = argParser.parse(ns.args);
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}

	/**
	 * Recursively search network & build a tree
	 * @param host {string} - Point to scan from
	 * @param depth {number} - Current scanning depth
	 * @param blacklist {String[]} - Devices already discovered
	 * @returns Dicionary of discovered devices
	 */
	function scan(target = 'home', depth = 1, found = new Set()) {
		if(found.size == 0) found.add(target);
		ns.scan(target).filter(t => !found.has(t)).forEach(t => {
			found.add(t);
			scan(t, depth + 1, found);
		});
		found.delete('home');
		return Array.from(found);
	}

	// Run
	const targets = scan();
	let complete = 0, failed = 0, skipped = 0;
	for(let target of targets) {
		if(target == 'home') continue;

		if(args['level'] < ns.getServerRequiredHackingLevel(target) || args['ports'] < ns.getServerNumPortsRequired(target)) {
			skipped++;
			continue;
		}

		const scriptArgs = args['args'].map(arg => arg == '{{TARGET}}' ? target : arg);
		const pid = ns.run(args['script'], args['cpu'], ...scriptArgs);
		if(pid == 0) {
			failed++;
			continue;
		}

        // Wait for script to finish
        do { await ns.sleep(1000); }
        while(ns.scriptRunning(args['script'], 'home'));
		complete++;
	}
	// Output report
	ns.tprint('===================================================');
	ns.tprint(`Crawler Report: ${targets.length} Device${targets.length > 1 ? 's' : ''}`);
	ns.tprint('===================================================');
	ns.tprint(`Complete: ${complete}\tFailed: ${failed}\tSkipped: ${skipped}`);
	ns.tprint('');
}
