import {ArgError, ArgParser} from './scripts/lib/arg-parser';

export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('network-graph.js', 'Scan the network for devices and display as an ASCII tree:\n home\n  ├─ n00dles (ROOTED)\n  |   └─ max-hardware (80|1)\n  |       └─ neo-net (50|1)\n  ├─ foodnstuff (ROOTED)\n  └─ sigma-cosmetics (ROOTED)', null, [
		{name: 'device', desc: 'Point to start scan from, defaults to current machine', optional: true, default: ns.getHostname(), type: 'string'},
		{name: 'depth', desc: 'Depth to scan to, defaults to 3', flags: ['-d', '--depth'], default: Infinity, type: 'num'},
        {name: 'filter', desc: 'Display devices matching name', flags: ['-f', '--filter'], type: 'string'},
		{name: 'regex', desc: 'Display devices matching pattern', flags: ['-r', '--regex'], type: 'string'},
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
	 * Prune tree down to devices that match name or pattern.
	 * @param tree {object} - Tree to search
	 * @param find {string} - Device name or pattern to search for
	 * @param regex {boolean} - True to use regex, false for raw check
	 * @returns {object} - Pruned tree
	 */
	function filter(tree, find, regex = false) {
		const found = new Set();
		function buildWhitelist(tree, find, path = []) {
			const keys = Object.keys(tree);
			if(!keys.length) return;
			Object.keys(tree).forEach(n => {
				const matches = regex ? new RegExp(find).test(n) : n == find;
				if(n == 'n00dles') console.log(n, find, matches);
				if(matches) {
					found.add(n);
					path.forEach(p => found.add(p));
				}
				buildWhitelist(tree[n], find, [...path, n]);
			})
		}
		function prune(tree, whitelist) {
			Object.keys(tree).forEach(n => {
				if(Object.keys(tree[n]).length) prune(tree[n], whitelist);
				if(!whitelist.includes(n)) delete tree[n];
			});
		}
		buildWhitelist(tree, find);
		prune(tree, Array.from(found));
	}

	/**
	 * Recursively search network & build a tree
	 * @param host {string} - Point to scan from
	 * @param depth {number} - Current scanning depth
	 * @param blacklist {String[]} - Devices already discovered
	 * @returns Dicionary of discovered devices
	 */
	function scan(host, depth = 1, blacklist = [host]) {
		if(depth > args['depth']) return {};
		const localTargets = ns.scan(host).filter(target => !blacklist.includes(target));
		blacklist = [...blacklist, ...localTargets];
		return localTargets.reduce((acc, target) => {
			const info = ns.getServer(target);
			const verb = args['verbose'] ? ` (${info.hasAdminRights ? 'ROOTED' : `${info.requiredHackingSkill}|${info.numOpenPortsRequired}`})` : '';
			const name = `${target}${verb}`;
			acc[name] = scan(target, depth + 1, blacklist);
			return acc;
		}, {});
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
	ns.tprint(args['device']);
	const found = scan(args['device']);
	if(args['regex']) filter(found, args['regex'], true);
	else if(args['filter']) filter(found, args['filter']);
	render(found);
	ns.tprint('');
}

export function autocomplete(data) {
	return [...data.servers];
}
