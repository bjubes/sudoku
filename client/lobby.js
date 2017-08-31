var lobbyName = "";
var lobbyStatus =   document.getElementById("lobby-status")
var players = new Set()

function setStatus(text){
lobbyStatus.innerHTML = "<p>" + text + "</p>"
}

function joinRandom(){
  socket.emit("joinRandomGame")
  //expecting joinedexistinglobbystatus response
  setStatus("Finding an open Lobby...")
}
function toggleJoinCodeField(reset=false) {
  var field = document.getElementById("join-code")
  var input = document.getElementById("join-code-input")
  var button = document.getElementById("join-toggle-btn")

    if (field.style.display == 'none' && !reset) {
        field.style.display = 'block';
        button.innerHTML = "Cancel"
        input.select()
     }
     else {
         field.style.display = 'none';
         button.innerHTML = "Join Existing Lobby"
     }
}

function createNewLobby() {
  lobbyName = "room-name-here" //TODO: let player choose
  socket.emit('createLobby', {roomName: lobbyName, isPublic: true})
  setStatus("Creating new lobby...")
}

socket.on('createLobbyStatus', function(data){
  if(data.success){
    joinedLobby();
  } else {
    setStatus("Could not create a new lobby.")
  }
})

function joinExisitingLobby() {
  var code = document.getElementById("join-code-input").value
  if(code.length != 0) {
    socket.emit("joinExisitingLobby", code)
    setStatus("Attempting to join...")
  }
  else {
    setStatus("Please enter a Lobby code")
  }
}

socket.on('joinExisitingLobbyStatus', function(data){
  if (data.success){
    console.log(data);
    lobbyName = data.lobby.room;
    socket.emit('requestPlayerList')
    joinedLobby();
  } else{
    setStatus(data.err)
  }
})

//player list inital pull and delta changes
socket.on('playerList', function(serverPlayersList){
  players = new Set(serverPlayersList)
  redrawPlayerList()
})

socket.on('playerJoinLobby', function(player){
  players.add(player.name)
  redrawPlayerList()
})


socket.on('playerLeaveLobby', function(player){
    players.delete(player.name)
    redrawPlayerList()
})

function redrawPlayerList() {
  while (document.getElementById('player-table').rows.length > 1) {
    document.getElementById('player-table').deleteRow(1)
  }
  players.forEach(function(player){
    var row = document.getElementById('player-table').insertRow(-1)
    row.innerHTML =  player
  })
}

// joining and leaving
function joinedLobby(){
  var field = document.getElementById("join-code").style.display = 'none'
  var button = document.getElementById("create-lobby-btn")
  button.innerHTML = "In Lobby"
  button.disabled = true
  document.getElementById("chat").style.display = 'block'
  document.getElementById("not-in-lobby").style.display = 'none'
  document.getElementById("in-lobby").style.display = 'block'
  document.getElementById("player-table-div").style.display = 'block'
  setStatus("In Lobby: " + lobbyName)
}

function leaveLobby(){
  //triggered by button - actuallly does the leaving
  socket.emit("leaveLobby");
  leftLobby();
}
function leftLobby(){
  toggleJoinCodeField(true)
  var button = document.getElementById("create-lobby-btn")
  button.innerHTML = "Create New Lobby"
  button.disabled = false
  document.getElementById("player-table-div").style.display = 'none'
  document.getElementById("chat").style.display = 'none'
  document.getElementById("not-in-lobby").style.display = 'block'
  document.getElementById("in-lobby").style.display = 'none'
  document.getElementById("lobby-status").innerHTML = ""
  document.getElementById("chat-text").innerHTML = ""
  setStatus("Left " + lobbyName)
}
