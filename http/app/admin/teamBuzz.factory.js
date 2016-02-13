(function () {
    'use strict';

    angular.module('ServerApp')
        .factory('teamBuzzFactory', teamBuzzFactory);


    function teamBuzzFactory(messageNames, SocketFactory, randomFactory, authKey) {
        return {
            buzzRandomTeam: buzzRandomTeam,
            buzzTeam: buzzTeam,
            onBuzzTeamError: buzzTeamError,
            onBuzzAck: onBuzzAck,
            registerBuzzStop: onBuzzStop,
            stopBuzz: stopBuzz
        };

        function buzzTeamError(onCannotBuzzRandom) {
            SocketFactory.on(messageNames.buzzTeamError, onCannotBuzzRandom);
        }

        function onBuzzAck(callback){
            SocketFactory.on(messageNames.buzzAck, callback);
        }

        function onBuzzStop(callback){
            SocketFactory.on(messageNames.buzzStop, callback);
        }


        /**
         * make the first team member of TEAM buzz.
         * Assertion: only used when TEAM.members is not empty
         * @param team
         */
        function buzzTeam(team) {

            var buzzTeamData = {
                messageId: randomFactory.rand(),
                authKey: authKey.value
            };
            if (team) {
                buzzTeamData.teamName = team.teamName;
            }

            SocketFactory.emit(messageNames.buzzTeam, buzzTeamData);
        }

        function buzzRandomTeam(){
            buzzTeam();
        }

        function stopBuzz(){
            var stopBuzzData = {
                messageId: randomFactory.rand(),
                authKey: authKey.value
            };
            SocketFactory.emit(messageNames.buzzStop, stopBuzzData);
        }

    }

})();