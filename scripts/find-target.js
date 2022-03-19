import {ArgError, ArgParser} from '/scripts/lib/arg-parser';
import {bestTarget} from '/scripts/lib/utils';

/**
 * Scan the network for the best device(s) to mine.
 * @param ns {NS} - BitBurner API
 * @returns {*}
 */
export function main(ns) {
    // Setup
    ns.disableLog('ALL');
    const argParser = new ArgParser('find-target.js', 'Scan the network for the best device(s) to mine.', null, [
        {name: 'count', desc: 'Number of devices to return in order from best to worst', flags: ['-c', '--count'], default: Infinity, type: 'number'},
        {name: 'rooted', desc: 'Filter to devices that have been rooted', flags: ['-r', '--rooted'], type: 'bool'},
        {name: 'notRooted', desc: 'Filter to devices that have not been rooted', flags: ['-n', '--not-rooted'], type: 'bool'},
        {name: 'verbose', desc: 'Display the estimated income per minute per core', flags: ['-v', '--verbose'], type: 'bool'},
    ]);

    try {
        // Run
        const args = argParser.parse(ns.args);

        // Banner
        ns.tprint('===================================================');
        ns.tprint(`Finding Targets`);
        ns.tprint('===================================================');

        // Search & display results
        bestTarget(ns).filter((t, i) => !args['count'] || i < args['count'])
            .filter(t => !args['rooted'] || t.hasAdminRights)
            .filter(t => !args['notRooted'] || !t.hasAdminRights)
            .map(t => `${t.hostname}${args['verbose'] ? ` (${t.moneyAMinute.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
            })})` : ''}`)
            .forEach((t, i) => ns.tprint(`${i + 1}) ${t}`));
        ns.tprint('');
    } catch(err) {
        if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
        throw err;
    }
}
