function init() {
    var app = angular.module('ClientApp', ['sharedFactories', 'helperDirectives', 'ui.bootstrap-slider', 'ui.bootstrap']);

    /**
     * The active window.
     * Use this to switch between windows.
     * See client-switch.html for valid values.
     * Event to update this variable: 'activeWindowChanged'
     */
    app.value('activeWindow', {
        value: 'NONE'
    });

    /**
     * the name of the device.
     * event to update this variable: 'deviceNameChanged'
     */
    app.value('deviceName', {
        value: 'DEFAULT DEVICE'
    });

    /**
     * the name of the own team.
     * event to update this variable: 'teamNameChanged'
     */
    app.value('teamName', {
        value: 'DEFAULT TEAM'
    });

    /**
     * list of available teams.
     * event to update this variable: 'teamDataChanged'
     */
    app.value('teamsData', {
        value: []
    });

    /**
     * token of the client.
     * event to update this variable: 'tokenChanged'
     */
    app.value('token', {
        value: 'DEFAULT TOKEN'
    });

    /**
     * Socket events. The socket can get any of this events a any time.
     * See comments below.
     */
    app.constant('socketEvents', {
        /**
         * Can be a response to every message send to server.
         *
         * ERROR
         * 'originatorId': the Id of the message which caused the error
         * 'errorMessage': optional error message which explains what went wrong
         */
        error : 'ERROR',

        /**
         * Can be a response to a helloClient message send to server.
         *
         * ERROR:HELLO:client
         * 'originatorId': the Id of the message which caused the error
         * 'errorMessage': optional error message which explains what went wrong
         */
        errorHelloClient : 'ERROR:HELLO:client',

        /**
         * Can be a response to a teamCreate message send to server.
         *
         * ERROR:TEAMS:create
         * 'originatorId': the Id of the message which caused the error
         * 'errorMessage': optional error message which explains what went wrong
         */
        errorTeamsCreate : 'ERROR:TEAMS:create',

        /**
         * This is a response for a valid helloClient message send to server.
         *
         * HELLO:ack
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'token': authKey or clientToken from HELLO_admin respectively HELLO_client. token is a
         *          fresh random token if the client did not sent a token
         * 'clientName': must be included for sending it to a client (not valid for admin and
         *               monitor). It is either the name which the server remembered or the
         *               clientName which was included in the HELLO:client message
         */
        helloAck : 'HELLO:ack',

        /**
         * This can be send to a server to register a client.
         *
         * HELLO:client
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'clientToken': (optional), if the client has saved its unique token from the last session
         * 'clientName': (optional), if the client wants a new name
         */
        helloClient : 'HELLO:client',

        /**
         * This is send by server when there are new information about the teams. E.g.: new team is
         * created, someone switches teams etc.
         *
         * TEAMS
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'teams': a list of objects. Every object has the following data:
         * -- 'teamName': name of this team
         * -- 'score': current points
         * -- 'members': a list of objects. Every object has the following information:
         * ---- 'clientToken': token to uniquely identify the client
         * ---- 'clientName': name of the client
         */
        teams : 'TEAMS',

        /**
         * This message is send to server when the client wants to change the team.
         *
         * TEAMS:change
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'clientToken': for uniquely identifying the client
         * 'teamName': the name of the team, the client wants to join
         */
        teamsChange : 'TEAMS:change',

        /**
         * This message is send to server when the client want to create a new team. The client does
         * not switch to the new created team with this message.
         *
         * TEAMS:create
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'teamName': the name of the new team
         */
        teamsCreate : 'TEAMS:create',

        /**
         * This is send by the server when there are changes in the game such as a new round,
         * buzzer button is disabled or enabled, some teams are excluded from buzzing etc.
         *
         * CHANGE:config
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'buzzersEnabled': true or false indicate whether the buzzers shall be enabled or disabled
         * 'buzzerRound': (only valid if buzzersEnabled is true) fresh random token generated by
         *                admin to identify this round, such that other BUZZ messages can be
         *                associated with this round
         * 'teamChangeAllowed': true or false whether team creation/deletion or switching for
         *                      clients is allowed or not
         * 'excludedTeams': teams corresponding to the teamNames in this list are not receiving
         *                  further BUZZ:config messages as long as the admin does not remove the
         *                  team from the list. These teams cannot buzz and the client should
         *                  display this fact to the user. This is independent from the enable flag.
         */
        changeConfig : 'CHANGE:config',

        /**
         * This message is send by server to inform the client that the server has registered a
         * valid buzz.
         *
         * BUZZ:buzz:ack
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'clientName': (optional) name of client which has buzzed if there is one. If the team was
         *               buzzed by admin, no clientName can be provided in this message
         * 'teamName': name of the client's team which has buzzed
         * 'buzzerRound': the corresponding buzzer round token, included in the BUZZ:config message
         *                and BUZZ:buzz:trial message
         * 'countdown': the countdown in seconds
         */
        buzzBuzzAck : 'BUZZ:buzz:ack',

        /**
         * This message is be send to server when the client is buzzing.
         *
         * BUZZ:buzz:trial
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'clientToken': for uniquely identifying the client
         * 'buzzerRound': the corresponding buzzer round token, included in the BUZZ:config message
         */
        buzzBuzzTrial : 'BUZZ:buzz:trial',

        /**
         * This message is send by server. The client stops the countdown when receiving this
         * message.
         *
         * BUZZ:stop
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         */
        buzzStop : 'BUZZ:stop',

        /**
         * This message is send by the server. When this message arrives the client updates its
         * name.
         *
         * CLIENT:name
         * 'messageId': fresh random number to identify exactly this message in an ERROR message,
         * 'authKey': (only sent from admin to server) authentication key to authenticate the admin,
         * 'token': for uniquely identifying the client,
         * 'newName': the clients new name
         */
        clientName : 'CLIENT:name',


        /**
         * These are the standard events of socket.io
         */

        /**
         * Fired upon a successful connection.
         */
        connect: 'connect',

        /**
         * Fired upon a disconnect.
         */
        disconnect : 'disconnect',

        /**
         * Fired upon an incoming message.
         */
        message : 'message',

        /**
         * Fired upon a connection error.
         * Parameters:
         * Object - error object
         */
        connectError: 'connect_error',

        /**
         * Fired upon a connection timeout.
         */
        connectTimeout : 'connect_timeout',

        /**
         * Fired upon a successful reconnection.
         * Parameters:
         * Number - reconnection attempt number
         */
        reconnect : 'reconnect',

        /**
         * Fired upon an attempt to reconnect.
         */
        reconnectAttempt : 'reconnect_attempt',

        /**
         * Fired upon an attempt to reconnect.
         * Parameters:
         * Number - reconnection attempt number
         */
        reconnecting : 'reconnecting',

        /**
         * Fired upon a reconnection attempt error.
         * Parameters:
         * Object - error object
         */
        reconnectError : 'reconnect_error',

        /**
         *  Fired when could not reconnect.
         */
        reconnectFailed : 'reconnect_failed'
    });

    /**
     * Events that rootScope may fire at any time.
     */
    app.constant('rootScopeEvents', {
        /**
         * Fire this event to let the switch controller know, if it should display the blocker.
         * This event is used by the connect.factory to block the interface until all socket events
         * are registered.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.changeBlockerStatus, DISPLAY, MESSAGE);
         * DISPLAY is a boolean. true if the blocker should be visible, false otherwise.
         *
         * MESSAGE is a string. This shows a message in the blocker. MESSAGE is not used when
         * DISPLAY is false.
         */
        changeBlockerStatus : 'changeBlockerStatus',

        /**
         * Fire tis event to change the message in the blocker.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.setBlockerMessage, MESSAGE);
         * MESSAGE is a string. The message in the blocker will change to MESSAGE.
         */
        setBlockerMessage : 'setBlockerMessage',

        /**
         * Fire this event to start the blocker animation text.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.startBlockerAnimation);
         */
        startBlockerAnimation : 'startBlockerAnimation',

        /**
         * Fire this event to stop the blocker animation text.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.stopBlockerAnimation);
         */
        stopBlockerAnimation : 'stopBlockerAnimation',

        /**
         * Fire this event to change the name of the device. This will not change the global device
         * name.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.deviceNameChanged, NAME);
         * NAME is a string. This is the device new name.
         */
        deviceNameChanged : 'deviceNameChanged',

        /**
         * Fire this event to change the own team. This will not change the own global team name.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.teamNameChanged, TEAM);
         * TEAM is a string. This is the team name of the own team.
         */
        teamNameChanged : 'teamNameChanged',

        /**
         * Fire this event to change the team data. This will not chnage the global team data.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.teamsDataChanged, DATA);
         * DATA is an Object. See wiki or socketEvents documentation for more information.
         */
        teamsDataChanged : 'teamsDataChanged',

        /**
         * Fire this event to change the token. This will not change the global token.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.tokenChanged, TOKEN);
         * TOKEN is a number.
         */
        tokenChanged : 'tokenChanged',

        /**
         * Fire this event to change the active window.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.activeWindowChanged, WINDOW);
         * WINDOW is a string. See switch-controller.html for valid values.
         */
        activeWindowChanged : 'activeWindowChanged',

        /**
         * Fire this event when all socket events are registered. This will trigger the auto
         * reconnect of the client.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.socketEventsRegistered);
         */
        socketEventsRegistered : 'socketEventsRegistered',

        /**
         * Fire this event to show an error in the login view.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.helloError, MESSAGE);
         * MESSAGE is a string. This message will be used for the error text.
         */
        helloError : 'helloError',

        /**
         * Fire this event to change the buzzer status.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.teamChangeAllowed, ENABLED, ROUND, EXCLUDED_TEAMS);
         * ENABLED is a boolean. true if it is allowed to buzz, false otherwise.
         * ROUND is a number. The round id which needs to be send when buzzing.
         * EXCLUDED_TEAMS is a string list. Teams which are not allowed to buzz.
         */
        buzzerStatusChanged : 'buzzerStatusChanged',

        /**
         * Fire this event when a team has buzzed.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.buzzed, CLIENT, TEAM, COUNTDOWN);
         * CLIENT is a string. The device which buzzed
         * TEAM is a string. The team which buzzed
         * COUNTDOWN is a number. The countdown until the buzzer will activate
         */
        buzzed : 'buzzed',

        /**
         * Fire this event when changing the team switch status.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.teamChangeAllowed, ENABLED);
         * ENABLED is a boolean. true if it is allowed to change teams, false otherwise.
         */
        teamChangeAllowed : 'teamChangeAllowed',


        /**
         * Fire this event to show an error message when creating a team.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.errorTeamCreate, MESSAGE);
         * MESSAGE is a string. This text will be shown as error text.
         */
        errorTeamCreate : 'errorTeamCreate',

        /**
         * Fire this event to let the client know that the points of own team has been updated.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.teamPointsUpdate, POINTS);
         * POINTS is a number. The points of the own team.
         */
        teamPointsUpdate : 'teamPointsUpdate',

        /**
         * Fire this event to stop the countdown and leave the buzzer deactivated.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.stopCountdown);
         */
        stopCountdown : 'stopCountdown',

        /**
         * This event is fired when an error message arrives from server.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.error, MESSAGE);
         */
        error : 'error',

        /**
         * This event is fired when the login is successful.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.helloAck);
         */
        helloAck : 'helloAck',

        /**
         * Fire this event when the buzz is triggered
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.buzzTrggered);
         */
        buzzTriggered : 'buzzTriggered',

        /**
         * Fire this event when reconnecting to server when the server is lost is successful.
         *
         * Use:
         * $rootScope.$emit(rootScopeEvents.reconnected);
         */

        reconnected : 'reconnected'
    });

    /**
     * The valid window views.
     */
    app.constant('windowViews', {
        /**
         * login view
         */
        login : 'login',

        /**
         * buzzer view
         */
        buzzer : 'buzzer',

        /**
         * team selection view
         */
        selectTeam : 'selectTeam',

        /**
         * calibration view
         */
        changeSensitivity : 'changeSensitivity',

        /**
         * team points view
         */
        teamPoints : 'teamPoints',

        /**
         * sound enable view
         */
        sound : 'sound'
    });

    /**
     * This are standard values such as the team name when first login to the serer
     */
    app.constant('standardValues', {
        /**
         * Lobby team. This is the team the client is in when login as a new device.
         */
        lobbyTeam : 'Lobby'
    });

    /**
     * Buzzer states. Used to set a color for the buzzer.
     */
    app.constant('buzzerState', {
        /**
         * Buzzer state when disabled.
         */
        disabled : 'disabled',

        /**
         * Buzzer state when enabled.
         */
        enabled : 'enabled',

        /**
         * Buzzer state when self buzzed.
         */
        selfBuzzed : 'selfBuzzed',

        /**
         * Buzzer state when team buzzed but not the client itself
         */
        teamBuzzed : 'teamBuzzed',

        /**
         * Buzzer status when another team buzzed
         */
        lateBuzzed : 'lateBuzzed',

        /**
         * Buzzer state when the own team is excluded
         */
        excluded : 'excluded',

        /**
         * Buzzer status when triggered the buzz and awaiting the reply from server
         */
        buzzTriggered : 'buzzTriggered'
    });

    /**
     * Values for team points view. They are used to sort the teams.
     */
    app.constant('sortBy', {
        /**
         * This will sort the team list by team name
         */
        teamName : 'teamName',

        /**
         * This will sort the teams by team points
         */
        teamPoints : 'teamPoints',

        /**
         * This will sort the teams by member size
         */
        teamMember : 'teamMember'
    });

    /**
     * Setting for device motion.
     */
    app.value('accelParameter', {
        /**
         * Values for storing the motion settings.
         */
        storageName: 'nodeBuzz2AccelSens',

        /**
         * Min. value for sensitivity.
         */
        min: 0,

        /**
         * Max. value for sensitivity.
         */
        max: 20,

        /**
         * Steps in which the slider will move.
         */
        step: 0.01,

        /**
         * slider background color when disabled
         */
        progressBarBgColor: 'background-color: #333333;'
    });
}
init();