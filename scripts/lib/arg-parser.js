export class ArgError extends Error {}

export class ArgParser {
	/**
	 * Create a unix-like argument parser to extract flags from the argument list. Can also create help messages.
	 * @param name {string} - Script name
	 * @param desc {string} - Help text desciption
	 * @param examples {string[]} - Help text examples
	 * @param argList {name: string, desc: string, flags: string[], type: string, default: any}[] - Array of CLI arguments
	 */
	constructor(name, desc, examples, argList) {
		this.name = name ?? 'example.js';
		this.description = desc ?? 'Example description';
		this.examples = examples || [`${argList.find(arg => !!arg.flags) ? '[OPTIONS] ' : ''}${argList.filter(arg => !arg.flags).map(arg => (arg.optional ? `[${arg.name.toUpperCase()}]` : arg.name.toUpperCase()) + (arg.extras ? '...' : '')).join(' ')}`];
		this.examples.push('--help');
		this.argList = argList || [];
		this.argList.push({name: 'help', desc: 'Display this help message', flags: ['-h', '--help'], type: 'bool'});
	}

	/**
	 * Parse an array into an arguments dictionary using the configuration.
	 * @param args {string[]} - Array of arguments to be parsed
	 * @returns {object} - Dictionary of arguments with defaults applied
	 */
	parse(args) {
		// Parse arguments
		const queue = [...args], extra = [];
		const parsed = this.argList.reduce((acc, arg) => ({...acc, [arg.name]: arg.default ?? (arg.type == 'bool' ? false : null)}), {});
		// Flags
		while(queue.length) {
			let parse = queue.splice(0, 1)[0];
			if(parse[0] == '-') {
				// Check combined flags
				if(parse[1] != '-' && parse.length > 2) {
					parse = `-${parse[1]}`;
					queue = parse.substring(1).split('').map(a => `-${a}`).concat(queue);
				}
				// Find & add flag
				const split = parse.split('=');
				const arg = this.argList.find(arg => arg.flags && arg.flags.includes(split[0] || parse));
				if(arg == null) throw new ArgError(`Option unknown: ${parse}`);
				if(arg.name == 'help') throw new ArgError('Help');
				const value = arg.type == 'bool' ? true : split[1] || queue.splice(queue.findIndex(q => q[0] != '-'), 1)[0];
				if(value == null) throw new ArgError(`Option missing value: ${arg.name}`);
				parsed[arg.name] = value;
			} else { 
				// Save for required parsing
				extra.push(parse);
			}
		}
		// Arguments
		this.argList.filter(arg => !arg.flags && !arg.extras).forEach(arg => {
			if(!arg.optional && !extra.length) throw new ArgError(`Argument missing: ${arg.name.toUpperCase()}`);
			const value = extra.splice(0, 1)[0];
			if(value != null) parsed[arg.name] = value;
		});
		// Extras
		const extraKey = this.argList.find(arg => arg.extras)?.name || 'extra';
		parsed[extraKey] = extra;
		return parsed;
	}

	/**
	 * Create help message from the provided description, examples & argument list.
	 * @param message {string} - Message to display, defaults to the description
	 * @returns {string} - Help message 
	 */
	help(msg) {
		// Description
		let message = '\n\n' + (msg && msg.toLowerCase() != 'help' ? msg : this.description);
		// Usage
		if(this.examples.length) message += '\n\nUsage:\t' + this.examples.map(ex => `run ${this.name} ${ex}`).join('\n\t');
		// Arguments
		const req = this.argList.filter(a => !a.flags);
		if(req.length) message += '\n\n\t' + req.map(arg => {
			const padding = 3 - ~~(arg.name.length / 8);
			return `${arg.name.toUpperCase()}${Array(padding).fill('\t').join('')} ${arg.desc}`;
		}).join('\n\t');
		// Flags
		const opts = this.argList.filter(a => a.flags);
		if(opts.length) message += '\n\nOptions:\n\t' + opts.map(a => {
			const flgs = a.flags.join(' ');
			const padding = 3 - ~~(flgs.length / 8);
			return `${flgs}${Array(padding).fill('\t').join('')} ${a.desc}`;
		}).join('\n\t');
		// Print final message
		return `${message}\n\n`;
	}
}
