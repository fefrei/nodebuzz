(function () {
    'use strict';

    angular.module('ClientApp')
        .controller('initLoginController', initLoginController);

    /**
     *  This is the login controller.
     *
     *  Use:
     *  loginCtrl.showError to show or hide the error message.
     *  loginCtrl.errorText to display the error text.
     *  loginCtrl.deviceName to display and change the device name in the input field.
     *  loginCtrl.login to try and login to the server.
     *  loginCtrl.hideError to hide the error message.
     *
     */

    function initLoginController(   $log,
                                    $rootScope,
                                    $interval,
                                    rootScopeEvents,
                                    tokenFactory,
                                    connectFactory,
                                    randomFactory,
                                    token){
       var self = this;
        self.showError = false;
        self.errorText = '';
        self.deviceName = 'DEVICE'+randomFactory.rand();
        self.login = login;
        self.hideError = hideError;

        $rootScope.$on(rootScopeEvents.soundAllowed, soundAllowed);
        $rootScope.$on(rootScopeEvents.helloError, helloError);
        $rootScope.$on(rootScopeEvents.deviceNameChanged, deviceNameChanged);
        $rootScope.$on(rootScopeEvents.helloAck, helloAck);
        $rootScope.$on(rootScopeEvents.error, error);
        $rootScope.$on(rootScopeEvents.reconnected, reconnected);

        var ignoreError = false;
        var tryAutoLoginInterval;


        function soundAllowed(event){
            $rootScope.$emit(rootScopeEvents.changeBlockerStatus, true,
                "Trying to login. Please wait!");

            tryAutoLoginInterval = $interval(function(){
                tryAutoLogin();
            }, 1000);
        }

        /**
         * This is fired when there is an error while trying to login manually.
         * @param event
         * @param msg: string. This is the error text which will be displayed.
         */
        function helloError(event, msg){
            if(!ignoreError) {
                self.showError = true;
                self.errorText = msg;
            } else {
                $interval.cancel(tryAutoLoginInterval);
            }
        }

        /**
         * This is fired when the device name is changed. This happens on a successful login.
         * @param event
         * @param value: string. The new device name.
         */
        function deviceNameChanged(event, value){
            self.deviceName = value;
        }

        /**
         * This function is executed when all socket events are registered. Here the client tries to
         * login to the server with the old token.
         */
        function tryAutoLogin(){
            ignoreError = true;
            tokenFactory.loadToken();

            if (token.value !== 'EMPTY_TOKEN'){
                connectFactory.helloClient();
            } else {
                $rootScope.$emit(rootScopeEvents.changeBlockerStatus, false);
                $interval.cancel(tryAutoLoginInterval);
            }
        }

        /**
         * This is executed when the user presses the login button.
         */
        function login(){
            ignoreError = false;
            hideError();
            connectFactory.helloClient(self.deviceName);
        }

        /**
         * This function is executed when the device name changes in the input field.
         * This hides the error message.
         */
        function hideError(){
            self.showError = false;
        }

        function helloAck(event){
            $interval.cancel(tryAutoLoginInterval);
        }

        function error(event, message){
            if (ignoreError){
                $rootScope.$emit(rootScopeEvents.setBlockerMessage,
                                 'Trying to login. Already logged in?');
            }
        }

        function reconnected(event){
            soundAllowed();
        }

    }

})();