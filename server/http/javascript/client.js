var colorBuzz = '#FFFF00';
var colorOurBuzz = '#00FF00';
var colorForeignBuzz = '#FF0000';
var colorBuzzNotAllowed = '#555555';
var colorReady = '#EEEEEE';
var colorError = '#000000';

var sensitivity = 3.0;

var lastPos = {x: 0, y: 0, z: 0};
var diff = 0;

var suppressBuzz = false;

var localBuzzActive = false;
var remoteBuzzActive = false;
var remoteBuzzIsOurs = false;
var buzzAllowed = true;

var socket;

var audioContext, buzzer, connectionLost;


function diffData(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.y - b.y);
}


function makeColor(x) {
    var scolor = Math.round(Math.min(Math.max(x, 0), 255));
    return 'rgb(' + scolor + ',' + scolor + ',' + scolor + ')';
}

if (window.DeviceMotionEvent) {
    
    window.ondevicemotion = function(event) {
        var newPos, newRot;
        newPos = event.accelerationIncludingGravity;
        
        diff += diffData(lastPos, newPos);
        
        if (event.rotationRate) {
            diff += Math.abs(event.rotationRate.alpha);
            diff += Math.abs(event.rotationRate.beta);
            diff += Math.abs(event.rotationRate.gamma);
        }
        
        lastPos = newPos;
    };
}


function buzz() { // called if locally, a buzz request is made
    if (!(localBuzzActive || remoteBuzzActive || suppressBuzz) && buzzAllowed) {
        localBuzzActive = true;
        socket.send(JSON.stringify({ method: 'buzz' }));
        
        setTimeout(function() {
            localBuzzActive = false;
        }, 2000);
    }
}


function suspendBuzz() {
    suppressBuzz = true;
    setTimeout(function() {suppressBuzz = false;}, 2000);
}


function connect() {
    suspendBuzz();
    localBuzzActive = false;
    remoteBuzzActive = false;
    remoteBuzzIsOurs = false;
    
    $('#lightmsg').text('Connecting...');
    
    var psocket = new eio();
    psocket.on('open', function () {
        $('#innerlight').css('visibility', 'hidden');
        socket = psocket;
        socket.send(JSON.stringify({ method: 'register', teamName: $('#teamname').val() }));
        
        socket.on('message', function (msg) { processMsg(msg); });
        socket.on('close', function () { handleConnectionLoss(); });
        socket.on('error', function () { handleConnectionLoss(); });
    });
}


function handleConnectionLoss() {
    socket = null;
    playConnectionLostSound();
    $('#lightmsg').text('Connection lost.');
    $('#time').text("");
    $('#innerlight').css('visibility', 'visible');
    $('#light').css('background-color', colorError);
}


function processMsg(msg) {
    var obj = JSON.parse(msg);
    
    switch (obj.method) {
        case 'setState':
            switch (obj.state) {
                case 'free':
                    remoteBuzzActive = false;
                    remoteBuzzIsOurs = false;
                    break;
                case 'yougotit':
                    playBuzzerSound();
                    remoteBuzzActive = true;
                    remoteBuzzIsOurs = true;
                    break;
                case 'nobuzzforyou':
                    remoteBuzzActive = true;
                    remoteBuzzIsOurs = false;
                    break;
            default:
                console.log("Illegal state: %s", msg);
            }
            break;
        case 'tick':
            $('#time').text(obj.time);
            remoteBuzzActive = true;
            break;
        case 'setBuzzAllowed' :
            buzzAllowed = obj.value;
            break;
        case 'setTeamName':
            $('#teamname').val(obj.value);
            break;
        default:
            console.log("Illegal message: %s", msg);
    }
}


function initializeAudio() {
    if('webkitAudioContext' in window) {
        audioContext = new webkitAudioContext();
        
        bRequest = new XMLHttpRequest();
        bRequest.open('GET', 'sounds/buzzer.wav', true);
        bRequest.responseType = 'arraybuffer';
        bRequest.send();
        bRequest.addEventListener('load', function(event) {
            audioContext.decodeAudioData(bRequest.response, function onSuccess(decodedBuffer) {
                buzzer = decodedBuffer;
            }, function onFailure() {});
        });
        
        cRequest = new XMLHttpRequest();
        cRequest.open('GET', 'sounds/connection-lost.wav', true);
        cRequest.responseType = 'arraybuffer';
        cRequest.send();
        cRequest.addEventListener('load', function(event) {
            audioContext.decodeAudioData(cRequest.response, function onSuccess(decodedBuffer) {
                connectionLost = decodedBuffer;
            }, function onFailure() {});
        });
    }
}


function playConnectSound() {
    if (audioContext) {
        var source = audioContext.createOscillator();
        source.type = 0; // sine wave
        source.frequency.value = 1200;
        source.connect(audioContext.destination);
        source.start(0);
        source.stop(0.01);
    }
}


function playBuzzerSound() {
    if (audioContext) {
        var source = audioContext.createBufferSource();
        source.buffer = buzzer;
        source.connect(audioContext.destination);
        source.start(0);
    }
}


function playConnectionLostSound() {
    if (audioContext) {
        var source = audioContext.createBufferSource();
        source.buffer = connectionLost;
        source.connect(audioContext.destination);
        source.start(0);
    }
}


// INITIALIZATION
$(document).on('pageinit',function(event) {
    initializeAudio();
    
    $("#light").tap(function(event) {
        if (socket) {
            buzz();
        } else {
            connect();
            playConnectSound();
        }
    });
    
    $("#teamname").keyup(function() {
        if (socket) {
            socket.send(JSON.stringify({ method: 'changeTeamName', teamName: $('#teamname').val() }));
        }
    });
    
    window.setInterval(function(){
        $('#shaketobuzz').css('background-color', makeColor(255 - (diff - 1) * 10));
        if (diff > sensitivity && socket) { buzz(); }
        diff = 0;
        
        if (socket) {
            if (remoteBuzzActive) {
                if (remoteBuzzIsOurs) {
                    $('#light').css('background-color', colorOurBuzz);
                } else {
                    $('#light').css('background-color', colorForeignBuzz);
                }
            } else {
                $('#time').text("");
                if (localBuzzActive) {
                    $('#light').css('background-color', colorBuzz);
                } else {
                    if (buzzAllowed) {
                        $('#light').css('background-color', colorReady);
                    } else {
                        $('#time').text("disabled");
                        $('#light').css('background-color', colorBuzzNotAllowed);
                    }
                }
            }
        }
        
    }, 50);
    
    $('#lightmsg').text('Tap to connect.');
});