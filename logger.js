// we support standard npm logging, i.e.:
// { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
var winston = require('winston');
var fs = require('fs');
var winstonLog;

var pastLogs = [];

var serverLog = {
    silly: function (message) {
        winstonLog.silly(message);
    },
    debug: function (message) {
        winstonLog.debug(message);
    },
    info: function (message) {
        winstonLog.info(message);
    },
    verbose: function (message) {
        winstonLog.verbose(message);
    },
    warn: function (message) {
        winstonLog.warn(message);
    },
    error: function (message) {
        winstonLog.error(message);
    },
    admin: function (message) {
        winstonLog.info(message);
        addToPastLogsAndSentToAdmins(message);
    },
    log: function (loglevel, message) {
        switch (loglevel) {
            case "silly":
                serverLog.silly(message);
                break;
            case "debug":
                serverLog.debug(message);
                break;
            case "info":
                serverLog.info(message);
                break;
            case "verbose":
                serverLog.verbose(message);
                break;
            case "warn":
                serverLog.warn(message);
                break;
            case "error":
                serverLog.error(message);
                break;
            case "admin":
                serverLog.admin(message);
                break;
            default:
                winstonLog.warn("Don\'t know loglevel " + loglevel);
        }
    },
    newAdmin: function () {
        return pastLogs;
    }
};

/**
 * Manages the messages in pastLogs and informs the admins about the new message
 * @param information last sent message
 */
function addToPastLogsAndSentToAdmins(message) {
    var information = {
        message: message,
        time: Date.now()
    };
    pastLogs.push(information);
    if (pastLogs.length > 30) pastLogs.shift();
    messageHandler.sendAdminsLogInformation(false, information);
}

/**
 * Initialize server log with specified logLevel for console logs.
 * @param logLevel
 */
exports.initServerLog = function initServerLog(logLevel, logDir) {
    // create requested log file if necessary
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    winstonLog = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                name: 'console',
                level: logLevel
            }),

            new (winston.transports.File)({
                name: 'info-file',
                filename: logDir + '/serverLog.log',
                level: 'info'
            }),
            new (winston.transports.File)({
                name: 'error-file',
                filename: logDir + '/crash.log',
                level: 'error',
                handleExceptions: true,
                humanReadableUnhandledException: true
            })
        ]
    });
};

/**
 * Get central server log. If the log was not yet initialized, it will be created with default
 * 'info' log level.
 * @returns {*}
 */
exports.getServerLog = function () {
    if (!serverLog) {
        // init standard logger if not yet initialized
        initServerLog('info');
    }
    return serverLog;
};

//message handler. needed to send log information to admins
var messageHandler = require('./messageHandler');