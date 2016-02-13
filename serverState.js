// separators for backup file format (cf. wiki)
const category_separator      = '\u2722';     // between categories like teams, clients,
                                            // buzzerAutoEnabled, ...
const team_client_separator   = '\u2740';     // between clients, teams, ...
const attribute_separator     = '\u2733';     // between attributes of teams or clients

exports.category_separator = category_separator;
exports.team_client_separator = team_client_separator;
exports.attribute_separator = attribute_separator;

//messageHandler
var msgHandler = require('./messageHandler');

//utils
var utils = require('./utils');

//Logging System
var logSystem = require('./logger');
var serverLog = logSystem.getServerLog();

// the string defining the name of the Lobby team
const lobbyTeam = 'Lobby';
exports.lobbyTeam = lobbyTeam;

// the key used to authenticate the admin
var adminAuthKey = '';

// the current countdown duration in seconds
var currentCountdownConfig = 5;

// the current buzzerRound nonce
var currentBuzzerRound = -1;
var buzzerEnabled = false;
var buzzersAutoEnabled = false;
var teamChangeAllowed = true;
var admins = [];
var clients = [];
var monitors = [];

// the teams list with initial Lobby team
var teams = [{
    teamName: lobbyTeam,
    members: [],
    points: 0
}];

// list of names of teams which are currently not allowed to buzz, independent of buzzerEnabled
var excludedTeams = [lobbyTeam];

exports.numClients = function () {
    return clients.length;
};

exports.numAdmins = function () {
    return admins.length;
};

exports.numMonitors = function () {
    return monitors.length;
};

exports.getClientByPosition = function (pos) {
    return clients[pos];
};

exports.getAdminByPosition = function (pos) {
    return admins[pos];
};

exports.getMonitorByPosition = function (pos) {
    return monitors[pos];
};

exports.setAdminAuthKey = function (newValue) {
    adminAuthKey = newValue;
};

exports.getAdminAuthKey = function () {
    return adminAuthKey;
};

exports.setCurrentBuzzerRound = function (newValue) {
    currentBuzzerRound = newValue;
};

exports.getCurrentBuzzerRound = function () {
    return currentBuzzerRound;
};

exports.newRound = function () {
    currentBuzzerRound++;
};

exports.setCurrentCountdownConfig = function (newValue) {
    currentCountdownConfig = newValue;
};

exports.getCurrentCountdownConfig = function () {
    return currentCountdownConfig;
};

/**
 * sets buzzerEnabled to true
 */
exports.enableBuzzers = function () {
    buzzerEnabled = true;
};

/**
 * sets buzzerEnabled to false
 */
exports.disableBuzzers = function () {
    buzzerEnabled = false;
    currentBuzzerRound = -1;
};

exports.getBuzzerStatus = function () {
    return buzzerEnabled;
};

exports.enableAutoBuzzersEnabling = function () {
    buzzersAutoEnabled = true;
};

exports.disableAutoBuzzersEnabling = function () {
    buzzersAutoEnabled = false;
};

exports.getAutoBuzzersEnablingStatus = function () {
    return buzzersAutoEnabled;
};


exports.allowTeamChange = function () {
    teamChangeAllowed = true;
};

exports.disallowTeamChange = function () {
    teamChangeAllowed = false;
};

exports.isTeamChangeAllowed = function () {
    return teamChangeAllowed;
};

exports.addAdmin = function (adminName) {
    admins.push(adminName);
};

/**
 * Add the given amount of points to the team with the corresponding teamname
 * @param teamName name of the teams the points should be added to
 * @param points the amount of points that shall be added
 */
exports.addPointsToTeam = function (teamName, points) {
    var team = this.getTeamGivenTeamname(teamName);
    this.setPointsOfTeam(team, team.points + points);
    serverLog.admin(teamName + " has new score: " + team.points + ".");
};

/**
 * Set the score of the given team to points
 * @param team
 * @param points
 */
exports.setPointsOfTeam = function (team, points) {
    team.points = points;
    if (team.points >= 1000000) {
        team.points = 999999;
    }
    if (team.points <= -1000000) {
        team.points = -999999;
    }
};

/**
 * Renames team with name oldName to newName
 * @param oldName
 * @param newName
 */
exports.renameTeam = function (oldName, newName) {
    var team = this.getTeamGivenTeamname(oldName);
    team.teamName = newName;
    for (var client = 0; client < team.members.length; client++) {
        client.team = newName;
    }
    for (var ex = 0; ex < excludedTeams.length; ex++) {
        if (excludedTeams[ex] === oldName) {
            excludedTeams[ex] === newName;
        }
    }
    serverLog.admin("Team: " + oldName + " was renamed to: " + newName + ".");
};

exports.removeAdmin = function (adminSocket) {
    for (var i = 0; i < admins.length; ++i) {
        if (admins[i].socket == adminSocket) {
            admins.splice(i--, 1);
            break;
        }
    }
};

exports.addClient = function (clientInformation) {
    clients.push(clientInformation);
};

exports.removeClientGivenToken = function (clientToken) {
    for (var i = 0; i < clients.length; ++i) {
        if (clients[i].basicInfo.clientToken == clientToken) {
            clients.splice(i--, 1);
            break;
        }
    }
};

exports.addMonitor = function (monitorInformation) {
    monitors.push(monitorInformation);
};

exports.removeMonitor = function (monitorSocket) {
    for (var i = 0; i < monitors.length; ++i) {
        if (monitors[i].socket == monitorSocket) {
            monitors.splice(i--, 1);
            break;
        }
    }
};

/**
 * Return the client with the given clientToken.
 * @param clientToken
 * @returns {*}
 */
exports.getClientGivenToken = function (clientToken) {
    for (var i = 0; i < clients.length; ++i) {
        if (clients[i].basicInfo.clientToken == clientToken) {
            return clients[i];
        }
    }
    return null;
};

/**
 *
 * @param teamName
 * @returns {{teamName, members}|*}
 */
exports.getTeamGivenTeamname = function (teamName) {
    for (var i = 0; i < teams.length; ++i) {
        var currentTeam = teams[i];
        if (currentTeam.teamName == teamName) {
            //directly return since there shouldn't be several teams with the same name
            return currentTeam;
        }
    }
};

/**
 * Removes client corresponding to given clientToken from team struct.
 * @param clientToken
 */
exports.removeClientFromTeamsGivenToken = function (clientToken) {
    for (var team = 0; team < teams.length; ++team) {
        for (var member = 0; member < teams[team].members.length; member++) {
            if (teams[team].members[member].clientToken == clientToken) {
                teams[team].members.splice(member--, 1);

                // immediately return as a client should not be in multiple teams at the same time
                return;
            }
        }
    }
};

/**
 * returns client corresponding to given name
 * @param name name of the client
 */
exports.getClientGivenName = function (name) {
    for (var client = 0; client < clients.length; ++client) {
        var currentClient = clients[client];
        if (currentClient.basicInfo.clientName == name) {
            //immediately return as there shouldn't be several clients with the same name
            return currentClient;
        }
    }
    return null;
};

/**
 * Insert the given client basicinfo into the team with the specified name. Return true if a
 * team with the given teamName was found and else otherwise.
 * @param clientBasicInfo
 * @param teamName
 * @returns {boolean}
 */
exports.addClientToTeam = function (clientBasicInfo, teamName) {
    var client = this.getClientGivenName(clientBasicInfo.clientName);
    for (var team = 0; team < teams.length; ++team) {
        if (teams[team].teamName == teamName) {
            teams[team].members.push(clientBasicInfo);
            client.team = teamName;
            if (client.timer && teamName != lobbyTeam){
                clearTimeout(client.timer);
            }
            //if a disconnected client gets moved to the lobby he gets removed from the game after 60 seconds
            if (!clientBasicInfo.connected && teamName == lobbyTeam) {
                msgHandler.clientStillDisconnected(client, 0);
            }
            return true;
        }
    }
    return false;
};

/**
 * Returns true if a client with a clientToken different from the given clientToken has a clientName
 * equal to the given name.
 * @param clientToken
 * @param name
 * @returns {boolean}
 */
exports.clientNameAlreadyExists = function (clientToken, name) {
    for (var client = 0; client < clients.length; ++client) {
        var currentClient = clients[client];
        if (currentClient.basicInfo.clientToken != clientToken && currentClient.basicInfo.clientName == name) {
            // We found another client with the same name
            return true;
        }
    }
    return false;
};

/**
 * Return true iff a team with the given teamName exists.
 * @param teamName
 * @returns {boolean}
 */
exports.teamNameAlreadyExists = function (teamName) {
    for (var team = 0; team < teams.length; ++team) {
        if (teams[team].teamName == teamName) {
            return true;
        }
    }
    return false;
};


exports.addTeam = function (team) {
    teams.push(team);
};

/**
 * Simply deletes the team with the given teamName, but additionally moves all clients in the
 * deleted team to the Lobby team. Btw, the Lobby team cannot be deleted.
 * @param teamName
 */
exports.removeTeam = function (teamName) {

    //Lobby must not be deleted
    if (teamName == lobbyTeam) {
        return;
    }

    for (var team = 0; team < teams.length; ++team) {
        if (teams[team].teamName == teamName) {
            for (var member = 0; member < teams[team].members.length; ++member) {
                var clientBasics = teams[team].members[member];
                this.addClientToTeam(clientBasics, lobbyTeam);
                serverLog.admin("Client: " + clientBasics.clientName + " was automatically moved" +
                    " to the Lobby.");
            }

            // delete the team
            teams.splice(team--, 1);

            // immediately return as only one team with the given name shall exist
            break;
        }
    }

    for (var team = 0; team < excludedTeams.length; ++team) {
        if (excludedTeams[team] == teamName) {
            // delete the team
            excludedTeams.splice(team--, 1);

            // immediately return as only one team with the given name shall exist
            break;
        }
    }
};

exports.getTeams = function () {
    return teams;
};

exports.getExcludedTeams = function () {
    return excludedTeams;
};

exports.setExcludedTeams = function (newExcludedTeams) {
    excludedTeams = newExcludedTeams;

    // ensure that the Lobby team is always excluded
    if (excludedTeams.indexOf(lobbyTeam) == -1) {
        excludedTeams.push(lobbyTeam);
    }
};


/**
 * creates a string which is used to write the backup files
 * Further information (esp. to the file type) can be found in the documentation
 * @returns {string}
 */
exports.getGameStateString = function () {
    return adminAuthKey + category_separator + currentCountdownConfig + category_separator + currentBuzzerRound +
        category_separator + getTeamString() + category_separator + getClientString() + category_separator +
        getExcludedTeamString() + category_separator + buzzersAutoEnabled + category_separator + teamChangeAllowed +
        category_separator + buzzerEnabled;
};

/**
 * creates the client part of the game string
 */
function getClientString() {
    var clientString = "";
    for (var client = 0; client < clients.length; ++client) {
        var currentClient = clients[client];
        if (client == clients.length - 1) {
            clientString = clientString.concat(currentClient.basicInfo.clientToken + attribute_separator +
                currentClient.basicInfo.clientName + attribute_separator + currentClient.team);
        }
        else {
            clientString = clientString.concat(currentClient.basicInfo.clientToken + attribute_separator +
                currentClient.basicInfo.clientName + attribute_separator + currentClient.team + team_client_separator);
        }
    }
    return clientString;
}

/**
 * creates the team part of the game string
 */
function getTeamString() {
    var teamString = "";
    for (var team = 0; team < teams.length; ++team) {
        var currentTeam = teams[team];
        if (team == teams.length - 1) {
            teamString = teamString + currentTeam.teamName + attribute_separator + currentTeam.points;
        }
        else {
            teamString = teamString + currentTeam.teamName + attribute_separator + currentTeam.points + team_client_separator;
        }
    }
    return teamString;
}

/**
 * creates the excludedTeam part of the game string
 */
function getExcludedTeamString() {
    var excludedString = "";
    for (var ex = 0; ex < excludedTeams.length; ++ex) {
        var currentTeam = excludedTeams[ex];
        if (ex == excludedTeams.length - 1) {
            excludedString = excludedString + currentTeam;
        }
        else {
            excludedString = excludedString + currentTeam + team_client_separator;
        }
    }
    return excludedString;
}

/**
 * Given a game string, this method parses the string and sets the single
 * fields of the server state to the values given in the string
 * Further information can be found in the documentation
 * @param gameString
 */
exports.setGameStateByString = function (gameString) {
    try {
        var input = gameString.split(category_separator);

        //import the admin key information
        adminAuthKey = input[0];

        //load integer values

        //countdown config
        if (input[1] == "" || isNaN(input[1])) {
            throw TypeError;
        }
        else {
            currentCountdownConfig = parseInt(input[1], 10);
        }

        //buzzer round
        if (input[2] == "" || isNaN(input[2])) {
            throw TypeError;
        }
        else {
            currentBuzzerRound = parseInt(input[2], 10);
        }

        //type check and loading of teamChangeAllowed
        teamChangeAllowed = JSON.parse(input[6]);
        if (typeof(teamChangeAllowed) != "boolean") {
            throw TypeError;
        }

        //load boolean values

        //type check and loading of buzzersAutoEnabled
        buzzersAutoEnabled = JSON.parse(input[7]);
        if (typeof(buzzersAutoEnabled) != "boolean") {
            throw TypeError;
        }

        //type check and loading of buzzerEnabled
        buzzerEnabled = JSON.parse(input[8]);
        if (typeof(buzzerEnabled) != "boolean") {
            throw TypeError;
        }

        //import teams
        var teamList = input[3];
        teams = [{
            teamName: lobbyTeam,
            members: [],
            points: 0
        }];
        if (teamList != "") {
            teamList = teamList.split(team_client_separator);
            for (var team = 0; team < teamList.length; ++team) {
                var currentTeam = teamList[team].split(attribute_separator);
                var teamName = currentTeam[0];
                var points = parseInt(currentTeam[1]);
                if (!this.teamNameAlreadyExists(teamName)) {
                    var newTeam = {
                        teamName: teamName,
                        members: [],
                        points: points
                    };
                    teams.push(newTeam);
                }
            }
        }

        //import clients
        var clientList = input[4];
        clients = [];
        if (clientList != "") {
            clientList = clientList.split(team_client_separator);
            for (var client = 0; client < clientList.length; ++client) {
                var currentClient = clientList[client];
                var information = currentClient.split(attribute_separator);
                var token = information[0];
                var name = information[1];
                var team = information[2];
                if (!this.clientNameAlreadyExists(token, name)) {
                    var oldClient = {
                        socket: null,
                        basicInfo: {
                            clientToken: token,
                            clientName: name,
                            connected: false
                        },
                        team: team,
                        timer: null
                    };
                    //add it to the client list
                    clients.push(oldClient);
                    if (this.teamNameAlreadyExists(oldClient.team)) {
                        this.addClientToTeam(oldClient.basicInfo, oldClient.team);
                    }
                    else {
                        this.addClientToTeam(oldClient.basicInfo, lobbyTeam);
                    }
                }
            }
        }

        //set excluded teams
        var oldExcludedTeams = input[5].split(team_client_separator);
        excludedTeams = [lobbyTeam];
        if (oldExcludedTeams != "") {
            for (var excluded = 0; excluded < oldExcludedTeams.length; ++excluded) {
                var exTeam = oldExcludedTeams[excluded];
                //-1 if not found
                if (excludedTeams.indexOf(exTeam) < 0) {
                    excludedTeams.push(exTeam);
                }
            }
        }

        //Broadcast Team information
        msgHandler.sendTeamInformation();
        //Broadcast Buzzer status
        msgHandler.sendConfigInformation();
        // Broadcast config information to admins
        msgHandler.sendAdminConfigInformation();

        serverLog.info("Loaded old server state successfully.\n" +
            "Note: This also reloaded the old authKey: " + adminAuthKey);
    }
    catch (err) {
        serverLog.info("Couldn't load old server state. Trying to reset server instead.");
        this.resetServer();
    }
};

/**
 * Resets the server state to the default value
 * The only assumptions
 *  - clients get removed to the lobby team
 *  - monitors stay connected
 *
 *  More information can be found in the documentation
 */
exports.resetServer = function () {
    adminAuthKey = utils.generateToken();
    currentBuzzerRound = -1;
    currentCountdownConfig = 5;
    buzzerEnabled = false;
    buzzersAutoEnabled = false;
    teamChangeAllowed = true;
    for (var client = 0; client < clients.length; ++client) {
        var currentClient = clients[client];
        this.removeClientFromTeamsGivenToken(currentClient.basicInfo.clientToken);
        this.addClientToTeam(currentClient.basicInfo, lobbyTeam);
    }
    admins = [];
    for (var team = 0; team < teams.length; ++team) {
        if (teams[team].teamName == lobbyTeam) {
            teams = [teams[team]];
            break;
        }
    }
    excludedTeams = [lobbyTeam];

    //Broadcast Team information
    msgHandler.sendTeamInformation();
    //Broadcast Buzzer status
    msgHandler.sendConfigInformation();
    // Broadcast config information to admins
    msgHandler.sendAdminConfigInformation();

    serverLog.admin("Reset of server state successful");
    serverLog.admin("New authKey: " + adminAuthKey);
};