angular.module("helperDirectives", [])

/**
 * An attribute directive setting the element it is used on to be focused on load.
 */
.directive('focusMe', function () {
    return function (scope, element) {
        element.focus();
    }
});