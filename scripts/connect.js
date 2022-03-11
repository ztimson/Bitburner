import {ArgError, ArgParser} from './scripts/lib/arg-parser';
import {terminal} from './scripts/lib/utils';

/**
 * Connect to a device on a different network.
 * @param ns {NS} - BitBurner API
 */
export function main(ns) {
	// Setup
	ns.disableLog('ALL');
	let args;
	const argParser = new ArgParser('connect.js', 'Connect to a device on a different network.', null, [
		{name: 'device', desc: 'Device to connect to', default: ns.getHostname(), type: 'string'}
	]);
	try {
		args = argParser.parse(ns.args);
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}

	/**
	 * Find path to a device recursively
	 * @param device {string} - Device to locate
	 * @param current {string} - Current device to scan
	 * @param path {string[]} - Path the the current device
	 * @param all {Set} - Stop devices from being scanned
	 * @returns {string[]} - Path to the located device
	 */
	function find(device, current = 'home', path = [current], blacklist = new Set()) {
		blacklist.add(current);
		const newDevices = ns.scan(current).filter(d => !blacklist.has(d));
		if(newDevices.length == 0) return [];
		if(newDevices.find(d => d == device)) return [...path, device];
		return newDevices.map(d => find(device, d, [...path, d], all)).find(p => p && p.length);
	}

	// Run
	const path = find(args['device']);
	path.splice(0, 1); // Delete 'home' from from the path
	for(let d of path) {
		terminal(`connect ${d}`);
	}
}

export function autocomplete(data) {
	return [...data.servers];
}
