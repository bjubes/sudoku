var Util = require('./utilities.js')

class Lobby {
    constructor(room, isPublic = true){
      this.room = room;
      this.isPublic = isPublic;
      this.players = []
      this.joincode = Util.generateId().substring(0,5) // all lobbies have joincodes regardless of being public or private
      Lobby.updateLobbyList(this)
    }

    //static events
    static sendLobbyList(socket) {
      socket.emit("lobbyList", LobbyList);
    }

    static createAndJoinLobby(socket, roomName, isPublic){
      var lobby = new Lobby(roomName, isPublic)
      Lobby.JoinLobby(socket, lobby)
      socket.emit('createLobbyStatus', {success: true});
    }

    static findLobbyByName(name){
      for (var i = 0; i < Lobby.prototype.LobbyList.length; i++) {
        if( name = Lobby.prototype.LobbyList[i].room) {
          return Lobby.prototype.LobbyList[i]
        }
      }
      console.log("ERR: cannot find lobby with name: "+ name)
    }

    static JoinLobby(socket, lobby){
      Lobby.leaveLobby(socket,false)
      socket.join(lobby.room)
      socket.room = lobby.room; //aribtrary for bookkeeping
      socket.lobby = lobby // not sure if lobby can be arbitrarily added to socket...
      lobby.players.push(socket.id)
      var msg = socket.id + " joined the lobby"
      io.sockets.in(lobby.room).emit('addToChat', {name: "Server", msg: msg})
      io.sockets.in(lobby.room).emit('playerJoinLobby', {name: socket.id})
    }

    static leaveLobby(socket, strict= true){
      if(socket.room) {
        socket.room = undefined;
        var lobby = socket.lobby
        delete lobby.players[socket.id]
        if (lobby.players.length == 0 ){
          lobby.destroy();
        } else {
          io.sockets.in(lobby.room).emit('playerLeaveLobby', {name: socket.id})
        }
        socket.leave(socket.room);
        socket.emit('leaveLobbyStatus', {success: true});
      } else if(strict) {
        socket.emit('leaveLobbyStatus', {success: false, err: "not currently in a room"});
      }
    }

    //sends newly made lobby to existing players
    static updateLobbyList(lobby){
        this.prototype.LobbyList.push(lobby);
        //Util.broadcast("newLobby", lobby);
    }

    destroy(){
      delete Lobby.prototype.LobbyList[this]
    }
}

//LobbyList is shared across all Lobby Instances - C# version of static

Lobby.prototype.LobbyList = []
module.exports = Lobby;
