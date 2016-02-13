(function () {
    'use strict';


    angular.module('ServerApp')
        .controller('adminConfigSoundController', adminConfigSoundController);

    function adminConfigSoundController($scope, soundEnabled, hotkeys, connectFactory) {
        var self = this;
        self.soundEnabled = soundEnabled.value;

        connectFactory.onHelloAck(addHotkey);

        function addHotkey(){
            hotkeys.add({
                combo: 's',
                description: 'enable/disable the sound',
                callback: function() {
                    self.soundEnabled = !self.soundEnabled;
                }
            });
        }

        $scope.$watch('configSoundCtrl.soundEnabled', onChangeReEnable);
        function onChangeReEnable(newValue, oldValue) {
            if(newValue == undefined){
                return
            }
            soundEnabled.value = newValue;

        }
    }
})();