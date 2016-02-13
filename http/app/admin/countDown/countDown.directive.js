(function () {
    'use strict';


    /**
     * Responsible to inform the admin which team has buzzed first in the current game round and
     * sets the countdown for the time that is left for the team to give an answer. The countdown
     * actualizes itself every second.
     */
    angular.module('ServerApp')
        .directive('adminCountDown', adminCountDown);


    function adminCountDown() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/admin/countDown/admin-count-down.html',
            controller: 'adminCountDownController',
            controllerAs: 'adminCountDownCtrl'
        };
    }

})();