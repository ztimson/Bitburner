class ArgError extends Error {}

class ArgParser {
	/**
	 * Create a unix-like argument parser to extract flags from the argument list. Can also create help messages.
	 * @param name {string} - Script name
	 * @param desc {string} - Help text desciption
	 * @param examples {string[]} - Help text examples
	 * @param argList {name: string, desc: string, flags: string[], type: string, default: any}[] - Array of CLI arguments
	 * @param allowUnknown {boolean} - Allow unknown flags
	 */
	constructor(name, desc, examples, argList, allowUnknown = false) {
		this.name = name ?? 'example.js';
		this.description = desc ?? 'Example description';
		this.examples = examples || [`${argList.find(arg => !!arg.flags) ? '[OPTIONS] ' : ''}${argList.filter(arg => !arg.flags).map(arg => (arg.optional ? `[${arg.name.toUpperCase()}]` : arg.name.toUpperCase()) + (arg.extras ? '...' : '')).join(' ')}`];
		this.examples.push('--help');
		this.argList = argList || [];
		this.argList.push({name: 'help', desc: 'Display this help message', flags: ['-h', '--help'], type: 'bool'});
		this.allowUnknown = allowUnknown;
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
				if(arg == null) {
					if(!this.allowUnknown) throw new ArgError(`Option unknown: ${parse}`);
					extra.push(parse);
					continue;
				}
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

/**
 * Display a progress bar in the terminal which updates in real time.
 *
 * **Example:**
 *
 * `/script/test.js          [||||||||||----------]  50% (24.2 MB/s)`
 *
 * @param ns {NS} - BitBurner API
 * @param name {string} - Name to display at the begging of bar
 * @param showSpeed {boolean} - Show the speed in the progress bar
 * @param time {number} - Time it takes for bar to fill
 */
export async function progressBar(ns, name, showSpeed = true, time = Math.random() + 0.5) {
	const text = (percentage, speed) => {
		const p = percentage > 1 ? 1 : percentage < 0 ? 0 : percentage;
		const spacer = Array(30 - name.length).fill(' ').join('');
		const bar = `[${Array(Math.round(20 * p)).fill('|').join('')}${Array(Math.round(20 * (1 - p))).fill('-').join('')}]`;
		const percent = `${Math.round(p * 100)}`;
		const percentSpacer = Array(3 - percent.length).fill(' ').join('');
		return `${name}${spacer}${bar} ${percentSpacer}${percent}%${speed != null ? ` (${speed} MB/s)` : ''}`;
	}

	let speed = Math.round((20 + Math.random() * 10) * 10) / 10;
	ns.tprint(text(1, speed)); // Display the complete bar (This is the one that will be shown on redraws)
	await ns.sleep(25); // Wait for the new line to display
	const terminalOutput = eval('document').querySelectorAll('#terminal li p');
	const updateLine = terminalOutput[terminalOutput.length - 1];
	if(!updateLine) return await ns.sleep(time * 1000);
	const script = updateLine.innerText.split(': ')[0];
	for(let p = 0; p <= 100; p++) {
		await ns.sleep((time * 1000) / 100);
		if(p % 5 == 0) speed = Math.round((speed + (Math.random() > 0.5 ? 1 : -1) * Math.random()) * 10) / 10;
		updateLine.innerText = `${script}: ${text(p / 100, showSpeed ? p == 0 ? 0 : speed : null)}`;
	}
}

/**
 * Print text to the terminal & then delay for a random amount of time to emulate execution time.
 * @param ns {NS} - BitBurner API
 * @param message {string} - Text to display
 * @param min {number} - minimum amount of time to wait after printing text
 * @param max {number} - maximum amount of time to wait after printing text
 */
async function slowPrint(ns, message, min = 0.5, max = 1.5) {
	const time = ~~(Math.random() * (max * 1000 - min * 1000)) + min * 1000;
	ns.tprint(message);
	await ns.sleep(time);
}

/**
 * Automatically download all the scripts in the repository.
 * @params ns {NS} - BitBurner API
 */
export async function main(ns) {
    // Setup
	ns.disableLog('ALL');
    const updateFile = 'update.js';
	const argParser = new ArgParser(updateFile, 'Download the latest script updates from the repository using wget.', null, [
		{name: 'device', desc: 'Device to update, defaults to current machine', optional: true, default: ns.getHostname(), type: 'string'},
		{name: 'skip-self', desc: 'Skip updating self (for debugging & used internally)', flags: ['--skip-self'], type: 'bool'},
		{name: 'no-banner', desc: 'Hide the banner (Used internally)', flags: ['--no-banner'], type: 'bool'}
	]);

	try {
		const args = argParser.parse(ns.args || []);
		const src = 'https://gitlab.zakscode.com/ztimson/BitBurner/-/raw/develop/scripts/';
		const dest = '/scripts/';
		const fileList = [
			'lib/arg-parser.js',
			'lib/logger.js',
			'lib/utils.js',
			'botnet-manager.js',
			'connect.js',
			'copy.js',
			'crawler.js',
			'find-target.js',
			'hacknet-manager.js',
			'miner.js',
			'network-graph.js',
			'rootkit.js'
		];

		if(!args['no-banner']) {
			// Banner
			ns.tprint('===================================================');
			ns.tprint(`Updating: ${args['device']}`);
			ns.tprint('===================================================');
		}

		// Run
		if(!args['skip-self']) { // Update self & restart
			await slowPrint(ns, 'Updating self:');
			await ns.wget(`${src}${updateFile}`, `${dest}${updateFile}`, args['device']);
			await progressBar(ns, `${dest}${updateFile}`);
			ns.tprint('');
			await slowPrint(ns, 'Restarting...');
			const pid = ns.run(`${dest}${updateFile}`, 1, args['device'], '--skip-self', '--no-banner');
			if(pid == 0) ns.tprint('Failed');
			else ns.tprint('Complete');
			return await slowPrint(ns, '');
		} else { // Update everything else
			await slowPrint(ns, 'Downloading scripts:');
			for(let file of fileList) {
				await ns.wget(`${src}${file}`, `${dest}${file}`, args['device']);
				await progressBar(ns, `${dest}${file}`);
			}
			ns.tprint('');
			ns.tprint('Done!');
			ns.tprint('');
		}
    } catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}
}
