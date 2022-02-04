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
        const SPEED = ~~(Math.random() * 100) / 10;
        await ns.wget(`${SRC}${FILE}`, `${DIST}${FILE}`);
        ns.tprint(`${FILE} \t [==================>] 100% \t (${SPEED} MB/s)`);
        await ns.sleep(500);
    }
    ns.tprint('Done!');
}
