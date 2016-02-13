process.on('uncaughtException', function (err) {
    console.error('Uncaught Exception!');
    console.error(err.stack);
    process.exit();
});

// try to parse command-line arguments
var parseArgs = require('./cmndArgParser');
var argv = parseArgs.parseAndVerifyCommandlineArgs();
var port = argv.port;

// init and get server logger
var LOG_LEVEL = argv.loglevel;
var LOG_DIR = argv.logdir;
var logSystem = require('./logger');
logSystem.initServerLog(LOG_LEVEL, LOG_DIR);
var serverLog = logSystem.getServerLog();

//init and get serverState
var state = require('./serverState');

var clientHandler = require('./clientMessageReceiver');
var adminHandler = require('./adminMessageReceiver');
var monitorHandler = require('./monitorMessageReceiver');
var msgHandler = require('./messageHandler');

// load utility module
var utils = require('./utils');

var recovery = require('./stateRecovery');

// sending a PING interval in milliseconds
var pingIntervalDuration = 1250;

// redirection to respective pages
var express = require('express');
var app = express();
var path = require('path');

recovery.loadServerState();

app.use(express.static('http'));

app.get("/", function (req, res) {
    serverLog.debug('Request for / getting redirected.');
    res.sendFile(path.join(__dirname + '/http/app/client/client.html'));
});

app.get("/admin", function (req, res) {
    serverLog.debug('Request for /admin getting redirected.');
    res.sendFile(path.join(__dirname + '/http/app/admin/admin.html'));
});

app.get("/monitor", function (req, res) {
    serverLog.debug('Request for /monitor getting redirected.');
    res.sendFile(path.join(__dirname + '/http/app/monitor/monitor.html'));
});


// create server and init socket-io object (Express 3/4)
var server = require('http').Server(app);
var io = require('socket.io')(server, {pingTimeout: 5000, pingInterval: pingIntervalDuration});

/**
 * Start listening.
 */
server.listen(port, initListeningAndCLI);

/**
 * Handle failure in port binding, i.e. during start-up of listening.
 */
server.on('error', reportPortBindingError);

/**
 * Called when a connection to a new device is established, registers standard event listeners
 * to receive messages and configures sending PING messages
 */
io.on('connection', welcomeMessageHandler);

/**
 * Called when server starts listening on port.
 * Starts command line interface.
 */
function initListeningAndCLI() {
    // called when start listening was successful
    serverLog.log("info", "Listening on port " + port.toString());
    // start CLI
    require('./commandLineInterface').startCLI();
}

/**
 * Called when port binding error occurs.
 * Prints reason and shuts down server.
 * @param e exception
 */
function reportPortBindingError(e) {
    //TODO: these logs will usually not be written into the log files, because the async writes
    // will not flush fast enough before the program is getting terminated. This is ca known issue
    // of winston. (https://github.com/winstonjs/winston/issues/228)
    if (e.code == 'EADDRINUSE') {
        serverLog.error("Failure: the port " + port + " is already in use\n" + "You might want" +
            " to use 'lsof -i :" + port + "' to find out by which application.");
    }
    else if (e.code == 'EACCES') {
        serverLog.error("Failure: permission denied to bind to port " + port);
    } else {
        serverLog.error("Unknown error: " + e.message + ", code: " + e.messageId);
    }
    process.exit(1);
}

/**
 * Called when a connection to new device with the given socket is opened.
 * Sends PING messages and handles PONG, ERROR and initial HELLO messages.
 * @param socket
 */
function welcomeMessageHandler(socket) {

    serverLog.debug('New connection established.');

    var handShakeAlreadyPerformed = false;

    // extra boolean, because an admin is allowed to send HELLO:admin more than once, e.g.
    // because of changed adminAuthKey
    var isAdmin = false;

    //send ping every pingIntervalDuration seconds
    var pingInterval = setInterval(function () {
        var ping = {messageId: utils.rand()};
        socket.emit('PING', ping);
        serverLog.silly("Sent PING: " + JSON.stringify(ping));
    }, pingIntervalDuration);


    /**
     * Just writes a silly-level log message when a PONG is received
     */
    socket.on('PONG', function (data) {
        serverLog.silly("received PONG: " + JSON.stringify(data));
    });

    /**
     * Just write a warning-level log message when an ERROR message is received
     */
    socket.on('ERROR', function (data) {
        serverLog.warn("received ERROR: " + JSON.stringify(data));
    });

    /**
     * Takes corresponding actions after receiving a HELLO:admin message, i.e. checks whether
     * the message and the included adminAuthKey is valid and then calls handleAdmin()
     */
    socket.on('HELLO:admin', function (data) {
        serverLog.log("debug", "received HELLO:admin: " + JSON.stringify(data));

        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }

        if (handShakeAlreadyPerformed && !isAdmin) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:HELLO:admin', {
                originatorId: data.messageId,
                errorMessage: 'Already sent HELLO message in this session'
            });
        } else {
            handShakeAlreadyPerformed = true;
            isAdmin = true;
            adminHandler.handleAdmin(socket, pingInterval);
        }
    });

    /**
     * Takes corresponding actions after receiving a HELLO:client message, i.e. checks whether
     * the message is valid and then calls handleClient()
     */
    socket.on('HELLO:client', function (data) {
        serverLog.log("debug", "received HELLO:client: " + JSON.stringify(data));

        var savedClient = state.getClientGivenToken(data.clientToken);

        /* We reply with an ERROR message if one of the following statements is true:
         * A handshake with this device was already performed OR
         * A client with the same clientToken is already connected to the server OR
         * The given messageId is not valid
         */
        if (handShakeAlreadyPerformed || (savedClient != null && savedClient.basicInfo.connected)
            || !utils.isValidRandomNumberToken(data.messageId)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR', {
                originatorId: data.messageId,
                errorMessage: 'No messageId provided, already send HELLO message in this' +
                ' session, already logged in with the same clientToken or no clientToken'
            });
            return;
        }

        // We reply with an ERROR message if the given name is already taken by another
        // connected client
        if (utils.isValidClientName(data.clientName).value && state.clientNameAlreadyExists(data.clientToken, data.clientName)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:HELLO:client', {
                originatorId: data.messageId,
                errorMessage: 'Name already exists!'
            });
            return;
        }

        // We reply with an ERROR message if the client is not remembered by our server state
        // and no valid clientName was given
        var val_res = utils.isValidTeamName(data.clientName);
        if (savedClient == null && !val_res.value) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:HELLO:client', {
                originatorId: data.messageId,
                errorMessage: val_res.description
            });
            return;
        }
        handShakeAlreadyPerformed = true;
        clientHandler.handleClient(socket, pingInterval, data.clientToken, data.clientName);

    });

    /**
     * Takes corresponding actions after receiving a HELLO:monitor message, i.e. checks whether
     * the message is valid and then calls handleMonitor()
     */
    socket.on('HELLO:monitor', function (data) {
        serverLog.log("debug", "received HELLO:monitor: " + JSON.stringify(data));
        if (handShakeAlreadyPerformed || !utils.isValidRandomNumberToken(data.messageId)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR', {
                originatorId: data.messageId,
                errorMessage: 'No messageId provided or already send HELLO message in this session'
            });
        } else {
            handShakeAlreadyPerformed = true;
            monitorHandler.handleMonitor(socket, pingInterval);
        }
    });
}