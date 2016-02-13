(function () {
    'use strict';


    angular.module('ServerApp')
        .controller('adminTeamChangeAllowedController', adminTeamChangeAllowedController);

    function adminTeamChangeAllowedController($scope, changeConfigFactory, hotkeys, connectFactory) {
        var self = this;
        var buttonText = {
            disallow: "Disallow Team Change",
            allow: "Allow Team Change"
        };
        self.teamChangeAllowed = true;

        changeConfigFactory.onChangeConfig(onChangeConfig);
        connectFactory.onHelloAck(addHotkey);
        $scope.$watch('changeTeamCtrl.teamChangeAllowed', changeTeamChanged);

        function addHotkey(){
            hotkeys.add({
                combo: 'c',
                description: 'Allow/Disallow the changing of teams for clients',
                callback: function() {
                    self.teamChangeAllowed = !self.teamChangeAllowed;
                }
            });

        }


        function changeTeamChanged(newValue, oldValue) {
            if (newValue == oldValue || newValue == undefined)
                return;

            changeConfigFactory.changeTeamChangeAllowed(newValue);

        }

        function onChangeConfig(data) {
            self.teamChangeAllowed = data.teamChangeAllowed;

        }

    }
})();