export class Logger {
	historyLen = 19;
	history = [];

    /**
     * Create a nicer log with a banner.
     * @param ns {NS} - BitBurner API
     * @param lineFns {Function[]} - Functions to generate a line (Seperated by a linebreak)
     */
	constructor(ns, lineFns = []) {
		this.ns = ns;
		this.fns = lineFns;
		this.historyLen -= fns.length * 2;
		this.history = Array(this.historyLen).fill('');
	}

    /**
     * Add a linebreak
     */
	lineBreak() {
		this.ns.print('===================================================');
	}

    /**
     * Print the header using the provided functions
     */
	header() {
		this.lineBreak();
		this.fns.forEach(fn => {
			this.ns.print(fn());
			this.lineBreak();
		});
	}

    /**
     * Add message to logs & output
     */
	log(message) {
		this.ns.clearLog();
		this.header();
		if(message != null) this.history.push(message);
		this.history.splice(0, this.history.length - this.historyLen);
		this.history.forEach(m => this.ns.print(m));
	}
}
