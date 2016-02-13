(function () {
    'use strict';


    /**
     * Directive used just to make template html. Logic is implemented in loginController
     */
    angular.module('ServerApp')
        .directive('adminLogin', adminLogin)

        .directive('adminNavbar', adminNavbar);


    function adminLogin() {
        return {
            restrict: 'E',
            templateUrl: 'app/admin/loginAndTabs/admin-login.html',
            require: 'loginController'
        };
    }

    function adminNavbar() {
        return {
            restrict: 'E',
            templateUrl: 'app/admin/loginAndTabs/admin-navbar.html',
            require: 'loginController'
        };
    }

})();