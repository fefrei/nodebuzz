var port = 8080;


var express = require("express");
var app = express();

var buzzHoldSteps = 5;
var buzzHoldTick = 1000;

var buzzEnabled = true;
var buzzOnce = false;

var nextID = 0;

app.use("/", express.static("http"));

var http = app.listen(port);
var io = require('engine.io').attach(http, { pingInterval: 2000, pingTimeout: 5000 });

io.on('connection', function (socket) {
  console.log("A client has established a connection.");
  
  socket.on('message', function (msg) {
    processMsg(socket, msg);
  });
  socket.on('close', function () {
    processClose(socket);
  });
});

console.log("Listening on port %d", port);


var clients = [];
var monitors = [];
var admins = [];
var currentBuzzHolder = null;
var currentBuzzHoldSteps = 0;


function processMsg(socket, msg) {
  var obj = JSON.parse(msg);
  
  switch (obj.method) {
    case 'register':
      if (clients.length === 0) {nextID = 0;}
      var client = { socket: socket, id: nextID++, teamName: obj.teamName, buzzAllowed: true };
      clients.push(client);
      console.log("The team %s registered for id %d.", client.teamName, client.id);
      sendBuzzAllowed();
      sendClients();
      break;
    case 'monitor':
      monitors.push({ socket: socket });
      console.log("A monitor was attached.");
      sendConfiguration();
      break;
    case 'administrate':
      admins.push({ socket: socket });
      monitors.push({ socket: socket });
      console.log("An ADMINISTRATOR connected.");
      sendConfiguration();
      sendClients();
      break;
    case 'buzz':
      processBuzz(socket);
      break;
    case 'randomBuzz':
      processRandomBuzz();
      break;
    case 'forcedBuzz':
      processForcedBuzz(obj.teamID);
      break;
    case 'setBuzzAllowed':
      for (i = 0; i < clients.length; ++i) {
        if (clients[i].id == obj.teamID) {
          clients[i].buzzAllowed = obj.value;
          sendBuzzAllowed();
          sendConfiguration();
        }
      }
      break;
    case 'setTeamName':
      processSetTeamName(obj.teamID, obj.teamName);
      break;
    case 'changeTeamName':
      //processChangeTeamName(socket, obj.teamName);
      break;
    case 'setBuzzDuration':
      buzzHoldSteps = Math.max(Math.min(obj.buzzDuration, 60), 1);
      sendConfiguration();
      break;
    case 'setBuzzEnabled':
      buzzEnabled = obj.buzzEnabled;
      sendConfiguration();
      sendBuzzAllowed();
      break;
    case 'setBuzzOnce':
      buzzOnce = obj.buzzOnce;
      sendConfiguration();
      break;
    default:
      console.log("Illegal message: %s", msg);
  }
}


function processClose(socket) {
  // remove the client
  for (i = 0; i < clients.length; ++i) {
    if (clients[i].socket == socket) {
      console.log("The team %s disconnected.", clients[i].teamName);
      clients.splice(i--, 1);
      sendClients();
    }
  }
  
  // remove the monitor
  for (i = 0; i < monitors.length; ++i) {
    if (monitors[i].socket == socket) {
      console.log("A monitor disconnected.");
      monitors.splice(i--, 1);
    }
  }
  
  // remove the admin
  for (i = 0; i < admins.length; ++i) {
    if (admins[i].socket == socket) {
      console.log("A monitor disconnected.");
      admins.splice(i--, 1);
    }
  }
}


function sendConfiguration() {
  for (i = 0; i < admins.length; ++i) {
    admins[i].socket.send(JSON.stringify({ method: 'setConfig', buzzDuration: buzzHoldSteps, buzzEnabled: buzzEnabled, buzzOnce: buzzOnce }));
  }
  
  for (i = 0; i < monitors.length; ++i) {
    monitors[i].socket.send(JSON.stringify({ method: 'setBuzzEnabled', buzzEnabled: buzzEnabled }));
  }
}


function sendClients() {
  var clist = [];
  for (i = 0; i < clients.length; ++i) {
    clist.push({ id: clients[i].id, buzzAllowed: clients[i].buzzAllowed, teamName: clients[i].teamName });
  }
  
  for (i = 0; i < admins.length; ++i) {
    admins[i].socket.send(JSON.stringify({ method: 'listClients', clients: clist }));
  }
}


function sendBuzzAllowed() {
  for (i = 0; i < clients.length; ++i) {
    clients[i].socket.send(JSON.stringify({ method: 'setBuzzAllowed', value: (buzzEnabled && clients[i].buzzAllowed) }));
  }
}


function processChangeTeamName(socket, teamName) {
  for (i = 0; i < clients.length; ++i) {
    if (clients[i].socket == socket) {
      console.log("Team %d, formely %s, is now known as %s.", clients[i].id, clients[i].teamName, teamName);
      clients[i].teamName = teamName;
      //sendClients();
    }
  }
}


function processSetTeamName(id, teamName) {
  for (i = 0; i < clients.length; ++i) {
    if (clients[i].id == id) {
      console.log("Team %d, formely %s, was renamed by an admin to %s.", clients[i].id, clients[i].teamName, teamName);
      clients[i].teamName = teamName;
      //clients[i].socket.send(JSON.stringify({ method: 'setTeamName', value: teamName }));
      //sendClients();
    }
  }
}


function processBuzz(socket) {
  if (currentBuzzHolder === null && buzzEnabled) {
    for (i = 0; i < clients.length; ++i) {
      if (clients[i].socket == socket) {
        buzz(clients[i]);
        break;
      }
    }
  }
}


function processForcedBuzz(teamID) {
  if (currentBuzzHolder === null) {
    for (i = 0; i < clients.length; ++i) {
      if (clients[i].id == teamID) {
        console.log("Processing a forced buzz.");
        buzz(clients[i]);
        
        break;
      }
    }
  }
}


function processRandomBuzz() {
  if (currentBuzzHolder === null) {
    var possibleClients = [];
    
    for (i = 0; i < clients.length; ++i) {
      if (clients[i].buzzAllowed) {
        possibleClients.push(clients[i]);
      }
    }
    
    if (possibleClients.length > 0) {
      var client = possibleClients[Math.floor(Math.random() * possibleClients.length)];
      console.log("Processing a random buzz.");
      buzz(client);
    }
  }
}


function buzz(client) {
  currentBuzzHolder = client;
  currentBuzzHoldSteps = buzzHoldSteps;
  console.log("Buzz from team %s.", currentBuzzHolder.teamName);
  
  sendBuzzNotifications();
  processBuzzTick();
  
  if (buzzOnce) {
    buzzEnabled = false;
    sendConfiguration();
    sendBuzzAllowed();
  }
}


function processBuzzTick() {
  if (currentBuzzHoldSteps === 0) {
    currentBuzzHolder = null;
    console.log("Buzz released.");
    sendBuzzNotifications();
  } else {
    for (i = 0; i < monitors.length; ++i) {
      monitors[i].socket.send(JSON.stringify({ method: 'setTime', time: currentBuzzHoldSteps }));
    }
    for (i = 0; i < clients.length; ++i) {
      clients[i].socket.send(JSON.stringify({ method: 'tick', time: currentBuzzHoldSteps }));
    }
    
    currentBuzzHoldSteps--;
    setTimeout(processBuzzTick, buzzHoldTick);
  }
}


function sendBuzzNotifications() {
  if (currentBuzzHolder === null) {
    for (i = 0; i < clients.length; ++i) {
      clients[i].socket.send(JSON.stringify({ method: 'setState', state: 'free' }));
    }
    for (i = 0; i < monitors.length; ++i) {
      monitors[i].socket.send(JSON.stringify({ method: 'setState', state: 'free' }));
    }
  } else {
    for (i = 0; i < clients.length; ++i) {
      if (clients[i] == currentBuzzHolder) {
        clients[i].socket.send(JSON.stringify({ method: 'setState', state: 'yougotit' }));
      } else {
        clients[i].socket.send(JSON.stringify({ method: 'setState', state: 'nobuzzforyou' }));
      }
    }
    for (i = 0; i < monitors.length; ++i) {
      monitors[i].socket.send(JSON.stringify({ method: 'setState', state: 'buzzed', teamName: currentBuzzHolder.teamName }));
    }
  }
}
