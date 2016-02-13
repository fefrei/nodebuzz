(function () {
    'use strict';

    angular.module('ServerApp')
        .controller('adminTeamListController', adminTeamListController);


    function adminTeamListController(anchorTeam, $scope, hotkeys , teamList, lobbyName, teamBuzzFactory, teamFactory, changeConfigFactory, changeNamesFactory, connectFactory) {
        var self = this;
        self.teamList = teamList.value;
        self.lastBuzzedTeam = "";
        self.buzzersEnabled = false;
        self.excludedTeams = {};

        self.isNotLobby = isNotLobby;
        self.toggleTeam = toggleTeam;
        self.getToggleTeamLabel = getToggleTeamLabel;
        self.teamIsExcluded = teamIsExcluded;
        self.teamNameInvalid = {};
        self.clientNameInvalid = {};

        self.deleteTeam = teamFactory.deleteTeam;
        self.buzzTeam = teamBuzzFactory.buzzTeam;
        self.buzzTeamDisallowed = buzzTeamDisallowed;

        teamFactory.onTeams(onTeams);
        teamBuzzFactory.onBuzzAck(onBuzzBuzzAck);
        teamBuzzFactory.registerBuzzStop(onBuzzStop);
        changeConfigFactory.onChangeConfig(onBuzzerStatusChanged);
        changeNamesFactory.registerErrorTeamName(onErrorTeamName);
        changeNamesFactory.registerTeamChangeName(onAckTeamName);
        changeNamesFactory.registerErrorClientName(onErrorClientName);
        changeNamesFactory.registerClientChangeName(onAckClientName);
        connectFactory.onHelloAck(addHotkey);

        /* variables managing the sorting of the list */
        self.sortParameter = 'creation';
        self.reverse = false;
        self.sort = sort;
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

        /**
         * Sets callbacks for drag and drop
         * @type {{itemMoved: onClientMoved}}
         */
        self.sortableOptions = {
            itemMoved: onClientMoved
        };

        /* Point management */
        self.takePoint = takePoint;
        self.addPoint = addPoint;

        /* anchoring scroll on team list */
        self.anchorTeam = false;
        self.toggleAnchorTeamList = toggleAnchorTeamList;

        /* hiding elements of the teamlist on edit */
        self.editShowClient = {};
        self.editShowTeam = {};

        self.onEditShowClient = onEditShow;
        self.onEditHideClient = onEditHide;
        self.onBeforeEditClient = onBeforeEditClient;

        self.onEditShowTeam = onEditShow;
        self.onEditHideTeam = onEditHide;
        self.onBeforeEditTeam = onBeforeEditTeam;
        self.onBeforeEditPoints = onBeforeEditPoints;


        $scope.$on('resetBuzzed', onResetBuzzed);



        function addHotkey(){
            hotkeys.add({
                combo: '+',
                description: 'Add the team that has buzzed in the current round one point',
                callback: addLastTeamOnePoint
            });

            hotkeys.add({
                combo: '-',
                description: 'Substract the team that has buzzed in the current round one point',
                callback: takeLastTeamOnePoint
            });
        }

        /**
         * resets view on reset buzzed
         */
        function onResetBuzzed() {
            self.lastBuzzedTeam = "";
        }

        /**
         * updates view on lastBuzzedTeam
         * @param data
         */
        function onBuzzBuzzAck(data) {
            self.lastBuzzedTeam = data.teamName;
            self.countDownRunning = true;
        }

        function addLastTeamOnePoint(){
            addPoint(self.lastBuzzedTeam);
        }

        function takeLastTeamOnePoint(){
            takePoint(self.lastBuzzedTeam);
        }


        /**
         * Updates the teamList in the view
         * @param data
         */
        function onTeams(data) {
            self.teamList = data;
            teamList.value = data;
        }

        /**
         * emits TEAMS:change message on drag and drop event
         * @param event
         */
        function onClientMoved(event) {

            var clientToken = event.source.itemScope.client.clientToken;
            var newTeamName = event.dest.sortableScope.team.teamName;

            teamFactory.teamChange(clientToken, newTeamName);
        }


        /**
         * updates the
         * @param data
         */
        function onBuzzerStatusChanged(data) {
            self.buzzersEnabled = data.buzzersEnabled;
            data.excludedTeams.forEach(function (entry) {
                self.excludedTeams[entry] = true;
            });
        }

        /**
         * Checks whether the given teamName is not the lobby name
         * @param teamName
         * @returns {boolean}
         */
        function isNotLobby(teamName) {
            return teamName != lobbyName;
        }

        /**
         * disables or enables buzzers for teamName
         * @param teamName
         */
        function toggleTeam(teamName) {
            if (self.excludedTeams[teamName] != undefined) {
                delete self.excludedTeams[teamName];
            } else {
                self.excludedTeams[teamName] = true;
            }

            var excludedTeamsAsArray = Object.keys(self.excludedTeams);
            changeConfigFactory.changeExcludedTeams(excludedTeamsAsArray);
        }

        function sort(sortParameter) {
            self.reverse = (self.sortParameter == sortParameter) ? !self.reverse : false;
            self.sortParameter = sortParameter;
        }

        function addPoint(teamName) {
            teamFactory.changePoints(teamName, 1);
        }

        function takePoint(teamName) {
            teamFactory.changePoints(teamName, -1);
        }


        function toggleAnchorTeamList() {
            if (self.anchorTeam) {
                anchorTeam.value = false;
                self.anchorTeam = false;
            } else {
                anchorTeam.value = true;
                self.anchorTeam = true;
            }

        }

        function getToggleTeamLabel(team) {
            if (self.excludedTeams[team.teamName] == undefined) {
                return 'Deactivate Buzzer'
            } else {
                return 'Activate Buzzer'
            }
        }

        function teamIsExcluded(teamName) {
            return self.excludedTeams[teamName] != undefined;
        }

        function onEditShow(entity) {

            if (entity.teamName) {
                self.editShowTeam[entity.teamName] = true;
            } else if (entity.clientName) {
                self.editShowClient[entity.clientName] = true;
            }
        }

        function onEditHide(entity) {
            if (entity.teamName) {
                delete self.editShowTeam[entity.teamName];
                delete self.teamNameInvalid[entity.teamName];
            } else if (entity.clientName) {
                delete self.editShowClient[entity.clientName];
                delete self.clientNameInvalid[entity.clientName];
            }
        }

        function onBeforeEditClient(newName,client) {
            self.currentTeamPending = client;

            if(newName == client.clientName) {
                return false;
            }
            changeNamesFactory.changeClientName(client.clientToken,newName);
            return "";



        }

        /**
         * Sends the change team name event to the server and does form validation.
         */
        function onBeforeEditTeam(newName, team) {
            self.currentTeamPending = team;

            if(newName == team.teamName){
                return false;
            }
            changeNamesFactory.changeTeamName(team.teamName,newName);
            return "";

        }

        function onErrorTeamName(data){
            self.teamNameInvalid[self.currentTeamPending.teamName] = true;
            self.currentTeamPending = undefined;
            self.namingErrorMessage = data.errorMessage;
        }

        function onAckTeamName() {
            delete self.teamNameInvalid[self.currentTeamPending.teamName];
            self.currentTeamPending = undefined;

        }

        function onErrorClientName(data){
            self.clientNameInvalid[self.currentTeamPending.clientName] = true;
            self.currentTeamPending = undefined;
            self.namingErrorMessage = data.errorMessage;
        }

        function onAckClientName(){
            delete self.clientNameInvalid[self.currentTeamPending.clientName];
            self.currentTeamPending = undefined;

        }

        /**
         * Sets the points of the team to newValue
         * @param newValue - value the points should be set to
         * @param team - the team whichs points need to be changed
         */
        function onBeforeEditPoints(newValue, team){
            if(!jQuery.isNumeric(newValue))
                return false;
            teamFactory.changePoints(team.teamName,newValue - team.points);
            return false;
        }



        function buzzTeamDisallowed(teamName){
            if(teamIsExcluded(teamName))
                return true;
            if(self.countDownRunning)
                return true;
            return false;
        }

        function onBuzzStop(){
            self.countDownRunning = false;
        }
    }

})();