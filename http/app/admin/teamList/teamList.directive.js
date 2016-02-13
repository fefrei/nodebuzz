(function () {
    'use strict';


    /**
     * Updates the view of the teamList on TEAMS messages from the server. Allows the admin to
     * modify any team in the game. (delete, change Members, activate/deactivate buzzer for
     * team, make a team buzz)
     */
    angular.module('ServerApp')
        .directive('adminTeamList', adminTeamList)
        .directive('onFinishRender', onFinishRender);

    function adminTeamList() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/admin/teamList/admin-team-list.html',
            controller: 'adminTeamListController',
            controllerAs: 'adminTeamCtrl'
        };
    }

    function onFinishRender(anchorTeam, $anchorScroll, $location) {
        return {
            restrict: 'A',
            link: linkingFunction
        };

        function linkingFunction(scope) {
            scope.$watch(function () {
                return anchorTeam.value;
            }, function (value) {
                if (value && scope.$last == true) {
                    $location.hash('teams');
                    $anchorScroll();
                }
            });


        }
    }
})();