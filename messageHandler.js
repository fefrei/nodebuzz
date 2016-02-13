//init and get serverState
var state = require('./serverState');

// load utility module
var utils = require('./utils');

//Logging System
var logSystem = require('./logger');
var serverLog = logSystem.getServerLog();

//
var currentCountdown = 0;
var countdownInterval;
var countdownActive = false;

/**
 * Removes client corresponding to given clientToken from its.
 * @param clientToken
 */
exports.removeClientFromTeamsGivenToken = function (clientToken) {
    state.removeClientFromTeamsGivenToken(clientToken);
    this.sendTeamInformation();
};

/**
 * Called by admin to buzz a specific team
 * @param teamName
 */
exports.forceTeamBuzz = function (teamName) {

    if (countdownActive == true) {
        // silently fail if countdown is currently active
        return;
    }

    serverLog.admin("Admin buzzed team: " + teamName + ".");
    buzzTeam(teamName);
};

/**
 * Checks if the buzzers are enabled, a countdown is currently not in progress and the
 * currentBuzzerRound matches the given buzzerRound. If this is the case, buzz the team in which
 * the client currently is.
 * @param client
 * @param buzzerRound
 */
exports.checkIfBuzzFirstAndInformAllDevices = function (client, buzzerRound) {
    if (state.getBuzzerStatus() && state.getCurrentBuzzerRound() == buzzerRound && countdownActive == false) {

        var teamName = client.team;

        if (teamName == '') {
            serverLog.error("Fatal error: There exists a client with name: " + client.basicInfo.clientName
                + " which is not in the Lobby and not in another team!");
        }

        if (teamName == state.lobbyTeam || isThisClientExcludedFromBuzzer(client.basicInfo.clientToken)) {
            return;
        }

        serverLog.admin("Client: " + client.basicInfo.clientName + " has buzzed for team: " + teamName + ".");
        // inform all devices
        buzzTeam(teamName, client.basicInfo.clientName);
    }
};

/**
 * Create a team with the given name and send a TEAMS message to all devices
 * @param teamName
 */
exports.createTeamAndInformAllDevices = function (teamName) {
    createTeam(teamName);
    this.sendTeamInformation();
};

/**
 * Deletes the team with the given name from the state and moves all clients in this team to the
 * Lobby. Further, sends TEAMS and CHANGE:config message to all connected devices.
 * @param teamName
 */
exports.deleteTeamAndInformAllDevices = function (teamName) {
    state.removeTeam(teamName);

    this.sendTeamInformation();

    // because the team was also maybe deleted from the list of excluded teams, send
    // CHANGE:config to all devices such that they know the modified excludedTeams list
    this.sendConfigInformation();

    serverLog.admin("team: " + teamName + " was deleted.")
};

/**
 * Insert the given client into the team with the given name and deletes it from the old team.
 * Additionally sends a CHANGE:config message to the client.
 * @param client
 * @param teamName
 */
exports.moveClientToTeamAndInformAllDevices = function (client, teamName) {
    state.removeClientFromTeamsGivenToken(client.basicInfo.clientToken);
    state.addClientToTeam(client.basicInfo, teamName);
    this.sendTeamInformation();
    this.sendConfigInformationToClient(client);
};

/**
 * Send team information to all devices or only to the specified socket
 * @param socket (optional) If no socket provided, team information is sent to ALL connected devices
 */
exports.sendTeamInformation = function (socket) {
    var teams = {
        messageId: utils.rand(),
        teams: state.getTeams()
    };

    if (socket) {
        this.emitMessageToSocket(socket, 'TEAMS', teams);
    } else {
        sendMessageToAllClients('TEAMS', teams);
        sendMessageToAllAdmins('TEAMS', teams);
        sendMessageToAllMonitors('TEAMS', teams);
    }
};

/**
 * Send config information to all admins or only to the specified socket
 * @param socket (optional) If no socket provided, config information is sent to ALL admins
 */
exports.sendAdminConfigInformation = function (socket) {
    var config = {
        messageId: utils.rand(),
        countdown: state.getCurrentCountdownConfig(),
        buzzersAutoEnable: state.getAutoBuzzersEnablingStatus()
    };

    if (socket) {
        this.emitMessageToSocket(socket, 'CHANGE:config:admins', config);
    } else {
        sendMessageToAllAdmins('CHANGE:config:admins', config);
    }
};

/**
 * Sends a log message to all admins or only to the given socket
 * @param socket (optional) if given, send only to this socket
 * @param logMessage description of the event that shall be logged
 */
exports.sendAdminsLogInformation = function (socket, logMessage) {
    var log = {
        messageId: utils.rand(),
        message: logMessage
    };
    if (socket) {
        this.emitMessageToSocket(socket, 'LOG', log);
    } else {
        sendMessageToAllAdmins('LOG', log);
    }
};

/**
 * Checks if the given data objects includes a valid messageId and a valid authKey. Returns
 * false and sends an ERROR message if it's not the case and returns true otherwise.
 * @param socket
 * @param data
 * @returns {boolean}
 */
exports.checkForAdminAuthKeyAndMessageId = function (socket, data) {
    if (!utils.isValidRandomNumberToken(data.messageId)) {
        this.emitMessageToSocket(socket, 'ERROR', {
            originatorId: data.messageId,
            errorMessage: 'Invalid or no messageId provided'
        });
        return false;
    }
    if (!utils.isValidAdminAuthKey(data.authKey)) {
        this.emitMessageToSocket(socket, 'ERROR:ADMIN:auth', {
            originatorId: data.messageId,
            errorMessage: 'Invalid authKey'
        });
        return false;
    }
    return true;
};

/**
 * Sets the current countdown config to the given value value and informs all connected admins about
 * this change
 * @param value
 */
exports.setCountdown = function (value) {

    // save new countdown value to global state
    state.setCurrentCountdownConfig(value);

    // inform all admins about this
    this.sendAdminConfigInformation();
};

/**
 * Sends the current config information (i.e. Buzzer status) to all connected devices or only to the
 * specified socket
 * @param socket (optional) If no socket provided, config information is sent to ALL connected
 * devices
 */
exports.sendConfigInformation = function (socket) {
    var messageData = {
        messageId: utils.rand(),
        buzzersEnabled: state.getBuzzerStatus(),
        teamChangeAllowed: state.isTeamChangeAllowed(),
        excludedTeams: state.getExcludedTeams()
    };

    if (state.getBuzzerStatus()) {
        messageData.buzzerRound = state.getCurrentBuzzerRound();
    }

    if (socket) {
        this.emitMessageToSocket(socket, 'CHANGE:config', messageData);
    } else {
        sendMessageToAllAdmins('CHANGE:config', messageData);
        sendMessageToAllMonitors('CHANGE:config', messageData);

        // clients need special treatment because a client can be in a team which is excluded
        // from buzzing
        for (var i = 0; i < state.numClients(); ++i) {
            var client = state.getClientByPosition(i);
            this.sendConfigInformationToClient(client);
        }
    }
};

/**
 * Send the current config information (i.e. Buzzer status) to the given client. It is checked
 * whether the client's team is excluded from buzzing. In this case, the buzzingExcluded flag is
 * set to false.
 * @param client
 */
exports.sendConfigInformationToClient = function (client) {
    //cannot send information to not connected clients, client will receive information on reconnect
    if (!client.basicInfo.connected) {
        return;
    }
    var messageData = {
        messageId: utils.rand(),
        buzzersEnabled: state.getBuzzerStatus(),
        buzzerRound: state.getCurrentBuzzerRound(),
        buzzingExcluded: isThisClientExcludedFromBuzzer(client.basicInfo.clientToken),
        teamChangeAllowed: state.isTeamChangeAllowed(),
        excludedTeams: state.getExcludedTeams()
    };

    this.emitMessageToSocket(client.socket, 'CHANGE:config', messageData);
};

/**
 * Just calls disableBuzzers() on the state
 */
exports.disableBuzzers = function () {
    state.disableBuzzers();
};

/**
 * Buzz a random Team. Returns true iff a team which is allowed to buzz was found.
 */
exports.buzzRandomTeam = function () {

    if (countdownActive == true) {
        // silently fail if countdown is currently active
        return true;
    }

    var teamsAllowedToBuzz = teamsCanBuzz(state.getTeams());

    if (teamsAllowedToBuzz.length == 0) {
        return false;
    }

    var teamOffset = utils.randMinMax(0, teamsAllowedToBuzz.length);

    serverLog.admin("Admin randomly buzzed team: " + teamsAllowedToBuzz[teamOffset].teamName + ".");
    buzzTeam(teamsAllowedToBuzz[teamOffset].teamName);

    return true;
};

/**
 * Enables the buzzers by setting the currentBuzzerRound nonce and informs all connected
 * devices. Returns true if buzzers were enabled and false if not
 * @param buzzerRound
 * @return {boolean}
 */
exports.enableBuzzers = function (buzzerRound) {
    if (countdownActive) {
        // fail if countdown is currently active
        return false;
    }
    state.setCurrentBuzzerRound(buzzerRound);
    state.enableBuzzers();
    return true;
};

/**
 * Returns true iff the team with the given name is excluded.
 * @param teamName
 * @returns {boolean}
 */
exports.isThisTeamExcludedFromBuzzer = function (teamName) {
    return state.getExcludedTeams().indexOf(teamName) > -1;
};

/**
 * Set the score of all teams to the given points and send the TEAMS message to all connected
 * devices
 * @param points
 */
exports.setPointsOfAllTeamsAndInformAllDevices = function (points) {
    var teams = state.getTeams();
    for (var team = 0; team < teams.length; team++) {
        state.setPointsOfTeam(teams[team], points);
    }
    this.sendTeamInformation();
    serverLog.admin("Admin set the points of all teams to: " + points + ".");
};

/**
 * Called by admin to force a stop of countdown in progress.
 */
exports.forceStopCountdown = function () {
    if (countdownActive) {
        serverLog.admin("Running countdown was stopped by admin.");
        stopCountdown();
    }
};

/**
 * Emits the given message to given socket with the given eventName and issues a log for this
 * @param socket
 * @param eventName
 * @param message
 */
exports.emitMessageToSocket = function (socket, eventName, message) {
    serverLog.debug("Sent " + eventName + ": " + JSON.stringify(message));
    socket.emit(eventName, message);
};

/**
 * This method is called, if a client if a disconnected client is in the lobby team
 * It waits 30 seconds and than checks if the client is still in the described status.
 * If its the first try the method calls itself to try another time later else the client is removed
 * from the server state
 * @param client A client who is disconnected  and in lobby team
 * @param attempt Online status has already checked attempt times since disconnect
 */
exports.clientStillDisconnected = function (client) {
     client.timer = setTimeout(function () {
            if (!client.basicInfo.connected && client.team == state.lobbyTeam) {
                state.removeClientGivenToken(client.basicInfo.clientToken);
                //this also sends team information
                this_.removeClientFromTeamsGivenToken(client.basicInfo.clientToken);
            }
        }, 60000);
};

/******************************** BEGIN OF NON-PUBLIC FUNCTIONS! ********************************/
var this_ = this;

/**
 * Informs all devices that the team with the given name has buzzed. This method does no sanity
 * checks, so please make sure that the given teamName exists and makes sense
 * @param teamName
 * @param clientName (optional) name of client which has buzzed. This parameter is not required,
 * as it is possible that the team was buzzed by an admin
 */
function buzzTeam(teamName, clientName) {

    // deactivate the buzzers and inform all devices
    this_.disableBuzzers();
    this_.sendConfigInformation();

    var buzzAck = {
        messageId: utils.rand(),
        teamName: teamName,
        buzzerRound: state.getCurrentBuzzerRound(),
        countdown: state.getCurrentCountdownConfig()
    };

    // If there is a clientName provided, also includ this in the message
    if (clientName) {
        buzzAck.clientName = clientName;
    }

    sendMessageToAllClients('BUZZ:buzz:ack', buzzAck);
    sendMessageToAllAdmins('BUZZ:buzz:ack', buzzAck);
    sendMessageToAllMonitors('BUZZ:buzz:ack', buzzAck);

    serverLog.admin("Started countdown for team: " + teamName + ". Duration: " + state.getCurrentCountdownConfig() + " seconds.");
    /*  start server internal countdown
     currentCountdown is counted in deciseconds, and we add
     two additional deciseconds such that the BUZZ:stop message is not send too early to the
     connected devices */
    currentCountdown = state.getCurrentCountdownConfig() * 10 + 2;
    countdownActive = true;
    countdownInterval = setInterval(countDownInterval, 100); // interval set to 100ms = 1ds
}

/**
 * Creates a new team and save it in the state
 * @param teamName
 */
function createTeam(teamName) {
    var newTeam = {
        teamName: teamName,
        members: [],
        points: 0
    };
    state.addTeam(newTeam);
}

/**
 * Returns true iff the client corresponding to the given clientToken is currently in an
 * excluded team
 * @param clientToken
 */
function isThisClientExcludedFromBuzzer(clientToken) {
    var teamName = state.getClientGivenToken(clientToken).team;
    return this_.isThisTeamExcludedFromBuzzer(teamName);
}

/**
 * Sends the given messageData as the given messageType to all connected clients
 * @param messageType
 * @param messageData
 */
function sendMessageToAllClients(messageType, messageData) {
    for (var i = 0; i < state.numClients(); ++i) {
        var client = state.getClientByPosition(i);
        //only sends message to connected clients
        if (client.basicInfo.connected) {
            this_.emitMessageToSocket(client.socket, messageType, messageData);
        }
    }
}

/**
 * Sends the given messageData as the given messageType to all connected admins
 * @param messageType
 * @param messageData
 */
function sendMessageToAllAdmins(messageType, messageData) {
    for (var i = 0; i < state.numAdmins(); ++i) {
        this_.emitMessageToSocket(state.getAdminByPosition(i).socket, messageType, messageData);
    }
}

/**
 * Sends the given messageData as the given messageType to all connected monitors
 * @param messageType
 * @param messageData
 */
function sendMessageToAllMonitors(messageType, messageData) {
    for (var i = 0; i < state.numMonitors(); ++i) {
        this_.emitMessageToSocket(state.getMonitorByPosition(i).socket, messageType, messageData);
    }
}

/**
 * Filters a given list of teams to the list of teams that are allowed to buzz in the currentRound.
 */
function teamsCanBuzz(teams) {
    return teams.filter(teamCanBuzz);
    /**
     * Checks whether team is not the lobby team and is allowed to buzz
     * @param team
     * @returns {boolean}
     */
    function teamCanBuzz(team) {
        return !this_.isThisTeamExcludedFromBuzzer(team.teamName);
    }
}

/**
 * Stops the currentCountDown if there is a currentCountdown in progress, otherwise do nothing
 */
function stopCountdown() {
    if (countdownActive) {
        clearInterval(countdownInterval);
        countdownInterval = undefined;
        countdownActive = false;
        sendStopCountdown();

        // Maybe re-enable the buzzers if the server is configured to do so
        if (state.getAutoBuzzersEnablingStatus()) {
            this_.enableBuzzers(utils.rand());
            this_.sendConfigInformation();
            serverLog.admin("Automatically enabled buzzers again.");
        }
    }
}

/**
 *  Responsible to decrement the currentCountdown every second and calls stopCountdown() when
 *  currentCountdown <= 0
 */
function countDownInterval() {
    if (currentCountdown > 0) {
        currentCountdown -= 1;
        if (currentCountdown <= 0) {
            serverLog.admin("Countdown expired.");
            stopCountdown();
        }
    }
}

/**
 * Just sends a BUZZ:stop message to all connected devices without further checks if no socket is
 * provided. If a socket is provided, a message is only sent to this socket is sent
 */
function sendStopCountdown(socket) {
    var messageData = {
        messageId: utils.rand()
    };
    if (socket) {
        this_.emitMessageToSocket(socket, 'BUZZ:stop', messageData);
    }
    else {
        sendMessageToAllClients('BUZZ:stop', messageData);
        sendMessageToAllAdmins('BUZZ:stop', messageData);
        sendMessageToAllMonitors('BUZZ:stop', messageData);
    }
}
