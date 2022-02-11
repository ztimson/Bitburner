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
		desc: 'Search the network for targets to execute a script against.',
		examples: [
			'run crawler.js [OPTIONS] SCRIPT [ARGS]...',
			'run crawler.js --help',
		],
		args: [
			{key: 'SCRIPT', desc: 'Script to copy & execute'},
			{key: 'ARGS', skip: true, desc: 'Aditional arguments for SCRIPT. Forward the target with "{{TARGET}}"'},
			{key: 'depth', alias: 'd', type: 'num', optional: true, desc: 'Number of network hops. Defaults to 3'},
            {key: 'level', alias: 'l', type: 'num', optional: true, desc: 'Exclude targets with a high hacking level. Defaults to hack level, 0 to disable'},
            {key: 'ports', alias: 'p', type: 'num', optional: true, desc: 'Exclute targets with too many closed ports'},
            {key: 'threads', alias: 't', type: 'num', optional: true, desc: 'Set number of threads for script'},
			{key: 'help', alias: 'h', type: 'bool', optional: true, desc: 'Display help message'},
		]
	});
	const args = argParser.parse(ns.args);
    if(args['help']) return ns.tprint(argParser.help());
    if(!args['SCRIPT']) return ns.tprint(argParser.help('Missing SCRIPT'));

	// Setup
    const depth = args['depth'] || 3;
    const level = args['level'] || ns.getHackingLevel();
	const ports = args['ports'] || Infinity;
	const threads = args['threads'] || 1;

    // Recursively search for targets
    const targets = ns.scan().map(h => [h, 1]);
	for(let i = 0; i < targets.length; i++) {
		if(targets[i][1] < depth) ns.scan(targets[i][0]).forEach(h => {
            if(h != 'home' && !targets.find(t => t[0] == h)) targets.push([h, targets[i][1] + 1]);
        });
	}

	// Execute script on each target
	for(const target of targets) {
		// Check target
        if(level && level < ns.getServerRequiredHackingLevel(target[0]) || 
			(ports && ports < ns.getServerNumPortsRequired(target[0]))) return;

        // Start script
        ns.run(args['SCRIPT'], threads, ...args['extra'].map(a => a == '{{TARGET}}' ? target[0] : a));

        // Wait for script to finish
        // do { await ns.sleep(1000); }
        // while(ns.scriptRunning(args['SCRIPT'], 'home'));
		await ns.sleep(10000);
	}
}
