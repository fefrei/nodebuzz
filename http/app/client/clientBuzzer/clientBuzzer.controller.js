(function () {
    'use strict';

    angular.module('ClientApp')
        .controller('initBuzzerController', initBuzzerController);

    /**
     *  This is the login controller.
     *
     *  Use:
     * buzzerCtrl.deviceName: show the device name
     * buzzerCtrl.teamName: show the own team name
     * buzzerCtrl.points: show the points of the team
     * buzzerCtrl.buzzerEnabled: use to enable/disable the buzzer
     * buzzerCtrl.buzzerState: use to color the buzzer
     * buzzerCtrl.buzzerText: use to display text on the buzzer
     * buzzerCtrl.goToTeamSelection(): use to change the view to team selection
     * buzzerCtrl.goToTeamPoints(): use to change the view to team points
     * buzzerCtrl.goToChangeSensitivity(): use to change the view to kalibration
     * buzzerCtrl.logout(): use to logout and refresh the page
     * buzzerCtrl.buzz(): use to buzz
     */

    function initBuzzerController(  $log,
                                    $rootScope,
                                    $window,
                                    $interval,
                                    rootScopeEvents,
                                    connectFactory,
                                    tokenFactory,
                                    windowViews,
                                    buzzerState,
                                    clientValuesFactory,
                                    audioFactory,
                                    deviceName){
        var self = this;
        self.deviceName = 'DEVICE NAME';
        self.teamName = 'Lobby';
        self.points = '100';
        self.buzzerEnabled = false;
        self.buzzerState = buzzerState.disabled;
        self.buzzerText = 'BUZZER TEXT';
        self.goToTeamSelection = goToTeamSelection;
        self.goToTeamPoints = goToTeamPoints;
        self.goToChangeSensitivity = goToChangeSensitivity;
        self.logout = logout;
        self.buzz = buzz;

        $rootScope.$on(rootScopeEvents.teamPointsUpdate, teamPointsUpdate);
        $rootScope.$on(rootScopeEvents.teamNameChanged, teamNameChanged);
        $rootScope.$on(rootScopeEvents.deviceNameChanged, deviceNameChanged);
        $rootScope.$on(rootScopeEvents.buzzerStatusChanged, buzzerStatusChanged);
        $rootScope.$on(rootScopeEvents.buzzed, buzzed);
        $rootScope.$on(rootScopeEvents.stopCountdown, stopCountdown);
        $rootScope.$on(rootScopeEvents.buzzTriggered, buzzTrggered);
        $rootScope.$on(rootScopeEvents.reconnected, reconnected);

        var buzzerRound = -1;
        var excludedTeams = [];
        var excluded = true;
        var countdown = 0;
        var contdownDecreaseInterval;
        var ignoreNextBuzzerStatusChanged = false;

        /**
         * Called when pressed the team select button.
         * Change the view to team selection.
         */
        function goToTeamSelection(){
            clientValuesFactory.setActiveWindow(windowViews.selectTeam);
        }

        /**
         * Called when pressed the team points button.
         * Change the view to team points.
         */
        function goToTeamPoints(){
            clientValuesFactory.setActiveWindow(windowViews.teamPoints);
        }

        /**
         * Called when pressed the sensitivity button.
         * Change the view to calibration.
         */
        function goToChangeSensitivity(){
            clientValuesFactory.setActiveWindow(windowViews.changeSensitivity);
        }

        /**
         * Called when logout button is pressed.
         * Delete the token and refresh the page.
         */
        function logout(){
            tokenFactory.deleteToken();
            $window.location.reload();
        }

        /**
         * Called when buzzer is pressed.
         * Send a buzz command to the server.
         */
        function buzz(){
            connectFactory.buzzBuzzTrial(buzzerRound);
            $rootScope.$emit(rootScopeEvents.buzzTriggered);
        }

        /**
         * Calles when points of the own team are updated.
         * @param event
         * @param points is a number. Points of the own team.
         */
        function teamPointsUpdate(event, points){
            self.points = points;
        }

        /**
         * Called when client changes the team.
         * @param event
         * @param teamName is a string. The new team name.
         */
        function teamNameChanged(event, teamName){
            self.teamName = teamName;
        }

        /**
         * Called when the device name has changed.
         * @param event
         * @param name is a string. The new name of the device.
         */
        function deviceNameChanged(event, name){
            self.deviceName = name;
        }

        /**
         * Called when CHANGE:config message has arrived.
         * @param event
         * @param enabled: true if the buzzer is enabled.
         * @param round: the round id which has to be send when buzzing
         * @param teams: a list of exluded teams
         * @param buzzingExcluded: is the own team excluded
         */
        function buzzerStatusChanged(event, enabled, round, teams, buzzingExcluded){
            if (ignoreNextBuzzerStatusChanged){
                ignoreNextBuzzerStatusChanged = false;
            } else {
                self.buzzerEnabled = enabled;
                buzzerRound = round;
                excludedTeams = teams;
                excluded = buzzingExcluded;
                setBuzzerStatus();
            }
        }

        /**
         * Perform a check if the own team is excluded from buzzing. If so this function also sets
         * the buzzer status and disables the buzzer
         * @returns {boolean}: true if the own team is excluded, false otherwise
         */
        function checkIfExcluded(){
            return excluded;
        }

        /**
         * Checks if the own team is excluded from buzzing. If not this function changes the buzzer
         * status (enables or disabled).
         * This resets also the countdown.
         */
        function setBuzzerStatus(){
            $interval.cancel(contdownDecreaseInterval);

            if (!checkIfExcluded()) {
                if (self.buzzerEnabled) {
                    self.buzzerState = buzzerState.enabled;
                    self.buzzerText = 'BUZZ!!!!!!';
                } else {
                    self.buzzerState = buzzerState.disabled;
                    self.buzzerText = 'DISABLED';
                }
            } else {
                self.buzzerState = buzzerState.excluded;
                self.buzzerText = 'EXCLUDED';
                self.buzzerEnabled = false;
            }
        }

        /**
         * Calles when a BUZZ:buzz:ack message arrives. It sets the buzzer status to self buzz,
         * team buzzed or late buzz(= other team buzzed). This also init the cooldown.
         * @param event
         * @param client: client which has buzzed
         * @param team: the team which has buzzed
         * @param cd: the cooldown
         */
        function buzzed(event, client, team, cd){
            if (excluded)
                return;

            if (true) {
                countdown = cd;
                self.buzzerText = countdown;

                contdownDecreaseInterval = $interval(function(){
                    countdownDecrease();
                },1000);
            } else {
                self.buzzerText = '';
            }

            if (client == self.deviceName){
                self.buzzerState = buzzerState.selfBuzzed;
                audioFactory.buzz();
                return;
            }

            if (team == self.teamName){
                self.buzzerState = buzzerState.teamBuzzed;
                audioFactory.buzz();
                return;
            }

            self.buzzerState = buzzerState.lateBuzzed;

        }

        /**
         * This function descreases the cooldown.
         */
        function countdownDecrease(){
            if (countdown > 0) {
                countdown = countdown - 1;
                self.buzzerText = countdown;
                if (countdown <= 0) {
                    stopCountdown();
                }
            }
        }

        function stopCountdown(event){
            $interval.cancel(contdownDecreaseInterval);
            setBuzzerStatus();
        }

        /**
         * This function is called when the buzz is triggered and the rootEvent
         * buzzTrggered is emitted. Sets the buzzer to triggered state and disabled the buzzer.
         * @param event
         */
        function buzzTrggered(event){
            if (self.buzzerState == buzzerState.enabled) {
                self.buzzerState = buzzerState.buzzTriggered;
                self.buzzerText = "BUZZED";
                self.buzzerEnabled = false;
                ignoreNextBuzzerStatusChanged = true;
            }
        }

        /**
         * Executetd when reconnected
         * @param event
         */
        function reconnected(event){
            ignoreNextBuzzerStatusChanged = false;
        }
    }
})();