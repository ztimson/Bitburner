/**
 * Automatically download all the scripts in the repository.
 */
export async function main(ns) {
    ns.disableLog('ALL');
    
    async function download(file) {
        await ns.wget(`${src}${file}`, `${dest}${file}`);
        const speed = ~~((Math.random() * 200) + 100) / 10;
        ns.tprint(`${file} ${file.length <= 10 ? '\t' : ''}\t [==================>] 100% \t (${speed} MB/s)`);
    }

    // Setup
    const src = 'https://gitlab.zakscode.com/ztimson/BitBurner/-/raw/develop/scripts/';
    const dest = '/scripts/';
    const fileList = [
        'lib/arg-parser.js',
        'auto-pwn.js',
        'bruteforce.js',
        'crawler.js',
        'miner.js',
        'node-manager.js'
    ];

    // Update self & restart
    if(!ns.args.length) {
        ns.tprint("Updating self:");
        await ns.sleep(1000);
        await download('update.js');
        await ns.sleep(500);
        ns.tprint('');
        ns.tprint("Restarting...");
        await ns.sleep(2000);
        return ns.run(`${dest}update.js`, 1, 1);
    }

    // Download each file
    ns.tprint("Downloading scripts:");
    ns.tprint('');
    for(const file of fileList) {
        await ns.sleep(500);
        await download(file);
    }
    ns.tprint('');
    ns.tprint('✅ Done!');
    ns.tprint('');
}
