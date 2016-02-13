(function () {
    'use strict';


    angular.module('ServerApp')
        .controller('adminStopBuzzerController', adminStopBuzzerController);

    function adminStopBuzzerController(teamBuzzFactory, $scope){
        var self = this;
        self.collapsed = true;
        self.sendStop = teamBuzzFactory.stopBuzz;
        teamBuzzFactory.registerBuzzStop(onBuzzStop);
        teamBuzzFactory.onBuzzAck(onBuzzAck);
        $scope.$on('countDownExpired', onBuzzStop);
        $scope.$on('resetBuzzed', onBuzzStop);

        function onBuzzStop(){
            self.collapsed = true;
        }

        function onBuzzAck(){
            self.collapsed = false;
        }

    }
})();