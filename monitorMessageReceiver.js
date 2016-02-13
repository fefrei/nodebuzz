//init and get serverState
var state = require('./serverState');

// load utility module
var utils = require('./utils');

//Logging System
var logSystem = require('./logger');
var serverLog = logSystem.getServerLog();

var msgHandler = require('./messageHandler');

/**
 * Called after receiving HELLO:monitor, registers for all messages a monitor can send a listener
 * with socket.on() and takes corresponding actions.
 * @param socket
 * @param pingInterval
 */
exports.handleMonitor = function(socket, pingInterval) {

    var monitor = {
        socket: socket
    };

    msgHandler.emitMessageToSocket(socket, 'HELLO:ack', {
        messageId: utils.rand()
    });

    state.addMonitor(monitor);

    msgHandler.sendConfigInformation(socket);
    msgHandler.sendTeamInformation(socket);

    /**
     * Removes the monitor socket from the state as reaction to a disconnect event
     */
    socket.on('disconnect', function () {
        serverLog.log("info", "monitor device disconnected");
        clearInterval(pingInterval);

        // remove the admin from the list
        state.removeMonitor(socket);
    });
};
