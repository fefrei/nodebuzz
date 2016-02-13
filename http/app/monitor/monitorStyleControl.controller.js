(function () {
    'use strict';

    /**
     * Needed to control the "head" part of the HTML document and change the style dynamically
     */
    angular.module('MonitorApp')
        .controller('monitorStyleController', monitorStyleController);

    function monitorStyleController(monitorStyle) {
        var self = this;
        self.style = monitorStyle;
    }

})();