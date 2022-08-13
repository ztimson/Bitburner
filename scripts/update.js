class ArgParser {
	/**
	 * Create a unix-like argument parser to extract flags from the argument list. Can also create help messages.
	 *
	 * @param {string} name - Script name
	 * @param {string} desc - Help description
	 * @param {(ArgParser | {name: string, desc: string, flags?: string[], optional?: boolean, default?: any})[]} argList - Array of CLI arguments
	 * @param {string[]} examples - Additional examples to display
	 */
	constructor(name, desc, argList = [], examples = []) {
		this.name = name;
		this.desc = desc;

		// Arguments
		this.commands = argList.filter(arg => arg instanceof ArgParser);
		this.args = argList.filter(arg => !arg.flags || !arg.flags.length);
		this.flags = argList.filter(arg => !(arg instanceof ArgParser) && arg.flags && arg.flags.length);
		this.flags.push({name: 'help', desc: 'Display this help message', flags: ['-h', '--help'], default: false});
		this.defaults = argList.reduce((acc, arg) => ({...acc, [arg.name]: arg?.extras ? [] : arg.default ?? null}), {});

		// Examples
		this.examples = [
			...examples,
			`[OPTIONS] ${this.args.map(arg => (arg.optional ? `[${arg.name.toUpperCase()}]` : arg.name.toUpperCase()) + (arg.extras ? '...' : '')).join(' ')}`,
			this.commands.length ? `[OPTIONS] COMMAND` : null,
			`--help ${this.commands.length ? '[COMMAND]' : ''}`
		].filter(e => !!e);
	}

	/**
	 * Parse an array into an arguments dictionary using the configuration.
	 *
	 * @param {string[]} args - Array of arguments to be parsed
	 * @returns {object} - Dictionary of arguments with defaults applied
	 */
	parse(args) {
		// Parse arguments
		let extras = [], parsed = {...this.defaults, '_error': []}, queue = [...args];
		while(queue.length) {
			let arg = queue.splice(0, 1)[0];
			if(arg[0] == '-') { // Flags
				// Check for combined shorthand
				if(arg[1] != '-' && arg.length > 2) {
					queue = [...arg.substring(2).split('').map(a => `-${a}`), ...queue];
					arg = `-${arg[1]}`;
				}
				// Find & add flag
				const combined = arg.split('=');
				const argDef = this.flags.find(flag => flag.flags.includes(combined[0] || arg));
				if(argDef == null) { // Not found, add to extras
					extras.push(arg);
					continue;
				}
				const value = argDef.default === false ? true : argDef.default === true ? false : queue.splice(queue.findIndex(q => q[0] != '-'), 1)[0] || argDef.default;
				if(value == null) parsed['_error'].push(`Option missing value: ${arg.name}`);
				parsed[argDef.name] = value;
			} else { // Command
				const c = this.commands.find(command => command.name == arg);
				if(!!c) {
					const parsedCommand = c.parse(queue.splice(0, queue.length));
					Object.keys(parsedCommand).forEach(key => {
						if(parsed[key] != parsedCommand[key] && parsedCommand[key] == c.defaults[key])
							delete parsedCommand[key];
					});
					parsed = {
						...parsed,
						...parsedCommand,
						_command: c.name
					};
				} else extras.push(arg); // Not found, add to extras
			}
		}
		// Arguments
		this.args.filter(arg => !arg.extras).forEach(arg => {
			if(!arg.optional && !extras.length) parsed['_error'].push(`Argument missing: ${arg.name.toUpperCase()}`);
			if(extras.length) parsed[arg.name] = extras.splice(0, 1)[0];
		});
		// Extras
		const extraKey = this.args.find(arg => arg.extras)?.name || '_extra';
		parsed[extraKey] = extras;
		return parsed;
	}

	/**
	 * Create help message from the provided description & argument list.
	 *
	 * @param {string} message - Message to display, defaults to the description
	 * @param {string} command - Command help message to show
	 * @returns {string} - Help message
	 */
	help(message = '', command = '') {
		const spacer = (text) => Array(24 - text.length || 1).fill(' ').join('');

		// Help with specific command
		if(command) {
			const argParser = this.commands.find(parser => parser.name == command);
			if(!argParser) throw new Error(`${command.toUpperCase()} does not have a help`)
			return argParser.help(message);
		}

		// Description
		let msg = `\n\n${message || this.desc}`;
		// Examples
		msg += '\n\nUsage:\t' + this.examples.map(ex => `run ${this.name} ${ex}`).join('\n\t');
		// Arguments
		if(this.args.length) msg += '\n\n\t' + this.args
			.map(arg => `${arg.name.toUpperCase()}${spacer(arg.name)}${arg.desc}`)
			.join('\n\t');
		// Flags
		msg += '\n\nOptions:\n\t' + this.flags.map(flag => {
			const flags = flag.flags.join(', ');
			return `${flags}${spacer(flags)}${flag.desc}`;
		}).join('\n\t');
		// Commands
		if(this.commands.length) msg += '\n\nCommands:\n\t' + this.commands
			.map(command => `${command.name}${spacer(command.name)}${command.desc}`)
			.join('\n\t');
		return `${msg}\n\n`;
	}
}

/**
 * Display a progress bar in the terminal which updates in real time.
 *
 * **Example:**
 *
 * `/script/test.js          [||||||||||----------]  50% (24.2 MB/s)`
 *
 * @param {NS} ns - BitBurner API
 * @param {string} name - Name to display at the begging of bar
 * @param {boolean} showSpeed - Show the speed in the progress bar
 * @param {number} time - Time it takes for bar to fill
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
 *
 * @param {NS} ns - BitBurner API
 * @param {string} message - Text to display
 * @param {number} min - minimum amount of time to wait after printing text
 * @param {number} max - maximum amount of time to wait after printing text
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
	const argParser = new ArgParser(updateFile, 'Download the latest script updates from the repository using wget.', [
		{name: 'device', desc: 'Device to update, defaults to current machine', optional: true, default: ns.getHostname()},
		{name: 'skip-self', desc: 'Skip updating self (for debugging & used internally)', flags: ['--skip-self'], default: false},
		{name: 'no-banner', desc: 'Hide the banner (Used internally)', flags: ['--no-banner'], default: false}
	]);
	const args = argParser.parse(ns.args || []);
	const src = 'https://raw.githubusercontent.com/PointyTrident/Bitburner/develop/scripts/';
	const dest = '/scripts/';
	const fileList = [
		'lib/arg-parser.js',
		'lib/logger.js',
		'lib/utils.js',
		'banner.js',
		'botnet-manager.js',
		'connect.js',
		'copy.js',
		'crawler.js',
		'find-target.js',
		'hacknet-manager.js',
		'miner.js',
		'network-graph.js',
		'rootkit.js',
		'server-manager.js',
	];

	// Help
	if(args['help'] || args['_error'].length)
		return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

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
}
