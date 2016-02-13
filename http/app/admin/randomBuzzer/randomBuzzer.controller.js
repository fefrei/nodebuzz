(function () {
    'use strict';

    angular.module('ServerApp')
        .controller('adminRandomBuzzController', adminRandomBuzzController);

    function adminRandomBuzzController($timeout, $scope, teamBuzzFactory, hotkeys, connectFactory) {
        var self = this;
        var errorShowTime = 4000;
        self.disabled = false;
        self.buzzRandomTeam = teamBuzzFactory.buzzRandomTeam;
        self.cannotBuzzRandom = false;
        teamBuzzFactory.onBuzzTeamError(onCannotBuzzRandom);
        teamBuzzFactory.registerBuzzStop(enableButton);
        teamBuzzFactory.onBuzzAck(disableButton);
        connectFactory.onHelloAck(addHotKey);
        $scope.$on('countDownExpired', enableButton);


        function addHotKey(){
            hotkeys.add({
                combo: 'r',
                description: 'Buzz a random team',
                callback: self.buzzRandomTeam
            });
        }



        /**
         * Handles error when teamBuzz was not possible
         * Shows the Error message and hides it after errorShowTime has passed
         */
        function onCannotBuzzRandom() {
            self.cannotBuzzRandom = true;
            $timeout(function () {
                self.cannotBuzzRandom = false;
            }, errorShowTime);
        }

        function enableButton(){
            self.disabled = false;
        }

        function disableButton(){
            self.disabled = true;
        }
    }

})();