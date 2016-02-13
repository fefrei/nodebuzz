var server = require('../server');
var state = require('../serverState');
var assert = require('assert');
//with chai
var expect = require('chai').expect;

var team1 = {teamName: "dagdaga", members: [], points: 0};
var team2 = {teamName: "babaa", members: [], points: 0};
var team3 = {teamName: "getea123", members: [], points: 0};

var rect1 = {teamName: "rect1", members: [], points: 0};
var rect2 = {teamName: "rect2", members: [], points: 0};
var rect3 = {teamName: "rect3", members: [], points: 0};

var save = "";

var recc1 = {
    socket: null,
    basicInfo: {clientToken: 1, clientName: "recc1", connected: false},
    team: ""
};

var recc2 = {
    socket: null,
    basicInfo: {clientToken: 2, clientName: "recc2", connected: false},
    team: ""
};

var recc3 = {
    socket: null,
    basicInfo: {clientToken: 3, clientName: "recc3", connected: false},
    team: ""
};

var recc4 = {
    socket: null,
    basicInfo: {clientToken: 4, clientName: "recc4", connected: false},
    team: ""
};

describe('setting and getting buzzer countdown', function () {
    before(function () {
        state.setCurrentCountdownConfig(42);
    });
    it('should return the set value', function () {
        assert.equal(42, state.getCurrentCountdownConfig());
    });
    it('should return the same value', function () {
        assert.equal(42, state.getCurrentCountdownConfig());
    });
});

describe('adding teams and look up if they exist', function () {
    before(function () {
        state.addTeam(team1);
        state.addTeam(team2);
        state.addTeam(team3);
    });
    it('should return true', function () {
        expect(state.teamNameAlreadyExists("dagdaga")).to.equal(true);
    });
    it('should return true', function () {
        expect(state.teamNameAlreadyExists("babaa")).to.equal(true);
    });
    it('should return true', function () {
        expect(state.teamNameAlreadyExists("getea123")).to.equal(true);
    });
    it('Lobby-Team should also exist', function () {
        expect(state.teamNameAlreadyExists(state.lobbyTeam)).to.equal(true);
    });
    it('Should return false for other values', function () {
        expect(state.teamNameAlreadyExists("potatoteam")).to.equal(false);
    });
});

describe('Lobby Team should exist by default', function () {
    it('should return true', function () {
        expect(state.teamNameAlreadyExists(state.lobbyTeam)).to.equal(true);
    });
});

describe('remove some of the created teams', function () {
    before(function () {
        state.removeTeam(team1.teamName);
        state.removeTeam(team3.teamName);
    });
    it('should return false', function () {
        expect(state.teamNameAlreadyExists("dagdaga")).to.equal(false);
    });
    it('should return true', function () {
        expect(state.teamNameAlreadyExists("babaa")).to.equal(true);
    });
    it('should return false', function () {
        expect(state.teamNameAlreadyExists("getea123")).to.equal(false);
    });
});

describe('should\'t be able to remove lobby team', function () {
    before(function () {
        state.removeTeam(state.lobbyTeam);
    });
    it('should return true', function () {
        expect(state.teamNameAlreadyExists(state.lobbyTeam)).to.equal(true);
    });
});

describe('save and load server state1', function () {
    before(function () {
        //add teams and clients and set different stuff
        state.addTeam(rect1);
        state.addTeam(rect2);
        state.addTeam(rect3);
        state.addClient(recc1);
        state.addClient(recc2);
        state.addClient(recc3);
        state.addClientToTeam(recc1.basicInfo, rect1.teamName);
        state.addClientToTeam(recc2.basicInfo, rect2.teamName);
        state.addClientToTeam(recc3.basicInfo, rect2.teamName);
        state.setAdminAuthKey("secure");
        state.setCurrentCountdownConfig(7);
    });
    //test if all settings are successfully transmitted to serverState
    it('should have the set values', function () {
        expect(state.getCurrentCountdownConfig()).to.equal(7);
        expect(state.getAdminAuthKey()).to.equal("secure");
        expect(state.teamNameAlreadyExists(rect1.teamName)).to.equal(true);
        expect(state.teamNameAlreadyExists(rect2.teamName)).to.equal(true);
        expect(state.teamNameAlreadyExists(rect3.teamName)).to.equal(true);
        expect(state.getClientGivenToken(recc1.basicInfo.clientToken).team).to.equal("rect1");
        expect(state.getClientGivenName(recc2.basicInfo.clientName).team).to.equal("rect2");
        expect(state.getClientGivenName(recc3.basicInfo.clientName).team).to.equal("rect2");
        expect(state.getClientGivenName(recc4.basicInfo.clientName)).to.equal(null);
    });
});

describe('save and load server state2', function () {
    before(function (done) {
        //save game state
        save = state.getGameStateString();

        //change game state

        //add client 4
        state.addClient(recc4);
        state.addClientToTeam(recc4.basicInfo, rect1.teamName);

        //delete client 1
        state.removeClientGivenToken(recc1.basicInfo.clientToken);
        state.removeClientFromTeamsGivenToken(recc1.basicInfo.clientToken);

        //delete team 2
        state.removeTeam(rect2.teamName);

        //change some other stuff
        state.setAdminAuthKey("1234");
        state.setCurrentCountdownConfig(3);
        //makes sure that 'before' is finished before 'it' starts
        {
            done();
        }

    });
    //check if all updates have been transmitted to serverState
    it('should have the new values', function () {
        expect(state.getCurrentCountdownConfig()).to.equal(3);
        expect(state.getAdminAuthKey()).to.equal("1234");
        expect(state.teamNameAlreadyExists(rect1.teamName)).to.equal(true);
        //expect(state.teamNameAlreadyExists(rect2.teamName)).to.equal(false);
        expect(state.teamNameAlreadyExists(rect3.teamName)).to.equal(true);
        expect(state.getClientGivenName(recc1.basicInfo.clientName)).to.equal(null);
        expect(state.getClientGivenName(recc2.basicInfo.clientName).team).to.equal(state.lobbyTeam);
        expect(state.getClientGivenName(recc3.basicInfo.clientName).team).to.equal(state.lobbyTeam);
        expect(state.getClientGivenName(recc4.basicInfo.clientName).team).to.equal(rect1.teamName);
    });
});

describe('save and load server state3', function () {
    before(function () {
        //load old serverState
        try {
            state.setGameStateByString(save);
        }
        catch (err) {
            //nothing since an error is expected because server tries to broadcast to invalid sockets
        }
    });
    //look up if everything was reloaded correctly
    it('should have old values after loading them', function () {
        expect(state.getCurrentCountdownConfig()).to.equal(7);
        expect(state.getAdminAuthKey()).to.equal("secure");
        expect(state.teamNameAlreadyExists(rect1.teamName)).to.equal(true);
        expect(state.teamNameAlreadyExists(rect2.teamName)).to.equal(true);
        expect(state.teamNameAlreadyExists(rect3.teamName)).to.equal(true);
        expect(state.getClientGivenName(recc1.basicInfo.clientName).team).to.equal(rect1.teamName);
        expect(state.getClientGivenName(recc2.basicInfo.clientName).team).to.equal(rect2.teamName);
        expect(state.getClientGivenName(recc3.basicInfo.clientName).team).to.equal(rect2.teamName);
        expect(state.getClientGivenName(recc4.basicInfo.clientName).team).to.equal(rect1.teamName);
    });

});