(function () {
    'use strict';

    /**
     * Implements the button allowing the admin to buzz a random team
     */
    angular.module('ServerApp')
        .directive('adminRandomBuzz', adminRandomBuzz);

    function adminRandomBuzz() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/admin/randomBuzzer/admin-random-buzz.html',
            controller: 'adminRandomBuzzController',
            controllerAs: 'randomBuzzCtrl'
        };
    }

})();