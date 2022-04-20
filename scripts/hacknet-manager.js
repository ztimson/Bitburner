import {ArgParser} from '/scripts/lib/arg-parser';
import {Logger} from '/scripts/lib/logger';
import {toCurrency} from '/scripts/lib/utils';

/**
 * Buy, upgrade & manage Hacknet nodes automatically.
 * Strategy is to buy a new node when ever we can & then resort to the cheapest upgrade. If auto-scale is on a new
 * server will be purchased when it becomes the cheapest option.
 *
 * @params {NS} ns - BitBurner API
 */
export async function main(ns) {
	// Setup
	ns.disableLog('ALL');
	const argParser = new ArgParser('hacknet-manager.js', 'Buy, upgrade & manage Hacknet nodes automatically. Tail for live updates.', [
		{name: 'limit', desc: 'Limit the number of nodes the manager will buy, defaults to 8 or the current number of nodes', optional: true, default: 8},
		{name: 'autoLimit', desc: 'Automatically increase the node limit when there is nothing to do', flags: ['-a', '--auto-limit'], default: false},
		{name: 'balance', desc: 'Prevent spending bellow point', flags: ['-b', '--balance'], default: false},
		{name: 'sleep', desc: 'Amount of time to wait between purchases, defaults to 1 (second)', flags: ['-s', '--sleep'], default: 1}
	]);
	let nodeCount = ns.hacknet.numNodes();
	const args = argParser.parse(ns.args);
	if(nodeCount > args['limit']) args['limit'] = nodeCount;
	const logger = new Logger(ns, [() => `Hacknet Manager: ${nodeCount}/${args['limit']}`]);

	// Help
	if(args['help'] || args['_error'].length)
		return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

	// Main loop
	// noinspection InfiniteLoopJS
	while(true) {
		const balance = ns.getServerMoneyAvailable('home');
		const newNodeCost = ns.hacknet.getPurchaseNodeCost();

		// Check if we should wait to buy a node
		if(nodeCount < args['limit'] && balance - newNodeCost >= args['balance']) {
			nodeCount++;
			ns.hacknet.purchaseNode();
			logger.log(`Node ${nodeCount} - Purchased - ${toCurrency(newNodeCost)}`);
		} else {
			// Create an ordered list of nodes by their cheapest upgrade
			const upgrades = Array(nodeCount).fill(null)
				.map((ignore, i) => ({ // Gather information
					index: i,
					cacheCost: ns.hacknet.getCacheUpgradeCost(i, 1),
					coreCost: ns.hacknet.getCoreUpgradeCost(i, 1),
					levelCost: ns.hacknet.getLevelUpgradeCost(i, 1),
					ramCost: ns.hacknet.getRamUpgradeCost(i, 1),
					...ns.hacknet.getNodeStats(i)
				})).map(node => { // Figure out cheapest upgrade
					if(node.cacheCost != 0 && node.cacheCost != Infinity && node.cacheCost <= node.coreCost && node.cacheCost <= node.levelCost && node.cacheCost <= node.ramCost) {
						node.bestUpgrade = {
							name: 'cache',
							cost: node.cacheCost,
							purchase: () => ns.hacknet.upgradeCache(node.index,1 )
						};
					} else if(node.coreCost != 0 && node.coreCost != Infinity && node.coreCost <= node.cacheCost && node.coreCost <= node.levelCost && node.coreCost <= node.ramCost) {
						node.bestUpgrade = {
							name: 'cores',
							cost: node.coreCost,
							purchase: () => ns.hacknet.upgradeCore(node.index, 1)
						};
					} else if(node.ramCost != 0 && node.ramCost != Infinity && node.ramCost <= node.cacheCost && node.ramCost <= node.levelCost && node.ramCost <= node.coreCost) {
						node.bestUpgrade = {
							name: 'ram',
							cost: node.ramCost,
							purchase: () => ns.hacknet.upgradeRam(node.index, 1)
						};
					} else {
						node.bestUpgrade = {
							name: 'level',
							cost: node.levelCost,
							purchase: () => ns.hacknet.upgradeLevel(node.index, 1)
						};
					}
					return node;
				}).sort((a, b) => { // Sort by cheapest upgrade
					if(a.bestUpgrade.cost > b.bestUpgrade.cost) return 1;
					if(a.bestUpgrade.cost < b.bestUpgrade.cost) return -1;
					return 0;
				});

			// Apply the cheapest upgrade/purchase
			if((!upgrades.length || newNodeCost < upgrades[0].bestUpgrade.cost) && args['autoLimit'] && nodeCount >= args['limit']) {
				args['limit'] = Math.max(nodeCount, args['limit']) + 1;
				logger.log(`Increasing node limit to ${args['limit']}`);
			} else if(upgrades.length && upgrades[0].bestUpgrade.cost != Infinity) {
				logger.log(`Node ${upgrades[0].index} - ${upgrades[0].bestUpgrade.name} ${upgrades[0][upgrades[0].bestUpgrade.name] + 1} - ${toCurrency(upgrades[0].bestUpgrade.cost)}`);
				upgrades[0].bestUpgrade.purchase();
			}
		}

		// Wait & then check again
		await ns.sleep(args['sleep'] * 1000);
	}
}

/**
 * BitBurner autocomplete.
 *
 * @param {{servers: string[], txts: string[], scripts: string[], flags: string[]}} data - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
	return new Array(10).fill(null).map((ignore, i) => Math.pow(i, 2).toString());
}
