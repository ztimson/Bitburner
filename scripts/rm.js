import {ArgParser} from '/scripts/lib/arg-parser';

/**
 * Recursively delete files inside a path. Equivalent to the Unix "rm -r".
 * @param {NS} ns - BitBurner API
 */
export function main(ns) {
    // Setup
    ns.disableLog('ALL');
    const argParser = new ArgParser('rm.js', 'Recursively delete files inside a directory', [
        {name: 'path', desc: 'Path to recursively search'},
        {name: 'server', desc: 'Run on remote server', optional: true, default: ns.getHostname()},
        {name: 'force', desc: 'Remove game files (.exe, .lit, .msg)', flags: ['-f', '--force'], default: false},
        {name: 'recursive', desc: 'Delete everything inside directory', flags: ['-r', '--recursive'], default: true}
    ]);
    const args = argParser.parse(ns.args);

    // Help
    if(args['help'] || args['_error'].length)
        return ns.tprint(argParser.help(args['help'] ? null : args['_error'][0], args['_command']));

    // Run
    ns.ls(args['server'], args['path'])
        .filter(f => new RegExp(/\.(exe|lit|msg)$/g).test(f) ? args['force'] : true)
        .forEach(f => ns.rm(f, args['server']));
}

/**
 * BitBurner autocomplete.
 *
 * @param {{servers: string[], txts: string[], scripts: string[], flags: string[]}} data - Contextual information
 * @returns {string[]} - Pool of autocomplete options
 */
export function autocomplete(data) {
    return [...data.txts, ...data.scripts]
        .map(file => file.split('/').slice(0, -1).join('/'))
        .filter((path, i, arr) => arr.indexOf(path) == i)
        .concat(data.txts, data.scripts);
}
