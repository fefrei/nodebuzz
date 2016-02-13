(function () {
    'use strict';


    angular.module('ServerApp')
        .directive('adminMainView', adminMainView);

    function adminMainView() {
        return {
            restrict: 'E',
            templateUrl: 'app/admin/mainView/admin-main-view.html'
        };
    }

})();