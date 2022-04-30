import {ArgParser} from '/scripts/lib/arg-parser';
import {availableExploits} from '/scripts/rootkit';
import {copyWithDependencies} from '/scripts/copy';
import {availableThreads} from "/scripts/lib/utils";

/**
 * Scan the network for servers.
 *
 * @param {NS} ns - BitBurner API
 * @param {string} server - Entrypoint to network
 * @param {number} maxDepth - Depth to scan to
 * @returns {[string[], Object]} - A tuple including an array of discovered servers & a tree of the network
 */
export function scanNetwork(ns, server = ns.getHostname(), maxDepth = Infinity) {
	let discovered = [server];
	function scan (server, depth = 1) {
		if(depth > maxDepth) return {};
		const localTargets = ns.scan(server).filter(s => !discovered.includes(s));
		discovered = [...discovered, ...localTargets];
		return localTargets.reduce((acc, s) => ({...acc, [s]: scan(s, depth + 1)}), {});
	}
	const network = scan(server);
	return [discovered.slice(1), network];
}

/**
 * Search the network for servers to execute a script against.
 *
 * @param {NS} ns - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('crawler.js', 'Search the network for servers to execute a script against.', [
		{name: 'script', desc: 'Script to copy & execute'},
		{name: 'args', desc: 'Arguments for script. Forward the discovered server with: {{SERVER}}', optional: true, extras: true, type: 'string'},
		{name: 'cpu', desc: 'Number of CPU threads to start script with, will use maximum if not specified', flags: ['-c', '--cpu']},
		{name: 'depth', desc: 'Depth to scan to, defaults to 3', flags: ['-d', '--depth'], default: Infinity},
		{name: 'kill', desc: 'Kill all running scripts on the server', flags: ['-k', '--kill'], default: false},
		{name: 'level', desc: 'Skip servers with higher hack level, defaults to current hack level', flags: ['--level'], default: ns.getHackingLevel()},
		{name: 'remoteExec', desc: 'Execute script on remote server', flags: ['-e', '--remote-exec'], default: false},
		{name: 'rooted', desc: 'Only servers that have been rooted', flags: ['-r', '--rooted'], default: false},
		{name: 'notRooted', desc: 'Only servers that have not been rooted', flags: ['-n', '--not-rooted'], default: false},
		{name: 'ports', desc: 'Skip servers with too many closed ports', flags: ['-p', '--ports'], default: availableExploits(ns).length},
		{name: 'quite', desc: 'Suppress program output', flags: ['-q', '--quite'], default: false},
		{name: 'verbose', desc: 'Display the server names in the final report', flags: ['-v', '--verbose'], default: false},
	]);
	const args = argParser.parse(ns.args);

	// Help
	if(args['help'] || args['_error'].length)
		return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

	// Run
	const localhost = ns.getHostname();
	const [servers, network] = scanNetwork(ns);
	let complete = [], failed = [], skipped = [];
	for(let server of servers) {
		// Check root status if needed
		const rooted = ns.hasRootAccess(server);
		if(args['rooted'] && !rooted) continue;
		if(args['notRooted'] && rooted) continue;

		// Skip invalid servers
		if(server == 'home' || args['level'] < ns.getServerRequiredHackingLevel(server) || args['ports'] < ns.getServerNumPortsRequired(server)) {
			skipped.push(server);
			continue;
		}

		// Start script
		if(args['kill']) ns.killall(server);
		const scriptArgs = args['args'].map(arg => arg.toUpperCase() == '{{SERVER}}' ? server : arg);
		const threads = args['cpu'] || availableThreads(ns, args['script'], server) || 1;
		if(args['remoteExec']) await copyWithDependencies(ns, args['script'], server);
		const pid = ns.exec(args['script'], args['remoteExec'] ? server : localhost, threads, ...scriptArgs);
		if(pid == 0) {
			failed.push(server);
			continue;
		}

		// Wait for script to finish if local
		if(!args['remoteExec'])
			while(ns.isRunning(args['script'], localhost, ...scriptArgs))
				await ns.sleep(1000);
		complete.push(server);
	}

	// Output report
	if(!args['quite']) {
		ns.tprint('===================================================');
		ns.tprint(`Crawler: ${complete.length + failed.length + skipped.length} Servers`);
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
}

/**
 * BitBurner autocomplete.
 *
 * @param {{servers: string[], txts: string[], scripts: string[], flags: string[]}} data - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
	return [...data.scripts, ...data.servers, '{{SERVER}}'];
}
