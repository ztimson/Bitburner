import {ArgError, ArgParser} from '/scripts/lib/arg-parser';
import {pruneTree, scanNetwork, terminal} from '/scripts/lib/utils';

/**
 * BitBurner autocomplete
 * @param data {server: string[], txts: string[], scripts: string[], flags: string[]} - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
	return [...data.servers];
}

/**
 * Search the network for a device and connect to it.
 * @param ns {NS} - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('connect.js', 'Search the network for a device and connect to it.', null, [
		{name: 'device', desc: 'Device to connect to', default: ns.getHostname(), type: 'string'}
	]);

	try {
		// Run
		const args = argParser.parse(ns.args);
		const [devices, network] = scanNetwork(ns);
		pruneTree(network, d => d == args['device']);
		let current = network, name, path = [];
		while(name = Object.keys(current)[0]) {
			current = current[name];
			path.push(name);
		}
		await terminal('home; ' + path.map(p => `connect ${p}`).join('; '));
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}
}
