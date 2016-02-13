(function () {
    'use strict';

    angular.module('ClientApp')
        .factory('connectFactory', connectFactory);

    /**
     *  This is the factory for connection.
     *
     *  Use:
     *  connectFactory.registerEvents(): to register the on events.
     *  connectFactory.helloClient(NAME): use to send a HELLO:client message. When no NAME is given
     *  the client tries to reconnect.
     *  connectFactory.teamsChange(TEAM_NAME): use to change the team to TEAM_NAME.
     *  connectFactory.teamsCreate(TEAM_NAME): use to create a new team and change the team to it.
     *  connectFactory.buzzBuzzTrial(ROUND): use to send a buzz to the server for a given ROUND.
     */

    function connectFactory(    $log,
                                $rootScope,
                                $interval,
                                $window,
                                token,
                                socketEvents,
                                rootScopeEvents,
                                clientValuesFactory,
                                windowViews,
                                tokenFactory,
                                SocketFactory,
                                randomFactory){
        return{
            registerEvents : registerSocketEvents,
            helloClient : emitHelloClient,
            teamsChange : emitTeamsChange,
            teamsCreate : emitTeamsCreate,
            buzzBuzzTrial : emitBuzzBuzzTrial
        }

        /**
         * Register incoming events.
         * This function emits a 'eventRegistered' in rootScope
         * after 300ms. This time should be enough to register all events.
         */
        function registerSocketEvents() {
            $rootScope.$emit(rootScopeEvents.changeBlockerStatus, true,
                'Initializing, please wait!');

            SocketFactory.on(socketEvents.error, onError);
            SocketFactory.on(socketEvents.errorHelloClient, onErrorHelloClient);
            SocketFactory.on(socketEvents.errorTeamsCreate, onErrorTeamsCreate);
            SocketFactory.on(socketEvents.helloAck, onHelloAck);
            SocketFactory.on(socketEvents.teams, onTeams);
            SocketFactory.on(socketEvents.changeConfig, onChangeConfig);
            SocketFactory.on(socketEvents.buzzBuzzAck, onBuzzBuzzAck);
            SocketFactory.on(socketEvents.buzzStop, onBuzzStop);
            SocketFactory.on(socketEvents.clientName, onClientName);

            SocketFactory.on(socketEvents.connect, onConnect);
            SocketFactory.on(socketEvents.disconnect, onDisconnect);
            SocketFactory.on(socketEvents.message, onMessage);
            SocketFactory.on(socketEvents.connectError, onConnectError);
            SocketFactory.on(socketEvents.connectTimeout, onConnectTimeout);
            SocketFactory.on(socketEvents.reconnect, onReconnect);
            SocketFactory.on(socketEvents.reconnectAttempt, onReconnectAttempt);
            SocketFactory.on(socketEvents.reconnecting, onReconnecting);
            SocketFactory.on(socketEvents.reconnectError, onReconnectError);
            SocketFactory.on(socketEvents.reconnectFailed, onReconnectFailed);

            $interval(function(){
                $rootScope.$emit(rootScopeEvents.changeBlockerStatus, false);
                $rootScope.$emit(rootScopeEvents.socketEventsRegistered);
            }, 300, 1);
        }

        /**
         * This can be send to a server to register a client.
         *
         * HELLO:client
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'clientToken': (optional), if the client has saved its unique token from the last session
         * 'clientName': (optional), if the client wants a new name
         *
         * @param name: Set a name when the client want to register to the server. If not set the
         *              client use the token and tries to reconnect.
         */
        function emitHelloClient(name){
            $log.info('[SEND]'+socketEvents.helloClient+': '+name);
            if(name == undefined){
                var msgValue = {
                    messageId: randomFactory.rand(),
                    clientToken: token.value
                };
                SocketFactory.emit(socketEvents.helloClient, msgValue);
            } else {
                var msgValue = {
                    messageId: randomFactory.rand(),
                    clientName: name
                };
                SocketFactory.emit(socketEvents.helloClient, msgValue);
            }
        }

        /**
         * Send to server to switch to a team.
         *
         * TEAMS:change
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'clientToken': for uniquely identifying the client
         * 'teamName': the name of the team, the client wants to join
         *
         * @param teamName: the name of the team to which the client wants to switch.
         */
        function emitTeamsChange(teamName){
            $log.info('[SEND]'+socketEvents.teamsChange+': '+teamName);
            var msgValue = {
                messageId: randomFactory.rand(),
                clientToken : token.value,
                teamName: teamName
            };
            SocketFactory.emit(socketEvents.teamsChange, msgValue);
        }

        /**
         * Send to server to create a new team.
         *
         * TEAMS:create
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'teamName': the name of the new team
         *
         * @param teamName: the name for the new team.
         */
        function emitTeamsCreate(teamName){
            $log.info('[SEND]'+socketEvents.teamsCreate+': '+teamName);
            var msgValue = {
                messageId: randomFactory.rand(),
                teamName: teamName
            };
            SocketFactory.emit(socketEvents.teamsCreate, msgValue);
        }

        /**
         * Send to server when the client is buzzing.
         *
         * BUZZ:buzz:trial
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'clientToken': for uniquely identifying the client
         * 'buzzerRound': the corresponding buzzer round token, included in the BUZZ:config message
         *
         * @param round: the round for which the client wants to buzz
         */
        function emitBuzzBuzzTrial(round){
            $log.info('[SEND]'+socketEvents.buzzBuzzTrial+': '+round);
            var msgValue = {
                messageId: randomFactory.rand(),
                clientToken : token.value,
                buzzerRound : round
            };
            SocketFactory.emit(socketEvents.buzzBuzzTrial, msgValue);
        }

        /**
         * Can be a response to every message send to server.
         *
         * ERROR
         * 'originatorId': the Id of the message which caused the error
         * 'errorMessage': optional error message which explains what went wrong
         */
        function onError(data){
            $log.info('[GOT]'+socketEvents.error+': '+data.errorMessage);
            $rootScope.$emit(rootScopeEvents.error, data.errorMessage);
        }

        /**
         * Can be a response to a helloClient message send to server.
         *
         * ERROR:HELLO:client
         * 'originatorId': the Id of the message which caused the error
         * 'errorMessage': optional error message which explains what went wrong
         */
        function onErrorHelloClient(data){
            $log.info('[GOT]'+socketEvents.errorHelloClient+': '+data.errorMessage);
            $rootScope.$emit(rootScopeEvents.helloError, data.errorMessage);
            $rootScope.$emit(rootScopeEvents.changeBlockerStatus, false);
        }

        /**
         * Can be a response to a teamCreate message send to server.
         *
         * ERROR:TEAMS:create
         * 'originatorId': the Id of the message which caused the error
         * 'errorMessage': optional error message which explains what went wrong
         */
        function onErrorTeamsCreate(data){
            $log.info('[GOT]'+socketEvents.errorTeamsCreate+': '+data.errorMessage);
            $rootScope.$emit(rootScopeEvents.errorTeamCreate, data.errorMessage);
        }

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
        function onHelloAck(data){
            $log.info('[GOT]'+socketEvents.helloAck+': '+data.clientName+'|'+data.token);
            clientValuesFactory.setDeviceName(data.clientName);
            clientValuesFactory.setToken(data.token);
            tokenFactory.saveToken(data.token);
            $rootScope.$emit(rootScopeEvents.changeBlockerStatus, false);
            $rootScope.$emit(rootScopeEvents.helloAck);
            clientValuesFactory.setActiveWindow(windowViews.selectTeam);
        }

        /**
         * This is send by server when there are new information about the teams. E.g.: new team is
         * created, someone switches teams etc. It also sends a teamNameChanged event.
         *
         * TEAMS
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         * 'teams': a list of objects. Every object has the following data:
         * -- 'teamName': name of this team
         * -- 'points': current points
         * -- 'members': a list of objects. Every object has the following information:
         * ---- 'clientToken': token to uniquely identify the client
         * ---- 'clientName': name of the client
         * ---- 'connected' : is the client connected
         */
        function onTeams(data){
            $log.info('[GOT]'+socketEvents.teams+': '+JSON.stringify(data.teams));
            $rootScope.$emit(rootScopeEvents.teamsDataChanged, data.teams);

            for (var i = 0; i < data.teams.length; i++) {
                var team = data.teams[i];
                for (var j = 0; j < team.members.length; j++) {
                    if (team.members[j].clientToken == token.value) {
                        clientValuesFactory.setDeviceName(team.members[j].clientName);
                        $rootScope.$emit(rootScopeEvents.teamNameChanged, team.teamName);
                        $rootScope.$emit(rootScopeEvents.teamPointsUpdate, team.points);
                        return;
                    }
                }
            }
        }

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
         * 'buzzingExcluded': true if the own team is excluded from buzzing. false otherwise.
         */
        function onChangeConfig(data){
            $log.info(JSON.stringify(data));
            $log.info('[GOT]'+socketEvents.changeConfig+': '+data.buzzersEnabled+'|'
                                                            +data.buzzerRound+'|'
                                                            +data.excludedTeams+'|'
                                                            +data.teamChangeAllowed+'|'
                                                            +data.buzzingExcluded);
            $rootScope.$emit(rootScopeEvents.buzzerStatusChanged, data.buzzersEnabled,
                                                                    data.buzzerRound,
                                                                    data.excludedTeams,
                                                                    data.buzzingExcluded);
            $rootScope.$emit(rootScopeEvents.teamChangeAllowed, data.teamChangeAllowed);
        }

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
        function onBuzzBuzzAck(data){
            $log.info('[GOT]'+socketEvents.buzzBuzzAck+': '+data.clientName+'|'
                                                            +data.teamName+'|'
                                                            +data.countdown);
            $rootScope.$emit(rootScopeEvents.buzzed, data.clientName, data.teamName,
                data.countdown);
        }

        /**
         * This message is send by server. The client stops the countdown when receiving this
         * message.
         *
         * BUZZ:stop
         * 'messageId': fresh random number to identify exactly this message in an ERROR message
         */
        function onBuzzStop(data){
            $log.info('[GOT]'+socketEvents.buzzStop);
            $rootScope.$emit(rootScopeEvents.stopCountdown);
        }

        /**
         * This message is send by the server. The client updates its name.
         *
         * CLIENT:name
         * messageId': fresh random number to identify exactly this message in an ERROR message,
         * 'token': for uniquely identifying the client,
         * 'newName': the clients new name
         */
        function onClientName(data){
            $log.info('[GOT]'+socketEvents.clientName+': '+data.newName);
            clientValuesFactory.setDeviceName(data.newName);
        }

        /**
         * Fired upon a successful connection.
         */
        function onConnect(){

        }

        /**
         * Fired upon a disconnect.
         */
        function onDisconnect(){
            $log.info('[GOT]'+socketEvents.disconnect);
            $rootScope.$emit(rootScopeEvents.changeBlockerStatus, true, 'Lost server. Trying to reconnect!');
        }

        /**
         * Fired upon an incoming message.
         * TODO: find out which parameter are there
         */
        function onMessage(){

        }

        /**
         * Fired upon a connection error.
         * Parameters:
         * Object - error object
         */
        function onConnectError(obj){

        }

        /**
         * Fired upon a connection timeout.
         */
        function onConnectTimeout(){

        }

        /**
         * Fired upon a successful reconnection.
         * Parameters:
         * Number - reconnection attempt number
         */
        function onReconnect(number){
            $log.info('[GOT]'+socketEvents.reconnect+': '+number);
            //$window.location.reload();
            $rootScope.$emit(rootScopeEvents.reconnected);
        }

        /**
         * Fired upon an attempt to reconnect.
         */
        function onReconnectAttempt(){

        }

        /**
         * Fired upon an attempt to reconnect.
         * Parameters:
         * Number - reconnection attempt number
         */
        function onReconnecting(number){
            $log.info('[GOT]'+socketEvents.reconnecting+': '+number);
            $rootScope.$emit(rootScopeEvents.changeBlockerStatus, true, 'Lost server. Reconnect attempt: '+number);
        }

        /**
         * Fired upon a reconnection attempt error.
         * Parameters:
         * Object - error object
         */
        function onReconnectError(obj){

        }

        /**
         *  Fired when could not reconnect.
         */
        function onReconnectFailed(){
            $log.info('[GOT]'+socketEvents.reconnectFailed);
            $rootScope.$emit(rootScopeEvents.changeBlockerStatus, true, 'Failed to reconnect to the server!');
        }

    }

})();