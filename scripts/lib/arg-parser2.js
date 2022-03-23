export class ArgError extends Error {}

export class ArgParser {
    /**
     * Create a unix-like argument parser to extract flags from the argument list. Can also create help messages.
     * @param name {string} - Script name
     * @param desc {string} - Help description
     * @param argList {(ArgParser || {name: string, desc: string, flags: string[], optional: boolean, default: boolean})[]} - Array of CLI arguments
     * @param examples {string[]} - Additional examples to display
     */
    constructor(name, desc, argList = [], examples = []) {
        this.name = name;
        this.desc = desc;

        // Arguments
        this.commands = argList.filter(arg => arg instanceof ArgParser);
        this.args = argList.filter(arg => !arg.flags || !arg.flags.length);
        this.flags = argList.filter(arg => !(arg instanceof ArgParser) && arg.flags && arg.flags.length);
        this.flags.push({name: 'help', desc: 'Display this help message', flags: ['-h', '--help'], default: false});
        this.defaults = argList.reduce((acc, arg) => ({...acc, [arg.name]: arg?.extras ? [] : arg.default ?? null}), {});

        // Examples
        this.examples = [
            ...examples,
            `[OPTIONS] ${this.args.map(arg => (arg.optional ? `[${arg.name.toUpperCase()}]` : arg.name.toUpperCase()) + (arg.extras ? '...' : '')).join(' ')}`,
            this.commands.length ? `[OPTIONS] COMMAND` : null,
            `--help ${this.commands.length ? '[COMMAND]' : ''}`
        ].filter(e => !!e);
    }

    /**
     * Parse an array into an arguments dictionary using the configuration.
     * @param args {string[]} - Array of arguments to be parsed
     * @returns {object} - Dictionary of arguments with defaults applied
     */
    parse(args) {
        // Parse arguments
        let extras = [], parsed = {...this.defaults}, queue = [...args];
        while(queue.length) {
            let arg = queue.splice(0, 1)[0];
            if(arg[0] == '-') { // Flags
                // Check for combined shorthand
                if(arg[1] != '-' && arg.length > 2) {
                    queue = [...arg.substring(2).split('').map(a => `-${a}`), ...queue];
                    arg = `-${arg[1]}`;
                }
                // Find & add flag
                const combined = arg.split('=');
                const argDef = this.flags.find(flag => flag.flags.includes(combined[0] || arg));
                if(!argDef) extras.push(arg); // Not found, add to extras
                const value = argDef.default === false ? true : argDef.default === true ? false : queue.splice(queue.findIndex(q => q[0] != '-'), 1)[0];
                if(value == null) parsed['_error'] = `${argDef.name.toUpperCase()} missing value`
                parsed[argDef.name] = value;
            } else { // Command
                const c = this.commands.find(command => command.name == arg);
                if(!!c) {
                    parsed['_command'] = c.name;
                    parsed[c.name] = c.parse(queue.splice(0, queue.length));
                } else extras.push(arg); // Not found, add to extras
            }
        }
        // Arguments
        this.args.filter(arg => !arg.extras).forEach(arg => {
            if(!arg.optional && !extras.length) parsed['_error'] = `${arg.name.toUpperCase()} is missing`;
            parsed[arg.name] = extras.splice(0, 1)[0];
        });
        // Extras
        const extraKey = this.args.find(arg => arg.extras)?.name || '_extra';
        parsed[extraKey] = extras;
        return parsed;
    }

    /**
     * Create help message from the provided description & argument list.
     * @param message {string} - Message to display, defaults to the description
     * @param command {string} - Command help message to show
     * @returns {string} - Help message
     */
    help(message = '', command = '') {
        const spacer = (text) => Array(24 - text.length || 1).fill(' ').join('');

        // Help with specific command
        if(command) {
            const argParser = this.commands.find(parser => parser.name == command);
            if(!argParser) throw new Error(`${command.toUpperCase()} does not have a help`)
            return argParser.help(message);
        }

        // Description
        let msg = `\n\n${message || this.desc}`;
        // Examples
        msg += '\n\nUsage:\t' + this.examples.map(ex => `run ${this.name} ${ex}`).join('\n\t');
        // Arguments
        if(this.args.length) msg += '\n\n\t' + this.args
            .map(arg => `${arg.name.toUpperCase()}${spacer(arg.name)}${arg.desc}`)
            .join('\n\t');
        // Flags
        msg += '\n\nOptions:\n\t' + this.flags.map(flag => {
            const flags = flag.flags.join(', ');
            return `${flags}${spacer(flags)}${flag.desc}`;
        }).join('\n\t');
        // Commands
        if(this.commands.length) msg += '\n\nCommands:\n\t' + this.commands
            .map(command => `${command.name}${spacer(command.name)}${command.desc}`)
            .join('\n\t');
        return `${msg}\n\n`;
    }
}
