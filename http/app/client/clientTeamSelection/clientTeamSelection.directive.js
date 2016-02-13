(function () {
    'use strict';

    angular.module('ClientApp')
        .directive('clientTeamSelectionController', clientTeamSelectionController);

    /**
     * This is the directive for the swicth controller.
     * Use:
     * <client-team-selection-controller></client-team-selection-controller>
     * to embed to controller in the html file.
     */

    function clientTeamSelectionController(){
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/client/clientTeamSelection/client-team-selection.html',
            controller: 'initTeamSelectionController',
            controllerAs: 'teamSelectionCtrl'
        };
    }

})();