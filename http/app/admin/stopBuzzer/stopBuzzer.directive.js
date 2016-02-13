(function () {
    'use strict';

    /**
     * TODO: doku
     */
    angular.module('ServerApp')
        .directive('adminStopBuzzer', adminStopBuzzer);

    function adminStopBuzzer() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/admin/stopBuzzer/admin-stop-buzzer.html',
            controller: 'adminStopBuzzerController',
            controllerAs: 'stopBuzzCtrl'
        };
    }

})();