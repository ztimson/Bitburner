import {ArgError, ArgParser} from './scripts/lib/arg-parser';
import {downloadPrint, slowPrint} from './scripts/lib/utils';

/**
 * Pwn a target server with availible tools. Additionally can copy & execute a script after pwning.
 * @param ns {NS} - Bitburner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('rootkit.js', 'Automatically gain root access to a device. A file can also be uploaded & executed.', null, [
		{name: 'device', desc: 'Device to root, defaults to current machine', optional: true, default: ns.getHostname(), type: 'string'},
		{name: 'script', desc: 'Script to copy & execute', optional: true, type: 'string'},
        {name: 'args', desc: 'Arguments for script. Forward the current target with: {{TARGET}}', optional: true, extras: true, type: 'string'},
		{name: 'cpu', desc: 'Number of CPU threads to use with script', flags: ['-c', '--cpu'], type: 'num'},
	]);
	let args;
	try {
		args = argParser.parse(ns.args);
		if(args['script'] && !args['cpu']) args['cpu'] = ~~(ns.getServerMaxRam(args['device']) / ns.getScriptRam(args['script'], 'home')) || 1;
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}

	/**
	 * Detect import statements inside script & build a dependency tree.
	 * @params file {string} - Path to file to search
	 * @returns {string[]} - Array of required files
	 */
	async function dependencyFinder(file) {
		const queue = [file], found = [];
		while(queue.length) {
			const imports = new RegExp(/from ["']\.(.+)["']/g);
			const script = await ns.read(queue.splice(0, 1)[0]);
			let match;
			while((match = imports.exec(script)) != null) {
				const path = `${match[1]}.js`;
				queue.push(path);
				found.push(path);
			}
		}
		return found;
	}

	// Banner
	ns.tprint('===================================================');
	ns.tprint(`Rooting: ${args['device']}`);
	await slowPrint(ns, '===================================================');

	let spacer = false;
	try {
		// Run exploits
		ns.brutessh(args['device']);
		await slowPrint(ns, `Attacking over SSH (${args['device']}:22)...`, 1, 2);
		spacer = true;
		ns.ftpcrack(args['device']);
		await slowPrint(ns, `Attacking over FTP (${args['device']}:24)...`, 1, 2);
		ns.relaysmtp(args['device']);
		await slowPrint(ns, `Attacking over SMTP (${args['device']}:25)...`, 1, 2);
	} catch {
	} finally {
		try {
			// Attempt root
			if(spacer) ns.tprint('');
			ns.nuke(args['device'])
			ns.tprint(`Root: Success!`);
			ns.tprint('');
		} catch {	
			ns.tprint(`Root: Failed`);
			ns.tprint('');
			ns.exit();
		}
	}
	
	if(args['script']) {
		// Detect script dependencies & copy everything to target
		await ns.sleep(0.5);
		await slowPrint(ns, 'Copying files:');
		const deps = [...(await dependencyFinder(args['script'])), args['script']];
		for(let dep of deps) {
			await ns.scp(dep, args['device']);
			await downloadPrint(ns, dep);
		}

		// Run script
		ns.tprint('');
		await slowPrint(ns, `Executing with ${args['cpu']} thread${args['cpu'] > 1 ? 's' : ''}...`);
		ns.scriptKill(args['script'], args['device']);
		const pid = ns.exec(args['script'], args['device'], args['cpu'], ...args['args']
			.map(a => a == '{{TARGET}}' ? args['device'] : a));
		ns.tprint(!!pid ? 'Done!' : 'Failed to start');
		ns.tprint('');
	}
}

export function autocomplete(data) {
	return [...data.servers, ...data.scripts];
}