class ArgParser {
	/**
	 * Create a unix-like argument parser to extract flags from the argument list. Can also create help messages.
	 * @param opts - {examples: string[], arguments: {key: string, alias: string, type: string, optional: boolean, desc: string}[], desc: string}
	 */
	constructor(opts) {
		this.examples = opts.examples ?? [];
		this.arguments = opts.args ?? [];
		this.description = opts.desc;
	}

	/**
	 * Parse the list for arguments & create a dictionary.
	 * @param args {any[]} - Array of arguments
	 * @returns Dictionary of matched flags + unmatched args under 'extra'
	 */
	parse(args) {
		const req = this.arguments.filter(a => !a.optional && !a.skip);
		const queue = [...args], parsed = {}, extra = [];
		for(let i = 0; i < queue.length; i++) {
			if(queue[i][0] != '-') {
				extra.push(queue[i]);
				continue;
			}
			let value = null, parse = queue[i].slice(queue[i][1] == '-' ? 2 : 1);
			if(parse.indexOf('=')) {
				const split = parse.split('=');
				parse = split[0];
				value = split[1];
			}
			let arg = this.arguments.find(a => a.key == parse) ?? this.arguments.find(a => a.alias == parse);
			if(!arg) {
				extra.push(queue[i]);
				continue;
			}
			if(!value) {
				value = arg.type == 'bool' ? true : queue[i + 1]; 
				if(arg.type != 'bool') i++;
			}
			parsed[arg.key] = value;
		}
		req.forEach((a, i) => parsed[a.key] = extra[i]);
		extra.splice(0, req.length);
		return {...parsed, extra};
	}

	/**
	 * Create a help message of the expected paramters & usage.
	 * @param msg {String} - Optional message to display with help
	 */
	help(msg) {
		let message = '\n\n';
		message += msg ? msg : this.description;
		if(this.examples.length) message += '\n\nUsage:\t' + this.examples.join('\n\t');
		const required = this.arguments.filter(a => !a.optional);
		if(required.length) message += '\n\n\t' + required.map(a => {
			const padding = 3 - ~~(a.key.length / 8);
			return `${a.key}${Array(padding).fill('\t').join('')} ${a.desc}`;
		}).join('\n\t');
		const optional = this.arguments.filter(a => a.optional);
		if(optional.length) message += '\n\nOptions:\n\t' + optional.map(a => {
			const flgs = `${a.alias ? `-${a.alias} ` : ''}--${a.key}${a.type && a.type != 'bool' ? `=${a.type}` : ''}`;
			const padding = 3 - ~~(flgs.length / 8);
			return `${flgs}${Array(padding).fill('\t').join('')} ${a.desc}`;
		}).join('\n\t');
		return `${message}\n\n`;
	}
}

/**
 * Manages hacknet nodes, purchasing nodes to reach the desired amount.
 * Upgrades (Level, RAM, Cores & Cache) will be automatically purchased.
 */
export async function main(ns) {
	ns.disableLog('ALL');

	/**
	 * Print header with logs
	 * @param message - message to append to logs
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

	// Initilize script arguments
	const argParser = new ArgParser({
		desc: 'Buy, upgrade & manage Hacknet nodes automatically. Tail for live updates.',
		examples: [
			'run node-manager.js [OPTIONS] LIMIT',
			'run node-manager.js --balance 1E6 4',
			'run node-manager.js --help',
		],
		args: [
			{key: 'LIMIT', desc: 'Limit the number of nodes the manager will buy'},
			{key: 'balance', alias: 'b', type: 'num', optional: true, desc: 'Prevent spending bellow this point'},
			{key: 'help', alias: 'h', type: 'bool', optional: true, desc: 'Display help message'},
		]
	});
	const args = argParser.parse(ns.args);

	// Check arguments
	if(args['help']) return ns.tprint(argParser.help());
	if(!args['LIMIT']) return ns.tprint(argParser.help('Missing LIMIT'));
	if(isNaN(args['LIMIT'])) return ns.tprint(argParser.help('LIMIT must be a number'));
	if(!!args['balance'] && isNaN(args['balance'])) return ns.tprint(argParser.help('LIMIT must be a number'));
	
	// Setup
	const historyLength = 17;
	const messageHistory = Array(historyLength).fill('');
	const limit = args['LIMIT'];
	const savings = args['balance'] ?? 0
	let nodeCount = ns.hacknet.numNodes();

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
			if(nodes.length && balance - nodes[0].bestUpgrade.cost >= savings) {
				const cost = Math.round(nodes[0].bestUpgrade.cost * 100) / 100;
				log(`Node ${nodes[0].index} - ${nodes[0].bestUpgrade.name} ${nodes[0][nodes[0].bestUpgrade.name] + 1} - $${cost}`);
				nodes[0].bestUpgrade.purchase();
			}
		}

		// Check again in 1s
		await ns.sleep(1000);
	}
}
