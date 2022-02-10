import {ArgParser} from './scripts/lib/arg-parser';

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
			{key: 'ARGS', desc: 'Any aditional arguments to pass to SCRIPT. Passing \'{{TARGET}}\' will forward the current target'},
			{key: 'help', alias: 'h', optional: true, desc: 'Display help message'},
		]
	});
	const args = argParser.parse(ns.args);
	if(args['help']) return ns.tprint(argParser.help());

	// Setup
	const target = args['TARGET'] && args['TARGET'] != 'localhost' ? args['TARGET'] : ns.getHostname();

	// Banner
	ns.tprint('===================================================');
	ns.tprint(`🧑‍💻 Pwning: ${target}`);
	await printWithDelay('===================================================');

	// Gain root
	try {
		ns.brutessh(target);
		await printWithDelay(`Attacking (SSH) ⚔️ ${target}:22`, 3, 5);
		ns.ftpcrack(target);
		await printWithDelay(`Attacking (FTP) ⚔️ ${target}:24`, 3, 5);
	} catch {
	} finally {
		try {
			ns.nuke(target)
			await printWithDelay(`💀 Root Granted 💀`);
		} catch {	
			await printWithDelay(`⚠️ Failed to Root ⚠️`);
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
		const threads = Math.floor(ns.getServerMaxRam(target) / 2.3);
		ns.scriptKill(args['SCRIPT'], target);
		await printWithDelay(`ssh -c "run ${args['SCRIPT']} ${args['extra'].join(' ')} -t ${threads}" root@${target}`);
		const pid = ns.exec(args['SCRIPT'], target, threads, ...args['extra'].map(a => a == '{{TARGET}}' ? target : a));
		if(!pid) return ns.tprint('⚠️ Failed to start ⚠️');
		ns.tprint('');
		ns.tprint('✅ Complete!');
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
