import {ArgError, ArgParser} from '/scripts/lib/arg-parser';
import {copyWithDependencies, progressBar, slowPrint} from '/scripts/lib/utils';

/**
 * BitBurner autocomplete
 * @param data {server: string[], txts: string[], scripts: string[], flags: string[]} - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
	return [...data.servers, ...data.scripts];
}

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
		{name: 'silent', desc: 'Surpress program output', flags: ['-s', '--silent'], type: 'bool'}
	], true);

	try {
		const args = argParser.parse(ns.args);
		if(args['script'] && !args['cpu']) args['cpu'] = ~~(ns.getServerMaxRam(args['device']) / ns.getScriptRam(args['script'], 'home')) || 1;

		// Banner
		if(!args['silent']) {
			ns.tprint('===================================================');
			ns.tprint(`Rooting: ${args['device']}`);
			ns.tprint('===================================================');
		}

		let spacer = false;
		const sleep = 750;
		try {
			// Run exploits
			ns.brutessh(args['device']);
			if(!args['silent']) {
				await slowPrint(ns, `Attacking over SSH (${args['device']}:22)...`, 0.5, 1.5);
				await ns.sleep(sleep);
				spacer = true;
			}
			ns.ftpcrack(args['device']);
			if(!args['silent']) {
				await slowPrint(ns, `Attacking over FTP (${args['device']}:24)...`, 0.5, 1.5);
				await ns.sleep(sleep);
			}
			ns.relaysmtp(args['device']);
			if(!args['silent']) {
				await slowPrint(ns, `Attacking over SMTP (${args['device']}:25)...`, 0.5, 1.5);
				await ns.sleep(sleep);
			}
		} catch {
		} finally {
			try {
				// Attempt root
				if(spacer) ns.tprint('');
				ns.nuke(args['device'])
				if(!args['silent']) {
					ns.tprint(`Root: Success!`);
					ns.tprint('');
				}
			} catch {
				if(!args['silent']) {
					ns.tprint(`Root: Failed`);
					ns.tprint('');
				}
				ns.exit();
			}
		}

		if(args['script']) {
			// Detect script dependencies & copy everything to target
			const files = await copyWithDependencies(ns, args['script'], args['device']);
			if(!args['silent']) {
				await ns.sleep(500);
				ns.tprint('Copying files:');
				for(let file of files) await progressBar(ns, file);
			}

			// Run script
			if(!args['silent']) {
				ns.tprint('');
				ns.tprint(`Executing with ${args['cpu']} thread${args['cpu'] > 1 ? 's' : ''}...`);
				await ns.sleep(500);
			}
			ns.scriptKill(args['script'], args['device']);
			const pid = ns.exec(args['script'], args['device'], args['cpu'], ...args['args']
				.map(a => a == '{{TARGET}}' ? args['device'] : a));
			if(!args['silent']) {
				ns.tprint(!!pid ? 'Done!' : 'Failed to start');
				ns.tprint('');
			}
		}
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}
}
