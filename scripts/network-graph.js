class ArgParser {
	/**
	 * Create a unix-like argument parser to extract flags from the argument list. Can also create help messages.
	 * @param opts - {examples: string[], arguments: {key: string, alias: string, type: string, optional: boolean, desc: string}[], desc: string}
	 */
	constructor(opts) {
		this.examples = opts.examples ?? [];
		this.arguments = opts.args ?? [];
		this.description = opts.desc;
	}

	/**
	 * Parse the list for arguments & create a dictionary.
	 * @param args {any[]} - Array of arguments
	 * @returns Dictionary of matched flags + unmatched args under 'extra'
	 */
	parse(args) {
		const req = this.arguments.filter(a => !a.optional && !a.skip);
		const queue = [...args], parsed = {}, extra = [];
		for(let i = 0; i < queue.length; i++) {
			if(queue[i][0] != '-') {
				extra.push(queue[i]);
				continue;
			}
			let value = null, parse = queue[i].slice(queue[i][1] == '-' ? 2 : 1);
			if(parse.indexOf('=')) {
				const split = parse.split('=');
				parse = split[0];
				value = split[1];
			}
			let arg = this.arguments.find(a => a.key == parse) ?? this.arguments.find(a => a.alias == parse);
			if(!arg) {
				extra.push(queue[i]);
				continue;
			}
			if(!value) {
				value = arg.type == 'bool' ? true : queue[i + 1]; 
				if(arg.type != 'bool') i++;
			}
			parsed[arg.key] = value;
		}
		req.forEach((a, i) => parsed[a.key] = extra[i]);
		extra.splice(0, req.length);
		return {...parsed, extra};
	}

	/**
	 * Create a help message of the expected paramters & usage.
	 * @param msg {String} - Optional message to display with help
	 */
	help(msg) {
		let message = '\n\n';
		message += msg ? msg : this.description;
		if(this.examples.length) message += '\n\nUsage:\t' + this.examples.join('\n\t');
		const required = this.arguments.filter(a => !a.optional);
		if(required.length) message += '\n\n\t' + required.map(a => {
			const padding = 3 - ~~(a.key.length / 8);
			return `${a.key}${Array(padding).fill('\t').join('')} ${a.desc}`;
		}).join('\n\t');
		const optional = this.arguments.filter(a => a.optional);
		if(optional.length) message += '\n\nOptions:\n\t' + optional.map(a => {
			const flgs = `${a.alias ? `-${a.alias} ` : ''}--${a.key}${a.type && a.type != 'bool' ? `=${a.type}` : ''}`;
			const padding = 3 - ~~(flgs.length / 8);
			return `${flgs}${Array(padding).fill('\t').join('')} ${a.desc}`;
		}).join('\n\t');
		return `${message}\n\n`;
	}
}

export async function main(ns) {
	ns.disableLog('ALL');

    // Initilize script arguments
	const argParser = new ArgParser({
		desc: 'Scan the network for devices and display as an ASCII tree:\n  ├─ n00dles (ROOTED)\n  |    └─ max-hardware (80|1)\n  |        └─ neo-net (50|1)\n  ├─ foodnstuff (ROOTED)\n  └─ sigma-cosmetics (ROOTED)',
		examples: [
			'run network-graph.js',
			'run network-graph.js [OPTIONS] TARGET',
			'run network-graph.js --help',
		],
		args: [
			{key: 'TARGET', desc: 'Starting point to scan from, defaults to home'},
			{key: 'depth', alias: 'd', type: 'num', optional: true, desc: 'Depth to scan for devices to, defaults to 3'},
            {key: 'verbose', alias: 'v', type: 'bool', optional: true, desc: 'Displays "ROOTED" or the required hack level & ports: (level|port)'},
			{key: 'help', alias: 'h', type: 'bool', optional: true, desc: 'Display help message'},
		]
	});
	const args = argParser.parse(ns.args);
    if(args['help']) return ns.tprint(argParser.help());
    const start = args['TARGET'] || 'home';
	const mDepth = args['depth'] || 3;

	/**
	 * Recursively search network & build a tree
	 * @param host {string} - Point to scan from
	 * @param depth {number} - Current scanning depth
	 * @param maxDepth {number} - Depth to scan to
	 * @param blacklist {String[]} - Devices already discovered
	 * @returns Dicionary of discovered devices
	 */
	function scan(host, depth = 1, maxDepth = mDepth, blacklist = [host]) {
		if(depth > maxDepth) return {};
		const localTargets = ns.scan(host).filter(target => !blacklist.includes(target));
		blacklist = blacklist.concat(localTargets);
		return localTargets.reduce((acc, target) => {
			const info = ns.getServer(target);
			const verbose = args['verbose'] ? ` (${info.hasAdminRights ? 'ROOTED' : `${info.requiredHackingSkill}|${info.numOpenPortsRequired}`})` : '';
			const name = `${target}${verbose}`;
			acc[name] = scan(target, depth + 1, maxDepth, blacklist);
			return acc;
		}, {});
	}

	/**
	 * Iterate tree & print to screen
	 * @param tree {Object} - Tree to parse
	 * @param spacer {String} - Spacer text for tree formatting
	 */
	function render(tree, spacer = '') {
		Object.keys(tree).forEach((key, i, arr) => {
			const last = i == arr.length - 1;
			const branch = last ? '└─ ' : '├─ ';
			ns.tprint(`${spacer}${branch}${key}`);
			render(tree[key], spacer + (last ? '    ' : '|   '));
		});
	}

	const network = scan(start);
	render(network);
}

export function autocomplete(data) {
	return [...data.servers];
}
