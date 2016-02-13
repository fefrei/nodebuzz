(function () {
    'use strict';

    /**
     * The monitorBuzzerControl directive controls two different aspects of the monitor (only in
     * the case that a dynamical view is chosen): When the buzzers are enabled, the monitor shows
     * that the teams can buzz (except the ones that are excluded from buzzing), when someone
     * buzzed, the monitor shows a countdown and the name of the team which has buzzed
     */

    angular.module('MonitorApp')
        .directive('monitorBuzzerControl', monitorBuzzerControl);

    function monitorBuzzerControl() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/monitor/monitorBuzzerControl/monitor-buzzer-control.html',
            controller: 'monitorBuzzerController',
            controllerAs: 'monitorBuzzerCtrl'
        };
    }

})();