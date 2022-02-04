const SAVINGS = 10E6 // Minimum bank account balance

export async function main(ns) {
	function help(message) {
		ns.tprint(`\n\n${!message ? '' : `${message}\n\n`}Usage:\nrun node-manager.js <num>\n\n\tnum - Target number of nodes\n\n`);
		ns.exit();
	}

	function log(message) {
		ns.clearLog();
		ns.print('===================================================');
		ns.print(`🖥️ Node Manager: ${nodeCount}/${LIMIT} Nodes`);
		ns.print('===================================================');
		if(message != null) MESSAGE_HISTORY.push(message);
		MESSAGE_HISTORY.splice(0, MESSAGE_HISTORY.length - HISTORY_LENGTH);
		MESSAGE_HISTORY.map(m => m).reverse().forEach(m => ns.print(m));
		for(let i = MESSAGE_HISTORY.length; i < HISTORY_LENGTH; i++) ns.print('');
	}

	ns.disableLog('ALL');
	if(ns.args[0] == 'help') help();
	if(ns.args[0] == null) help('Missing number of nodes');
	if(isNaN(ns.args[0])) help('First argument must be a number');
	
	const HISTORY_LENGTH = 17;
	const MESSAGE_HISTORY = [];
	const LIMIT = ns.args[0] < ns.hacknet.maxNumNodes() ? ns.args[0] : ns.hacknet.maxNumNodes();
	let nodeCount = ns.hacknet.numNodes();

	log();
    while(true) {
		const BALANCE = ns.getServerMoneyAvailable('home');

		if(nodeCount < LIMIT && BALANCE - ns.hacknet.getPurchaseNodeCost() > SAVINGS) {
 			nodeCount++;
			ns.hacknet.purchaseNode();
			log(`Buying Node ${nodeCount}`);
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
				log(`Upgrading Node ${NODES[0].index} ${NODES[0].bestUpgrade.name}: $${COST}`);
				NODES[0].bestUpgrade.purchase();
			}
		}

		await ns.sleep(1000);
	}
}
