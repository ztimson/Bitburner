export async function main(ns) {
    const FILE_LIST = [
        'scripts/auto-pwn.js',
        'scripts/bruteforce.js',
        'scripts/crawler.js',
        'scripts/miner.js',
        'scripts/node-manager.js',
        'scripts/update.js'
    ];

    function getUrl(file) {
        return `https://gitlab.zakscode.com/ztimson/BitBurner/-/raw/develop/${file}`;
    }

    for(const FILE of FILE_LIST) {
        await ns.wget(getUrl(FILE), FILE);
    }
}
