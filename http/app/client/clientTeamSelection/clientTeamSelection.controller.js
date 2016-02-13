(function () {
    'use strict';

    angular.module('ClientApp')
        .controller('initTeamSelectionController', initTeamSelectionController);

    /**
     *  This is the team selection controller.
     *
     *  Use:
     *  teamSelectionCtrl.teamName: own team name
     *  teamSelectionCtrl.teamsData: the data about the teams
     *  teamSelectionCtrl.newTeamName: the name of the new team
     *  teamSelectionCtrl.teamChangeAllowed: true if it is allowed to change teams
     *  teamSelectionCtrl.showError: true if the error message is visible
     *  teamSelectionCtrl.errorText: the error message
     *  teamSelectionCtrl.alertType: the type of the message in which team the client is
     *  teamSelectionCtrl.showTeams: true if team list is visible
     *  teamSelectionCtrl.showNewTeam: true if the create dialog is visible
     *  teamSelectionCtrl.changeTeam(TEAM): call this to change the team. TEAM is the team name
     *  teamSelectionCtrl.createTeam(): call this to create a team
     *  teamSelectionCtrl.goToBuzzer(): call this to change to the buzzer view
     *  teamSelectionCtrl.hideError(): call this to hide the error message
     *  teamSelectionCtrl.newTeamButtonClick(): call this to display or hide the creation dialogue
     *  teamSelectionCtrl.teamsButtonClick(): call this to show or hide the team list
     */

    function initTeamSelectionController(   $log,
                                            $rootScope,
                                            $interval,
                                            rootScopeEvents,
                                            connectFactory,
                                            clientValuesFactory,
                                            windowViews,
                                            standardValues){
        var self = this;
        self.teamName = "NO NAME";
        self.teamsData = [];
        self.newTeamName = '';
        self.teamChangeAllowed = true;
        self.showError = false;
        self.errorText = '';
        self.alertType = 'alert-danger';
        self.showTeams = false;
        self.showNewTeam = false;
        self.changeTeam = changeTeam;
        self.createTeam = createTeam;
        self.goToBuzzer = goToBuzzer;
        self.hideError = hideError;
        self.newTeamButtonClick = newTeamButtonClick;
        self.teamsButtonClick = teamsButtonClick;


        $rootScope.$on(rootScopeEvents.teamNameChanged, teamNameChanged);
        $rootScope.$on(rootScopeEvents.teamChangeAllowed, teamChangeAllowed);
        $rootScope.$on(rootScopeEvents.teamsDataChanged, teamsDataChanged);
        $rootScope.$on(rootScopeEvents.errorTeamCreate, errorTeamCreate);

        /**
         * Send a team change command to the server.
         * @param teamName: string. he name of the team to which the clients wants to switch.
         */
        function changeTeam(teamName){
            connectFactory.teamsChange(teamName);
        }

        /**
         * Create a new team and switch the current team to the new created one. Also hides the
         * error message.
         */
        function createTeam(){
            connectFactory.teamsCreate(self.newTeamName);

            hideError();

            $interval(function(){
                changeTeam(self.newTeamName);
            }, 100, 1);
        }

        /**
         * Change the view to the buzzer view.
         */
        function goToBuzzer(){
            clientValuesFactory.setActiveWindow(windowViews.buzzer);
        }

        /**
         * This is called when the own team name is changed.
         * @param event
         * @param name: the name of the new team
         */
        function teamNameChanged(event, name){
            self.teamName = name;
            teamsButtonClick();
            changeAlertType(name);
        }

        /**
         * This changes the info background color of the "You are in:" info box. If teamName is the
         * name of the lobby team the box will be red. blue otherwise.
         * @param teamName
         */
        function changeAlertType(teamName){
            if (teamName == standardValues.lobbyTeam){
                self.alertType = 'alert-danger';
            } else {
                self.alertType = 'alert-info';
            }
        }

        /**
         * This is called when CHANGE:config is arrived. This function enables/disables team change.
         * @param event
         * @param allowed: true if it is allowed to change teams. false otherwise.
         */
        function teamChangeAllowed(event, allowed){
            self.teamChangeAllowed = allowed;
        }

        /**
         * This is called when there is new team data.
         * @param event
         * @param teamsData: the new team data.
         */
        function teamsDataChanged(event, teamsData){
            self.teamsData = teamsData;
        }

        /**
         * This is called when the new team name is already taken or is invalid.
         * @param event
         * @param msg: the error message.
         */
        function errorTeamCreate(event, msg){
            self.showError = true;
            self.errorText = msg;
        }

        /**
         * This will hide the error message.
         */
        function hideError(){
            self.showError = false;
        }

        /**
         * Called when the user presses the "create new team" button.
         */
        function newTeamButtonClick(){
            self.showNewTeam = !self.showNewTeam;
            self.showTeams = false;
        }

        /**
         * This is called when the user preses the "join team" button.
         */
        function teamsButtonClick(){
            self.showTeams = !self.showTeams;
            self.showNewTeam = false;
        }

    }

})();