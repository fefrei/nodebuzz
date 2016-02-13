(function () {
    'use strict';


    angular.module('ServerApp')
        .directive('adminResetPoints', resetPoints);

    function resetPoints() {
        return {
            restrict: 'E',
            templateUrl: 'app/admin/resetPoints/resetPoints.html',
            controller: 'resetPointsController',
            controllerAs: 'resetPointsCtrl'
        };
    }

})();