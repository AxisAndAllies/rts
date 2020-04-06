const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const Game = require("./game");
const path = require("path");

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile("/index.html");
});

// app.get("/debug", function (req, res) {
//   res.sendFile(path.join(__dirname, "/public/debugger.html"));
// });

users = [];
pauseTime = 0;
game = new Game();
hostSocket = null;
/*
see https://socket.io/docs/emit-cheatsheet/
*/

io.on("connection", function (socket) {
  console.log("a user connected", socket.id);
  hostSocket = socket;
  if (!users.map((u) => u.id).includes(socket.id)) {
    // don't add again on reconnect...
    users.push({ id: socket.id });
    game.addNewPlayer(socket.id);
  }
  socket.on("disconnect", function () {
    console.log("user disconnected");
    game.removePlayer(socket.id);
    users = users.filter((e) => e.id != socket.id);
  });
  socket.on("action", function (msg) {
    // users.filter((e) => e.id == socket.id)[0].pos = msg;
    // console.log(users);
    console.log("Handing action ", msg);
    game.handlePlayerAction(msg.type, socket.id, msg.data);

    socket.broadcast.emit("game_state", game.getState());
    socket.emit("game_state", game.getState());
  });
  //   socket.on("pause", function (msg) {
  //     // when any player sends a pause event, pause for all users
  //     pauseTime = 5000;

  //     socket.emit("pause", { time: pauseTime });
  //     socket.broadcast.emit("pause", { time: pauseTime });
  //     // setInterval(function() {
  //     //   pauseTime = 0;
  //     // }, pauseTime);
  //   });
});

http.listen(process.env.PORT || 8080, function () {
  console.log("listening on *:8080");
  // TODO: make this more accurate, finer...
  setInterval(() => {
    // a hack lol, hostSocket can be disconnected...
    if (!hostSocket) {
      console.error("host socket does not exist");
      return;
    }
    const updated = game.update(100);
    if (updated) {
      hostSocket.broadcast.emit("game_state", game.getState());
      hostSocket.emit("game_state", game.getState());
    }
  }, 100);
});
