/**
 * Add CSS to DOM.
 *
 * @param {string} id - An ID so we can make sure we only inject it once
 * @param {string} css - CSS to inject
 */
export function addCSS(id, css) {
	const doc = eval('document');
	id = `dynamic-css-${id}`;
	const exists = doc.querySelector(`#${id}`);
	if(exists) exists.outerHTML = '';
	doc.head.insertAdjacentHTML('beforeend', `<style id="${id}">${css}</style`);
}

/**
 * Calculate the maximum number of threads a script can be executed with the remaining available RAM on a server.
 *
 * @param {NS} ns - BitBurner API
 * @param {string} script - Full path to script
 * @param {string} server - Server script will run on
 * @returns {number} - Number of threads the server will be able to support
 */
export function availableThreads(ns, script, server = ns.getHostname()) {
	return ~~((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / ns.getScriptRam(script, ns.getHostname()));
}

/**
 * Format number to look like a dollar value ($1,000.00).
 *
 * @param {number} num - Number to format
 * @returns {string} - formatted value with dollar sign
 */
export function toCurrency(num) {
	return Number(num).toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
	});
}

/**
 * Injects HTML into the terminal as a new line.
 *
 * **Disclaimer:** React will wipe out anything injected by this function.
 *
 * @param {string} html - HTML to inject into terminal
 * @param {boolean} wrap - Wrap in a list-item & paragraph to match default style
 */
export function htmlPrint(html, wrap = true) {
	setTimeout(() => {
		const doc = eval('document');
		if(wrap) {
			const liClass = doc.querySelector('#terminal li').classList.value;
			const pClass = doc.querySelector('#terminal li p').classList.value;
			html = `<li class="${liClass}"><p class="${pClass}">${html}</p></li>`
		}
		eval('document').getElementById('terminal').insertAdjacentHTML('beforeend', html)
	}, 25);
}

/**
 * Calculate the maximum number of threads a script can be executed with using all server resources.
 *
 * @param {NS} ns - BitBurner API
 * @param {string} script - Full path to script
 * @param {string} server - Server script will run on
 * @returns {number} - Number of threads the server will be able to support
 */
export function maxThreads(ns, script, server = ns.getHostname()) {
	return ~~(ns.getServerMaxRam(server) / ns.getScriptRam(script, ns.getHostname()));
}

/**
 * Display a progress bar in the terminal which updates in real time.
 *
 * **Example:**
 *
 * `/script/test.js          [||||||||||----------]  50% (24.2 MB/s)`
 *
 * @param {NS} ns - BitBurner API
 * @param {string} name - Name to display at the begging of bar
 * @param {boolean} showSpeed - Show the speed in the progress bar
 * @param {number} time - Time it takes for bar to fill
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
	const terminalOutput = eval('document').querySelectorAll('#terminal li p');
	const updateLine = terminalOutput[terminalOutput.length - 1];
	if(!updateLine) return await ns.sleep(time * 1000);
	const script = updateLine.innerText.split(': ')[0];
	for(let p = 0; p <= 100; p++) {
		await ns.sleep((time * 1000) / 100);
		if(p % 5 == 0) speed = Math.round((speed + (Math.random() > 0.5 ? 1 : -1) * Math.random()) * 10) / 10;
		updateLine.innerText = `${script}: ${text(p / 100, showSpeed ? p == 0 ? 0 : speed : null)}`;
	}
}

/**
 * **Impure:** Prune tree down to keys which pass function
 *
 * @param {Object} tree - Tree to search
 * @param {(key: string) => boolean} fn - Function to test each key with
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
 * Pause for a random amount of time.
 * @param {number} min - minimum amount of time to wait after printing text
 * @param {number} max - maximum amount of time to wait after printing text
 */
export function randomSleep(min = 0.5, max = 1.5) {
	return new Promise(res => setTimeout(res, ~~(Math.random() * (max * 1000 - min * 1000)) + min * 1000));
}

/**
 * Converts function into HTML friendly string with it's arguments. Meant to be used
 * with `onclick` to execute code.
 *
 * @param {Function} fn - function that will be serialized
 * @param {...any} args - Arguments passed to function
 * @returns {string} - Serialized function with arguments: "(function(arg1, arg2, ...) {...})(arg1, arg2, ...)"
 */
export function serializeFunction(fn, ...args) {
	let serialized = fn.toString().replace(/function .+\W?\(/, 'function(');
	serialized = `(${serialized})(${args.map(a => JSON.stringify(a)).join()})`;
	serialized = serialized.replace(/"/g, '&quot;');
	serialized = serialized.replace(/'/g, '&#39;');
	return serialized;
}

/**
 * Print text to the terminal & then delay for a random amount of time to emulate execution time.
 *
 * @param {NS} ns - BitBurner API
 * @param {string} message - Text to display
 * @param {boolean} first - Pause first or wait until text is displayed
 * @param {number} min - minimum amount of time to wait after printing text
 * @param {number} max - maximum amount of time to wait after printing text
 */
export async function slowPrint(ns, message, first = false, min = 0.5, max = 0.5) {
	if(first) await randomSleep(min, max);
	ns.tprint(message);
	await randomSleep(min, max);
}

/**
 * Write a command to the terminal.
 *
 * @param {string} command - Command that will be run
 * @returns {Promise<string[]>} - Any new output
 */
export function terminal(command) {
	// Get the terminal
	const doc = eval('document');
	const terminalInput = doc.getElementById("terminal-input");
	const handler = Object.keys(terminalInput)[1];

	// Send command
	terminalInput.value = command; // Enter the command
	terminalInput[handler].onChange({target: terminalInput}); // React on change
	terminalInput[handler].onKeyDown({key: 'Enter', preventDefault: () => null}); // Enter 'keystroke'

	// Return any new terminal output
	return new Promise(res => setTimeout(() => {
		const terminalOutput = Array.from(doc.querySelectorAll('#terminal li p')).map(out => out.innerText);
		const i = terminalOutput.length - terminalOutput.reverse().findIndex(o => o.indexOf(command) != -1);
		res(terminalOutput.reverse().slice(i));
	}, 25));
}
