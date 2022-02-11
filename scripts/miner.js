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
 * Hack a server for it's money.
 */
export async function main(ns) {
	ns.disableLog('ALL');

	/**
	 * Print header with logs
	 * @param message - message to append to logs
	 */
	function log(message) {
		const sec = `${Math.round(security)}/${minSecurity}`;
		ns.clearLog();
		ns.print('===================================================');
		ns.print(`💎⛏️ Mining: ${target}`);
		ns.print('===================================================');
		ns.print(`Security: ${sec}${sec.length < 6 ? '\t' : ''}\tBalance: $${Math.round(balance * 100) / 100}`);
		ns.print('===================================================');
		if(message != null) messageHistory.push(message);
		messageHistory.splice(0, messageHistory.length - historyLength);
		messageHistory.forEach(m => ns.print(m));
	}

	// Initilize script arguments
	const argParser = new ArgParser({
		desc: 'Weaken, spoof & hack the target in a loop for money.',
		examples: [
			'run miner.js [TARGET]',
			'run miner.js --help',
		],
		args: [
			{key: 'TARGET', desc: 'Target to mine. Defaults to localhost'},
			{key: 'help', alias: 'h', type: 'bool', optional: true, desc: 'Display help message'},
		]
	});
	const args = argParser.parse(ns.args);
	if(args['help']) return ns.tprint(argParser.help());

	// Setup
	const historyLength = 15;
	const messageHistory = Array(historyLength).fill('');
	const target = args['TARGET'] && args['TARGET'] != 'localhost' ? args['TARGET'] : ns.getHostname();
	const minSecurity = ns.getServerMinSecurityLevel(target) + 2;
	let orgBalance, balance, security;

	log();
	while(true) {
		// Update information
		security = await ns.getServerSecurityLevel(target);
		balance = await ns.getServerMoneyAvailable(target);
		if(orgBalance == null) orgBalance = balance;

		// Pick step
		if(security > minSecurity) { // Weaken
			log('Attacking Security...');
			const w = await ns.weaken(target);
			log(`Security: -${w}`);
		} else if(balance <= orgBalance) { // Grow
			log('Spoofing Balance...');
			const g = await ns.grow(target);
			log(`Balance: +$${Math.round((g * balance - balance) * 100) / 100}`);
		} else { // Hack
			log('Hacking Account...');
			const h = await ns.hack(target);
			log(`Balance: -$${h}`);
		}
	}
}

export function autocomplete(data) {
	return [...data.servers];
}
