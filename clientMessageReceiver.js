//init and get serverState
var state = require('./serverState');

// load utility module
var utils = require('./utils');

//Logging System
var logSystem = require('./logger');
var serverLog = logSystem.getServerLog();

var msgHandler = require('./messageHandler');

/**
 * Called after receiving HELLO:client, registers for all messages a client can send a listener with
 * socket.on() and takes corresponding actions.
 * @param socket
 * @param pingInterval
 * @param clientToken
 * @param clientName
 */
exports.handleClient = function (socket, pingInterval, clientToken, clientName) {

    if (!utils.isValidRandomNumberToken(clientToken)) {
        clientToken = utils.rand();
    }

    var client = state.getClientGivenToken(clientToken);

    if (client == null) {
        // The client is not known and we create a new one
        client = {
            socket: socket,
            basicInfo: {
                clientToken: clientToken,
                clientName: clientName,
                connected: true
            },
            team: state.lobbyTeam,
            timer: null
        };
        state.addClient(client);
        state.addClientToTeam(client.basicInfo, state.lobbyTeam);
        msgHandler.emitMessageToSocket(socket, 'HELLO:ack', {
            messageId: utils.rand(),
            token: clientToken,
            clientName: clientName
        });
    }
    else {
        // The client is already known and we update the clientName if a new name was
        // included in the HELLO:client message
        if (utils.isValidClientName(clientName).value && !state.clientNameAlreadyExists(clientToken, clientName)) {
            client.basicInfo.clientName = clientName;
        }
        client.socket = socket;
        client.basicInfo.connected = true;
        if (client.timer){
            clearTimeout(client.timer);
        }
        msgHandler.emitMessageToSocket(socket, 'HELLO:ack', {
            messageId: utils.rand(),
            token: clientToken,
            clientName: client.basicInfo.clientName
        });
    }


    msgHandler.sendConfigInformationToClient(client);

    // send teamInformation to all devices
    msgHandler.sendTeamInformation();

    /**
     * Removes the client socket from the state as reaction to a disconnect event
     */
    socket.on('disconnect', function () {
        serverLog.log("info", "client named " + client.basicInfo.clientName + " disconnected");
        clearInterval(pingInterval);

        // set the connected status to false
        state.getClientGivenToken(client.basicInfo.clientToken).basicInfo.connected = false;

        //if a lobby client disconnects he gets removed from the serverState after 60 seconds
        if (client.team == state.lobbyTeam) {
            msgHandler.clientStillDisconnected(client, 0);
        }

        //inform all devices
        msgHandler.sendTeamInformation();
    });

    /**
     * Takes corresponding actions after receiving a BUZZ:buzz:trial message from the
     * connected client. That is: send a ERROR message if the received message is invalid, or
     * otherwise call the function checkIfBuzzFirstAndInformAllDevices on the messageHandler which
     * sends BUZZ:buzz:ack messages to all connected devices when this client has buzzed first.
     */
    socket.on('BUZZ:buzz:trial', function (data) {
        serverLog.log("debug", "received BUZZ:buzz:trial: " + JSON.stringify(data));
        if (!utils.isValidRandomNumberToken(data.messageId) || !utils.isValidRandomNumberToken(data.clientToken) || !utils.isValidRandomNumberToken(data.buzzerRound)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR', {
                originatorId: data.messageId,
                errorMessage: 'Invalid clientToken, messageId or buzzerRound\n'
            });
        } else {
            msgHandler.checkIfBuzzFirstAndInformAllDevices(client, data.buzzerRound);
        }
    });

    /**
     * Takes corresponding actions after receiving a TEAMS:change message from the
     * connected client. That is: send a ERROR message if the received message is invalid, or
     * otherwise move the client to the given team and send a TEAMS:change message to the
     * client and a TEAMS message to all connected devices.
     */
    socket.on('TEAMS:change', function (data) {
        serverLog.log("debug", "received TEAMS:change: " + JSON.stringify(data));
        if (!utils.isValidRandomNumberToken(data.messageId) || !utils.isValidRandomNumberToken(data.clientToken) || !data.teamName) {
            msgHandler.emitMessageToSocket(socket, 'ERROR', {
                originatorId: data.messageId,
                errorMessage: 'Invalid clientToken, messageId or teamName.\n'
            });
            return;
        }
        if (!state.isTeamChangeAllowed()) {
            msgHandler.emitMessageToSocket(socket, 'ERROR', {
                originatorId: data.messageId,
                errorMessage: 'Team change is currently not allowed!\n'
            });
            return;
        }
        if (!state.teamNameAlreadyExists(data.teamName)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR', {
                originatorId: data.messageId,
                errorMessage: 'The destination team does not exist\n'
            });
            return;
        }

        msgHandler.moveClientToTeamAndInformAllDevices(client, data.teamName);
        serverLog.admin("Client: " + client.basicInfo.clientName + " moved to team: " + data.teamName + ".");

        // construct and send answer to client
        data.messageId = utils.rand();
        msgHandler.emitMessageToSocket(socket, 'TEAMS:change', data);

    });

    /**
     * Takes corresponding actions after receiving a TEAMS:create message from the
     * connected client. That is: send a ERROR message if the received message is invalid, or
     * otherwise create a new team with the provided name and send a TEAMS message to all
     * connected devices.
     */
    socket.on('TEAMS:create', function (data) {
        serverLog.log("debug", "received TEAMS:create: " + JSON.stringify(data));
        if (!utils.isValidRandomNumberToken(data.messageId)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR', {
                originatorId: data.messageId,
                errorMessage: 'Invalid messageId provided.\n'
            });
            return;
        }

        if (!state.isTeamChangeAllowed()) {
            msgHandler.emitMessageToSocket(socket, 'ERROR', {
                originatorId: data.messageId,
                errorMessage: 'Team change and creation is currently not allowed!\n'
            });
            return;
        }

        var val_res = utils.isValidTeamName(data.teamName);
        if(!val_res.value) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:TEAMS:create', {
                originatorId: data.messageId,
                errorMessage: val_res.description
            });
            return;
        }
        if(state.teamNameAlreadyExists(data.teamName)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:TEAMS:create', {
                originatorId: data.messageId,
                errorMessage: 'TeamName already given to another team.\n.'
            });
            return;
        }

        msgHandler.createTeamAndInformAllDevices(data.teamName);
        serverLog.admin("Client: " + client.basicInfo.clientName + " created team: " + data.teamName + ".");

    });
};