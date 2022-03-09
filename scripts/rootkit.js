import {ArgError, ArgParser} from './scripts/lib/arg-parser';
import {downloadPrint, slowPrint} from './scripts/lib/utils';

/**
 * Pwn a target server with availible tools. Additionally can copy & execute a script after pwning.
 * @param ns {NS} - Bitburner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('rootkit.js', 'Automatically gain root on a target machine. A file can also be uploaded & executed.', null, [
		{name: 'target', desc: 'Target machine to root, defaults to current machine', optional: true, default: ns.getHostname(), type: 'string'},
		{name: 'script', desc: 'Script to copy & execute', optional: true, type: 'string'},
        {name: 'args', desc: 'Arguments for script. Forward the current target with: {{TARGET}}', optional: true, extras: true, type: 'string'},
		{name: 'cpu', desc: 'Number of CPU threads to use with script', flags: ['-c', '--cpu'], type: 'num'},
	]);
	let args;
	try {
		args = argParser.parse(ns.args);
		if(args['script'] && !args['cpu']) args['cpu'] = ~~(ns.getServerMaxRam(args['target']) / ns.getScriptRam(args['script'], 'home')) || 1;
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
	ns.tprint(`Rooting: ${args['target']}`);
	await slowPrint(ns, '===================================================');

	try {
		// Run exploits
		await slowPrint(ns, `Attacking over SSH (${args['target']}:22)...`, 1, 2);
		ns.brutessh(args['target']);
		await slowPrint(ns, `Attacking over FTP (${args['target']}:24)...`, 1, 2);
		ns.ftpcrack(args['target']);
		await slowPrint(ns, `Attacking over SMTP (${args['target']}:25)...`, 1, 2);
		ns.relaysmtp(args['target']);
	} catch {
	} finally {
		try {
			// Attempt root
			ns.tprint('');
			ns.nuke(args['target'])
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
			await ns.scp(dep, args['target']);
			await downloadPrint(ns, dep);
		}

		// Run script
		ns.tprint('');
		await slowPrint(ns, `Executing with ${args['cpu']} thread${args['cpu'] > 1 ? 's' : ''}...`);
		ns.scriptKill(args['script'], args['target']);
		const pid = ns.exec(args['script'], args['target'], args['cpu'], ...args['args']
			.map(a => a == '{{TARGET}}' ? args['target'] : a));
		ns.tprint(!!pid ? 'Done!' : 'Failed to start');
		ns.tprint('');
	}
}

export function autocomplete(data) {
	return [...data.servers, ...data.scripts];
}
