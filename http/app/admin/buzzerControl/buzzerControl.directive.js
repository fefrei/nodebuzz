(function () {
    'use strict';


    /**
     * The adminBuzzerControl directive controls the button for Enabling and Disabling the
     * buzzers of the clients.
     * The variable buzzersEnabled indicates if the buzzers of the clients are
     * enabled. A call of the function enableOrDisableBuzzers disables the buzzers if the
     * buzzers are activated (and buzzersEnabled is true) and sets buzzerEnabled to true.
     * Otherwise it enables the buzzers (they are deactivated), sets buzzersEnabled to false and
     * removes the name of the team that has buzzed before.
     * TODO: Can be restructured, I think the code is a little bit bizarre
     */
    angular.module('ServerApp')
        .directive('adminBuzzerControl', adminBuzzerControl);

    function adminBuzzerControl() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/admin/buzzerControl/admin-buzzer-control.html',
            controller: 'adminBuzzerController',
            controllerAs: 'adminCtrl'
        };
    }

})();