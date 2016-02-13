(function () {
    'use strict';

    angular.module('ClientApp')
        .controller('initSwitchController', initSwitchController);

    /**
     *  This is the switch controller.
     *
     *  Use:
     *  switchCtrl.activeWindow - the active window.
     *  switchCtrl.showBlocker - shows/hide blocker.
     */

    function initSwitchController(  $log,
                                    $rootScope,
                                    $interval,
                                    rootScopeEvents,
                                    connectFactory,
                                    windowViews,
                                    standardValues,
                                    clientValuesFactory){
        var self = this;
        self.activeWindow = 'sound';
        self.showBlocker = true;

        $rootScope.$on(rootScopeEvents.activeWindowChanged, onActiveWindowChanged);
        $rootScope.$on(rootScopeEvents.changeBlockerStatus, changeBlockerStatus);
        var waitForTeam = $rootScope.$on(rootScopeEvents.teamNameChanged, teamNameChanged);
        $rootScope.$on(rootScopeEvents.reconnected, reconnected);

        $interval(function() {
            connectFactory.registerEvents()
        }, 100, 1);

        /**
         * This will be fired when the view of the app is changed.
         * @param event: not used
         * @param value: the view which be shown.
         * See client-switch.html for valid values.
         */
        function onActiveWindowChanged(event, value) {
            self.activeWindow = value;
        }

        /**
         * This will be fired when socket events start and finish register.
         * @param event
         * @param value: Boolean. true if blocker should be displayed. false otherwise.
         * @param message: the message shown in the blocker. Not needed when value is false.
         */
        function changeBlockerStatus(event, value, message){
            if (self.showBlocker == value){
                $rootScope.$emit(rootScopeEvents.setBlockerMessage, message);
            } else {
                self.showBlocker = value;
                if (self.showBlocker) {
                    $rootScope.$emit(rootScopeEvents.setBlockerMessage, message);
                    $rootScope.$emit(rootScopeEvents.startBlockerAnimation);
                }
                else {
                    $rootScope.$emit(rootScopeEvents.stopBlockerAnimation);
                }
            }
        }

        function teamNameChanged(event, value){
            if (value !== standardValues.lobbyTeam)
                clientValuesFactory.setActiveWindow(windowViews.buzzer);

            waitForTeam();
        }

        function reconnected(event){
            waitForTeam = $rootScope.$on(rootScopeEvents.teamNameChanged, teamNameChanged);
        }

    }

})();