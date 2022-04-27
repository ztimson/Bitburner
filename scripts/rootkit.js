import {ArgParser} from '/scripts/lib/arg-parser';
import {maxThreads, progressBar, slowPrint} from '/scripts/lib/utils';
import {copyWithDependencies} from '/scripts/copy';

/**
 * Check if exploit is available for use.
 *
 * @param {NS} ns - BitBurner API
 * @returns {string[]} - Available exploits
 */
export function availableExploits(ns) {
	return ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe']
		.filter(e => ns.fileExists(e));
}

/**
 * Attempt to root a server.
 *
 * @param {NS} ns - BitBurner API
 * @param {string} server - Server to attempt to root
 * @returns {[boolean, string[]]} - Tuple of whether the server was successfully rooted & the exploits which where ran
 */
export function root(ns, server) {
	function runExploit(name) {
		if(name == 'BruteSSH.exe') ns.brutessh(server);
		else if(name == 'FTPCrack.exe') ns.ftpcrack(server);
		else if(name == 'relaySMTP.exe') ns.relaysmtp(server);
		else if(name == 'HTTPWorm.exe') ns.httpworm(server);
		else if(name == 'SQLInject.exe') ns.sqlinject(server);
	}

	const exploits = availableExploits(ns);
	exploits.forEach(e => runExploit(e));
	try {
		ns.nuke(server)
		return [true, exploits];
	} catch {
		return [false, exploits];
	}
}

/**
 * Automatically gain root access to a server. A file can also be uploaded & executed.
 *
 * @param {NS} ns - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('rootkit.js', 'Automatically gain root access to a server. A file can also be uploaded & executed.', [
		{name: 'server', desc: 'Server to root, defaults to local server', optional: true, default: ns.getHostname()},
		{name: 'script', desc: 'Script to copy & execute', optional: true},
		{name: 'args', desc: 'Arguments for script. Forward the discovered server with: {{SERVER}}', optional: true, extras: true},
		{name: 'cpu', desc: 'Number of CPU threads to start script with, will use maximum if not specified', flags: ['-c', '--cpu'], default: false},
		{name: 'quite', desc: 'Suppress program output', flags: ['-q', '--quite'], default: false},
	]);
	const args = argParser.parse(ns.args);
	if(args['script'] && !args['cpu']) args['cpu'] =
		~~(ns.getServerMaxRam(args['server']) / ns.getScriptRam(args['script'], 'home')) || 1;

	// Help
	if(args['help'] || args['_error'].length)
		return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

	// Banner
	if(!args['quite']) {
		ns.tprint('===================================================');
		ns.tprint(`Rooting: ${args['server']}`);
		ns.tprint('===================================================');
	}

	// Root server if access is restricted
	if(!ns.hasRootAccess(args['server'])) {
		const [rooted, exploits] = root(ns, args['server']);
		if(exploits.length >= 1) await slowPrint(ns, 'Exploiting SSH (*:22)...');
		if(exploits.length >= 2) await slowPrint(ns, 'Exploiting FTP (*:24)...');
		if(exploits.length >= 3) await slowPrint(ns, 'Exploiting SMTP (*:25)...');
		if(exploits.length >= 4) await slowPrint(ns, 'Exploiting HTTP (*:80)...');
		if(exploits.length >= 5) await slowPrint(ns, 'Exploiting MSQL (*:3306)...');
		ns.tprint(`Root: ${rooted ? 'Success!' : 'Failed'}`);
		if(!rooted) ns.exit();
	} else {
		ns.tprint(`Root: Skipped`);
	}
	ns.tprint('');

	// Start script if required
	if(args['script']) {
		const threads = args['cpu'] || maxThreads(ns, args['script'], args['server']);
		if(!threads) {
			ns.tprint(`Server does not have enough RAM to start script.`);
			ns.exit();
		}
		// Copy script & it's dependencies
		const files = await copyWithDependencies(ns, args['script'], args['server']);
		if(!args['quite']) {
			await ns.sleep(500);
			ns.tprint('Copying files:');
			for(let file of files) await progressBar(ns, file);
		}

		// Start the script
		if(!args['quite']) {
			ns.tprint('');
			ns.tprint(`Executing with ${threads} thread${threads > 1 ? 's' : ''}...`);
			await ns.sleep(500);
		}
		ns.killall(args['server']);
		const pid = ns.exec(args['script'], args['server'], threads, ...args['args']);
		if(!args['quite']) {
			ns.tprint(!!pid ? 'Done!' : 'Failed to start');
			ns.tprint('');
		}
	}
}

/**
 * BitBurner autocomplete.
 *
 * @param {{servers: string[], txts: string[], scripts: string[], flags: string[]}} data - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
	return [...data.servers, ...data.scripts];
}
