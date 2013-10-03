var socket;

var audioContext, buzzer;

$('#statusmsg').text('Click to connect.');


function connect() {
  $('#statusmsg').text('Connecting...');
  
  var psocket = new eio();
  psocket.on('open', function () {
    socket = psocket;
    socket.send(JSON.stringify({ method: 'administrate' }));
    
    socket.on('message', function (msg) { processMsg(msg) });
    socket.on('close', function () { handleConnectionLoss() });
    socket.on('error', function () { handleConnectionLoss() });
    
    $('#statusmsg').text('Ready.');
    $('#detail').css('visibility', 'visible');
  });
};

function handleConnectionLoss() {
  socket = null;
  $('#detail').css('visibility', 'hidden');
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
          $('#statusmsg').text('Ready.');
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
    case 'setConfig':
      $("#buzzduration").val(obj.buzzDuration);
      $("#buzzenabled").prop("checked", (obj.buzzEnabled));
      $("#buzzonce").prop("checked", (obj.buzzOnce));
      break;
    case 'listClients':
      updateClientList(obj.clients);
      break;
    case 'setBuzzEnabled':
      break; // not for us
    default:
      console.log("Illegal message: %s", msg);
  }
}


function addClientListRow(client) {
  var newRow = $('<tr class="client" data-client-id="' + client.id + '">');
  
  var cols = "";
  cols += '<td>' + client.id + '</td>';
  cols += '<td><input type="button" class="clientBuzz" value="Buzz!"></td>';
  cols += '<td><input type="checkbox" class="clientBuzzEnabled" checked="' + client.buzzAllowed + '"></td>';
  cols += '<td><input type="text" class="clientTeamName" value="' + client.teamName + '"></td>';
  
  newRow.append(cols);
  $("#clientList").append(newRow);
}


function updateClientListRow(client) {
  var found = false;
  
  $("tr.client").each(function() {
    var $this = $(this);
    if (parseInt($this.data("client-id")) == client.id) {
      found = true;
      
      // update
      $this.find('.clientBuzzEnabled').prop("checked", client.buzzAllowed);
      $this.find('.clientTeamName').val(client.teamName);
    }
  });
  
  return found;
}


function updateClientList(clients) {
  for (i = 0; i < clients.length; ++i) {
    if (!updateClientListRow(clients[i])) {
      addClientListRow(clients[i]);
    }
  }
  
  $("tr.client").each(function() {
    var $this = $(this);
    var id = parseInt($this.data("client-id"));
    
    var found = false;
    for (i = 0; i < clients.length; ++i) {
      if (clients[i].id == id) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      $this.closest("tr").remove();
    }
  });
}


function randomBuzz() {
  if (socket != null) {
    socket.send(JSON.stringify({ method: 'randomBuzz' }));
   }
}


$("#status").click("tap", function(event){
  if (socket == null) {
    connect();
  }
});

$("#buzzduration").change(function() {
  if (socket != null) {
    socket.send(JSON.stringify({ method: 'setBuzzDuration', buzzDuration: parseInt($("#buzzduration").val()) }));
   }
});

$("#buzzenabled").change(function() {
  if (socket != null) {
    socket.send(JSON.stringify({ method: 'setBuzzEnabled', buzzEnabled: $("#buzzenabled").is(':checked') }));
   }
});

$("#buzzonce").change(function() {
  if (socket != null) {
    socket.send(JSON.stringify({ method: 'setBuzzOnce', buzzOnce: $("#buzzonce").is(':checked') }));
   }
});

$(document).keypress(function( event ) {
  if ( $("*:focus").is("textarea, input") ) return; // ignore if a text field has focus
  
  switch (event.which) {
    case 32: //space
    case 101: //e
      $("#buzzenabled").prop("checked", !$("#buzzenabled").is(':checked')).trigger("change");
      break;
    case 111: //o
      $("#buzzonce").prop("checked", !$("#buzzonce").is(':checked')).trigger("change");
      break;
    case 114: //r
      randomBuzz();
      break;
  }
});

$("#clientList").on("click", ".clientBuzz", function (event) {
  var id = parseInt($(this).closest("tr").data("client-id"));
  if (socket != null) {
    socket.send(JSON.stringify({ method: 'forcedBuzz', teamID: id }));
  }
});

$("#clientList").on("change", ".clientBuzzEnabled", function (event) {
  var id = parseInt($(this).closest("tr").data("client-id"));
  var value = $(this).is(':checked');
  if (socket != null) {
    socket.send(JSON.stringify({ method: 'setBuzzAllowed', teamID: id, value: value }));
  }
});

$("#clientList").on("change", ".clientTeamName", function (event) {
  var id = parseInt($(this).closest("tr").data("client-id"));
  var name = $(this).val();
  if (socket != null) {
    socket.send(JSON.stringify({ method: 'setTeamName', teamID: id, teamName: name }));
  }
});

$("#randombuzz").click(function (event) {
  randomBuzz();
});
