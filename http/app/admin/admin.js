(function () {
    'use strict';

    angular.module('ServerApp', ['helperDirectives', 'as.sortable', 'ui.bootstrap', 'adminAndMonitorValues', 'sharedFactories', 'xeditable', 'ngAnimate', 'cfp.hotkeys'])


        .run(function (editableOptions) {
            editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
        })

        /**
         * the buzzer starts from counterValue to count down to 0. Is globally true over the whole
         * nodebuzz system. Initially 5.
         */
        .value('counterValue',
            {
                value: 5
            })


        /**
         * Indicates whether the sound is enabled for the admin interface
         */
        .value('soundEnabled', {
            value: false
        })

        /**
         * Name of the local storage item storing the authentication key.
         */
        .constant('authKeyName', 'nodeBuzzAuthKey')

        /**
         * Name of the special lobby team.
         */
        .constant('lobbyName', 'Lobby')


        /**
         * Indicates whether the scroll is anchored on the team list.
         */
        .value('anchorTeam',
            {
                value: false
            }
        )

        /**
         * This constant represents an object with properties containing the names of all admin to server messages.
         * Use this instead of directly inputting the message name。See messageProtocol
         * specification for details about the message Types.
         */
        .constant('messageNames', {
            helloAdmin: 'HELLO:admin',
            helloAck: 'HELLO:ack',
            helloAdminError: 'ERROR:ADMIN:auth',
            buzzAck: 'BUZZ:buzz:ack',
            buzzTeam: 'BUZZ:buzz:team',
            buzzTeamError: 'ERROR:BUZZ:buzz:team',
            buzzStop: 'BUZZ:stop',
            changeConfig: 'CHANGE:config',
            changeConfigAdmin: 'CHANGE:config:admins',
            teams: 'TEAMS',
            teamsDelete: 'TEAMS:delete',
            teamsChange: 'TEAMS:change',
            teamsPoints: 'TEAMS:points',
            teamsCreate: 'TEAMS:create',
            teamsCreateError: 'ERROR:TEAMS:create',
            logMessage: 'LOG',
            teamChangeName: 'TEAMS:name',
            clientChangeName: 'CLIENT:name',
            teamNameError: 'ERROR:TEAMS:name',
            clientNameError: 'ERROR:CLIENT:name',
            teamsResetPoints: 'TEAMS:points:reset'

        })


        /**
         * The authentication key of the admin. Used in every message from admin to server. Is initially
         * inputted by the user.
         */
        .value('authKey', {
            value: ''
        })


})();