(function () {
    'use strict';


    /**
     * implements the logic of retrieving and setting the authKey from the user.
     * Initializes the session with the server by sending HELLO message
     * Also manages which tab is visible currently.
     */
    angular.module('ServerApp')
        .controller('loginController', loginController);

    function loginController($window, $timeout ,authKey, PageTitleFactory, storageFactory, connectFactory, authKeyName, hotkeys) {
        var self = this;
        self.pwd = authKey.value;
        self.loggedIn = false;
        self.autoLogin = false;
        self.invalidKey = 0;
        self.normalLogin = false;
        self.login = login;
        self.logOut = logOut;
        self.toggleHelp = hotkeys.toggleCheatSheet;

        var helloDelay = 300;

        self.disconnected = false;
        self.reconnected = false;

        self.setTab = setTab;

        connectFactory.onHelloAck(onHelloAck);
        connectFactory.onHelloError(onErrorHelloAck);

        connectFactory.onConnect(onConnect);
        connectFactory.onDisconnect(onDisconnect);
        connectFactory.onReconnect(onReconnect);

        activate();


        function activate(){

            if (storageFactory.getItem(authKeyName)) {
                self.autoLogin = true;
                authKey.value = storageFactory.getItem(authKeyName);
                $timeout( function () {
                    connectFactory.sendHello(authKey.value);
                }, helloDelay);
            }

        }

        function addHotkeys(){
            hotkeys.add({
                combo: 'l',
                description: 'Switch to log view',
                callback: function() {
                    self.activeTab = "log";
                }
            });
            hotkeys.add({
                combo: 'm',
                description: 'Switch to main view',
                callback: function() {
                    self.activeTab = "home";
                }
            });

        }

        function evaluateLocation(){
            if ($window.location.hash.indexOf("log") > -1) {
                self.activeTab = "log";
            } else {
                self.activeTab = "home";

            }
        }

        function login() {
            authKey.value = self.pwd;
            self.normalLogin = true;
            $timeout( function (){
                connectFactory.sendHello(authKey.value);
            }, helloDelay);

        }

        function logOut() {
            storageFactory.removeItem(authKeyName);
            $window.location.reload(true);
        }


        function onHelloAck() {


            storageFactory.setItem(authKeyName, authKey.value);
            self.normalLogin = false;
            self.autoLogin = false;
            self.loggedIn = true;
            self.invalidKey = 0;
            PageTitleFactory.setTitle('NodeBuzz 2.0 - Admin');

            evaluateLocation();
            addHotkeys();
        }

        /**
         * Display the login screen and disconnect info message.
         */
        function onDisconnect() {
            self.disconnected = true;
            self.autoLogin = false;
            self.loggedIn = false;
            self.invalidKey = 0;
        }

        function onConnect() {
            self.disconnected = false;
        }

        /**
         * Resend new Hello message to obtain current data from server
         * TODO: if storage right needed?
         */
        function onReconnect() {
            self.reconnected = true;
            if (Storage) {
                self.autoLogin = true;
                $timeout( function () {
                    connectFactory.sendHello(authKey.value);
                }, helloDelay);

            }
        }

        function onErrorHelloAck() {
            self.invalidKey++;
            self.autoLogin = false;
            self.normalLogin = false;
            self.loggedIn = false;
        }

        function setTab(tab) {
            self.activeTab = tab;

        }
    }

})();