// for secure token generation
var cryptoApi = require('crypto');
var tokenChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
var maxLen = 30;
var serverLog = require('./logger').getServerLog();
var serverState = require('./serverState');

// return values of name validation
var VALIDATION_STATUS = {
    SUCCESS:    {id: 0, value: true,    name: "SUCCESS",    // successful validation
        description: "Valid name.\n"},
    NO_NAME:    {id: 1, value: false,   name: "NO_NAME",    // no name provided
        description: "No name specified.\n"},
    TOO_LONG:   {id: 2, value: false,   name: "TOO_LONG",   // name longer than maxLen
        description: "Name must not be longer than "+maxLen.toString()+".\n"},
    LOBBY_ERR:  {id: 3, value: false,   name: "LOBBY_ERR",  // 'lobby' included in name
        description: "Names must not contain 'lobby' to avoid confusion.\n"},
    BCK_COLL:   {id: 4, value: false,   name: "BCK_COLL",   // collision with backup format chars
        description: "The name contains at least one char of the backup format ("+
            serverState.category_separator +
            serverState.team_client_separator +
            serverState.attribute_separator +
            ":" +
        ")\n"}
};


/**
 * Generation of sequence numbers.
 * @returns {number}
 */
exports.rand = function () {
    return Math.ceil(Math.random() * 10000000000);
};

exports.randMinMax = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

/**
 * Generates (admin) token as specified in the wiki, i.e. length of 15, containing tall and small
 * letters, as well as digits from 0 to 9.
 */
exports.generateToken = function () {
    //Note: standard same algorithm, but randomBytes returns error if entropy of underlying pool
    //  has not yet been seeded enough
    var buf = cryptoApi.pseudoRandomBytes(15);
    // transform to our encoding
    var token = '';
    for (var i = 0; i < buf.length; ++i) {
        token += tokenChars[buf[i] % tokenChars.length];
    }
    return token;
};

/**
 * Returns true if the given randomNumberToken is valid
 * @param randomNumberToken
 * @returns {boolean}
 */
exports.isValidRandomNumberToken = function (randomNumberToken) {
    //TODO make the length check working!
    if (!randomNumberToken || !(/^[0-9]+$/.test(randomNumberToken)) /*||
     !randomNumberToken.length >= randomNumberMinLength || !randomNumberToken.length <=
     randomNumberMaxLength */) {
        return false
    } else {
        return true;
    }
};

/**
 * Returns true if the given adminAuthKey is valid
 * @param adminAuthKey
 * @returns {boolean}
 */
exports.isValidAdminAuthKey = function (adminAuthKey) {
    // TODO: Remove this function completely to avoid dependency on 'serverState' in utils?
    if (!adminAuthKey || require('./serverState').getAdminAuthKey() != adminAuthKey) {
        return false;
    }
    else {
        return true;
    }
};

/**
 * Checks whether provided name is valid.
 * Value attribute of return value is true on success, else false.
 * @param clientName
 */
exports.isValidClientName = function (clientName) {
    // must provide name
    if (!clientName) {
        serverLog.debug("Empty clientName provided!\n");
        return VALIDATION_STATUS.NO_NAME;
    }
    // length restriction
    if (clientName.length > maxLen) {
        serverLog.warn("Given name too long: "+String(clientName.length));
        return VALIDATION_STATUS.TOO_LONG;
    }
    // filter out "lobby" and some versions of it
    var cpyName = clientName.toLowerCase();
    cpyName = cpyName.replace(/\s/g, '');
    // tall 'i' looks like small 'L' sometimes
    var pattern = RegExp(".*[li][o0]bby.*");
    if (!cpyName.localeCompare("lobby") || pattern.test(cpyName)) {
        serverLog.warn("Given name: "+String(clientName)+" too similar to 'lobby'");
        return VALIDATION_STATUS.LOBBY_ERR;
    }
    // check for backup format special unicode chars + CLI :
    var bck_pattern = RegExp("["
                                +serverState.category_separator
                                +serverState.team_client_separator
                                +serverState.attribute_separator
                                +":"+
                            "]");
    if(bck_pattern.test(clientName)) {
        serverLog.warn("Given name: "+String(clientName)+" contains char from backup format");
        return VALIDATION_STATUS.BCK_COLL;
    }
    return VALIDATION_STATUS.SUCCESS;
};

/**
 * Checks whether given team name is valid.
 * Value attribute of return value is true on success, else false.
 * @param teamName
 */
exports.isValidTeamName = function (teamName) {
    // enforce the same requirements as for client names
    return this.isValidClientName(teamName);
};


/**
 * Returns true if the given object is a boolean, i.e. true or false
 * @param boolean
 * @returns {boolean}
 */
exports.isValidBoolean = function (boolean) {
    return boolean == true || boolean == false;
};