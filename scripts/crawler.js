export async function main(ns) {
    function usage(message) {
        ns.tprint(`${!message ? '' : `${message}\n\n`}Usage:\nrun hack-all.js [...scripts]\n\n\tdepth - Follows network recersively\n\tscript1 - Path to script to run\n\tscripts - Additional scripts to run`);
    }

    ns.disableLog('ALL');
    if(ns.args[0] == null) return usage('Missing depth');
    if(ns.args.length < 2) return usage('Missing script(s)');

    let targets = ns.scan().map(h => [h, 1]);
    for(let i = 0; i < targets.length; i++) {
        if(targets[i][1] < ns.args[0]) ns.scan(targets[i][0]).forEach(h => {
            if(h != 'home') targets.push([h, targets[i][1] + 1])
        });
        if(ns.getServerRequiredHackingLevel(targets[i][0]) > ns.getHackingLevel()) continue;
        if(ns.getServerNumPortsRequired(targets[i][0]) > 0) continue;
        ns.run('hack.js', 1, targets[i][0], ...ns.args.slice(1));
        do { await ns.sleep(1000); }
        while(ns.scriptRunning('hack.js', 'home'));
    }
}
