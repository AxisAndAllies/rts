var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
const path = require("path");

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile("/index.html");
});

// app.get("/debug", function (req, res) {
//   res.sendFile(path.join(__dirname, "/public/debugger.html"));
// });

players = [];
pauseTime = 0;

/*
see https://socket.io/docs/emit-cheatsheet/
*/

io.on("connection", function (socket) {
  console.log("a user connected", socket.id);
  players.push({ id: socket.id });
  socket.on("disconnect", function () {
    console.log("user disconnected");
    players = players.filter((e) => e.id != socket.id);
  });
  socket.on("player_pos", function (msg) {
    players.filter((e) => e.id == socket.id)[0].pos = msg;
    // console.log(players);

    socket.broadcast.emit("other_player_pos", { id: socket.id, pos: msg });
  });
  socket.on("pause", function (msg) {
    // when any player sends a pause event, pause for all players
    pauseTime = 5000;

    socket.emit("pause", { time: pauseTime });
    socket.broadcast.emit("pause", { time: pauseTime });
    // setInterval(function() {
    //   pauseTime = 0;
    // }, pauseTime);
  });
});

http.listen(process.env.PORT || 8080, function () {
  console.log("listening on *:8080");
});
