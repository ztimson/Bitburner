export function sortByProp(prop, reverse = false) {
	return function(a, b) {
		if(a[prop] > b[prop]) return reverse ? -1 : 1;
		if(a[prop] < b[prop]) return reverse ? 1: -1;
		return 0;
	};
}

export async function main(ns) {
	ns.disableLog('ALL');
	const LIMIT = ns.args[0] || 8;
	let nodeCount = ns.hacknet.numNodes();

	ns.print('===================================================');
	ns.print(`🖥️ Node Manager: ${nodeCount}`);
	ns.print('===================================================');

    while(true) {
		let limit = LIMIT < ns.hacknet.maxNumNodes() ? LIMIT : ns.hacknet.maxNumNodes();
		while(nodeCount < limit) {
			const res = ns.hacknet.purchaseNode();
			if(res == -1) break;
			nodeCount++;
			ns.print(`Purchased Node: ${nodeCount}`);
		}

		const NODES = Array(nodeCount).fill(null)
			.map((ignore, i) => ({index: i, ...ns.hacknet.getNodeStats(i)}));
		
		NODES.sort(sortByProp('level')).forEach(n => {
			const s = ns.hacknet.upgradeLevel(n.index, 1);
			if(s) ns.print(`Purchased Level for: ${n.index}`);
		});
		NODES.sort(sortByProp('ram')).forEach(n => {
			const s = ns.hacknet.upgradeRam(n.index, 1);
			if(s) ns.print(`Purchased RAM for: ${n.index}`);
		});
		NODES.sort(sortByProp('cores')).forEach(n => {
			const s = ns.hacknet.upgradeCore(n.index, 1);
			if(s) ns.print(`Purchased CPU for: ${n.index}`);
		});

		await ns.sleep(10000);
	}
}
