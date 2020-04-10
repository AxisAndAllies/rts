const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const fs = require("fs");

// const Bundler = require("parcel");

// const bundler = new Bundler("./public/index.html", {
//   // Don't cache anything in development
//   cache: false,
// });

if (process.env.NODE_ENV !== "production") {
  // // Step 1: Create & configure a webpack compiler
  // var webpack = require("webpack");
  // var webpackConfig = require(process.env.WEBPACK_CONFIG
  //   ? process.env.WEBPACK_CONFIG
  //   : "./webpack.config");
  // var compiler = webpack(webpackConfig);

  // // Step 2: Attach the dev middleware to the compiler & the server
  // app.use(
  //   require("webpack-dev-middleware")(compiler, {
  //     logLevel: "warn",
  //     publicPath: webpackConfig.output.publicPath,
  //   })
  // );

  // // Step 3: Attach the hot middleware to the compiler & the server
  // app.use(
  //   require("webpack-hot-middleware")(compiler, {
  //     log: console.log,
  //     path: "/__webpack_hmr",
  //     heartbeat: 10 * 1000,
  //   })
  // );

  // Will only hot reload after this
  require("node-hot")
    // Globally configure node-hot (optional)
    .configure({
      // Disable logging (default: false)
      silent: false,

      // Automatically patch all exported classes (default: false)
      patchExports: true,

      // Exclude patterns (default: node_modules)
      exclude: [/[\/\\]node_modules[\/\\]/],
    });
  /**
   * can't simply roll-your-own hot reload like https://blog.cloudboost.io/reloading-the-express-server-without-nodemon-e7fa69294a96
   * b/c that doesn't take into account changes in dep tree, too naive
   */
}

let active_sockets = [];
let pauseTime = 0;
let hostSocket = null;

// hack :)
recently_disconnected_users = [];

// Main/entry module can't be reloaded, hence the extra file
// const game = new (require("./game/game"))(loadGameStateFromFile());
const game = new (require("./game/game"))();

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile("/index.html");
});

function loadGameStateFromFile() {
  // TODO: use https://github.com/typestack/class-transformer to convert POJO --> actual class instances
  let raw = "{}";
  try {
    raw = fs.readFileSync("./gameState.json");
  } catch (err) {
    console.error(err);
  }
  let state = JSON.parse(raw);
  // allow all players to reconnect :)
  if (Object.keys(state).length > 0) {
    Object.keys(state.socket_player_map).forEach((id) =>
      recently_disconnected_users.push({
        id: id,
        ts: Date.now(),
      })
    );
    console.log(recently_disconnected_users);
  }
  return state;
}

function checkReconnect(new_socket_id) {
  if (recently_disconnected_users.length) {
    // hacky reconnect XD using FILA (like a stack)
    // TODO: use actually good auth/fingerprinting/sessions
    let old_socket = recently_disconnected_users.pop();
    game.updatePlayerSocket(old_socket.id, new_socket_id);
  } else {
    // actually new player
    console.log("new player", new_socket_id);
    game.addNewPlayer(new_socket_id);
  }
}
/*
see https://socket.io/docs/emit-cheatsheet/
*/

setInterval(() => {
  // clear stale disconnects (>10 sec disconnects)
  let stale_users = recently_disconnected_users
    .filter((u) => Date.now() - u.ts > 10 * 1000)
    .map((u) => u.id);

  stale_users.forEach((id) => {
    game.removePlayer(id);
    console.log("removed stale user ", id);
  });
  recently_disconnected_users = recently_disconnected_users.filter(
    (u) => !stale_users.includes(u.id)
  );
}, 1000);

io.on("connection", function (socket) {
  console.log("a user connected", socket.id);
  hostSocket = socket;
  if (!active_sockets.includes(socket.id)) {
    active_sockets.push(socket.id);
    checkReconnect(socket.id);

    // send client initial game state :)
    socket.emit("game_state", game.state);
  }
  socket.on("disconnect", function () {
    active_sockets = active_sockets.filter((e) => e != socket.id);
    recently_disconnected_users.push({ id: socket.id, ts: Date.now() });
    console.log(
      "user disconnect detected, adding to stack",
      recently_disconnected_users
    );
  });
  socket.on("action", function (msg) {
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

// Pass the Parcel bundler into Express as middleware
// app.use(bundler.middleware());

let gameLoop = null;

function runGame() {
  // TODO: make this more accurate, finer...

  gameLoop = setInterval(() => {
    // a hack lol, hostSocket can be disconnected...
    if (!hostSocket) {
      console.error("host socket does not exist");
      return;
    }
    let updated = game.update(100);
    if (updated) {
      hostSocket.broadcast.emit("game_state", game.state);
      hostSocket.emit("game_state", game.state);
    }
  }, 100);
}

http.listen(process.env.PORT || 8080, function () {
  console.log("listening on *:8080");

  runGame();
});

// enables server to keep state even on errors, prevent crashes no matter what
if (process.env.NODE_ENV !== "production") {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  process.on("uncaughtException", function (err) {
    console.log(
      "Unhandled Exception: Please fix the error below and press ENTER to continue :)"
    );
    console.trace(err.stack);
    clearInterval(gameLoop);

    rl.on("line", () => {
      console.log("game resuming ", game.state);
      runGame();
    });
  });
}
