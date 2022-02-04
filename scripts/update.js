/**
 * Automatically download all the scripts in the repository.
 */
export async function main(ns) {
    const SRC = 'https://gitlab.zakscode.com/ztimson/BitBurner/-/raw/develop/scripts/';
    const DIST = '/scripts/';
    const FILE_LIST = [
        'auto-pwn.js',
        'bruteforce.js',
        'crawler.js',
        'miner.js',
        'node-manager.js',
        'update.js'
    ];

    // Download each file
    for(const FILE of FILE_LIST) {
        ns.tprint(`Downloading: ${FILE}...`);
        await ns.wget(`${SRC}${FILE}`, `${DIST}${FILE}`);
        ns.tprint('Complete!');
    }
    ns.tprint('Done!');
}
