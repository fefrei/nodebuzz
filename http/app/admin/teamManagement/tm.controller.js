(function () {
    'use strict';


    angular.module('ServerApp')
        .controller('adminTeamManagementController', adminTeamManagementController);

    function adminTeamManagementController(teamFactory) {
        var self = this;

        self.invalidTeamName = false;
        self.invalidTeamNameMessage = undefined;
        self.addTeam = createTeam;

        teamFactory.onTeamCreateError(onErrorTeamCreate);

        function createTeam(addTeamForm){
            teamFactory.addTeam(self.newTeamName);
            self.newTeamName = "";
            addTeamForm.$setPristine();
        }

        function onErrorTeamCreate(data) {
            self.invalidTeamName = true;
            self.invalidTeamNameMessage = data.errorMessage;
        }
    }

})();