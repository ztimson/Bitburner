import {ArgParser} from '/scripts/lib/arg-parser';
import {maxThreads, progressBar} from '/scripts/lib/utils';

/**
 * Copy a file & it's dependencies to a server.
 *
 * @param {NS} ns - BitBurner API
 * @param {string} src - File to scan & copy
 * @param {string} server - Device to copy files to
 * @returns {Promise<string[]>} - Array of copied files
 */
export async function copyWithDependencies(ns, src, server) {
    const queue = [src], found = [src];
    while(queue.length) {
        const file = queue.splice(0, 1)[0];
        const imports = new RegExp(/from ["']\.?(\/.+)["']/g);
        const script = await ns.read(file);
        let match;
        while((match = imports.exec(script)) != null) {
            const path = `${match[1]}.js`;
            if(!found.includes(path)) found.push(path);
            queue.push(path);
        }
    }
    await ns.scp(found, server);
    return found.reverse();
}

/**
 * Copy a file & it's dependencies to a server.
 *
 * @param {NS} ns - BitBurner API
 */
export async function main(ns) {
    // Setup
    ns.disableLog('ALL');
    const argParser = new ArgParser('copy.js', 'Copy a file & it\'s dependencies to a server.', [
        {name: 'file', desc: 'File to copy'},
        {name: 'server', desc: 'Server to copy file(s) to'},
        {name: 'args', desc: 'Arguments to start file/script with', optional: true, extras: true},
        {name: 'cpu', desc: 'Number of CPU threads to start script with, will use maximum if not specified', flags: ['-c', '--cpu']},
        {name: 'execute', desc: 'Start script after copying', flags: ['-e', '--execute'], default: false},
        {name: 'noDeps', desc: 'Skip copying dependencies', flags: ['-n', '--no-deps'], default: false},
        {name: 'quite', desc: 'Suppress program output', flags: ['-q', '--quite'], default: false},
    ]);
    const args = argParser.parse(ns.args);

    // Help
    if(args['help'] || args['_error'].length)
        return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

    // Banner
    if(!args['quite']) {
        ns.tprint('===================================================');
        ns.tprint(`Copying: ${args['server']}`);
        ns.tprint('===================================================');
        ns.tprint('');
        ns.tprint('Copying Files:');
        await ns.sleep(500);
    }

    // Copy files & create download bar
    if(args['noDeps']) {
        await ns.scp(args['file'], args['server']);
        if(!args['quite']) await progressBar(ns, args['file']);
    } else {
        const files = await copyWithDependencies(ns, args['file'], args['server']);
        if(!args['quite']) {
            for(let file of files) {
                await progressBar(ns, file);
            }
        }
    }

    // Run the script if requested
    if(args['execute']) {
        const threads = args['cpu'] || maxThreads(ns, args['file'], args['server']) || 1;
        if(!args['quite']) {
            ns.tprint('');
            ns.tprint(`Executing with ${threads} thread${threads > 1 ? 's' : ''}...`);
            await ns.sleep(500);
        }
        ns.killall(args['server']);
        const pid = ns.exec(args['file'], args['server'], threads, ...args['args']);
        if(!args['quite']) {
            ns.tprint(!!pid ? 'Done!' : 'Failed to start');
            ns.tprint('');
        }
    }

    // Done message
    if(!args['quite']) {
        ns.tprint('');
        ns.tprint('Done!');
        ns.tprint('');
    }
}

/**
 * BitBurner autocomplete.
 *
 * @param {{servers: string[], txts: string[], scripts: string[], flags: string[]}} data - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
    return [...data.servers, ...data.scripts];
}
