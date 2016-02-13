(function () {
    'use strict';


    /**
     * TODO: doku
     */
    angular.module('ServerApp')
        .directive('adminCountdownReEnable', adminCountdownReEnable);

    function adminCountdownReEnable() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/admin/countdownReEnable/admin-countdown-re-enable.html',
            controller: 'adminCountdownReEnableController',
            controllerAs: 'reEnableCtrl'
        };
    }

})();