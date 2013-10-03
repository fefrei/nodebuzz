var socket;

var audioContext, buzzer;

var buzzEnabled;

$('#statusmsg').text('Click to connect.');

function setStatusMsg() {
  if (buzzEnabled) {
    $('#statusmsg').text('Ready.');
  } else {
    $('#statusmsg').text('.');
  }
}

function connect() {
  $('#statusmsg').text('Connecting...');
  
  var psocket = new eio();
  psocket.on('open', function () {
    setStatusMsg();
    socket = psocket;
    socket.send(JSON.stringify({ method: 'monitor' }));
    
    socket.on('message', function (msg) { processMsg(msg) });
    socket.on('close', function () { handleConnectionLoss() });
    socket.on('error', function () { handleConnectionLoss() });
  });
};

function handleConnectionLoss() {
  socket = null;
  $('#buzzed').css('visibility', 'hidden');
  $('#statusmsg').text('Connection lost.');
  $('#nobuzz').css('visibility', 'visible');
}

function processMsg(msg) {
  var obj = JSON.parse(msg);
  
  switch (obj.method) {
    case 'setState':
      switch (obj.state) {
        case 'free':
          $('#buzzed').css('visibility', 'hidden');
          setStatusMsg();
          $('#nobuzz').css('visibility', 'visible');
          break;
        case 'buzzed':
          $('#nobuzz').css('visibility', 'hidden');
          $('#teamname').text(obj.teamName);
          $('#time').text("");
          $('#buzzed').css('visibility', 'visible');
          break;
      default:
        console.log("Illegal state: %s", msg);
      }
      break;
    case 'setTime':
      $('#time').text(obj.time);
      break;
    case 'setBuzzEnabled':
      buzzEnabled = obj.buzzEnabled;
      setStatusMsg();
      break;
    default:
      console.log("Illegal message: %s", msg);
  }
}

$("#status").on("tap", function(event){
  if (socket == null) {
    connect();
  }
});
