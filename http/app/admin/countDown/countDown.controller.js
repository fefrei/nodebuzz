(function () {
    'use strict';


    angular.module('ServerApp')
        .controller('adminCountDownController', adminCountDownController);

    function adminCountDownController($rootScope, $scope, $interval, audioFactory, counterValue, teamBuzzFactory, soundEnabled) {
        var self = this;
        var countInterval = 1000;
        self.progressType = 'primary';
        self.counterValue = counterValue.value;
        self.countDown = 0;
        self.active = false;
        var stop;
        teamBuzzFactory.onBuzzAck(onBuzzBuzzAck);
        teamBuzzFactory.registerBuzzStop(stopCounting);
        $scope.$on('resetBuzzed', stopCounting);

        // Sets the countdown and team who has buzzed first in the current game round
        function onBuzzBuzzAck(BUZZData) {
            self.countDown = BUZZData.countdown;
            self.counterValue = BUZZData.countdown;
            if (soundEnabled.value) {
                audioFactory.stopGong();
            }


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
                    if(soundEnabled.value && self.countDown > 0)
                        audioFactory.bleep();
                    if (self.countDown <= 0) {
                        if (soundEnabled.value)
                            audioFactory.timeOver();
                        $interval.cancel(stop);
                        $rootScope.$broadcast('countDownExpired');
                        stop = undefined;
                        self.active = false;
                    }
                }
            }

        }

        /**
         * Stops the couting
         */
        function stopCounting() {
            if (stop != undefined) {
                $interval.cancel(stop);
                self.active = false;
                self.countDown = 0;
                $rootScope.$broadcast('countDownExpired');
                stop = undefined;
            }
        }

    }

})();