import {ArgError, ArgParser} from '/scripts/lib/arg-parser';
import {pruneTree, scanNetwork} from '/scripts/lib/utils';

/**
 * BitBurner autocomplete
 * @param data {server: string[], txts: string[], scripts: string[], flags: string[]} - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
	return [...data.servers];
}

/**
 * Scan the network for devices and display as an ASCII tree.
 * @param ns {NS} - BitBurner API
 */
export async function main(ns) {
	/**
	 * Iterate tree & print to screen
	 * @param tree {Object} - Tree to parse
	 * @param stats {Object} - Pool of stats to pull extra information from
	 * @param spacer {string} - Spacer text for tree formatting
	 */
	function render(tree, stats, spacer = ' ') {
		Object.keys(tree).forEach((device, i, arr) => {
			const deviceStats = stats ? stats[device] : null;
			const stat = deviceStats ? ` (${deviceStats.hasAdminRights ? 'ROOTED' : `${deviceStats.requiredHackingSkill}|${deviceStats.numOpenPortsRequired}`})` : '';
			const last = i == arr.length - 1;
			const branch = last ? '└─ ' : '├─ ';
			ns.tprint(spacer + branch + device + stat);
			render(tree[device], stats, spacer + (last ? '    ' : '|   '));
		});
	}

	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('network-graph.js', 'Scan the network for devices and display as an ASCII tree:\n home\n  ├─ n00dles (ROOTED)\n  |   └─ max-hardware (80|1)\n  |       └─ neo-net (50|1)\n  ├─ foodnstuff (ROOTED)\n  └─ sigma-cosmetics (ROOTED)', null, [
		{name: 'device', desc: 'Point to start scan from, defaults to current machine', optional: true, default: ns.getHostname(), type: 'string'},
		{name: 'depth', desc: 'Depth to scan to', flags: ['-d', '--depth'], default: Infinity, type: 'num'},
		{name: 'filter', desc: 'Filter to device matching name', flags: ['-f', '--filter'], type: 'string'},
		{name: 'regex', desc: 'Filter to devices matching pattern', flags: ['-e', '--regex'], type: 'string'},
		{name: 'rooted', desc: 'Filter to devices that have been rooted', flags: ['-r', '--rooted'], type: 'bool'},
		{name: 'notRooted', desc: 'Filter to devices that have not been rooted', flags: ['-n', '--not-rooted'], type: 'bool'},
		{name: 'verbose', desc: 'Display the required hack level & number of ports to root: (level|port)', flags: ['-v', '--verbose'], type: 'bool'},
	]);

	try {
		// Run
		const args = argParser.parse(ns.args);
		const [devices, network] = scanNetwork(ns, args['device'], args['depth']);
		const stats = devices.reduce((acc, d) => ({...acc, [d]: ns.getServer(d)}), {});
		if(args['regex']) pruneTree(network, d => RegExp(args['regex']).test(d)); // Regex flag
		else if(args['filter']) pruneTree(network, d => d == args['filter']); // Filter flag
		if(args['rooted']) pruneTree(network, d => stats[d].hasAdminRights); // Rooted flag
		else if(args['notRooted']) pruneTree(network, d => !stats[d].hasAdminRights); // Not rooted flag
		ns.tprint(args['device']);
		render(network, args['verbose'] ? stats : null);
		ns.tprint('');
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}
}
