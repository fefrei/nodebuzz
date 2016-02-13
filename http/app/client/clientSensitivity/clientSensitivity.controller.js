(function () {
    'use strict';

    angular.module('ClientApp')
        .controller('initSensitivityController', initSensitivityController);

    /**
     *  This is the sensitivity controller.
     *
     *  Use:
     *  sensitivityCtrl.sensitivity: sensitivity to trigger a buzz
     *  sensitivityCtrl.currentMotion: current motion value
     *  sensitivityCtrl.disabledMotion: enable or disable motion triggering
     *  sensitivityCtrl.motionAvalible: true if motion is avalible
     *  sensitivityCtrl.motionButtonText: use to show text on the motion on/off button
     *  sensitivityCtrl.progressBarBgColor: use to change the progress bar bg color
     *  sensitivityCtrl.testText: use to show text for the test trigger field
     *  sensitivityCtrl.testAlertType: use to change color of the test trigger field
     *  sensitivityCtrl.goToBuzzer(): use to change the view to buzzer view
     *  sensitivityCtrl.toggleMotion(): use to enable/disable motion trigger
     *  sensitivityCtrl.load(): use to load motion values from storage
     */

    function initSensitivityController( $log,
                                        $rootScope,
                                        $interval,
                                        $window,
                                        storageFactory,
                                        rootScopeEvents,
                                        clientValuesFactory,
                                        windowViews,
                                        accelParameter,
                                        connectFactory,
                                        audioFactory) {
        var self = this;
        self.sensitivity = 5;
        self.currentMotion = 0;
        self.disabledMotion = false;
        self.motionAvalible = true;
        self.motionButtonText = 'motion enabled!';
        self.progressBarBgColor = '';
        self.testText = 'Buzzer has not triggered!';
        self.testAlertType = 'alert-danger';
        self.goToBuzzer = goToBuzzer;
        self.toggleMotion = toggleMotion;
        self.cancel = cancel;

        self.max = accelParameter.max;
        self.min = accelParameter.min;
        self.step = accelParameter.step;

        $rootScope.$on(rootScopeEvents.changeBlockerStatus, changeBlockerStatus);
        $rootScope.$on(rootScopeEvents.buzzerStatusChanged, buzzerStatusChanged);
        $rootScope.$on(rootScopeEvents.activeWindowChanged, activeWindowChanged);
        $rootScope.$on(rootScopeEvents.helloAck, helloAck);

        var buzzRound = -1;
        var buzzerEnabled = false;
        var inBuzzerView = false;
        var inCalibrationView = false;
        var blockerDisabled = false;
        var motionAvalible = false;
        var testTriggerTriggered = false;
        var testTriggerInterval;

        startCheckingForMotion();

        /**
         * Saves the values for motion and changes the view to buzzer view.
         */
        function goToBuzzer(){
            saveParameter();
            clientValuesFactory.setActiveWindow(windowViews.buzzer);
        }

        /**
         * Called when the blocker status is changed. Needed to know if motion should trigger a
         * buzz.
         * @param event
         * @param visible
         * @param message
         */
        function changeBlockerStatus(event, visible, message){
            blockerDisabled = !visible;
        }

        /**
         * Called when buzzer status has changed. Needed to know if motion should trigger a buzz.
         * @param event
         * @param enabled
         * @param round
         * @param teams
         */
        function buzzerStatusChanged(event, enabled, round, teams){
            buzzerEnabled = enabled;
            buzzRound = round;
        }

        /**
         * Called when the view is changed. Needed to know if motion should trigger a buzz.
         * @param event
         * @param view
         */
        function activeWindowChanged(event, view){
            inBuzzerView = (view == windowViews.buzzer);
            inCalibrationView = (view == windowViews.changeSensitivity);
        }

        /**
         * Called when there is a motion. Calculate the maximum from all 3 axis. If one of the axis
         * values is higher than sensitivity value, trigger a buzz/test buzz.
         * @param event
         */
        function onDeviceMotion(event){
            if (self.disabledMotion)
                return;

            $rootScope.$apply(function () {
                var accel = event.acceleration;
                var absX = Math.abs(accel.x);
                var absY = Math.abs(accel.y);
                var absZ = Math.abs(accel.z);
                var maxMotion = Math.max(absX,absY,absZ);

                self.currentMotion = maxMotion;

                if (maxMotion >= self.sensitivity){
                    if (inBuzzerView){
                        buzz();
                    } else {
                        if (inCalibrationView && !testTriggerTriggered){
                            testTriggerTriggered = true;
                            triggerTest();
                        }
                    }
                } else {
                    if (inCalibrationView && testTriggerTriggered){
                        testTriggerTriggered = false;
                    }
                }
            });
        }

        /**
         * This gets called by onDeviceMotion when the motion should trigger a buzz.
         * This is when: 1) motion is strong enough, 2) buzzer is enabled, 3) the blocker is
         * disabled and 4) the view is not the calibration view
         */
        function buzz(){
            if (buzzerEnabled && inBuzzerView && blockerDisabled)
                connectFactory.buzzBuzzTrial(buzzRound);
            $rootScope.$emit(rootScopeEvents.buzzTriggered);
        }

        /**
        * This gets called by onDeviceMotion when the motion should trigger a test buzz.
        * This is when: 1) motion is strong enough and 2) the blocker is
        * disabled
        */
        function triggerTest(){
            var resetInterval = 1000;
            if (!blockerDisabled)
                return;

            audioFactory.bleep();
            self.testText = 'Buzzer triggered!';
            self.testAlertType = 'alert-success';
            $interval.cancel(testTriggerInterval);
            testTriggerInterval = $interval(function(){
                triggerTestReset();
            }, resetInterval, 1);
        }

        /**
         * When the test trigger was triggered this function gets called after 3 sec.
         * It resets the test trigger field.
         */
        function triggerTestReset(){
            self.testText = 'Buzzer has not triggered!';
            self.testAlertType = 'alert-danger';
        }

        /**
         */
        function toggleMotion(){
            self.disabledMotion = !self.disabledMotion;
            self.motionButtonText = (self.disabledMotion) ? 'motion disabled' : 'motion enabled';
            self.progressBarBgColor = (self.disabledMotion) ? accelParameter.progressBarBgColor
                                                            : '';
            self.currentMotion = 0;
        }

        /**
         * Called when pressed the cancel button.
         */
        function cancel(){
            loadParameter();
            clientValuesFactory.setActiveWindow(windowViews.buzzer);
        }

        /**
         * Checks for motion support. If so it also loads the motion values from storage and
         * register the devicemotion event.
         */
        function checkForMotionSupport(){
            if(motionAvalible){
                self.motionAvalible = true;
                self.disabledMotion = false;
                self.progressBarBgColor = '';
                self.testText = 'Buzzer has not triggered!';
                loadParameter();
                $window.addEventListener('devicemotion', onDeviceMotion);
            } else {
                self.motionAvalible = false;
                self.disabledMotion = true;
                self.motionButtonText = 'Motion is not supported!'
                self.testText = 'Motion is not supported!';
                self.progressBarBgColor = accelParameter.progressBarBgColor;
            }
        }

        /**
         * This gets called when the device supports motion or the cancel button is pressed.
         * It loads the motion values.
         */
        function loadParameter(){
            if (storageFactory.getItem(accelParameter.storageName)) {

                var motionOptions = JSON.parse(storageFactory.getItem(accelParameter.storageName));

                self.sensitivity = motionOptions.sensitivity;

                //simulate XOR
                if(motionOptions.disabledMotion ?  !self.disabledMotion : self.disabledMotion){
                    toggleMotion();
                }
            }
        }

        /**
         * Gets called when changing the view to buzzer view. The function saves the motion values.
         */
        function saveParameter() {
            accelParameter.value = self.sensitivity;
            var motionSensorOptions = {
                sensitivity: self.sensitivity,
                disabledMotion: self.disabledMotion
            };
            storageFactory.setItem(accelParameter.storageName, JSON.stringify(motionSensorOptions));
        }

        function startCheckingForMotion(){
            $window.addEventListener('devicemotion', checkDataForMotion);
        }

        function helloAck(){
            $window.removeEventListener('devicemotion', checkDataForMotion);
            checkForMotionSupport();
        }

        function checkDataForMotion(event){
            if (motionAvalible)
                return;

            $rootScope.$apply(function () {
                var accel = event.acceleration;

                    motionAvalible = (accel.x ||accel.y || accel.z);
            });
        }


    }

})();