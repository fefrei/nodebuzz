(function () {
    'use strict';


    angular.module('ServerApp')
        .directive('adminLogView', adminLogView);

    function adminLogView() {
        return {
            restrict: 'E',
            templateUrl: 'app/admin/logView/admin-log-view.html',
            controller: 'logViewController',
            controllerAs: 'logViewCtrl'
        };
    }
})();