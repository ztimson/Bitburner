import {ArgError, ArgParser} from './scripts/lib/arg-parser';

export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('network-graph.js', 'Scan the network for devices and display as an ASCII tree:\n home\n  ├─ n00dles (ROOTED)\n  |   └─ max-hardware (80|1)\n  |       └─ neo-net (50|1)\n  ├─ foodnstuff (ROOTED)\n  └─ sigma-cosmetics (ROOTED)', [], [
		{name: 'depth', desc: 'Depth to scan to, defaults to 3', flags: ['-d', '--depth'], default: Infinity, type: 'num'},
        {name: 'filter', desc: 'Display path to single device', flags: ['-f', '--filter'], type: 'string'},
		{name: 'start', desc: 'Point to start scan from, defaults to current machine', flags: ['-s', '--start'], default: ns.getHostname(), type: 'string'},
		{name: 'verbose', desc: 'Displays the required hack level & ports needed to root: (level|port)', flags: ['-v', '--verbose'], type: 'bool'},
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
	function scan(host, depth = 1, blacklist = [host]) {
		if(depth >= args['depth']) return {};
		const localTargets = ns.scan(host).filter(target => !blacklist.includes(target));
		blacklist = blacklist.concat(localTargets);
		return localTargets.reduce((acc, target) => {
			const info = ns.getServer(target);
			const verb = args['verbose'] ? ` (${info.hasAdminRights ? 'ROOTED' : `${info.requiredHackingSkill}|${info.numOpenPortsRequired}`})` : '';
			const name = `${target}${verb}`;
			acc[name] = scan(target, depth + 1, blacklist);
			return acc;
		}, {});
	}

	/**
	 * Search tree for path to device.
	 * @param tree {object} - Tree to search
	 * @param find {string} - Device to search for
	 * @returns {object} - Path to device
	 */
	function filter(tree, find) {
		function filter(tree, find, path = []) {
			return Object.keys(tree).flatMap(n => {
				if(n.indexOf(find) == 0) return [...path, n];
				if(Object.keys(n).length) return filter(tree[n], find, [...path, n]);
				return null;
			}).filter(p => !!p);
		}
		let whitelist = filter(tree, find), acc = {}, next = acc;
		while(whitelist.length) {
			const n = whitelist.splice(0, 1);
			next[n] = {};
			next = next[n];
		}
		return acc;
	}

	/**
	 * Iterate tree & print to screen
	 * @param tree {object} - Tree to parse
	 * @param spacer {string} - Spacer text for tree formatting
	 */
	function render(tree, spacer = ' ') {
		Object.keys(tree).forEach((key, i, arr) => {
			const last = i == arr.length - 1;
			const branch = last ? '└─ ' : '├─ ';
			ns.tprint(`${spacer}${branch}${key}`);
			render(tree[key], spacer + (last ? '    ' : '|   '));
		});
	}

	// Run
	let found = scan(args['start'], args['verbose']);
	if(args['filter']) found = filter(found, args['filter']);
	ns.tprint(args['start']);
	render(found);
	ns.tprint('');
}

export function autocomplete(data) {
	return [...data.servers];
}