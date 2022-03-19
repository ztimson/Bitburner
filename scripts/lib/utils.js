/**
 * Scan the entire network for the best device to hack.
 * @param ns {NS} - BitBurner API
 * @returns {string[]} - Sorted list of targets to hack based on financial return
 */
export function bestTarget(ns) {
	const [devices, network] = scanNetwork(ns, 'home');
	return devices.map(d => ns.getServer(d)).filter(d => d.hasAdminRights).map(d => ({
		...d,
		moneyAMinute: (ns.hackAnalyze(d.hostname) * ns.getServerMaxMoney(d.hostname)) * ((60 / (ns.getHackTime(d.hostname) / 1000)) * ns.hackAnalyzeChance(d.hostname))}
	)).sort((a, b) => {
		if(a.moneyAMinute < b.moneyAMinute) return 1;
		if(a.moneyAMinute > b.moneyAMinute) return -1;
		return 0;
	});
}

/**
 * Copy a file & scan it for dependencies copying them as well.
 * @param ns {NS} - BitBurner API
 * @param src {string} - File to scan & copy
 * @param device {string} - Device to copy files to
 * @returns {string[]} - Array of coppied files
 */
export async function copyWithDependencies(ns, src, device) {
	const queue = [src], found = [src];
	while(queue.length) {
		const file = queue.splice(0, 1)[0];
		const imports = new RegExp(/from ["']\.?(\/.+)["']/g);
		const script = await ns.read(file);
		let match;
		while((match = imports.exec(script)) != null) {
			const path = `${match[1]}.js`;
			queue.push(path);
			found.push(path);
		}
	}
	await ns.scp(found, device);
	return found.reverse();
}

/**
 * Display a progress bar in the terminal which updates in real time.
 *
 * **Example:**
 *
 * `/script/test.js          [||||||||||----------]  50% (24.2 MB/s)`
 *
 * @param ns {NS} - BitBurner API
 * @param name {string} - Name to display at the begging of bar
 * @param showSpeed {boolean} - Show the speed in the progress bar
 * @param time {number} - Time it takes for bar to fill
 */
export async function progressBar(ns, name, showSpeed = true, time = Math.random() + 0.5) {
	const text = (percentage, speed) => {
		const p = percentage > 1 ? 1 : percentage < 0 ? 0 : percentage;
		const spacer = Array(30 - name.length).fill(' ').join('');
		const bar = `[${Array(Math.round(20 * p)).fill('|').join('')}${Array(Math.round(20 * (1 - p))).fill('-').join('')}]`;
		const percent = `${Math.round(p * 100)}`;
		const percentSpacer = Array(3 - percent.length).fill(' ').join('');
		return `${name}${spacer}${bar} ${percentSpacer}${percent}%${speed != null ? ` (${speed} MB/s)` : ''}`;
	}

	let speed = Math.round((20 + Math.random() * 10) * 10) / 10;
	ns.tprint(text(1, speed)); // Display the complete bar (This is the one that will be shown on redraws)
	await ns.sleep(25); // Wait for the new line to display
	const terminalOutput = eval('document').querySelectorAll('[class*="jss"].MuiTypography-body1');
	const updateLine = terminalOutput[terminalOutput.length - 1];
	const script = updateLine.innerText.split(': ')[0];
	for(let p = 0; p <= 100; p++) {
		await ns.sleep((time * 1000) / 100);
		if(p % 5 == 0) speed = Math.round((speed + (Math.random() > 0.5 ? 1 : -1) * Math.random()) * 10) / 10;
		updateLine.innerText = `${script}: ${text(p / 100, showSpeed ? p == 0 ? 0 : speed : null)}`;
	}
	return;
}

/**
 * **Impure:** Prune tree down to keys which pass function
 * @param tree {object} - Tree to search
 * @param fn {(key: string) => boolean} - Function to test each key with
 * @returns {boolean} - True if a match was found
 */
export function pruneTree(tree, fn) {
	return !!Object.keys(tree).map(k => {
		let matches = fn(k), children = Object.keys(k), childrenMatch = false;
		if(children.length) childrenMatch = pruneTree(tree[k], fn);
		if(!childrenMatch && !matches) delete tree[k];
		return childrenMatch || matches;
	}).find(el => el);
}

/**
 * Scan the network of a given device.
 * @param ns {NS} - BitBurner API
 * @param device {string} - Device network that will be scanned
 * @param maxDepth - Depth to scan to
 * @returns {[string[], Object]} - A tuple including an array of discovered devices & a tree of the network
 */
export function scanNetwork(ns, device = ns.getHostname(), maxDepth = Infinity) {
	let discovered = [device];
	function scan (device, depth = 1) {
		if(depth > maxDepth) return {};
		const localTargets = ns.scan(device).filter(newDevice => !discovered.includes(newDevice));
		discovered = [...discovered, ...localTargets];
		return localTargets.reduce((acc, device) => ({...acc, [device]: scan(device, depth + 1)}), {});
	}
	const network = scan(device);
	return [discovered.slice(1), network];
}

/**
 * Print text to the terminal & then delay for a random amount of time to emulate execution time.
 * @param ns {NS} - BitBurner API
 * @param message {string} - Text to display
 * @param min {number} - minimum amount of time to wait after printing text
 * @param max {number} - maximum amount of time to wait after printing text
 */
export async function slowPrint(ns, message, min = 0.5, max = 1.5) {
	const time = ~~(Math.random() * (max * 1000 - min * 1000)) + min * 1000;
	ns.tprint(message);
	await ns.sleep(time);
}

/**
 * Write a command to the terminal.
 * @param command {string} - Command that will be run
 * @returns {string} - Response
 */
export async function terminal(command) {
	// Get Terminal
	const cli = eval('document').querySelector("#terminal-input"); // Terminal
	const key = Object.keys(cli)[1];

	// Send command
	cli[key].onChange({ target: {value: command} });
	cli[key].onKeyDown({ keyCode: 13, preventDefault: () => {} });
}
