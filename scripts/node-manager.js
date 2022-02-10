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
		ns.tprint(`\n\n${!message ? '' : `${message}\n\n`}Usage: run node-manager.js [OPTION] LIMIT\n\n\tLimit - Limit the number of nodes the script will buy\n\nOptions:\n\tHelp - Displays this help message\n\tBalance - Prevent spending bellow this point\n\n`);
		ns.exit();
	}

	/**
	 * Print header with logs
	 * message - message to append to logs
	 */
	function log(message) {
		ns.clearLog();
		ns.print('===================================================');
		ns.print(`🖥️ Node Manager: ${nodeCount}/${limit} Nodes`);
		ns.print('===================================================');
		if(message != null) messageHistory.push(message);
		messageHistory.splice(0, messageHistory.length - historyLength);
		messageHistory.forEach(m => ns.print(m));
	}

	// Setup
	ns.disableLog('ALL');
	if(ns.args.length == 0) help('Missing number of nodes'); 
	if(ns.args[0] == 'help') help();
	const historyLength = 17;
	const messageHistory = Array(historyLength).fill('');
	let limit, savings, nodeCount = ns.hacknet.numNodes();

	if(ns.args.length == 1) {
		if(isNaN(ns.args[0])) help('Limit must be a number');
		limit = ns.args[0];
		savings = 0;
	} else if(ns.args.length == 2) {
		if(isNaN(ns.args[1])) help('Limit must be a number');
		limit = ns.args[1];
		if(isNaN(ns.args[0])) help('Balance must be a number');
		savings = ns.args[0];
	}

	log();
    while(true) {
		const balance = ns.getServerMoneyAvailable('home');

		// Check if we should buy a new node
		if(nodeCount < limit && balance - ns.hacknet.getPurchaseNodeCost() >= savings) {
 			nodeCount++;
			ns.hacknet.purchaseNode();
			log(`Buying Node ${nodeCount}`);
		} else {
			// Create an ordered list of nodes by their cheapest upgrade
			const nodes = Array(nodeCount).fill(null)
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
			if(nodes.length && balance - nodes[0].bestUpgrade.cost >= savings) {
				const cost = Math.round(nodes[0].bestUpgrade.cost * 100) / 100;
				log(`Upgrading Node ${nodes[0].index} ${nodes[0].bestUpgrade.name}: $${cost}`);
				nodes[0].bestUpgrade.purchase();
			}
		}

		// Check again in 1s
		await ns.sleep(1000);
	}
}
