/**
 * Print a download bar to the terminal.
 * @params ns {NS} - Bitburner API
 * @params file - Filename to display with progress bar
 */
export async function downloadPrint(ns, file) {
	const speed = ~~(Math.random() * 100) / 10;
	const spacing = Array((40 - file.length) || 1).fill(' ').join('');
	await slowPrint(ns, `${file}${spacing}[==================>] 100%\t(${speed} MB/s)`);
}

/**
 * Print text to the terminal & then delay for a random amount of time to emulate execution time.
 * @params ns {NS} - Bitburner API
 * @params message {string} - Text to display
 * @params min {number} - minimum amount of time to wait after printing text
 * @params max {number} - maximum amount of time to wait after printing text
 */
export async function slowPrint(ns, message, min = 0.5, max = 1.5) {
	const time = ~~(Math.random() * (max * 1000 - min * 1000)) + min * 1000;
	ns.tprint(message);
	await ns.sleep(time);
}
