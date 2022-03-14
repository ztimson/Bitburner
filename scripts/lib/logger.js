export class Logger {
	historyLen = 17;
	history = [];

    /**
     * Create a nicer log with a banner.
     * @param ns {NS} - BitBurner API
     * @param titleFn {Function} - Function to generate title
     * @param extraFns {Function[]} - Extra info to put in the header
     */
	constructor(ns, titleFn, extraFns = []) {
		this.ns = ns;
		this.title = titleFn;
		this.extra = extraFns;
		this.historyLen -= extraFns.length * 2;
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
		this.ns.print(this.title());
		this.lineBreak();
		this.extra.forEach(extra => {
			this.ns.print(extra());
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
