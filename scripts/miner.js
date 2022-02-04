export async function main(ns) {
	ns.disableLog('ALL');
	const TARGET = ns.args[0];
	const SECURITY = ns.getServerMinSecurityLevel(TARGET) + 2;
	let BALANCE, once = true;

	while(true) {
		let s = await ns.getServerSecurityLevel(TARGET);
		let b = await ns.getServerMoneyAvailable(TARGET);
		if(BALANCE == null) BALANCE = b;

		if(once) {
			ns.print('===================================================');
			ns.print(`Bankrupting: ${TARGET}`);
			ns.print('===================================================');
			ns.print(`Security: ${Math.round(s * 100) / 100}/${SECURITY}`);
			ns.print(`Balance: $${Math.round(BALANCE * 100) / 100}`);
			ns.print('===================================================');
			once = false;
		}

		if(s > SECURITY) {
			ns.print('Attacking Security...');
			const w = await ns.weaken(TARGET);
			ns.print(`Security: -${w} (${Math.round((s - w) * 100) / 100}/${SECURITY})`);
		} else if(b < BALANCE) {
			ns.print('Spoofing Balance...');
			const g = await ns.grow(TARGET);
			ns.print(`Balance: +${Math.round(g * 10) / 10}% ($${Math.round(b * g * 100) / 100})`);
		} else {
			ns.print('Hacking Account...');
			const h = await ns.hack(TARGET);
			ns.print(`Balance: -$${h} ($${Math.round((b - h) * 100) / 100})`);
		}
	}
}

export function autocomplete(data) {
	return [...data.servers];
}
