(function () {
    'use strict';

    /**
     * The monitorTeamsController controls the list of the teams, when it is shown, which kind
     * (dependent on the view) and whether the members are shown or not
     */

    angular.module('MonitorApp')
        .directive('monitorTeamsControl', monitorTeamsControl);

    function monitorTeamsControl() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/monitor/monitorTeamsControl/monitor-teams-control.html',
            controller: 'monitorTeamsController',
            controllerAs: 'monitorTeamsCtrl'
        };
    }

})();