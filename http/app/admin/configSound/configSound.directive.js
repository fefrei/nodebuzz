(function () {
    'use strict';


    /**
     * TODO: doku
     *
     */
    angular.module('ServerApp')
        .directive('adminConfigSound', adminConfigSound);

    function adminConfigSound() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/admin/configSound/admin-config-sound.html',
            controller: 'adminConfigSoundController',
            controllerAs: 'configSoundCtrl'
        };
    }

})();