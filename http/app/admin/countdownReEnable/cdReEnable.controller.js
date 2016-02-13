(function () {
    'use strict';


    angular.module('ServerApp')
        .controller('adminCountdownReEnableController', adminCountdownReEnableController);

    function adminCountdownReEnableController(changeConfigFactory, $scope, hotkeys, connectFactory) {
        var self = this;
        self.reEnable = false;
        changeConfigFactory.onChangeConfigAdmin(onChangeConfigAdmin);
        connectFactory.onHelloAck(addHotkey);
        $scope.$watch('reEnableCtrl.reEnable', onChangeReEnable);

        function addHotkey(){
            hotkeys.add({
                combo: 'o',
                description: 'enable/disable auto enabling of buzzers after end of countdown',
                callback: function() {
                    self.reEnable = !self.reEnable;
                }
            });
        }


        function onChangeConfigAdmin(data) {
            self.reEnable = data.buzzersAutoEnable;
        }

        function onChangeReEnable(newValue, oldValue) {
            if(newValue == undefined){
                return
            }
            if (newValue != oldValue) {
                changeConfigFactory.changeBuzzReEnable(newValue);
            }
        }
    }
})();