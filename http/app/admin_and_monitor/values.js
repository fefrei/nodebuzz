angular.module("adminAndMonitorValues", [])

    /**
     * Defines the list of teams and clients that will be displayed in the view.
     * initially filled with dummy values.
     */
    .value('teamList', {
        value: {
            messageId: 12345,
            teams: [
                {
                    teamId: '12345',
                    teamName: 'testTeam1',
                    points: '123',
                    members: [
                        {
                            clientToken: '42',
                            clientName: 'TestClient1',
                            connected: true
                        },
                        {
                            clientToken: '43',
                            clientName: 'TestClient2',
                            connected: true
                        },
                        {
                            clientToken: '44',
                            clientName: 'TestClient3',
                            connected: false
                        }
                    ]
                },
                {
                    teamName: 'testTeam2',
                    teamId: '123456',
                    points: '5',
                    members: [
                        {
                            clientToken: '45',
                            clientName: 'TestClient4',
                            connected: false
                        },
                        {
                            clientToken: '46',
                            clientName: 'TestClient5',
                            connected: true
                        },
                        {
                            clientToken: '47',
                            clientName: 'TestClient6',
                            connected: true
                        }
                    ]
                }
            ]
        }
    })

    //necessary to control if the monitor should play sounds or not
    .value('isSoundEnabled', {
        value: false
    })

    //is set on true when the device is disconnected from server and then shows an error message
    .value('disconnected',
        {
            value: true
        }
    )

    //The list of all teams not allowed to buzz as object. Contains a property for every team not
    // allowed to buzz
    .value('excludedTeams',
        {
            value: []
        }
    )

    //team that has buzzed first in the last buzzer round
    .value('firstBuzzed',
        {
            value: "No one"
        });