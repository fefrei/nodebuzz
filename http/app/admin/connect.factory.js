(function () {
    'use strict';

    angular.module('ServerApp')
        .factory('connectFactory', connectFactory);


    function connectFactory(messageNames, SocketFactory, randomFactory) {
        return {
            onDisconnect: onDisconnect,
            onConnect: onConnect,
            onReconnect: onReconnect,
            sendHello: emitHello,
            onHelloAck: onHelloAck,
            onHelloError: onHelloError
        };



        function onReconnect(callback){
            SocketFactory.on('reconnect', callback);

        }

        function onConnect(callback){
            SocketFactory.on('connect', callback);
        }

        function onDisconnect(callback){
            SocketFactory.on('disconnect', callback);
        }

        function onHelloError(callback){
            SocketFactory.on(messageNames.helloAdminError, callback);
        }

        function onHelloAck(callback){
            SocketFactory.on(messageNames.helloAck, callback);
        }


        function emitHello(key) {
            var HELLOAdminData = {
                messageId: randomFactory.rand(),
                authKey: key
            };
            SocketFactory.emit(messageNames.helloAdmin, HELLOAdminData);
        }

    }

})();