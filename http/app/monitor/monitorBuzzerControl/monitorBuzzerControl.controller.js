(function () {
    'use strict';

    angular.module('MonitorApp')
        .controller('monitorBuzzerController', monitorBuzzerController);

    function monitorBuzzerController(buzzersEnabled, firstBuzzed, dynamicView, disconnected, messageNames, isSoundEnabled, audioFactory, SocketFactory, $log, isTeamListShown, $interval) {
        var self = this;


        //variables needed for the view when a team has buzzed
        var stop;
        var countInterval = 1000;
        self.progressType = "primary";
        self.active = false;
        self.firstBuzzed = "Nobody";

        //if the monitor is disconnected, one can only see an error message
        self.disconnected = disconnected;

        //if a static view is selected, the screen always shows the teams
        self.dynamicView = dynamicView;

        //initially the buzzers are disabled
        setBuzzersEnabled(false);
        setShowTeamList(isTeamListShown);


        //message handling
        SocketFactory.on(messageNames.buzzAck, onBuzzBuzzAck);
        SocketFactory.on(messageNames.changeConfig, onBuzzConfig);
        SocketFactory.on(messageNames.buzzStop, onBuzzStop);


        /**
         * The Function onBuzzStop is called, when the admin stops the countdown before it is 0
         * @param data
         */
        function onBuzzStop(data) {
            self.countDown = 0;
            $log.log('(BUZZ:stop) the admin stopped the countdown');

        }


        /**
         * The Function onBuzzBuzzAck is called when the monitor gets the BUZZ:buzz:ack message.
         * Since a team has buzzed, the monitor shows the teamName and the countDown (iff a
         * dynamic view is selected) and the buzzers are not enabled.
         * @param BUZZData
         */
        function onBuzzBuzzAck(BUZZData) {
            //actualize values for the countdown and set the progressType of the progressBar
            self.countDown = BUZZData.countdown;
            self.maxCounter = BUZZData.countdown;
            self.progressType = "primary";

            //actualize which team has buzzed first, also global so that the monitor knows the
            // team that has buzzed first when showing the teams again
            firstBuzzed.value = BUZZData.teamName;
            self.firstBuzzed = BUZZData.teamName;

            //buzzers are enabled and teams should not be visible
            setBuzzersEnabled(false);
            setShowTeamList(false);
            $log.log('(BUZZ:buzz:ack) team ' + JSON.stringify(BUZZData.teamName) + ' has buzzed');

            //if new buzzer arrives while countdown is still running, reset the countdown
            if (stop != undefined) {
                $interval.cancel(stop);
                stop = undefined;
                self.active = false;
            }
            self.active = true;
            stop = $interval(countDownInterval, countInterval);

            /**
             *  Responsible to decrement the countdown every second
             */
            function countDownInterval() {
                if (self.countDown > 0) {
                    self.countDown = self.countDown - 1;
                    if (self.countDown <= 0) {
                        $interval.cancel(stop);
                        stop = undefined;
                        self.active = false;
                    }
                    if (isSoundEnabled.value && dynamicView.value) {
                        if (self.countDown > 0) {
                            audioFactory.bleep();
                        }
                        else {
                            audioFactory.timeOver();
                        }
                    }
                }
            }
        }


        /**
         * The Function onBuzzConfig is called when the monitor receives the BUZZ:config message.
         * @param BUZZConfigData (contains the value enable: if it is set on true, the
         * monitor shows that the teams can buzz and otherwise the teamList or the name of the
         * team that has buzzed,  if the countdown is greater than 0)
         */
        function onBuzzConfig(BUZZConfigData) {
            setBuzzersEnabled(BUZZConfigData.buzzersEnabled);

            //if enable is true then the monitor shows the message that the teams can buzz,
            // so the teamList is not visible
            if (BUZZConfigData.buzzersEnabled == true) {
                setShowTeamList(false);
            }

            //otherwise the teamList can be visible; if a BuzzBuzzAck message follows, the teams
            // are not visible as long the countdown is greater than 0
            else {
                setShowTeamList(true);
            }
            $log.log('(BUZZ:Config) new data: ' + JSON.stringify(BUZZConfigData));
        }

        function setBuzzersEnabled(buzzersEnabledFlag) {
            buzzersEnabled.value = buzzersEnabledFlag;
            self.buzzersEnabled = buzzersEnabledFlag;
        }

        function setShowTeamList(showTeamListFlag) {
            isTeamListShown.value = showTeamListFlag;
        }

        //checks if the browser is Safari to configure the animation of "please buzz"
        self.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

    }

})();