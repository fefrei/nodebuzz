(function () {
    'use strict';


    angular.module('ServerApp')
        .controller('adminBuzzerController', adminBuzzerController);

    function adminBuzzerController($rootScope, $scope ,changeConfigFactory, hotkeys, connectFactory, teamBuzzFactory) {
        var self = this;
        self.buzzersEnabled = false;
        self.buttonLabel = "Enable Buzzers";
        changeConfigFactory.onChangeConfig(onChangeConfig);
        connectFactory.onHelloAck(addHotkey);
        teamBuzzFactory.onBuzzAck(deactivateButton);
        teamBuzzFactory.registerBuzzStop(activateButton);
        $scope.$on('countDownExpired', activateButton);

        self.toggleBuzzer = toggleBuzzer;
        self.disabled = false;

        /**
         * Enables the buzzers if they are disabled and to disable them if they are enabled
         */
        function toggleBuzzer() {
            var enable = !self.buzzersEnabled;

            self.buzzersEnabled = enable;
            if (enable) {
                self.buttonLabel = "Disable Buzzers";
                $rootScope.$broadcast('resetBuzzed', 'no one');
            } else {
                self.buttonLabel = "Enable Buzzers";
            }

            changeConfigFactory.changeBuzzerStatus(enable);
        }

        /**
         * Updates the view according to the changed buzz:config DATA
         * Listens to changes to the buzzer
         */
        function onChangeConfig(data) {
            self.buzzersEnabled = data.buzzersEnabled;
            if (data.buzzersEnabled == false) {
                self.buttonLabel = "Enable Buzzers!";
            } else {
                self.buttonLabel = "Disable Buzzers!";
                $rootScope.$broadcast('resetBuzzed', 'no one');
            }
        }

        /**
         * Adds the possibility to use a hotkey to enable/disable the buzzer
         */
        function addHotkey(){
            hotkeys.add({
                combo: 'space',
                description: 'enable/disable the buzzer',
                callback: function (event) {
                    //prevent the default handler for space
                    event.preventDefault();
                    toggleBuzzer();
                }
            });
        }

        function deactivateButton(){
            self.disabled = true;
        }

        function activateButton(){
            self.disabled = false;
        }

    }
})();