(function () {
    'use strict';

    /**
     *The monitorConnectControl directive controls the connection to the server. It is
     *  responsible fo
     *  sending the HELLO:monitor message to the server and trying to reconnect when the
     *  connection to the server is lost.
     */

    angular.module('MonitorApp')
        .directive('monitorConnectControl', monitorConnectControl);

    function monitorConnectControl() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/monitor/monitorConnectControl/monitor-connect-control.html',
            controller: 'monitorConnectController',
            controllerAs: 'monitorConnectCtrl'
        };
    }

})();