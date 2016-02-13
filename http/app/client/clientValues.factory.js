(function () {
    'use strict';

    angular.module('ClientApp')
        .factory('clientValuesFactory', clientValuesFactory);

    /**
     * Use this factory to set clients values.
     * Use the emitted value to react to a change. E.g.:
     * $rootScope.$on('deviceNameChanged', handleFunction);
     *
     * Use:
     * setDeviceName(value) - set the name of the device. Emits: deviceNameChanged
     *
     * setTeamName(value) - set the name of the team. Emits: teamNameChanged
     *
     * setTeamsData(value) - set the data for all teams. Emits: teamsDataChanged
     * This will also change the own team name which will emit: teamNameChanged
     *
     * setToken(value) - set the token. Emits: tokenChanged
     *
     * setActiveWindow(value) - set the active window. Emits: activeWindowChanged
     * See client-switch.html for valid values.
     */

    function clientValuesFactory(   $log,
                                    $rootScope,
                                    rootScopeEvents,
                                    deviceName,
                                    teamName,
                                    teamsData,
                                    token,
                                    activeWindow,
                                    windowViews,
                                    PageTitleFactory){
        return {
            setDeviceName: changeDeviceName,
            setTeamName: changeTeamName,
            setTeamsData: changeTeamsData,
            setToken: changeTokenName,
            setActiveWindow: changeActiveWindow
        };

        /**
         * Set the name of the device.
         * Emits: deviceNameChanged
         * @param value: the name of the device.
         */
        function changeDeviceName(value) {
            deviceName.value = value;
            $rootScope.$emit(rootScopeEvents.deviceNameChanged, value);
        }

        /**
         * Set the team name for own team.
         * Emits: teamNameChanged
         * @param value: the name of the own team.
         */
        function changeTeamName(value) {
            teamName.value = value;
            $rootScope.$emit(rootScopeEvents.teamNameChanged, value);
        }

        /**
         * Sets the data for the teams. In the process this function also sets the name of the own
         * team.
         * Emits: teamsDataChanged
         * (and teamNameChanged)
         * @param value: data for all teams.
         */
        function changeTeamsData(value){
            teamsData.value = value;

            for (var i = 0; i < teamsData.value.length; i++) {
                for (var j = 0; j < teamsData.value[i].members.length; j++) {
                    if (token.value + '' == teamsData.value[i].members[j].clientToken + '') {
                        changeTeamName(teamsData.value[i].teamName);
                    }
                }
            }

            $rootScope.$emit(rootScopeEvents.teamsDataChanged, value);
        }

        /**
         * Set the token.
         * Emits: tokenChanged
         * @param value: the new token value.
         */
        function changeTokenName(value) {
            token.value = value;
            $rootScope.$emit(rootScopeEvents.tokenChanged, value);
        }

        /**
         * Sets the active window. This is used to show different views of the client app.
         * Emits: activeWindowChanged
         * @param value: the new view.
         * See client-switch.html for valid values.
         */
        function changeActiveWindow(value) {
            activeWindow.value = value;
            PageTitleFactory.setTitle(mapWindowIdToTitle(value));
            $rootScope.$emit(rootScopeEvents.activeWindowChanged, value);
        }

        function mapWindowIdToTitle(value){
            switch(value){
                case windowViews.login : return 'Login';
                case windowViews.buzzer: return 'Buzzer';
                case windowViews.teamPoints: return 'Team scores';
                case windowViews.changeSensitivity: return 'Calibration';
                case windowViews.selectTeam: return 'Team select';
                default: return 'Unknown view!';
            }
        }
    }

})();
