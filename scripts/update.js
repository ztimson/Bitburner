/**
 * Automatically download all the scripts in the repository.
 */
export async function main(ns) {
    const src = 'https://gitlab.zakscode.com/ztimson/BitBurner/-/raw/develop/scripts/';
    const dist = '/scripts/';
    const fileList = [
        'auto-pwn.js',
        'bruteforce.js',
        'crawler.js',
        'miner.js',
        'node-manager.js',
        'update.js'
    ];

    // Download each file
    ns.tprint("Downloading scripts:");
    for(const file of fileList) {
        await ns.sleep(500);
        await ns.wget(`${src}${file}`, `${dist}${file}`);
        const speed = ~~((Math.random() * 200) + 100) / 10;
        ns.tprint(`${file} ${file.length <= 10 ? '\t' : ''}\t [==================>] 100% \t (${speed} MB/s)`);
    }
    ns.tprint('Done!');
}
