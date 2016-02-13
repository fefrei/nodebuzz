(function () {
    'use strict';

    /**
     * The monitorSettingsControl directive controls the four settings:
     * 1)If the standard view is chosen, it controls if the team-members are shown or hidden
     * 2)The sound of the monitor can be set on mute or audible
     * 3)The style of the monitor can be changed
     * 4)There are 4 different views (2 dynamic, 2 static) which can be chosen
     */

    angular.module('MonitorApp')
        .directive('monitorSettingsControl', monitorSettingsControl);

    function monitorSettingsControl() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/monitor/monitorSettingsControl/monitor-settings-control.html',
            controller: 'monitorSettingsController',
            controllerAs: 'monitorSettingsCtrl'
        };
    }

})();