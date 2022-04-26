import {ArgParser} from '/scripts/lib/arg-parser';
import {addCSS, htmlPrint, pruneTree, serializeFunction, terminal} from '/scripts/lib/utils';
import {connectionString} from '/scripts/connect';
import {scanNetwork} from '/scripts/crawler';

const CSS = `
	#terminal a:not([href]):hover {
		cursor:pointer;
		text-decoration:underline;
	}
	.srv-fnr { color: #BBBB11; }
	.srv-fr {
		color: #FFFF44;
		font-weight: bold;
	}
	.srv-nr { color: #11BB11; }
	.srv-r { 
		color: #00FF00;
		font-weight: bold;
	}`

export const factionServers = ['CSEC', 'avmnite-02h', 'I.I.I.I', 'run4theh111z', 'w0r1d_d43m0n'];

/**
 * Scan the network for servers and display as an ASCII tree. Servers with root access are highlighted & bold.
 *
 * @param {NS} ns - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('network-graph.js', 'Scan the network for servers and display as an ASCII tree. Servers with root access are highlighted & bold. Click to automatically connect.', [
		{name: 'server', desc: 'Point to start scan from, defaults to local server', optional: true, default: ns.getHostname()},
		{name: 'depth', desc: 'Depth to scan to', flags: ['-d', '--depth'], default: Infinity},
		{name: 'filter', desc: 'Filter to servers matching name', flags: ['-f', '--filter'], default: false},
		{name: 'regex', desc: 'Filter to servers matching pattern', flags: ['-e', '--regex'], default: false},
		{name: 'level', desc: 'Display the required hack level & number of ports to root: [level|port]', flags: ['-l', '--level'], default: false},
		{name: 'notRooted', desc: 'Filter to servers that have not been rooted', flags: ['-n', '--not-rooted'], default: false},
		{name: 'rooted', desc: 'Filter to servers that have been rooted', flags: ['-r', '--rooted'], default: false},
		{name: 'specs', desc: 'Display the server specifications: {CPU|RAM}', flags: ['-s', '--specs'], default: false},
		{name: 'usage', desc: 'Display the server utilization: (USG%)', flags: ['-u', '--usage'], default: false},
		{name: 'verbose', desc: 'Display level, specs & usage in that order: [HL|P] {CPU|RAM} (USG%)', flags: ['-v', '--verbose'], default: false},
	]);
	const args = argParser.parse(ns.args);

	/**
	 * Get the color class for the server.
	 *
	 * @param {string} server - Server to figure out color for.
	 */
	function color(server) {
		const rooted = ns.getServer(server).hasAdminRights; // Already using getServer so we might as well keep using it
		if(factionServers.includes(server)) return rooted ? 'srv-fr' : 'srv-fnr';
		return rooted ? 'srv-r' : 'srv-nr';
	}

	/**
	 * Create serialized connection command.
	 *
	 * @param {string} server - server to connect to.
	 */
	function connectFn(server) {
		return serializeFunction(terminal, connectionString(ns, server, 'home'));
	}

	/**
	 * Iterate tree & convert to ascii.
	 *
	 * @param {Object} tree - Tree to parse
	 * @param {string} spacer - Spacer text for tree formatting
	 */
	function render(tree, spacer = ' ') {
		const nodes = Object.keys(tree);
		for(let i = 0; i < nodes.length; i++) {
			const server = nodes[i], info = ns.getServer(server);
			let stats = '';
			if(args['level'] || args['verbose']) stats += ` [${info.requiredHackingSkill}|${info.openPortCount}]`;
			if(args['specs'] || args['verbose']) stats += ` {${info.cpuCores}|${info.maxRam}}`;
			if(args['usage'] || args['verbose']) stats += ` (${Math.round(info.ramUsed / info.maxRam * 100) || 0}%)`;
			const last = i == nodes.length - 1;
			const branch = last ? '└─ ' : '├─ ';
			htmlPrint(spacer + branch + `<a class="${color(server)}" onclick="${connectFn(server)}">${server + stats}</a>`);
			render(tree[server], spacer + (last ? '    ' : '│   '));
		}
	}

	// Help
	if(args['help'] || args['_error'].length)
		return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

	// Gather network information
	const [ignore, network] = scanNetwork(ns, args['server'], args['depth']);

	// Add flags filters
	if(args['regex']) pruneTree(network, s => RegExp(args['regex']).test(s));
	if(args['filter']) pruneTree(network, s => s == args['filter']);
	if(args['rooted']) pruneTree(network, s => ns.getServer(s).hasAdminRights); // Already using getServer so we might as well keep using it
	if(args['notRooted']) pruneTree(network, s => !ns.getServer(s).hasAdminRights); // Already using getServer so we might as well keep using it

	// Output
	addCSS('network-graph', CSS);
	htmlPrint(`\n<a class="srv-tree-span ${color(args['server'])}" onclick="${connectFn(args['server'])}">${args['server']}</a>`);
	render(network);
	htmlPrint('\n');
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
