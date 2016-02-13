//init and get serverState
var state = require('./serverState');

// load utility module
var utils = require('./utils');

//Logging System
var logSystem = require('./logger');
var serverLog = logSystem.getServerLog();

var msgHandler = require('./messageHandler');

/**
 * Called after receiving HELLO:admin, registers for all messages a admin can send a listener with
 * socket.on() and takes corresponding actions.
 * @param socket
 * @param pingInterval
 */
exports.handleAdmin = function (socket, pingInterval) {

    var admin = {
        socket: socket
    };

    msgHandler.emitMessageToSocket(socket, 'HELLO:ack', {
        messageId: utils.rand(),
        token: state.getAdminAuthKey()
    });

    state.addAdmin(admin);

    msgHandler.sendConfigInformation(socket);
    msgHandler.sendTeamInformation(socket);
    msgHandler.sendAdminConfigInformation(socket);

    var pastLogs = serverLog.newAdmin();

    for (var i = 0; i < pastLogs.length; i++) {
        var currentLog = pastLogs[i];
        msgHandler.sendAdminsLogInformation(socket, currentLog);
    }

    /**
     * Removes the admin socket from the state as reaction to a disconnect event
     */
    socket.on('disconnect', function () {
        serverLog.log("info", "admin device disconnected");
        clearInterval(pingInterval);

        // remove the admin from the list
        state.removeAdmin(socket);
    });

    /**
     * Takes corresponding actions after receiving a CHANGE:config:admins message from the
     * connected admin. That is: send a ERROR message if the received message is invalid, or
     * otherwise update the server state and send CHANGE:config:admins messages to all connected
     * admins.
     */
    socket.on('CHANGE:config:admins', function (data) {
        serverLog.log("debug", "received CHANGE:config:admins: " + JSON.stringify(data));
        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }

        if (data.countdown) {
            if (!(data.countdown >= 0)) {
                msgHandler.emitMessageToSocket(socket, 'ERROR:CHANGE:config:admins', {
                    originatorId: data.messageId,
                    errorMessage: 'Invalid countdown value provided'
                });
                return;
            }
            // save new countdown value to global state
            state.setCurrentCountdownConfig(data.countdown);
        }

        if (utils.isValidBoolean(data.buzzersAutoEnable)) {
            if (data.buzzersAutoEnable == true) {
                state.enableAutoBuzzersEnabling();
            } else {
                state.disableAutoBuzzersEnabling();
            }
        }

        // inform all admins about the new configuration
        msgHandler.sendAdminConfigInformation();

    });

    /**
     * Takes corresponding actions after receiving a CHANGE:config message from the
     * connected admin. That is: send a ERROR message if the received message is invalid, or
     * otherwise update the server state and send CHANGE:config messages to all connected
     * devices.
     */
    socket.on('CHANGE:config', function (data) {
        serverLog.log("debug", "received CHANGE:config: " + JSON.stringify(data));
        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }

        if (utils.isValidBoolean(data.buzzersEnabled)) {
            if (data.buzzersEnabled == true) {
                if (utils.isValidRandomNumberToken(data.buzzerRound)) {
                    var success = msgHandler.enableBuzzers(data.buzzerRound);
                    if (success) {
                        serverLog.admin("Admin enabled buzzers.");
                    }
                } else {
                    msgHandler.emitMessageToSocket(socket, 'ERROR:CHANGE:config', {
                        originatorId: data.messageId,
                        errorMessage: 'buzzerEnabled == true but invalid buzzerRound'
                    });
                    return;
                }
            } else {
                msgHandler.disableBuzzers();
                serverLog.admin("Admin disabled buzzers.");
            }
        }

        if (data.excludedTeams) {
            state.setExcludedTeams(data.excludedTeams);
        }

        if (utils.isValidBoolean(data.teamChangeAllowed)) {
            if (data.teamChangeAllowed == true) {
                state.allowTeamChange();
            } else {
                state.disallowTeamChange();
            }
        }

        // finally send CHANGE:config to all connected devices
        msgHandler.sendConfigInformation();
    });

    /**
     * Takes corresponding actions after receiving a BUZZ:buzz:team message from the
     * connected admin. That is: send a ERROR message if the received message is invalid, or
     * otherwise buzz the given team or a random team.
     */
    socket.on('BUZZ:buzz:team', function (data) {
        serverLog.log("debug", "received BUZZ:buzz:team: " + JSON.stringify(data));
        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }

        if (data.teamName != null && data.teamName != '') {
            if (state.teamNameAlreadyExists(data.teamName) && !msgHandler.isThisTeamExcludedFromBuzzer(data.teamName)) {
                msgHandler.forceTeamBuzz(data.teamName);
            }
            return;
        }

        var success = msgHandler.buzzRandomTeam();
        if (!success) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:BUZZ:buzz:team', {
                originatorId: data.messageId,
                errorMessage: 'No team which can be buzzed was found!'
            });
        }
    });

    /**
     * Takes corresponding actions after receiving a BUZZ:stop message from the
     * connected admin. That is: send a ERROR message if the received message is invalid, or
     * otherwise stop a countdown in progress and send BUZZ:stop messages to all connected devices.
     */
    socket.on('BUZZ:stop', function (data) {
        serverLog.log("debug", "received BUZZ:stop: " + JSON.stringify(data));
        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }

        msgHandler.forceStopCountdown();

    });

    /**
     * Takes corresponding actions after receiving a TEAMS:change message from the
     * connected admin. That is: send a ERROR message if the received message is invalid, or
     * otherwise move the given client to the given team and send a TEAMS:change message to this
     * client and a TEAMS message to all connected devices.
     */
    socket.on('TEAMS:change', function (data) {
        serverLog.log("debug", "received TEAMS:change: " + JSON.stringify(data));
        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }

        // get the client
        var client = state.getClientGivenToken(data.clientToken);

        if (!state.teamNameAlreadyExists(data.teamName) || !client) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:TEAMS:change', {
                originatorId: data.messageId,
                errorMessage: 'The destination team or the client with the given clientToken' +
                ' does not exist'
            });
        }

        // place the client in the specified team
        msgHandler.moveClientToTeamAndInformAllDevices(client, data.teamName);
        serverLog.admin("Admin moved client: " + client.basicInfo.clientName + " to team: " + data.teamName + ".");

        // construct and send notification to the client
        data.messageId = utils.rand();
        delete data.authKey;
        msgHandler.emitMessageToSocket(socket, 'TEAMS:change', data);

    });

    /**
     * Takes corresponding actions after receiving a TEAMS:create message from the
     * connected admin. That is: send a ERROR message if the received message is invalid, or
     * otherwise create a new team with the provided name and send a TEAMS message to all
     * connected devices.
     */
    socket.on('TEAMS:create', function (data) {
        serverLog.log("debug", "received TEAMS:create: " + JSON.stringify(data));
        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }

        var val_res = utils.isValidTeamName(data.teamName);
        if (!val_res.value) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:TEAMS:create', {
                originatorId: data.messageId,
                errorMessage: val_res.description
            });
            return;
        }

        if (state.teamNameAlreadyExists(data.teamName)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:TEAMS:create', {
                originatorId: data.messageId,
                errorMessage: 'TeamName already exists.\n'
            });
        } else {
            msgHandler.createTeamAndInformAllDevices(data.teamName);
            serverLog.admin("Admin created team: " + data.teamName + ".");
        }
    });

    /**
     * Takes corresponding actions after receiving a TEAMS:delete message from the
     * connected admin. That is: send a ERROR message if the received message is invalid, or
     * otherwise delete the team with the provided name and send a TEAMS message to all
     * connected devices.
     */
    socket.on('TEAMS:delete', function (data) {
        serverLog.log("debug", "received TEAMS:delete: " + JSON.stringify(data));
        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }
        if (!state.teamNameAlreadyExists(data.teamName)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:TEAMS:delete', {
                originatorId: data.messageId,
                errorMessage: 'No teamName provided or team with this name does not exist.'
            });
        } else {
            msgHandler.deleteTeamAndInformAllDevices(data.teamName);
        }
    });

    /**
     * Takes corresponding actions after receiving a TEAMS:points message from the
     * connected admin. That is: send a ERROR message if the received message is invalid, or
     * otherwise add the given amount of points to the team with the provided name and send a TEAMS
     * message to all connected devices.
     */
    socket.on('TEAMS:points', function (data) {
        serverLog.log("debug", "received TEAMS:points: " + JSON.stringify(data));
        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }
        if (data.points == null || isNaN(data.points)
            || !parseInt(Number(data.points)) == data.points || isNaN(parseInt(data.points, 10))) {
            msgHandler.emitMessageToSocket(socket, 'ERROR', {
                originatorId: data.messageId,
                errorMessage: 'Invalid amount of points'
            });
            return;
        }
        if (!state.teamNameAlreadyExists(data.teamName)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR', {
                originatorId: data.messageId,
                errorMessage: 'The destination team does not exist'
            });
            return;
        }
        state.addPointsToTeam(data.teamName, parseInt(data.points));

        msgHandler.sendTeamInformation();
    });

    /**
     * Takes corresponding actions after receiving a TEAMS:points:reset message from the
     * connected admin. That is: send a ERROR message if the received message is invalid, or
     * otherwise reset the points off all teams to 0 and send a TEAMS message to all connected
     * devices.
     */
    socket.on('TEAMS:points:reset', function (data) {
        serverLog.log("debug", "received TEAMS:points:reset: " + JSON.stringify(data));
        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }
        msgHandler.setPointsOfAllTeamsAndInformAllDevices(0);
    });

    /**
     * Takes corresponding actions after receiving a TEAMS:name message from the
     * connected admin. That is: send a ERROR message if the received message is invalid, or
     * otherwise rename the team with the provided name, reply with a TEAMS:name message and
     * send a TEAMS message to all connected devices.
     */
    socket.on('TEAMS:name', function (data) {
        serverLog.log("debug", "received TEAMS:name: " + JSON.stringify(data));
        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }

        if (data.teamName == "" || data.newTeamName == "") {
            msgHandler.emitMessageToSocket(socket, 'ERROR:TEAMS:name', {
                originatorId: data.teamName,
                errorMessage: 'At least one of the team names is empty'
            });
            return;
        }
        if (data.teamName == state.lobbyTeam) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:TEAMS:name', {
                originatorId: data.teamName,
                errorMessage: 'Can\'t rename Lobby Team'
            });
            return;
        }
        if (state.teamNameAlreadyExists(data.newTeamName)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:TEAMS:name', {
                originatorId: data.newTeamName,
                errorMessage: 'A team with the same name already exists'
            });
            return;
        }
        var val_res = utils.isValidTeamName(data.newTeamName);
        if (!val_res.value) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:TEAMS:name', {
                originatorId: data.newTeamName,
                errorMessage: val_res.description
            });
            return;
        }
        state.renameTeam(data.teamName, data.newTeamName);

        //answer that rename was successful
        msgHandler.emitMessageToSocket(socket, 'TEAMS:name', data);

        //Broadcast Team information
        msgHandler.sendTeamInformation();
        msgHandler.sendConfigInformation();
    });

    /**
     * Takes corresponding actions after receiving a CLIENT:name message from the
     * connected admin. That is: send a ERROR message if the received message is invalid, or
     * otherwise rename the client with the provided clientToken, reply with a CLIENT:name
     * message and send a TEAMS message to all connected devices.
     */
    socket.on('CLIENT:name', function (data) {
        serverLog.log("debug", "received CLIENT:name: " + JSON.stringify(data));
        if (!msgHandler.checkForAdminAuthKeyAndMessageId(socket, data)) {
            return;
        }

        var client = state.getClientGivenToken(data.token);
        if (client == "") {
            msgHandler.emitMessageToSocket(socket, 'ERROR:CLIENT:name', {
                originatorId: data.token,
                errorMessage: 'User not found'
            });
            return;
        }
        if (state.getClientGivenName(data.newName)) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:CLIENT:name', {
                originatorId: data.newName,
                errorMessage: 'User with this name already exists'
            });
            return;
        }
        //Team Name Check can be used since user and team name have the same syntax
        var val_res = utils.isValidTeamName(data.newName);
        if (!val_res.value) {
            msgHandler.emitMessageToSocket(socket, 'ERROR:CLIENT:name', {
                originatorId: data.newName,
                errorMessage: val_res.description
            });
            return;
        }
        var oldName = client.basicInfo.clientName;
        client.basicInfo.clientName = data.newName;
        serverLog.admin("Client: " + oldName + " was renamed to: " + data.newName + ".");

        //answer that rename was successful
        msgHandler.emitMessageToSocket(socket, 'CLIENT:name', data);

        //Broadcast Team information
        msgHandler.sendTeamInformation();
    });


};