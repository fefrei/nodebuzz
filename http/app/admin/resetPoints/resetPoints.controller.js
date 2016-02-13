(function () {
    'use strict';


    angular.module('ServerApp')
        .controller('resetPointsController', resetPointsController);

    function resetPointsController($uibModal, teamFactory) {
        var self = this;

        self.openModel = function () {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'app/admin/resetPoints/modal.html',
                controller: 'resetPointsModelController',
                controllerAs: 'resetPointsModelCtrl',
                size: "sm"
            });

            modalInstance.result.then(onConfirmation);
        };

        function onConfirmation(result) {
            if (result === 'reset') {
                teamFactory.resetPoints();
            }
        }

    }

})();

