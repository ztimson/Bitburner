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

/**
 * Automatically download all the scripts in the repository.
 */
export async function main(ns) {
    ns.disableLog('ALL');
    
    /**
     * Download a file from the repo with some fancy styling & deplays.
     * @param file {String} - file name
     */
    async function download(file) {
        await ns.wget(`${src}${file}`, `${dest}${file}`);
        const speed = ~~((Math.random() * 200) + 100) / 10;
        ns.tprint(`${file} ${file.length <= 10 ? '\t' : ''}\t [==================>] 100% \t (${speed} MB/s)`);
    }

    // Initilize script arguments
	const argParser = new ArgParser({
		desc: 'Automatically download the latest versions of all scripts using wget.',
		examples: [
			'run update.js',
			'run update.js --help',
		],
		args: [
			{key: 'help', alias: 'h', type: 'bool', optional: true, desc: 'Display help message'},
		]
	});
    const args = argParser.parse(ns.args);
	if(args['help']) return ns.tprint(argParser.help());

    // Setup
    const src = 'https://gitlab.zakscode.com/ztimson/BitBurner/-/raw/develop/scripts/';
    const dest = '/scripts/';
    const fileList = [
		'lib/arg-parser.js',
        'auto-pwn.js',
        'bruteforce.js',
        'crawler.js',
        'miner.js',
		'network-graph.js',
        'node-manager.js'
    ];

    // Update self & restart
    if(!ns.args.length) {
        ns.tprint("Updating self:");
        await ns.sleep(1000);
        await download('update.js');
        await ns.sleep(500);
        ns.tprint('');
        ns.tprint("Restarting...");
        await ns.sleep(2000);
        return ns.run(`${dest}update.js`, 1, 1);
    }

    // Download each file
    ns.tprint("Downloading scripts:");
    ns.tprint('');
    for(const file of fileList) {
        await ns.sleep(500);
        await download(file);
    }
    ns.tprint('');
    ns.tprint('✅ Done!');
    ns.tprint('');
}
