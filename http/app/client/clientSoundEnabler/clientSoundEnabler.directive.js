(function () {
    'use strict';

    angular.module('ClientApp')
        .directive('clientSoundEnablerController', clientSoundEnablerController);

    /**
     * This is the directive for the sound enabler controller.
     * Use:
     * <client-sound-enabler--controller></client-sound-enabler--controller>
     * to embed to controller in the html file.
     */

    function clientSoundEnablerController(){
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/client/clientSoundEnabler/client-sound-enabler.html',
            controller: 'initSoundEnablerController',
            controllerAs: 'soundEnablerCtrl'
        };
    }

})();