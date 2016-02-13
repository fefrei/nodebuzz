(function () {
    'use strict';

    /**
     * TODO: documentation
     */
    angular.module('ServerApp')
        .factory('changeNamesFactory', changeNamesFactory);


    function changeNamesFactory(messageNames, SocketFactory, randomFactory, authKey) {



        return {
            registerErrorTeamName: registerErrorTeamName,
            registerTeamChangeName: registerTeamChangeName,
            registerClientChangeName: registerClientChangeName,
            registerErrorClientName: registerErrorClientName,
            changeTeamName: changeTeamName,
            changeClientName: changeClientName
        };

        function getMessageHead(){
            var messageHead = {
                messageId: randomFactory.rand(),
                authKey: authKey.value
            };
            return messageHead;
        }

        function registerErrorTeamName(callback){
            SocketFactory.on(messageNames.teamNameError, callback);
        }

        function registerErrorClientName(callback){
            SocketFactory.on(messageNames.clientNameError, callback);
        }

        function registerClientChangeName(callback){
            SocketFactory.on(messageNames.clientChangeName, callback);
        }


        function registerTeamChangeName(callback){
            SocketFactory.on(messageNames.teamChangeName, callback);
        }

        function changeTeamName(oldTeamName, newTeamName){
            var teamChangeNameData = getMessageHead();
            teamChangeNameData.teamName = oldTeamName;
            teamChangeNameData.newTeamName = newTeamName;
            SocketFactory.emit(messageNames.teamChangeName, teamChangeNameData);

        }

        function changeClientName(clientToken, newName){
            var clientChangeNameData = getMessageHead();
            clientChangeNameData.token = clientToken;
            clientChangeNameData.newName = newName;
            SocketFactory.emit(messageNames.clientChangeName, clientChangeNameData);
        }

    }

})();