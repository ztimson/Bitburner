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
 * Pwn a target server will availible tools. Can also copy & execute a script after pwning.
 */
export async function main(ns) {
	ns.disableLog('ALL');
	
	/**
	 * Prints text and waits a random amount of time to emulate work being complete.
	 * @param text {String} - message to Display
	 * @param min {Number} - minimum amount of time to wait in seconds. Defaults to 1 second.
	 * @param max {Number} - maximum amount of time to wait in seconds. Defaults to 1 second.
	 */
	async function printWithDelay(text, min=1, max=1) {
		ns.tprint(text);
		await ns.sleep(~~(Math.random() * (max * 1000 - min * 1000)) + min * 1000);
	}

	// Initilize script arguments
	const argParser = new ArgParser({
		desc: 'Automatically gain root on a target machine. Optionaly after being rooted, a file can be coppied & executed.',
		examples: [
			'run auto-pwn.js [TARGET] [SCRIPT] [ARGS]...',
			'run auto-pwn.js --help',
		],
		args: [
			{key: 'TARGET', desc: 'Target machine to root. Defaults to localhost'},
			{key: 'SCRIPT', desc: 'Script to copy & execute'},
			{key: 'ARGS', skip: true, desc: 'Aditional arguments for SCRIPT. Forward the target with "{{TARGET}}"'},
			{key: 'threads', alias: 't', type: 'num', optional: true, desc: 'Set number of threads for script'},
			{key: 'help', alias: 'h', type: 'bool', optional: true, desc: 'Display help message'},
		]
	});
	const args = argParser.parse(ns.args);
	if(args['help']) return ns.tprint(argParser.help());

	// Setup
	const target = args['TARGET'] && args['TARGET'] != 'localhost' ? args['TARGET'] : ns.getHostname();
	const threads = args['threads'] || !args['SCRIPT'] ? 1 : ~~(ns.getServerMaxRam(target) / ns.getScriptRam(args['SCRIPT'], 'home'));

	// Banner
	ns.tprint('===================================================');
	ns.tprint(`🧑‍💻 Pwning: ${target}`);
	await printWithDelay('===================================================');

	try {
		// Open as many ports as possible
		ns.brutessh(target);
		await printWithDelay(`Attacking (SSH) ⚔️ ${target}:22`, 3, 5);
		ns.ftpcrack(target);
		await printWithDelay(`Attacking (FTP) ⚔️ ${target}:24`, 3, 5);
	} catch {
	} finally {
		// Attempt to root
		try {
			ns.nuke(target)
			await printWithDelay(`💀 Root Granted 💀`);
		} catch {	
			await printWithDelay(`⚠️ Failed to Root ⚠️`);
			ns.exit();
		}
	}
	
	if(args['SCRIPT']) {
		// Copy scripts
		ns.tprint('');
		await printWithDelay('Copying script:');
		const speed = ~~(Math.random() * 100) / 10
		await ns.scp(args['SCRIPT'], target);
		await printWithDelay(`${args['SCRIPT']} \t [==================>] 100% \t (${speed} MB/s)`);
		
		// Run scripts
		ns.tprint('');
		ns.tprint('Executing:');
		ns.scriptKill(args['SCRIPT'], target);
		await printWithDelay(`ssh -c "run ${args['SCRIPT']} ${args['extra'].join(' ')} -t ${threads}" root@${target}`);
		const pid = ns.exec(args['SCRIPT'], target, threads, ...args['extra'].map(a => a == '{{TARGET}}' ? target : a));
		ns.tprint('');
		ns.tprint(pid != null ? '✅ Done!' : '⚠️ Failed to start ⚠️');
		ns.tprint('');
	}
}

/**
 * Autocomplete script arguments
 * @param data - provided by API
 */
export function autocomplete(data) {
	return [...data.servers, ...data.scripts];
}
