(function () {
    'use strict';

    angular.module('ClientApp')
        .directive('clientTeamPointsController', clientTeamPointsController);

    /**
     * This is the directive for the points controller.
     * Use:
     * <client-team-points-controller></client-team-points-controller>
     * to embed to controller in the html file.
     */

    function clientTeamPointsController(){
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/client/clientTeamPoints/client-team-points.html',
            controller: 'initTeamPointsController',
            controllerAs: 'teamPointsCtrl'
        };
    }

})();