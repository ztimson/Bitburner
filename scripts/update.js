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
    ns.tprint("Downloading scripts:");
    for(const FILE of FILE_LIST) {
        await ns.sleep(500);
        await ns.wget(`${SRC}${FILE}`, `${DIST}${FILE}`);
        const SPEED = ~~((Math.random() * 200) + 100) / 10;
        ns.tprint(`${FILE} ${FILE.length <= 10 ? '\t' : ''}\t [==================>] 100% \t (${SPEED} MB/s)`);
    }
    ns.tprint('Done!');
}
