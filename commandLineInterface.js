//Working with command line
var prompt = require('prompt');

//Logging System
var logSystem = require('./logger');
var serverLog = logSystem.getServerLog();

/* File System Object */
var fs = require('fs');

//Save and load saves
var sR = require('./stateRecovery');

//access the server state
var state = require('./serverState');

//access the server
var msgHandler = require('./messageHandler');

//access utils
var utils = require('./utils');

// create directory saves if not already there
if (!fs.existsSync("saves")) {
    fs.mkdirSync("saves");
}

//short help text
var helpText = "Valid commands are:\n" +
    "     about                          displays information about development team\n".grey +
    "     disable/enable buzzer          disables/enables buzzer\n" +
    "     fullHelp                       displays the extended info\n".grey +
    "     kickUser username              moves client to " + state.lobbyTeam + "\n" +
    "     loadServerState                loads the corresponding server state\n".grey +
    "     key                            prints the key needed to login as admin\n" +
    "     renameTeam oldName:newName     changes the name of team oldName to newName\n".grey +
    "     renameUser oldName:newName     changes the name of user oldName to newName\n" +
    "     reset                          resets the server state".grey;

//full help text
var fullHelp = "Valid commands are:\n" +
    "     about                          displays information about development team\n".grey +
    "     addPoints teamname:points      adds the given amount of points to given team\n" +
    "     changeTeam user:teamname       moves user user to the team teamname\n".grey +
    "     close                          ends the commandLineInterface\n" +
    "     createTeam teamname            creates team with name teamname\n".grey +
    "     deleteTeam teamname            deletes corresponding team and moves members into lobby\n" +
    "     disable/enable buzzer          disables/enables buzzer\n".grey +
    "     help                           displays the info\n" +
    "     fullHelp                       displays the extended info\n".grey +
    "     kickUser username              moves client to " + state.lobbyTeam + "\n" +
    "     loadServerState fileName       loads the corresponding server state\n".grey +
    "     printAK                        prints the key needed to login as admin\n" +
    "     renameTeam oldName:newName     changes the name of team oldName to newName\n".grey +
    "     renameUser oldName:newName     changes the name of user oldName to newName\n" +
    "     reset                          resets the server state\n".grey +
    "     saveServerState fileName       saves the current server state\n" +
    "     setCountdown newValue          sets the countdown start time to newValue\n".grey;


exports.startCLI = function () {
    setTimeout(function () {
        serverLog.info("This program can be controlled via command line:\n" + "Enter \"help\" to get" +
            " further details");
        comIntFace();
    }, 250);
};

/**
 * This starts one iteration of the command line interface
 * prompt is used to get the message from the terminal
 */
function comIntFace() {
    prompt.start();
    prompt.message = "";
    prompt.delimiter = "";
    var inputCom;
    prompt.get([{
            name: 'name',
            description: 'CLI:'.magenta
        }], function (err, result) {
            if (err) {
                serverLog.warn('CLI terminated by error or via CTL+C');
                serverLog.warn('Finishing process');
                process.exit(1);
                return;
            }
            inputCom = result.name;
            interpretInput(inputCom);
            return comIntFace();
        }
    );
}

/**
 * Interprets commands and performs the requested actions
 * @param inputCom the commands that needs to be interpreted
 */
function interpretInput(inputCom) {
    try {
        if (inputCom != null) {
            //switch that covers all implemented commands
            switch (true) {
                case inputCom == "help":
                    serverLog.info(helpText);
                    break;
                case inputCom == "fullHelp":
                    serverLog.info(fullHelp);
                    break;
                case stringStartsWith(inputCom, "saveServerState "):
                    saveServerState(inputCom);
                    break;
                case stringStartsWith(inputCom, "loadServerState"):
                    loadServerState(inputCom);
                    break;
                case inputCom == "reset":
                    state.resetServer();
                    break;
                case stringStartsWith(inputCom, "kickUser "):
                    kickUser(inputCom);
                    break;
                case (inputCom == "printAK" || inputCom == "print key" || inputCom == "printkey" || inputCom == "key"):
                    serverLog.info(state.getAdminAuthKey());
                    break;
                case inputCom == "close":
                    return;
                case inputCom == "disable buzzer" || inputCom == "d" || inputCom == "disabled":
                    state.disableBuzzers();
                    // Broadcast Buzzer status
                    msgHandler.sendConfigInformation();
                    break;
                case inputCom == "enable buzzer" || inputCom == "e" || inputCom == "enabled":
                    state.enableBuzzers();
                    // Broadcast Buzzer status
                    msgHandler.sendConfigInformation();
                    break;
                case stringStartsWith(inputCom, "createTeam "):
                    createTeam(inputCom);
                    break;
                case stringStartsWith(inputCom, "deleteTeam "):
                    deleteTeam(inputCom);
                    break;
                case stringStartsWith(inputCom, "changeTeam "):
                    changeTeam(inputCom);
                    break;
                case stringStartsWith(inputCom, "renameTeam "):
                    renameTeam(inputCom);
                    break;
                case stringStartsWith(inputCom, "renameUser "):
                    renameUser(inputCom);
                    break;
                case stringStartsWith(inputCom, "setCountdown "):
                    setCountdown(inputCom);
                    break;
                case stringStartsWith(inputCom, "addPoints "):
                    addPoints(inputCom);
                    break;
                case inputCom == "about":
                    serverLog.info("\nThis program was developed as project of the course Software " +
                        "Engineering by Andreas Zeller in ws 2015/2016 at Saarland University.\n" +
                        "Team Members: Cavelius, Mario\n" +
                        "              Jank, Oliver\n" +
                        "              Jany, Mathäus\n" +
                        "              Merkel, Dieter\n" +
                        "              Schwarz, Fabian\n" +
                        "              Speicher, Patrick\n" +
                        "              Wilhelm, Anna\n" +
                        "Client:       Freiberger, Felix\n" +
                        "Tutor:        Schlosser, Alex\n");
                    break;
                case inputCom == "cake":
                    serverLog.info("Never heard of it. Must be a lie!\n");
                    break;
                case(inputCom == "do a barrel roll" || inputCom == "use the force luke"):
                    serverLog.info("This isn't google ...\n");
                    break;
                case inputCom == "answer" :
                    serverLog.info("42\n");
                    break;
                //if the prompted command is not known the user gets informed that the command is unknown
                default:
                    serverLog.info("Don't know that one ...\n");
            }
        }
    }
    catch
        (err) {
        serverLog.error("Something went wrong! Please check if your arguments are valid for " +
            "the requested command.");
    }
}

//checks if the string string starts with string prefix
function stringStartsWith(string, prefix) {
    return string.slice(0, prefix.length) == prefix;
}

function saveServerState(inputCom){
    if (inputCom == "saveServerState") {
        serverLog.info("A file name is expected\n")
    }
    else {
        //extract the command
        inputCom = inputCom.replace("saveServerState ", "");
        //extract all other stuff not allowed in file names
        inputCom = inputCom.replace(/[`~!@#$%^&*()|+\-=?;:'",<>\{\}\[\]\\\/]/gi, '');
        sR.saveServerStateFileName("saves/" + inputCom);
    }
}

function loadServerState(inputCom){
    if (inputCom = "loadServerState") {
        sR.loadServerState();
        return;
    }
    inputCom = inputCom.replace("loadServerState ", "");
    //extract all other stuff not allowed in file names
    inputCom = inputCom.replace(/[`~!@#$%^&*()|+\-=?;:'",<>\{\}\[\]\\\/]/gi, '');
    sR.loadServerState("saves/" + inputCom);
}

function kickUser(inputCom){
    inputCom = inputCom.replace("kickUser ", "");
    if (inputCom == "") {
        serverLog.warn("no user name given\n");
        return;
    }
    var client = state.getClientGivenName(inputCom);
    if (client == null) {
        serverLog.warn("Couldn't find user with name: \"" + inputCom + "\"" + "\n");
        return;
    }
    state.removeClientFromTeamsGivenToken(client.basicInfo.clientToken);
    state.addClientToTeam(client.basicInfo, state.lobbyTeam);
    //Broadcast Team information
    msgHandler.sendTeamInformation();
}

function createTeam(inputCom){
    inputCom = inputCom.replace("createTeam ", "");
    if (state.teamNameAlreadyExists(inputCom)) {
        serverLog.warn("Given teamname already exists!\n");
        return;
    }
    var val_res = utils.isValidTeamName(inputCom);
    if (!val_res.value) {
        serverLog.warn(val_res.description);
        return;
    }
    var newTeam = {
        teamName: inputCom,
        members: [],
        points: 0
    };
    state.addTeam(newTeam);
    //Broadcast Team information
    msgHandler.sendTeamInformation();
}

function deleteTeam(inputCom){
    inputCom = inputCom.replace("deleteTeam ", "");
    if (inputCom == state.lobbyTeam) {
        serverLog.warn("Default team \"Lobby\" can't be deleted!\n");
        return;
    }
    if (!state.teamNameAlreadyExists(inputCom)) {
        serverLog.warn("Couldn't find team with name: \"" + inputCom + "\"" + "\n");
        return;
    }
    state.removeTeam(inputCom);
    //Broadcast Team information
    msgHandler.sendTeamInformation();
    msgHandler.sendConfigInformation();
}

function renameTeam(inputCom){
    inputCom = inputCom.replace("renameTeam ", "");
    var oldteam = inputCom.split(":")[0];
    var newteam = inputCom.split(":")[1];
    if (oldteam == "" || newteam == "") {
        serverLog.warn("Parameters not valid. Remember to use : to split old " +
            "and new teamname\n");
        return;
    }
    if (oldteam == "Lobby") {
        serverLog.warn("Can't rename team Lobby\n");
        return;
    }
    if (state.teamNameAlreadyExists(newteam)) {
        serverLog.warn("Name with this name already exists: \"" + newteam + "\"");
        return;
    }
    if (!state.teamNameAlreadyExists(oldteam)) {
        serverLog.warn("Team with this name was not found: \"" + oldteam + "\"");
        return;
    }
    var val_res = utils.isValidTeamName(newteam);
    if (!val_res.value) {
        serverLog.warn(val_res.description);
        return;
    }
    state.renameTeam(oldteam, newteam);
    //Broadcast Team information
    msgHandler.sendTeamInformation();
    msgHandler.sendConfigInformation();
}

function changeTeam(inputCom){
    inputCom = inputCom.replace("changeTeam ", "");
    var userteam = inputCom.split(":");
    var user = userteam[0];
    var team = userteam[1];
    if (user == "" || team == "") {
        serverLog.warn("Parameters not valid. Remember to use : to split user and name of new team\n");
        return;
    }
    if (!state.isTeamChangeAllowed()) {
        serverLog.warn("Team change is currently not allowed.\n")
    }
    if (!state.teamNameAlreadyExists(team)) {
        serverLog.warn("Couldn't find team with name: \"" + team + "\"" + "\n");
        return;
    }
    var client = state.getClientGivenName(user);
    if (client == null) {
        serverLog.warn("Couldn't find user with name: \"" + user + "\"" + "\n");
        return;
    }
    state.removeClientFromTeamsGivenToken(client.basicInfo.clientToken);
    state.addClientToTeam(client.basicInfo, team);
    //Broadcast Team information
    msgHandler.sendTeamInformation();
    // Broadcast Buzzer status
    msgHandler.sendConfigInformation();
}

function renameUser (inputCom) {
    inputCom = inputCom.replace("renameUser ", "");
    var useruser = inputCom.split(":");
    var olduser = useruser[0];
    var newuser = useruser[1];
    if (oldteam == "" || newteam == "") {
        serverLog.warn("Parameters not valid. Remember to use : to split old " +
            "and new username\n");
    }
    client = state.getClientGivenName(olduser);
    if (olduser == null) {
        serverLog.warn("User with this name wasn't found: \"" + olduser + "\"");
        return;
    }
    if (state.getClientGivenName(newuser) != null) {
        serverLog.warn("User with this name already exists: \"" + newuser + "\"");
        return;
    }
    var val_res = utils.isValidTeamName(newuser);
    if (!val_res.value) {
        serverLog.warn(val_res.description);
        return;
    }
    client.basicInfo.clientName = newuser;
    //Broadcast Team information
    msgHandler.sendTeamInformation();
}

function setCountdown(inputCom){
    inputCom = inputCom.replace("setCountdown ", "");
    inputCom = inputCom.replace(" ", "");
    if (isNaN(inputCom)) {
        serverLog.warn("Can't set countdown because given parameter is not a number: " + inputCom + "\n");
        return;
    }
    inputCom = parseInt(inputCom, 10);
    if (inputCom < 0) {
        serverLog.warn("Can't set countdown to a negative value\n");
        return;
    }
    if (inputCom > 600) {
        serverLog.warn("You can't set a countdown longer than 10 minutes.\n")
    }
    inputCom = Math.round(inputCom);
    state.setCurrentCountdownConfig(inputCom);
    // Broadcast config information to admins
    msgHandler.sendAdminConfigInformation();
}

function addPoints(inputCom){
    inputCom = inputCom.replace("addPoints ", "");
    var team = inputCom.split(":")[0];
    var points = inputCom.split(":")[1];
    if (team == "" || points == "") {
        serverLog.warn("Parameters not valid. Remember to use : to split team " +
            "and points\n");
        return;
    }
    if (points == null || isNaN(points)
        || !parseInt(Number(points)) == points || isNaN(parseInt(points, 10))) {
        serverLog.warn("Given value is not a number: " + points + "\n");
        return;
    }
    points = parseInt(points, 10);
    if (!state.teamNameAlreadyExists(team) || team == state.lobbyTeam) {
        serverLog.warn("Given teamname is not valid: " + team + "\n");
        return;
    }
    state.addPointsToTeam(team, points);
    //Broadcast Team information
    msgHandler.sendTeamInformation();
}

/**
 * This calls the intern function interpretInput with the parameter command
 * The only purpose of this is to test this module
 * @param command
 */
exports.testCLI = function (command) {
    interpretInput(command);
};