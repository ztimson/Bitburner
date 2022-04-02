import {ArgError, ArgParser} from '/scripts/lib/arg-parser';
import {Logger} from '/scripts/lib/logger';

/**
 * Buy, upgrade & manage Hacknet nodes automatically.
 * @params ns {NS} - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('hacknet-manager.js', 'Buy, upgrade & manage Hacknet nodes automatically. Tail for live updates.', null, [
		{name: 'limit', desc: 'Limit the number of nodes the manager will buy, defaults to 8', optional: true, default: 8, type: 'num'},
		{name: 'autoLimit', desc: 'Automatically increase the node limit when there is nothing to do', flags: ['-a', '--auto-limit'], type: 'bool'},
		{name: 'balance', desc: 'Prevent spending bellow point', flags: ['-b', '--balance'], type: 'num'},
		{name: 'sleep', desc: 'Amount of time to wait between purchases, defaults to 1 (second)', flags: ['-s', '--sleep'], default: 1, type: 'num'}
	]);

	try {
		// Run
		const args = argParser.parse(ns.args);
		let nodeCount = ns.hacknet.numNodes();
		const logger = new Logger(ns, [() => `Hacknet Manager: ${nodeCount}/${args['limit']}`]);
		while(true) {
			const balance = ns.getServerMoneyAvailable('home');

			// Check if we should buy a new node
			if(nodeCount < args['limit'] && balance - ns.hacknet.getPurchaseNodeCost() >= args['balance']) {
				nodeCount++;
				ns.hacknet.purchaseNode();
				logger.log(`Buying Node ${nodeCount}`);
			} else {
				// Create an ordered list of nodes by their cheapest upgrade
				const upgrades = Array(nodeCount).fill(null)
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
								name: 'cache',
								cost: node.cacheCost,
								purchase: () => ns.hacknet.upgradeCache(node.index)
							};
						} else if(node.coreCost != 0 && node.coreCost != Infinity && node.coreCost <= node.cacheCost && node.coreCost <= node.levelCost && node.coreCost <= node.ramCost) {
							node.bestUpgrade = {
								name: 'cores',
								cost: node.coreCost,
								purchase: () => ns.hacknet.upgradeCore(node.index)
							};
						} else if(node.ramCost != 0 && node.ramCost != Infinity && node.ramCost <= node.cacheCost && node.ramCost <= node.levelCost && node.ramCost <= node.coreCost) {
							node.bestUpgrade = {
								name: 'ram',
								cost: node.ramCost,
								purchase: () => ns.hacknet.upgradeRam(node.index)
							};
						} else {
							node.bestUpgrade = {
								name: 'level',
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
				if(upgrades.length) {
					if(args['autoLimit'] && nodeCount >= args['limit'] && upgrades[0].bestUpgrade.cost == Infinity) {
						args['limit'] = Math.max(nodeCount, args['limit']) + 1;
						logger.log(`Increasing node limit to ${args['limit']}`);
					} else if(balance - upgrades[0].bestUpgrade.cost >= args['balance']) {
						const cost = Math.round(upgrades[0].bestUpgrade.cost * 100) / 100;
						logger.log(`Node ${upgrades[0].index} - ${upgrades[0].bestUpgrade.name} ${upgrades[0][upgrades[0].bestUpgrade.name] + 1} - $${cost}`);
						upgrades[0].bestUpgrade.purchase();
					}
				}
			}

			// Check again in 1s
			await ns.sleep(args['sleep'] * 1000);
		}
	} catch(err) {
		if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
		throw err;
	}
}
