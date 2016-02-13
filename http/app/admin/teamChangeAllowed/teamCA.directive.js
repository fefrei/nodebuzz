(function () {
    'use strict';


    /**
     * TODO: doku
     */
    angular.module('ServerApp')
        .directive('adminTeamChangeAllowed', adminTeamChangeAllowed);

    function adminTeamChangeAllowed() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/admin/teamChangeAllowed/admin-team-change-allowed.html',
            controller: 'adminTeamChangeAllowedController',
            controllerAs: 'changeTeamCtrl'
        };
    }
})();