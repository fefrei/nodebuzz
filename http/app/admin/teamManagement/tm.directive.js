(function () {
    'use strict';


    /**
     * Allows the admin to create a new team.
     */
    angular.module('ServerApp')
        .directive('adminTeamManagement', adminTeamManagement);

    function adminTeamManagement() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/admin/teamManagement/admin-team-management.html',
            controller: 'adminTeamManagementController',
            controllerAs: 'adminTeamMngmtCtrl'
        };
    }

})();