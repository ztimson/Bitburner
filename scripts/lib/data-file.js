export class DataFile {
    /**
     * Read & write data to a JSON file.
     *
     * @param {NS} ns - Bitburner API
     * @param path - Path to config file
     */
    constructor(ns, path) {
        this.ns = ns;
        this.path = path;
    }

    /**
     * Load data file
     *
     * @returns {Promise<any>} - Saved data
     */
    async load() {
        return JSON.parse(await this.ns.read(this.path) || 'null');
    }

    /**
     * Save data to file
     *
     * @param values - Data to save
     * @returns {Promise<void>} - Save complete
     */
    async save(values) {
        await this.ns.write(this.path, JSON.stringify(values), 'w');
    }
}
