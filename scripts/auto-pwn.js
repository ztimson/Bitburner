export async function main(ns) {
	/**
	 * Prints text and waits a random amount of time to emulate
	 * work being complete.
	 */
	async function printWithDelay(text, min=1, max=1) {
		ns.tprint(text);
		await ns.sleep(~~(Math.random() * (max * 1000 - min * 1000)) + min * 1000);
	}

	function usage(message) {
		ns.tprint(`${!message ? '' : `${message}\n\n`}Usage:\nrun hack.js <target> <script1> [...scripts]\n\n\ttarget - Hostname or Address to attack\n\tscript1 - Path to script to run\n\tscripts - Additional scripts to run`);
	}

	// Setup
	ns.disableLog('ALL');
	if (ns.args[0] == null) return usage('Missing target address');
	if (ns.args.length < 2) return usage('Provide scritp(s) for remote execution');
	const TARGET = ns.args[0];
	const SCRIPTS = ns.args.slice(1);

	// Banner
	ns.tprint('===================================================');
	ns.tprint(`🧑‍💻 Hacking: ${TARGET}`);
	await printWithDelay('===================================================');

	// Gain root
	// await printWithDelay(`Attacking (SSH) ⚔️ ${TARGET}:22`, 3, 5);
	// ns.brutessh(TARGET);
	// await printWithDelay(`Attacking (FTP) ⚔️ ${TARGET}:24`, 3, 5);
	// ns.ftpcrack(TARGET);
	ns.nuke(TARGET);
	await printWithDelay(`💀 Root Granted 💀`);

	// Copy scripts
	ns.tprint('');
	await printWithDelay('Copying scripts:');
	await Promise.all(SCRIPTS.map(async s => {
		const SPEED = ~~(Math.random() * 100) / 10
		await printWithDelay(`${s} \t [==================>] 100% \t (${SPEED} MB/s)`);
		await ns.scp(s, TARGET);
	}));

	// Run scripts
	ns.tprint('');
	const THREADS = Math.floor(ns.getServerMaxRam(TARGET) / 2.3);
	await Promise.all(SCRIPTS.map(async s => {
		ns.scriptKill(s, TARGET);
		await printWithDelay(`ssh -c "run ${s} -t ${THREADS}" root@${TARGET}`);
		const PID = ns.exec(s, TARGET, THREADS, TARGET);
		if(!PID) ns.tprint('⚠️ Failed to start ⚠️');
	}));
	ns.tprint('✅ Complete!');
}

export function autocomplete(data) {
	return [...data.servers, ...data.scripts];
}
