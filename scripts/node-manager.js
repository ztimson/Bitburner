const SAVINGS = 10E6 // Minimum bank account balance

export async function main(ns) {
	ns.disableLog('ALL');
	let limit = ns.args[0] || 8;
	limit = limit < ns.hacknet.maxNumNodes() ? limit : ns.hacknet.maxNumNodes();
	let nodeCount = ns.hacknet.numNodes();

	ns.print('===================================================');
	ns.print(`🖥️ Node Manager: ${limit > nodeCount ? limit : nodeCount} Nodes`);
	ns.print('===================================================');

    while(true) {
		const BALANCE = ns.getServerMoneyAvailable('home');

		if(nodeCount < limit && BALANCE - ns.hacknet.getPurchaseNodeCost() > SAVINGS) {
 			nodeCount++;
			ns.hacknet.purchaseNode();
			ns.print(`Buying Node ${nodeCount}`);
		} else {
			const NODES = Array(nodeCount).fill(null)
				.map((ignore, i) => ({
					index: i,
					cacheCost: ns.hacknet.getCacheUpgradeCost(i),
					coreCost: ns.hacknet.getCoreUpgradeCost(i),
					levelCost: ns.hacknet.getLevelUpgradeCost(i),
					ramCost: ns.hacknet.getRamUpgradeCost(i),
					...ns.hacknet.getNodeStats(i)
				})).map(node => {
					if(node.cacheCost != 0 && node.cacheCost != Infinity && node.cacheCost <= node.coreCost && node.cacheCost <= node.levelCost && node.cacheCost <= node.ramCost) {
						node.bestUpgrade = {
							name: 'Cache',
							cost: node.cacheCost,
							purchase: () => ns.hacknet.upgradeCache(node.index)
						};
					} else if(node.coreCost != 0 && node.coreCost != Infinity && node.coreCost <= node.cacheCost && node.coreCost <= node.levelCost && node.coreCost <= node.ramCost) {
						node.bestUpgrade = {
							name: 'Core',
							cost: node.coreCost,
							purchase: () => ns.hacknet.upgradeCore(node.index)
						};
					} else if(node.ramCost != 0 && node.ramCost != Infinity && node.ramCost <= node.cacheCost && node.ramCost <= node.levelCost && node.ramCost <= node.coreCost) {
						node.bestUpgrade = {
							name: 'RAM',
							cost: node.ramCost,
							purchase: () => ns.hacknet.upgradeRam(node.index)
						};
					} else {
						node.bestUpgrade = {
							name: 'Level',
							cost: node.levelCost,
							purchase: () => ns.hacknet.upgradeLevel(node.index)
						};
					}
					return node;
				}).sort((a, b) => {
					if(a.bestUpgrade.cost > b.bestUpgrade.cost) return 1;
					if(a.bestUpgrade.cost < b.bestUpgrade.cost) return -1;
					return 0;
				});
			
			if(BALANCE - NODES[0].bestUpgrade.cost > SAVINGS) {
				const COST = Math.round(NODES[0].bestUpgrade.cost * 100) / 100;
				ns.print(`Upgrading Node ${NODES[0].index} ${NODES[0].bestUpgrade.name}: $${COST}`);
				NODES[0].bestUpgrade.purchase();
			}
		}

		await ns.sleep(1000);
	}
}
