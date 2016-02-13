var server = require('../server');
var CLI = require('../commandLineInterface');
var state = require('../serverState');
var assert = require('assert');
//with chai
var expect = require('chai').expect;


describe('Invalid inputs should return without crashing the server', function () {
    before(function () {
        //...
    });
    it('no input', function () {
        assert.equal(null, CLI.testCLI());
    });
    it('a really long input', function () {
        assert.equal(null, CLI.testCLI("abdlkeiaodsaidasgajsdagnaknaklnflaflabnhkbvalnjfnlsknvjsban" +
            "vhjbaljbejlanflnflalfjisajflaifnlsnflaisagajlfahflwehfnanhflanhflnasfnbfgajlbafabhfua" +
            "wbfabhnjbajkaubgauwbefgakbfukabwfkbhafbahfaihfuilsafhuisahfauiosdhfchklughwuunlianfjb" +
            "saljisajiufhoaiuhfioashfuisdfkjahlfuiahfiuabfgaklybgayulbauofhsahfuoahfuoyhuaolopngakl"));
    });
    it('some letters', function () {
        assert.equal(null, CLI.testCLI("abdlkeiaodsaiopngakl"));
    });
    it('some digits', function () {
        assert.equal(null, CLI.testCLI("2464632168146"));
    });
    it('some special signs', function () {
        assert.equal(null, CLI.testCLI("!@#$%()[]{}^&*/?\\\'\":;.,"));
    });
    it('more special signs', function () {
        assert.equal(null, CLI.testCLI("░▒▓ ☺♥☻ ♣♠♦♥ ◘○◙♂♀♪♫☼►◄↕‼¶§"));
    });
});

describe('buzzer specific commands', function () {
    before(function () {
        //...
    });
    it('enable buzzer', function () {
        CLI.testCLI("enable buzzer");
        assert.equal(true, state.getBuzzerStatus());
    });
    it('2nd enable should not change anything', function () {
        CLI.testCLI("enable buzzer");
        assert.equal(true, state.getBuzzerStatus());
    });
    it('disable now', function () {
        CLI.testCLI("disable buzzer");
        assert.equal(false, state.getBuzzerStatus());
    });
    it('and enable again', function () {
        CLI.testCLI("disable buzzer");
        assert.equal(false, state.getBuzzerStatus());
    });
});

describe('team specific commands', function () {
    before(function () {
        //...
    });
    it('createTeam', function () {
        CLI.testCLI("createTeam abcd");
        expect(state.teamNameAlreadyExists("abcd")).to.equal(true);
        var team = state.getTeamGivenTeamname("abcd");
        expect(team.teamName).to.equal("abcd");
    });
    it('createTeamWithInvalidNames', function () {
        CLI.testCLI("10 kleine Jägermeister");
        expect(state.getTeamGivenTeamname("10 kleine Jägermeister")).to.equal(undefined);
    });
    it('renameTeam', function () {
        CLI.testCLI("renameTeam abcd:defg");
        expect(state.teamNameAlreadyExists("defg")).to.equal(true);
        expect(state.getTeamGivenTeamname("defg").teamName).to.equal("defg");
    });
    it('renameTeamToInvalidName', function () {
        CLI.testCLI("renameTeam defg:Kappa123 & KappaPride");
        expect(state.teamNameAlreadyExists("defg")).to.equal(true);
        expect(state.getTeamGivenTeamname("defg").teamName).to.equal("defg");
    });
    it('rename Lobby', function () {
        CLI.testCLI("renameTeam Lobby:oha");
        expect(state.teamNameAlreadyExists("Lobby")).to.equal(true);
        expect(state.getTeamGivenTeamname("Lobby").teamName).to.equal("Lobby");
    });
    it('deleteTeam', function () {
        CLI.testCLI("deleteTeam defg");
        expect(state.teamNameAlreadyExists("defg")).to.equal(false);
        expect(state.getTeamGivenTeamname("defg")).to.equal(undefined);
    });
    it('delete non existing team', function () {
        expect(CLI.testCLI("deleteTeam trololololol")).to.equal(undefined);
    });
    it('delete Lobby', function () {
        CLI.testCLI("deleteTeam Lobby");
        expect(state.teamNameAlreadyExists("Lobby")).to.equal(true);
        expect(state.getTeamGivenTeamname("Lobby").teamName).to.equal("Lobby");
    });
});

//this will throw (catched) errors since the socket is not valid.
//but testing should work anyway
describe('client specific commands', function () {
    before(function () {
        var client = {
            socket: "something",
            basicInfo: {
                clientToken: 12345678,
                clientName: "testing",
                connected: true
            },
            team: state.lobbyTeam
        };
        state.addClient(client);
        state.addClientToTeam(client.basicInfo, state.lobbyTeam);
        CLI.testCLI("createTeam KappaPride");
    });
    it('renameUser', function () {
        CLI.testCLI("renameUser testing:testing2");
        expect(state.getClientGivenName("testing2").basicInfo.clientName).to.equal("testing2");
    });
    it('rename user to invalid name', function () {
        CLI.testCLI("renameUser testing2:trol&ol");
        expect(state.getClientGivenName("testing2").basicInfo.clientName).to.equal("testing2");
        expect(state.getClientGivenName("trol&ol")).to.equal(null);
    });
    it('change Team', function () {
        CLI.testCLI("changeTeam testing2:KappaPride");
        expect(state.getClientGivenName("testing2").team).to.equal("KappaPride");
    });
    it('change Team to nonexisting', function () {
        CLI.testCLI("changeTeam testing2:dgasdgae");
        expect(state.getClientGivenName("testing2").team).to.equal("KappaPride");
    });
    it('kick client', function () {
        CLI.testCLI("kickUser testing2");
        expect(state.getClientGivenName("testing2").team).to.equal(state.lobbyTeam);
    });
    it('kick non existing client', function () {
        CLI.testCLI("kickUser testingPride");
        expect(null).to.equal(null);
    });
});

describe('points', function () {
    before(function () {
        CLI.testCLI("createTeam KappaPride");
    });
    it('add Points', function () {
        CLI.testCLI("addPoints KappaPride:10");
        expect(state.getTeamGivenTeamname("KappaPride").points).to.equal(10);
    });
    it('remove Points', function () {
        CLI.testCLI("addPoints KappaPride:-5");
        expect(state.getTeamGivenTeamname("KappaPride").points).to.equal(5);
    });
    it('cannot add points to lobby', function () {
        CLI.testCLI("addPoints " + state.lobbyTeam + ":-5");
        expect(state.getTeamGivenTeamname(state.lobbyTeam).points).to.equal(0);
    });
});


describe('countdown', function () {
    before(function () {
        //...
    });
    it('set countdown', function () {
        CLI.testCLI("setCountdown 10");
        expect(state.getCurrentCountdownConfig()).to.equal(10);
    });
    it('set countdown to negative value', function () {
        CLI.testCLI("setCountdown -5");
        expect(state.getCurrentCountdownConfig()).to.equal(10);
    });
    it('set countdown to other invalid value', function () {
        CLI.testCLI("setCountdown holahola");
        expect(state.getCurrentCountdownConfig()).to.equal(10);
    });
});