(function () {
    'use strict';

    angular.module('ClientApp')
        .controller('initSoundEnablerController', initSoundEnablerController);

    /**
     *  This is the sound enabler controller.
     *
     * Use:
     * soundEnablerCtrl.allow(): plays the buzz sound with volume 0, changes the view to login
     *                           and fire the event for enabling the auto login.
     */

    function initSoundEnablerController( $log,
                                         $rootScope,
                                         rootScopeEvents,
                                         audioFactory,
                                         clientValuesFactory,
                                         windowViews){
        var self = this;
        self.allow = allow;

        /**
         * Executed when the allow button in the sound enable view is clicked.
         * This plays a soundless buzz, set the view to login and starts the auto login.
         */
        function allow(){
            audioFactory.init();
            audioFactory.soundlessbuzz();
            audioFactory.soundlessbleep();
            clientValuesFactory.setActiveWindow(windowViews.login);
            $rootScope.$emit(rootScopeEvents.soundAllowed);
        }
    }

})();