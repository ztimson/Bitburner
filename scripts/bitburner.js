/**
 * Automatically complete the current BitNode.
 *
 * @param {NS} ns - BitBurner API
 */
export function main(ns) {
    let modules = [
        'auto-root',
        'auto-hack',
        'botnet-manager',
        'hacknet-manager',
        'server-manager'
    ];

    // Banner
    ns.run('/scripts/banner.js', 1, '-r');
    ns.tprint(`Starting BitBurner with ${modules.length} enabled: `);
    ns.tprint(modules.join(', '));

    // botnet-manager

    // hacknet-manager
    ns.run('/scripts/hacknet-manager', 1, '-a');

    // server-manager
    ns.run('/scripts/server-manager', 1, '');

    while(true) {
        // auto-hack


        ns.sleep(1000);
    }
}
