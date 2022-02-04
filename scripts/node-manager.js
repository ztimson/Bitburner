/**
 * Manages hacknet nodes, purchasing nodes to reach the desired amount.
 * Upgrades (Level, RAM, Cores & Cache) will be automatically purchased.
 */
export async function main(ns) {
	/**
	 * How to use this script
	 * message - optional message to add
	 */
	function help(message) {
		ns.tprint(`\n\n${!message ? '' : `${message}\n\n`}Usage:\nrun node-manager.js <num> [savings]\n\n\tnum - Target number of nodes\n\tsavings - Prevent spending bellow this point\n\n`);
		ns.exit();
	}

	/**
	 * Print header with logs
	 * message - message to append to logs
	 */
	function log(message) {
		ns.clearLog();
		ns.print('===================================================');
		ns.print(`🖥️ Node Manager: ${nodeCount}/${LIMIT} Nodes`);
		ns.print('===================================================');
		if(message != null) MESSAGE_HISTORY.push(message);
		MESSAGE_HISTORY.splice(0, MESSAGE_HISTORY.length - HISTORY_LENGTH);
		MESSAGE_HISTORY.forEach(m => ns.print(m));
	}

	// Setup
	ns.disableLog('ALL');
	if(ns.args[0] == 'help') help();
	if(ns.args[0] == null) help('Missing number of nodes');
	if(isNaN(ns.args[0])) help('First argument must be a number');
	const HISTORY_LENGTH = 17;
	const MESSAGE_HISTORY = Array(HISTORY_LENGTH).fill('');
	const LIMIT = ns.args[0] < ns.hacknet.maxNumNodes() ? ns.args[0] : ns.hacknet.maxNumNodes();
	const SAVINGS = ns.args[1] ?? 0;
	let nodeCount = ns.hacknet.numNodes();

	log();
    while(true) {
		const BALANCE = ns.getServerMoneyAvailable('home');

		// Check if we should buy a new node
		if(nodeCount < LIMIT && BALANCE - ns.hacknet.getPurchaseNodeCost() > SAVINGS) {
 			nodeCount++;
			ns.hacknet.purchaseNode();
			log(`Buying Node ${nodeCount}`);
		} else {
			// Create an ordered list of nodes by their cheapest upgrade
			const NODES = Array(nodeCount).fill(null)
				.map((ignore, i) => ({ // Gather information
					index: i,
					cacheCost: ns.hacknet.getCacheUpgradeCost(i),
					coreCost: ns.hacknet.getCoreUpgradeCost(i),
					levelCost: ns.hacknet.getLevelUpgradeCost(i),
					ramCost: ns.hacknet.getRamUpgradeCost(i),
					...ns.hacknet.getNodeStats(i)
				})).map(node => { // Figure out cheapest upgrade
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
				}).sort((a, b) => { // Sort by cheapest upgrade
					if(a.bestUpgrade.cost > b.bestUpgrade.cost) return 1;
					if(a.bestUpgrade.cost < b.bestUpgrade.cost) return -1;
					return 0;
				});
			
			// Apply the cheapest upgrade
			if(BALANCE - NODES[0].bestUpgrade.cost > SAVINGS) {
				const COST = Math.round(NODES[0].bestUpgrade.cost * 100) / 100;
				log(`Upgrading Node ${NODES[0].index} ${NODES[0].bestUpgrade.name}: $${COST}`);
				NODES[0].bestUpgrade.purchase();
			}
		}

		// Check again in 1s
		await ns.sleep(1000);
	}
}
