describe("Hello World", function () {
    var element;
    var $scope;
    beforeEach(inject(function ($compile, $rootScope) {
        $scope = $rootScope;
        element = angular.element("<div>{{2 + 2}}</div>");
        element = $compile(element)($rootScope);
    }));

    it("should eqaul 4", function () {
        $scope.$digest();
        expect(element.html()).toBe("4");
    });
});


describe("TeamBuzzerFactory can", function () {

    var TeamBuzzerFactory;

    //beforeEach(function() {
    //    module(function ($provide) {
    //        $provide.value('buzzerRound', function () {
    //            this.value = 42;
    //        });
    //        $provide.service('$log', function () {
    //            this.log = jasmine.createSpy('log');
    //        });
    //        $provide.value('authKey', function () {
    //            this.value = 'someAuthKey';
    //        });
    //        $provide.value('lobbyName', function () {
    //            this.value = 'LobbyName';
    //        });
    //
    //        $provide.value('buzzerRound', function () {
    //            this.value = 42;
    //        });
    //
    //        $provide.value('SocketFactory', function () {
    //            this.emit = jasmine.createSpy('socketEmit');
    //        });
    //
    //        $provide.value('teamList', function () {
    //            this.value = {
    //                messageId: 12345,
    //                    teams: [
    //                    {
    //                        teamId: '12345',
    //                        teamName: 'testTeam1',
    //                        score: '123',
    //                        members: [
    //                            {
    //                                clientToken: '42',
    //                                clientName: 'TestClient1'
    //                            },
    //                            {
    //                                clientToken: '43',
    //                                clientName: 'TestClient2'
    //                            },
    //                            {
    //                                clientToken: '44',
    //                                clientName: 'TestClient3'
    //                            }
    //                        ]
    //                    },
    //                    {
    //                        teamName: 'testTeam2',
    //                        teamId: '123456',
    //                        score: '5',
    //                        members: [
    //                            {
    //                                clientToken: '45',
    //                                clientName: 'TestClient4'
    //                            },
    //                            {
    //                                clientToken: '46',
    //                                clientName: 'TestClient5'
    //                            },
    //                            {
    //                                clientToken: '47',
    //                                clientName: 'TestClient6'
    //                            }
    //                        ]
    //                    }
    //                ]
    //            };
    //        });
    //
    //        $provide.service('$rootScope', function () {
    //            this.$broadcast = jasmine.createSpy('broadcast');
    //        });
    //
    //
    //
    //
    //
    //
    //    })
    //});

    beforeEach(module('ServerApp'));

    beforeEach(inject(function (_TeamBuzzerFactory_) {
        TeamBuzzerFactory = _TeamBuzzerFactory_;
    }));

    describe('buzz a specific team', function () {

        it('that is not empty', function () {
            expect(TeamBuzzerFactory.buzzTeam({})).toBe('fail');
        })
    });


});
