(function () {
    'use strict';


    angular.module('ServerApp')
        .controller('logViewController', logViewController);

    function logViewController(changeConfigFactory) {
        var self = this;
        self.timestampFormat = "dd.MM.yy HH:mm:ss";
        self.logLimit = 30;
        self.clearLog = clearLog;
        self.logActive = true;
        self.toggleActiveLog = toggleActiveLog;
        self.log =[];
        self.savedLog = [];

        changeConfigFactory.registerLog(logPushBack);

        function logPushBack(data) {
            if (self.logActive)
                self.log.unshift(data.message);
            else
                self.savedLog.unshift(data.message);

        }

        function toggleActiveLog(){
            self.logActive = !self.logActive;
            if(self.logActive){
                self.log = self.savedLog.concat(self.log);
                self.savedLog = [];
            }
        }

        function clearLog() {
            self.log = [];
        }
    }

})();

