(function () {
    'use strict';


    angular.module('ServerApp')
        .controller('resetPointsModelController', resetPointsModelController);

    function resetPointsModelController($uibModalInstance) {
        var self = this;

        self.ok = function () {
            $uibModalInstance.close('reset');

        };

        self.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }

})();

