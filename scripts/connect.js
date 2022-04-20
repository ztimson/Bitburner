import {ArgParser} from '/scripts/lib/arg-parser';
import {pruneTree, terminal} from '/scripts/lib/utils';
import {scanNetwork} from '/scripts/crawler';

/**
 * Create connection string to get from one server to another.
 *
 * @param {NS} ns - BitBurner API
 * @param {string} end - Server to find path to
 * @param {string} start - Starting point, defaults to the local server
 * @returns {string} - Connection string: "home;connect n00dles;connect CSEC;"
 */
export function connectionString(ns, end, start = ns.getHostname()) {
	let path = pathToServer(ns, end, start);
	const homeShortcut = path.indexOf('home');
	if(homeShortcut) path = path.slice(homeShortcut);
	return path.map((p, i) => p == 'home' && i == 0 ? 'home' : 'connect ' + p).join(';');
}

/**
 * Find path from one server to another.
 *
 * @param {NS} ns - BitBurner API
 * @param {string} end - Server to find path to
 * @param {string} start - Starting point, defaults to the local server
 * @returns {string[]} - Path to get to server
 */
export function pathToServer(ns, end, start = ns.getHostname()) {
	if(start == end) return [end];
	const [ignore, network] = scanNetwork(ns, start);
	pruneTree(network, d => d == end);
	let current = network, name, path = [start];
	while(name = Object.keys(current)[0]) {
		path.push(name);
		current = current[name];
	}
	return path;
}

/**
 * Connect to a server anywhere in the network without a backdoor.
 *
 * @param {NS} ns - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('connect.js', 'Connect to a server anywhere in the network without a backdoor.', [
		{name: 'server', desc: 'Server to connect to'}
	]);
	const args = argParser.parse(ns.args);

	// Help
	if(args['help'] || args['_error'].length)
		return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

	// Run
	await terminal(connectionString(ns, args['server']));
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
