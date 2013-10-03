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

var audioContext, buzzer;


function diffData(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.y - b.y)
}


function makeColor(x) {
  var scolor = Math.round(Math.min(Math.max(x, 0), 255));
  return 'rgb(' + scolor + ',' + scolor + ',' + scolor + ')';
}

if (window.DeviceMotionEvent != undefined) {
  
  window.ondevicemotion = function(event) {
    var newPos, newRot;
    newPos = event.accelerationIncludingGravity;
    
    diff += diffData(lastPos, newPos);
    
    if (event.rotationRate != null) {
      diff += Math.abs(event.rotationRate.alpha);
      diff += Math.abs(event.rotationRate.beta);
      diff += Math.abs(event.rotationRate.gamma);
    }
    
    lastPos = newPos;
  }
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
  $('#lightmsg').text('Connecting...');
  
  var psocket = new eio();
  psocket.on('open', function () {
    $('#innerlight').css('visibility', 'hidden');
    socket = psocket;
    socket.send(JSON.stringify({ method: 'register', teamName: $('#teamname').val() }));
    
    socket.on('message', function (msg) { processMsg(msg) });
    socket.on('close', function () { handleConnectionLoss() });
    socket.on('error', function () { handleConnectionLoss() });
  });
};


function handleConnectionLoss() {
  socket = null;
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
    request = new XMLHttpRequest();
  	request.open('GET', 'sounds/buzzer.wav', true);
  	request.responseType = 'arraybuffer';
    request.addEventListener('load', function(event) {
    buzzer = audioContext.createBuffer(request.response, false);
  });
  request.send();
  }
}


function playConnectSound() {
  if (audioContext != null) {
    var source = audioContext.createOscillator();
    source.type = 0; // sine wave
    source.frequency.value = 1200;
    source.connect(audioContext.destination);
    source.start(0);
    source.stop(0.01);
  }
}


function playTickSound() {
  if (audioContext != null) {
    var source = audioContext.createOscillator();
    source.type = 0; // sine wave
    source.frequency.value = 1000;
    source.connect(audioContext.destination);
    source.start(0);
    source.stop(0.1);
  }
}


function playBuzzerSound() {
  if (audioContext != null) {
    var source = audioContext.createBufferSource();
    source.buffer = buzzer;
    source.connect(audioContext.destination);
    source.start(0);
  }
}


// INITIALIZATION
$(document).on('pageinit',function(event) {
  initializeAudio();
  
  $("#light").tap(function(event) {
    if (socket != null) {
      buzz();
    } else {
      connect();
      playTickSound();
    }
  });
  
  $("#teamname").keyup(function() {
    if (socket != null) {
      socket.send(JSON.stringify({ method: 'changeTeamName', teamName: $('#teamname').val() }));
    }
  });
  
  window.setInterval(function(){
    
    $('#shaketobuzz').css('background-color', makeColor(255 - (diff - 1) * 10));
    if (diff > sensitivity && socket != null) { buzz(); }
    diff = 0;
    
    if (socket != null) {
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