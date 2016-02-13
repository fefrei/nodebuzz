(function () {
    'use strict';


    /**
     * The adminConfig directive implements the logic of changing any configurable values (for
     * now the counter value). The admin can submit a new counter value to the server.
     */
    angular.module('ServerApp')
        .directive('adminConfig', adminConfig);

    function adminConfig() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/admin/cdConfig/admin-config.html',
            controller: 'adminConfigController',
            controllerAs: 'adminConfigCtrl'
        };
    }

})();