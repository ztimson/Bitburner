export async function main(ns) {
	ns.disableLog('ALL');
	const TARGET = ns.args[0];
	const SECURITY = ns.getServerMinSecurityLevel(TARGET);
	let security, once = true;
	
	do {
		security = ns.getServerSecurityLevel(TARGET);
		if(once) {
			ns.print('===================================================');
			ns.print(`🔐 Bruteforcing: ${TARGET}`);
			ns.print('===================================================');
			ns.print(`Security: ${Math.round(security * 100) / 100}/${SECURITY}`);
			ns.print('===================================================');
			once = false;
		}

		ns.print(`Attacking ⚔️...`);
		const w = await ns.weaken(TARGET);
		ns.print(`Security: ${w} (${Math.round((security - w) * 100) / 100}/${SECURITY})`);
	} while (security > SECURITY);
	ns.print('Complete!');
}

export function autocomplete(data) {
	return [...data.servers];
}
