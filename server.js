const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

// Will only hot reload after this
require("node-hot")
  // Globally configure node-hot (optional)
  .configure({
    // Disable logging (default: false)
    silent: true,

    // Automatically patch all exported classes (default: false)
    patchExports: true,

    // Exclude patterns (default: node_modules)
    exclude: [
      /[\/\\]node_modules[\/\\]/,
      /[\/\\]bower_components[\/\\]/,
      /[\/\\]jspm_packages[\/\\]/,
    ],
  });

// Main/entry module can't be reloaded, hence the extra file
const game = require("./game/game");

// let { enableHotReload, hotRequire } = require("@hediet/node-reload");

// // Call `enableHotReload` to track dependencies and watch for file changes.
// enableHotReload();

// hot reloading black magic :)
// from https://codeburst.io/dont-use-nodemon-there-are-better-ways-fc016b50b45e

// more comprehensive soln https://blog.cloudboost.io/reloading-the-express-server-without-nodemon-e7fa69294a96
// let production = process.env.NODE_ENV === "production";
// if (!production) {
//   let chokidar = require("chokidar");
//   // let watcher = chokidar.watch("./dist");
//   const watcher = chokidar.watch("./game");
//   function pathCheck(id) {
//     return (
//       // id.startsWith(path.join(__dirname, 'routes')) ||
//       id.startsWith(path.join(__dirname, "game"))
//     );
//   }
//   watcher.on("ready", function () {
//     watcher.on("all", function () {
//       console.log("Clearing module cache from server");
//       let files = [];
//       Object.keys(require.cache).forEach((id) => {
//         if (pathCheck(id)) {
//           // delete selectively
//           console.log("Reloading", id);
//           files.push(id);
//           delete require.cache[id];
//         }
//       });
//       Object.keys(require.cache).forEach(function (id) {
//         if (/[\/\\]dist[\/\\]/.test(id)) delete require.cache[id];
//       });
//       files.forEach((id) => {
//         let a = require(id);
//         try {
//           console.log(new a());
//         } catch (err) {
//           console.log("error constructing ", a);
//         }
//       });
//       // game.printStub();
//       // gotta require() again...
//       // key is to keep GameState and Game separate?
//       // or patch current Game funcs...
//       let state = game.state;
//       let refreshedGame = require("./game/game");
//       console.log("transferring state...", state);
//       game = new refreshedGame(state);
//     });
//   });
// }

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile("/index.html");
});

// app.get("/debug", function (req, res) {
//   res.sendFile(path.join(__dirname, "/public/debugger.html"));
// });

users = [];
pauseTime = 0;
hostSocket = null;

// hotRequire(module, "./game/game.js", (cur) => {
//   console.log(cur);
// });
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

    socket.broadcast.emit("game_state", game.state);
    socket.emit("game_state", game.state);
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
      hostSocket.broadcast.emit("game_state", game.state);
      hostSocket.emit("game_state", game.state);
    }
  }, 100);
});
