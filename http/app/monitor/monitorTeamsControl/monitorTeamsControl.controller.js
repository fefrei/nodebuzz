(function () {
    'use strict';

    angular.module('MonitorApp')
        .controller('monitorTeamsController', monitorTeamsController);


    function monitorTeamsController(buzzersEnabled, maxPoints, dynamicView, scoreBoard, firstBuzzed, standardView, disconnected, excludedTeams, messageNames, areTeamMembersVisible, SocketFactory, teamList, $log, isTeamListShown) {
        var self = this;

        self.buzzersEnabled = buzzersEnabled;

        self.disconnected = disconnected;

        self.teamList = teamList;
        self.excludedTeams = excludedTeams.value;
        self.areTeamMembersVisible = areTeamMembersVisible;
        self.isTeamListShown = isTeamListShown;
        self.firstBuzzed = firstBuzzed;

        //variables to enable different views of the teams
        self.scoreBoard = scoreBoard;
        self.dynamicView = dynamicView;
        self.standardView = standardView;

        //needed to sort the list
        self.maxPoints = maxPoints;
        self.sortParameter = 'creation';
        self.reverse = false;
        self.searchButtons = [
            {
                option: 'creation',
                label: 'Creation',
                glyphicon: 'glyphicon-sort-by-order',
                glyphiconAlt: 'glyphicon-sort-by-order-alt'
            },
            {
                option: 'teamName',
                label: 'Name',
                glyphicon: 'glyphicon-sort-by-alphabet',
                glyphiconAlt: 'glyphicon-sort-by-alphabet-alt'
            },
            {
                option: 'members.length',
                label: 'Members',
                glyphicon: 'glyphicon-sort-by-attributes',
                glyphiconAlt: 'glyphicon-sort-by-attributes-alt'
            },
            {
                option: 'points',
                label: 'Points',
                glyphicon: 'glyphicon-sort-by-order-alt',
                glyphiconAlt: 'glyphicon-sort-by-order'
            }
        ];
        self.sort = sort;

        self.areAllDevicesDisconnected = areAllDevicesDisconnected;
        self.isExcluded = isExcluded;

        //message handling
        SocketFactory.on(messageNames.teams, onTeams);
        SocketFactory.on(messageNames.changeConfig, onChangeConfig);
        SocketFactory.on(messageNames.buzzStop, onBuzzStop);


        /**
         * When the admin stops the countdown, the teamList is shown again
         * @param data
         */
        function onBuzzStop(data) {
            isTeamListShown.value = true;
            self.isTeamListShown = isTeamListShown;
            $log.log('(BUZZ:stop) admin stopped the countdown');
        }


        /**
         * Actualizes the excluded teams (teams that are not allowed to buzz)
         * @param data
         */
        function onChangeConfig(data) {
            excludedTeams.value = data.excludedTeams;
            self.excludedTeams = excludedTeams.value;
            $log.log('(CHANGE:config) new data: ' + JSON.stringify(data));

        }


        /**
         * If a team is in excludedTeams, it is shown transparent
         * @param teamName
         * @returns {boolean}
         */
        function isExcluded(teamName) {
            return (self.excludedTeams.indexOf(teamName) != -1);
        }


        /**
         * Actualizes whether the teamList is shown and which teams exists
         * @param data
         */
        function onTeams(data) {
            self.teamList = data;
            teamList = data;
            maxPoints.value = data.teams[0].points;
            computeMaxPoints(data.teams);
            $log.log('(TEAMS) new data: ' + JSON.stringify(data));
        }


        function sort(sortParameter) {
            self.reverse = (self.sortParameter == sortParameter) ? !self.reverse : false;
            self.sortParameter = sortParameter;
        }


        /**
         * Checks if all devices of a team are disconnected
         * @param team
         * @returns {boolean}
         */
        function areAllDevicesDisconnected(team) {
            var connected = true;
            for (var i = 0; i < team.members.length; i++) {
                if (team.members[i].connected == true) {
                    return false;
                }
            }
            return connected;
        }


        /**
         * Computes the maximal points of all teams
         * @param teams
         */
        function computeMaxPoints(teams) {
            for (var i = 0; i < teams.length; i++) {
                if (teams[i].points > maxPoints.value) {
                    maxPoints.value = teams[i].points;
                }
            }
        }
    }

})();