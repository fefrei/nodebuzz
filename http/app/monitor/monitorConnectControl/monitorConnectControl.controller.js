(function () {
    'use strict';

    angular.module('MonitorApp')
        .controller('monitorConnectController', monitorConnectController);

    function monitorConnectController(PageTitleFactory, messageNames, disconnected, SocketFactory, $log, randomFactory) {
        var self = this;
        self.disconnected = disconnected;

        //sets the title of the page to Nodebuzz 2.0 - Monitor
        PageTitleFactory.setTitle("NodeBuzz 2.0 - Monitor");

        //event and message handling
        SocketFactory.on('reconnect', onReconnect);
        SocketFactory.on('disconnect', onDisconnect);
        SocketFactory.on('connect', onConnect);
        SocketFactory.on(messageNames.helloAck, onHelloAck);


        /**
         * Sets status of the monitor to connected when the HELLO:ack message is received
         */
        function onHelloAck() {
            disconnected.value = false;
            self.disconnected = disconnected.value;
            $log.log('(Hello:ack) monitor is connected');
        }


        /**
         * When the monitor connects to the server, it sends the HELLO:monitor message
         */
        function onConnect() {
            emitHello();
            $log.log("monitor is connected");
        }


        /**
         * When the monitor reconnects to the server, it sends the HELLO:monitor message and
         */
        function onReconnect() {
            emitHello();
            $log.log("monitor is reconnected");
        }


        /**
         * When monitor disconnects from the server, it shows an error message
         */
        function onDisconnect() {
            disconnected.value = true;
            self.disconnected = disconnected;
            $log.log("monitor is disconnected");
        }


        /**
         * Sends the HELLO:monitor message to the admin
         */
        function emitHello() {
            var HELLOMonitorData = {
                messageId: randomFactory.rand()
            };
            SocketFactory.emit(messageNames.helloMonitor, HELLOMonitorData);
            $log.log('(HELLO:monitor) data: ' + JSON.stringify(HELLOMonitorData));
        }
    }

})();