export class Logger {
	historyLen = 19;
	history = [];

	/**
	 * Create a nicer log with a banner.
	 *
	 * @param {NS} ns - BitBurner API
	 * @param {Function[]} lineFns - Functions to generate a line (Seperated by a linebreak)
	 */
	constructor(ns, lineFns = []) {
		this.ns = ns;
		this.fns = lineFns;
		this.historyLen -= lineFns.length * 2;
		this.history = Array(this.historyLen).fill('');
		this.log();
	}

	/**
	 * Add red error message to logs.
	 *
	 * @param {string} message - Text that will be added
	 */
	error(message) { this.log(`ERROR: ${message}`); }

	/**
	 * Add a linebreak
	 */
	lineBreak() {
		this.ns.print('===================================================');
	}

	/**
	 * Print the header using the provided functions.
	 */
	header() {
		this.lineBreak();
		this.fns.forEach(fn => {
			this.ns.print(fn());
			this.lineBreak();
		});
	}

	/**
	 * Add message to the logs.
	 *
	 * @param {string} message - Text that will be added
	 */
	log(message = '') {
		this.ns.clearLog();
		this.header();
		if(message) this.history.push(message);
		this.history.splice(0, this.history.length - this.historyLen);
		this.history.forEach(m => this.ns.print(m));
	}

	/**
	 * Add orange warning to the logs.
	 *
	 * @param {string} message - Text that will be added
	 */
	warn(message) { this.log(`WARN: ${message}`); }
}
