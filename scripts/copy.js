import {ArgError, ArgParser} from '/scripts/lib/arg-parser';
import {copyWithDependencies, progressBar} from '/scripts/lib/utils';

/**
 * BitBurner autocomplete
 * @param data {server: string[], txts: string[], scripts: string[], flags: string[]} - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
    return [...data.servers, ...data.scripts];
}

/** @param {NS} ns **/
export async function main(ns) {
    // Setup
    ns.disableLog('ALL');
    const argParser = new ArgParser('copy.js', 'Copy a file/script to a device along with any dependencies.', null, [
        {name: 'file', desc: 'File to copy', type: 'string'},
        {name: 'device', desc: 'Device to copy file(s) to', type: 'string'},
        {name: 'noDeps', desc: 'Skip copying dependencies', flags: ['-n', '--no-deps'], type: 'bool'},
        {name: 'silent', desc: 'Suppress program output', flags: ['-s', '--silent'], type: 'bool'}
    ], true);

    try {
        // Run
        const args = argParser.parse(ns.args);

        // Banner
        if(!args['silent']) {
            ns.tprint('===================================================');
            ns.tprint(`Copying: ${args['device']}`);
            ns.tprint('===================================================');
            ns.tprint('');
            ns.tprint('Copying Files:');
            await ns.sleep(500);
        }

        // Copy files & create download bar
        if(args['noDeps']) {
            await ns.scp(args['file'], args['device']);
            if(!args['silent']) await progressBar(ns, args['file']);
        } else {
            const files = await copyWithDependencies(ns, args['file'], args['device']);
            if(!args['silent']) {
                for(let file of files) {
                    await progressBar(ns, file);
                }
            }
        }

        // Done message
        if(!args['silent']) {
            ns.tprint('');
            ns.tprint('Done!');
            ns.tprint('');
        }
    } catch(err) {
        if(err instanceof ArgError) return ns.tprint(argParser.help(err.message));
        throw err;
    }
}
