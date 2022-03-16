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
	return found;
}

/**
 * Print a download bar to the terminal.
 * @param ns {NS} - BitBurner API
 * @param file - Filename to display with progress bar
 */
export async function downloadPrint(ns, file) {
	const speed = ~~(Math.random() * 100) / 10;
	const spacing = Array((40 - file.length) || 1).fill(' ').join('');
	await slowPrint(ns, `${file}${spacing}[==================>] 100%\t(${speed} MB/s)`);
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
