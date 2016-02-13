
(function () {
    'use strict';

    angular.module('ServerApp')
        .factory('changeConfigFactory', changeConfigFactory);

    function changeConfigFactory(messageNames, SocketFactory, randomFactory, authKey){
        return {
            changeBuzzerStatus: setAndSendBuzzerConfig,
            onChangeConfig: onChangeConfig,
            changeCountdown: changeCountdown,
            onChangeConfigAdmin: onChangeConfigAdmin,
            changeTeamChangeAllowed: changeTeamChangeAllowed,
            changeExcludedTeams: changeExcludedTeams,
            changeBuzzReEnable: changeBuzzReEnable,
            registerLog: registerLog
        };

        function onChangeConfig(callback){
            SocketFactory.on(messageNames.changeConfig, callback);
        }

        /**
         * Sets the buzzer status according to the given boolean flag to enabled or disabled and sends the
         * information to the server
         * @param enable
         */
        function setAndSendBuzzerConfig(enable) {

            var CHANGE_config = {
                buzzersEnabled: enable
            };
            if (enable) {
                CHANGE_config.buzzerRound = randomFactory.rand();
            }
            sendChangeConfig(CHANGE_config, messageNames.changeConfig);
        }

        function onChangeConfigAdmin(callback){
            SocketFactory.on(messageNames.changeConfigAdmin, callback);
        }

        function registerLog(callback){
            SocketFactory.on(messageNames.logMessage, callback);
        }

        /**
         * Notifies the server about a change in the excludedTeams property
         * @param excludedTeams
         */
        function changeExcludedTeams(excludedTeams){
            var changeConfigDataParts = {
                excludedTeams: excludedTeams
            };
            sendChangeConfig(changeConfigDataParts, messageNames.changeConfig);
        }

        /**
         * Notifies the server about a change in the teamChangeAllowed property
         * @param teamChangeAllowed - new value
         */
        function changeTeamChangeAllowed(teamChangeAllowed){
            var changeConfigDataParts = {
                teamChangeAllowed: teamChangeAllowed
            };
            sendChangeConfig(changeConfigDataParts, messageNames.changeConfig);
        }

        /**
         * Adds to changeConfigDataParts the general properties messageId and authKey
         * @param changeConfigDataParts - parts of the change config message that contain
         * the information reflecting the change in the status
         */
        function sendChangeConfig(changeConfigDataParts, messageName){
            changeConfigDataParts.messageId = randomFactory.rand();
            changeConfigDataParts.authKey = authKey.value;
            SocketFactory.emit(messageName, changeConfigDataParts);
        }

        /**
         * Change the current start countdown value
         * @param newCountDown
         */
        function changeCountdown(newCountDown) {
            var changeCounterValueData = {
                messageId: randomFactory.rand(),
                authKey: authKey.value,
                countdown: newCountDown
            };

            SocketFactory.emit(messageNames.changeConfigAdmin, changeCounterValueData);

        }

        function changeBuzzReEnable(reEnable){
            var changeConfigAdminParts = {
                buzzersAutoEnable: reEnable
            };
            sendChangeConfig(changeConfigAdminParts, messageNames.changeConfigAdmin)
        }



    }


})();