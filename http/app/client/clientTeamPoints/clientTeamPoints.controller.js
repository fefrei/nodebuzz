(function () {
    'use strict';

    angular.module('ClientApp')
        .controller('initTeamPointsController', initTeamPointsController);

    /**
     *  This is the points controller.
     *
     *  Use:
     *  teamPointsCtrl.teamData: the teams list with the data
     *  teamPointsCtrl.sortBy: used to sort teams by a attribute
     *  teamPointsCtrl.teamName: own team name
     *  teamPointsCtrl.goToBuzzer(): change view to buzzer view
     *  teamPointsCtrl.sortByName(): sort team list by name
     *  teamPointsCtrl.sortByPoints(): sort team list by points
     *  teamPointsCtrl.sortByMemberSize(): sort team by member size
     */

    function initTeamPointsController(  $log,
                                        $rootScope,
                                        clientValuesFactory,
                                        rootScopeEvents,
                                        windowViews,
                                        sortBy){
        var self = this;
        self.teamsData = [];
        self.sortBy = sortBy.teamPoints;
        self.teamName = '';
        self.goToBuzzer = goToBuzzer;
        self.sortByName = sortByName;
        self.sortByPoins = sortByPoints;
        self.sortByMemberSize = sortByMemberSize;

        $rootScope.$on(rootScopeEvents.teamsDataChanged, teamsDataChanged);
        $rootScope.$on(rootScopeEvents.teamNameChanged, teamNameChanged);

        var teamsData = [];

        /**
         * Called to switch view to buzzer.
         */
        function goToBuzzer(){
            clientValuesFactory.setActiveWindow(windowViews.buzzer);
        }

        /**
         * Called to sort team list by name.
         */
        function sortByName(){
            self.sortBy = sortBy.teamName;
            sort(teamsData);
        }

        /**
         * Called to sort team list by points.
         */
        function sortByPoints(){
            self.sortBy = sortBy.teamPoints;
            sort(teamsData);
        }

        /**
         * Called to sort team list by member size.
         */
        function sortByMemberSize(){
            self.sortBy = sortBy.teamMember;
            sort(teamsData);
        }

        /**
         * Called when there are new team data. This also execute the sort function.
         * @param event
         * @param data: team data.
         */
        function teamsDataChanged(event, data){
            teamsData = data;

            sort(teamsData);
        }

        /**
         * Called when there is new team data.
         * @param event
         * @param name: The name of own team.
         */
        function teamNameChanged(event, name){
            self.teamName = name;
        }

        /**
         * Sort function. Uses self.sortBy to sort the list by a specific attribute.
         * @param data
         */
        function sort(data){
            switch(self.sortBy){
                case sortBy.teamName: data.sort(compareByName); break;
                case sortBy.teamPoints: data.sort(compareByPoints); break;
                default : data.sort(compareByMemberSize); break;
            }

            self.teamsData = data;
        }

        /**
         * Compare function for sorting the team list by name.
         * @param team1: team 1 to compare with team 2.
         * @param team2: team 2 to compare with team 1.
         * @returns {number}: -1 if team 1 comes before team 2
         */
        function compareByName(team1, team2){
            return team1.teamName.localeCompare(team2.teamName);
        }

        /**
         * Compare function for sorting the team list by points.
         * @param team1: team 1 to compare with team 2.
         * @param team2: team 2 to compare with team 1.
         * @returns {number}: -1 if team 1 comes before team 2
         */
        function compareByPoints(team1, team2){
            if (team1.points > team2.points)
                return -1;
            else {
                if (team1.points < team2.points)
                    return 1;
                else
                    return team1.teamName.localeCompare(team2.teamName);
            }
        }

        /**
         * Compare function for sorting the team list by team size.
         * @param team1: team 1 to compare with team 2.
         * @param team2: team 2 to compare with team 1.
         * @returns {number}: -1 if team 1 comes before team 2
         */
        function compareByMemberSize(team1, team2){
            if (team1.members.length > team2.members.length)
                return -1;
            else{
                if (team1.members.length < team2.members.length)
                    return 1;
                else
                    return team1.teamName.localeCompare(team2.teamName);
            }
        }


    }

})();