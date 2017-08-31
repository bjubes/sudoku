var express = require('express');
var app = express();
var serv = require('http').Server(app);

var Util = require('./utilities.js')
var Lobby = require('./lobby.js')
//https on heroku
app.get('*', function(req,res,next) {
  if(req.headers['x-forwarded-proto'] != 'https' && process.env.NODE_ENV === 'production')
    res.redirect('https://'+req.hostname+req.url)
  else
    next() /* Continue to other routes if we're not redirecting */
});
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("----server started-----");

DEBUG = process.env.DEBUG

io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
  console.log(socket.id + " connected.");
  var response = "connected as " + socket.id
  socket.emit('addToChat', {name:"Server", msg: response})

    socket.on('createLobby', function(data){
    Lobby.createAndJoinLobby(socket,data.roomName,data.isPublic)
    })

  socket.on('joinRandomGame', function(){
    var err = "No open games."
    for (var i = 0; i < Lobby.prototype.LobbyList.length; i++) {
      if (Lobby.prototype.LobbyList[i].players.size < 4){
    joinLobby(Lobby.prototype.LobbyList[i], socket, err )
    return;
      }
    }
    var statusObj = {
      success: false,
      err: err
    }
    socket.emit('joinExisitingLobbyStatus', statusObj);
  })

  socket.on('joinExisitingLobby', function(code){
    var err = "Invalid join code."
    var lobby;
    for (var i = 0; i < Lobby.prototype.LobbyList.length; i++) {
      if (code == Lobby.prototype.LobbyList[i].joincode){
    joinLobby(Lobby.prototype.LobbyList[i], socket, err )
    return;
      }
    }
    var statusObj = {
      success: false,
      err: err
    }
    socket.emit('joinExisitingLobbyStatus', statusObj);
  })

  socket.on('requestPlayerList', function(){
    socket.emit('playerList', Array.from(socket.lobby.players))
  })

  socket.on('leaveLobby', function(){
    Lobby.leaveLobby(socket);
  })

  socket.on('disconnect',function(){
    Lobby.leaveLobby(socket)
    console.log(socket.id + " disconnected.");
    })

    socket.on('chatToServer',function(msg){
    if (socket.room!= undefined){
      io.to(socket.room).emit('addToChat', {name: socket.id, msg: msg})
    }
  })

   socket.on('evalServer',function(data){
       if(!DEBUG)
       return;
       var res = eval(data);
       socket.emit('evalResponse',res);
   });

});


function joinLobby(lobby, socket, error) {
    var statusObj = {success:false, err:error}
      if (lobby.players.size < 4){
    statusObj = {
    success: true,
    lobby: lobby,
    err:""
    }
    Lobby.joinLobby(socket, lobby)
      }
      else  {
    statusObj = {
      success: false,
      err:"That lobby is full"
    }
      }
    socket.emit('joinExisitingLobbyStatus', statusObj);
}
