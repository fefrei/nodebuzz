(function () {
    'use strict';

    var app = angular.module('MonitorApp', ['adminAndMonitorValues', 'sharedFactories', 'ui.bootstrap'])

        //the style of the monitor, can be set dynamically
        .value('monitorStyle',
            {
                value: 'superhero'
            }
        )

        //is set on true if the standardView is selected
        .value('standardView',
            {
                value: true
            }
        )

        //is set on true if the scoreBoard is selected to show
        .value('scoreBoard',
            {
                value: false
            }
        )

        //is set on true if a dynamic view (standard or scoreBoard) is selected
        .value('dynamicView',
            {
                value: true
            }
        )

        //this value stores the maximal points of all teams
        .value('maxPoints',
            {
                value: -1
            }
        )

        //is set on true if the buzzers are enabled and the client can buzz
        .value('buzzersEnabled',
            {
                value: false
            }
        )

        //is set on true when the teamList should be shown on the monitor
        //if a dynamic view is selected and the buzzers are enabled, the teams should not be
        // visible, if a team buzzed and the countdown is > 0 then the teamsList also should not be
        // visible.
        .value('isTeamListShown',
            {
                value: true
            }
        )

        //controls if the teamMembers are visible in the teamLists (can be hidden by the Hide
        // Team-Members button
        .value('areTeamMembersVisible',
            {
                value: true
            }
        )

        //different names of messages, the monitor can receive
        .constant('messageNames', {
                //emitted to establish a connection to the server
                //used in: monitorConnectControl
                helloMonitor: 'HELLO:monitor',

                //received to complete establishment of the connection to the server
                //used in: monitorConnectControl
                helloAck: 'HELLO:ack',

                //received if a client buzzed
                //used in: monitorBuzzerControl
                buzzAck: 'BUZZ:buzz:ack',

                //received if:
                //              the admin excludes a team from buzzing or unlocks a team for buzzing
                //              the buzzer get enabled or disabled
                //used in: monitorBuzzerControl, monitorTeamsControl
                changeConfig: 'CHANGE:config',

                //received if:
                //              a client joined/changed a team
                //              a new team was created or a team was deleted
                //              the points of at least one team changed
                //              the name of a team or a client changed
                //used in: monitorTeamsController
                teams: 'TEAMS',

                //received if the countdown was stopped by the admin or the countdown is over
                //used in: monitorBuzzerControl, monitorTeamsControl
                buzzStop: 'BUZZ:stop'
            }
        );

})();