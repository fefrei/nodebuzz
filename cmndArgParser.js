var HELP_MSG = 'Usage: node server.js [options]\n \
Options:\n \
    -a, --admins    Number of needed admin credentials (not yet supported)\n \
    -d, --logdir    Target directory for logs\n \
    -h, --help      Print this help message\n \
    -l, --loglevel  Log level for console\n \
    -p, --port      Listen on specified port';


// npm log levels
var LOG_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
var LOG_DIR = './Logs';
var DEFAULT_LEVEL = 'info';

// external parsing module
var parseArgs = require('minimist');

/**
 * Outputs invalid argument, as well as the help message and finally terminates the program.
 * @param arg
 */
function unknownArg(arg) {
    console.error('Invalid argument: ' + arg);
    console.log(HELP_MSG);
    process.exit(1);
    console.warn('Ignoring unknown argument: ' + arg);
}

/**
 * Checks whether passed command line arguments are valid w.r.t. to their types and values.
 * The function returns false iff malformed arguments were detected.
 * @param argv
 * @return {boolean} false iff malformed arguments detected
 */
function verifyArgs(argv) {
    // check passed port number
    if (argv.port) {
        if (typeof argv.port != 'number' || argv.port < 1) {
            console.error('Specified port number is invalid.');
            return false;
        }
    }
    // check help flag
    if (argv.help) {
        if (typeof argv.help != 'boolean') {
            console.error('Specified illegal value for help option.');
            return false;
        }
    }
    // check log level (npm level, i.e. error, warn, info, verbose, debug, silly)
    if (argv.loglevel) {
        if (LOG_LEVELS.indexOf(argv.loglevel) == -1) {
            console.error('Unsupported log level: ' + argv.level);
            console.error('Supported are: ' + LOG_LEVELS);
            return false;
        }
    }
    // flag set, but no value specified
    if (!argv.logdir) {
        argv.logdir = LOG_DIR;
        console.warn("Warning: invalid log directory specified.\nUsing standard './Logs'");
    }
    // TODO: might be used to support multiple different admin accounts later on
    // TODO: enforcement of 1 admin per admin token needs to be implemented for that
    // check entered number of admins
    if (argv.admins) {
        if (typeof argv.admins != 'number' || argv.admins < 1) {
            console.error('Specified number of admin accounts is invalid.');
            return false;
        }
    }
    return true;
}

/**
 * Parses and verifies command-line arguments of program.
 * Returns argv object in case of success, otherwise exits program.
 */
exports.parseAndVerifyCommandlineArgs = function () {
    // p: port number, h: help msg
    var opts = {
        //TODO '-h=22' not treated as true, but '--help=22' correctly treated as bool
        string: ['logdir', 'l'],
        boolean: ['help', 'h'],
        alias: {'p': 'port', 'h': 'help', 'l': 'loglevel', 'd': 'logdir', 'a': 'admins'},
        default: {'p': 8080, 'h': false, 'l': DEFAULT_LEVEL, 'd': LOG_DIR, 'a': 1},
        unknown: unknownArg
    };
    // slide away path + name
    var argv = parseArgs(process.argv.slice(2), opts);

    if (!verifyArgs(argv)) {
        console.log(HELP_MSG);
        process.exit(1);
    }

    // TODO: possible to stop parsing as soon as -h flag got recognized?
    if (argv.help) {
        console.log(HELP_MSG);
        process.exit(0);
    }

    return argv;
};