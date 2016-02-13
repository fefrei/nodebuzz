(function () {
    'use strict';


    angular.module('ServerApp')
        .factory('teamFactory', teamFactory);

    function teamFactory(randomFactory, authKey, SocketFactory, messageNames) {
        return{
            addTeam: addTeam,
            onTeamCreateError: onTeamCreateError,
            deleteTeam: deleteTeam,
            changePoints: changePoints,
            onTeams: onTeams,
            teamChange: teamChange,
            resetPoints: resetPoints
        };

        function onTeamCreateError(callback){
            SocketFactory.on(messageNames.teamsCreateError, callback);
        }

        function onTeams(callback){
            SocketFactory.on(messageNames.teams, callback);
        }

        /**
         * creates a new team
         * @param teamName
         */
        function addTeam(teamName) {
            var teamCreateData = {
                messageId: randomFactory.rand(),
                authKey: authKey.value,
                teamName: teamName
            };
            SocketFactory.emit(messageNames.teamsCreate, teamCreateData);
        }

        /**
         * deletes an existing team
         * @param teamName
         */
        function deleteTeam(teamName) {
            var teamDeleteData = {
                messageId: randomFactory.rand(),
                authKey: authKey.value,
                teamName: teamName
            };
            SocketFactory.emit(messageNames.teamsDelete, teamDeleteData);
        }

        function changePoints(teamName, amount) {

            var teamsPointsData = {
                messageId: randomFactory.rand(),
                authKey: authKey.value,
                teamName: teamName,
                points: parseInt(amount, 10)

            };
            SocketFactory.emit(messageNames.teamsPoints, teamsPointsData)

        }

        function teamChange(clientToken, newTeamName){
            var teamsChangeData = {
                messageId: randomFactory.rand(),
                clientToken: clientToken,
                authKey: authKey.value,
                teamName: newTeamName
            };
            SocketFactory.emit(messageNames.teamsChange, teamsChangeData);
        }

        function resetPoints(){
            var resetPointsData = {
                messageId: randomFactory.rand(),
                authKey: authKey.value
            };
            SocketFactory.emit(messageNames.teamsResetPoints, resetPointsData);
        }
    }
})();