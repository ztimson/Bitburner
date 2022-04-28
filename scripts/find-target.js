import {ArgParser} from '/scripts/lib/arg-parser';
import {toCurrency} from '/scripts/lib/utils';
import {scanNetwork} from '/scripts/crawler';

/**
 * Sort array of servers based on the potential return/yield.
 *
 * @param {NS} ns - BitBurner API
 * @param {string[]} servers - List of servers to sort based on yield
 * @returns {[string, number][]} - Sorted list of servers & their potential yield per minute
 */
export function bestTarget(ns, servers) {
    return servers.map(s => [s, serverYield(ns, s)]).sort((a, b) => {
        if(a[1] < b[1]) return 1;
        if(a[1] > b[1]) return -1;
        return 0;
    });
}

/**
 * Calculate the average return per minute when hacking a server.
 *
 * **Disclaimer:** Does not take into account security or weaken time.
 *
 * @param {NS} ns - BitBurner API
 * @param {string} server - Server to calculate yield for
 * @returns {number} - $/minute
 */
export function serverYield(ns, server) {
    return (ns.hackAnalyze(server) * ns.getServerMaxMoney(server))
        * ((60 / (ns.getHackTime(server) / 1000)) * ns.hackAnalyzeChance(server));
}

/**
 * Scan the network for the best server(s) to hack.
 *
 * @param ns {NS} - BitBurner API
 * @returns {*}
 */
export function main(ns) {
    // Setup
    ns.disableLog('ALL');
    const argParser = new ArgParser('find-target.js', 'Scan the network for the best servers(s) to hack.',[
        {name: 'count', desc: 'Number of servers to return', flags: ['-c', '--count'], default: Infinity},
        {name: 'rooted', desc: 'Only servers that have been rooted', flags: ['-r', '--rooted'], default: false},
        {name: 'notRooted', desc: 'Only servers that have not been rooted', flags: ['-n', '--not-rooted'], default: false},
        {name: 'verbose', desc: 'Display the estimated income per minute per core', flags: ['-v', '--verbose'], default: false},
    ]);
    const args = argParser.parse(ns.args);

    // Help
    if(args['help'] || args['_error'].length)
        return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

    // Banner
    ns.tprint('===================================================');
    ns.tprint(`Finding Targets:`);
    ns.tprint('===================================================');

    // Search & display results
    const [servers, ignore] = scanNetwork(ns);
    bestTarget(ns, servers).map(s => [...s, ns.hasRootAccess(s[0])])
        .filter(s => (!args['rooted'] || s[2]) || (!args['notRooted'] || !s[2]))
        .filter((s, i) => i < args['count'])
        .map(s => `${s[0]}${args['verbose'] ? ` (~${toCurrency(s[1])}/min)` : ''}`)
        .forEach((s, i) => ns.tprint(`${i + 1}) ${s}`));
    ns.tprint('');
}
