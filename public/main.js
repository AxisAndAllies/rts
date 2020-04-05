// const Victor = require("victor");

// Make the paper scope global, by injecting it into window:
paper.install(window);
const CONSTRAINTS_UNITS = {
  dmg: "dmg/shot",
  health: "hp",

  range: "m",
  speed: "m/sec",

  //   shortReload: "sec"
  reload: "sec",
  turn: "deg/sec",
};
const CONSTRAINTS_MIN = {
  dmg: 1,
  health: 1,

  range: 1,
  speed: 1,

  reload: 1,
  turn: 5,
};
const CONSTRAINTS_MAX = {
  dmg: 100,
  health: 100,

  range: 200,
  speed: 30,

  reload: 30,
  turn: 360,
};

const ACTION_TYPES = {
  END_TURN: "END_TURN",
  BUY_UNIT: "BUY_UNIT",
  BUY_BLUEPRINT: "BUY_BLUEPRINT",
  SET_UNIT_MOVE: "SET_UNIT_MOVE",
  SET_UNIT_ATTACK: "SET_UNIT_ATTACK",
};
///
window.gameState = null;
window.self = null;
window.selected = {};

// maps id to drawn path, ensuring each elem gets drawn exactly once
window.drawn = {};
//

function calcCost(obj) {
  let { dmg, health, range, speed, reload, turn } = obj;
  let realistic_range = speed / 2 + Math.pow(range, 1.5); // b/c of kiting
  let dps = dmg / reload;

  // speed^2 to correct for value of moving fast
  // dps * health = damage output over lifespan
  // sqrt(turn) b/c difference between 5 and 10 deg way more valuable than 180 to 360 deg.
  cost = realistic_range * dps * health * Math.sqrt(turn) + speed * speed;
  cost = Math.max(cost, 100);
  return Math.round(cost);
}

function formatMoney(number) {
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function dispStatText(stats) {
  let disp = "";
  Object.keys(stats).forEach((k) => {
    disp += k + ": " + stats[k] + "\n";
  });
  disp += "COST: $" + calcCost(stats);
  //   console.log(disp);
  return disp;
}

function dispText() {
  let disp = "";
  Object.keys(CONSTRAINTS_MAX).forEach((k) => {
    disp +=
      k +
      ": " +
      CONSTRAINTS_MIN[k] +
      " - " +
      CONSTRAINTS_MAX[k] +
      " " +
      CONSTRAINTS_UNITS[k] +
      "\n";
  });
  disp +=
    "COST: $" + calcCost(CONSTRAINTS_MIN) + " - $" + calcCost(CONSTRAINTS_MAX);
  //   console.log(disp);
  return disp;
}

function getMakerObj() {
  let newobj = {};
  let invalid = false;
  Object.keys(CONSTRAINTS_MIN).forEach((k) => {
    newobj[k] = parseInt(document.getElementById(k).value);
    if (newobj[k] < CONSTRAINTS_MIN[k] || newobj[k] > CONSTRAINTS_MAX[k]) {
      invalid = true;
    }
  });
  // console.log(newobj, invalid);
  return { invalid, newobj };
}

function updateMaker() {
  let { invalid, newobj } = getMakerObj();
  //   console.log(newobj);
  document.getElementById("maker");
  document.getElementById("buy").disabled = invalid;

  document.getElementById("buy").innerText = formatMoney(calcCost(newobj));
}

window.onload = function () {
  showdefaultdetail();
  let st = "";
  Object.keys(CONSTRAINTS_MIN).forEach((k) => {
    //min=${CONSTRAINTS_MIN[k]} max=${CONSTRAINTS_MAX[k]}
    st += `<span>${k}: </span><input type="text" value="${CONSTRAINTS_MIN[k]}" id="${k}" oninput="updateMaker()"</input><br>`;
  });
  console.log(st);
  document.getElementById("maker").innerHTML = st;
  updateMaker();

  // Setup directly from canvas id:
  paper.setup("canvas");
  // var path = new Path();
  // path.strokeColor = "black";
  // var start = new Point(100, 100);
  // path.moveTo(start);
  // path.lineTo(start.add([200, -50]));
  path = new Path.Rectangle([0, 0], [1200, 900]);
  path.fillColor = "#eee";
  path.onMouseDown = function (e) {
    // when clicking outside any objects
    console.log(e.point);
    window.selected = {};
  };
  // view.draw();

  // windo;

  // path.onMouseDown = () => {
  //   path.strokeColor = "red";
  // };

  view.onFrame = function (event) {
    // console.log(this.gameState);
    if (!window.gameState) {
      return;
    }
    window.gameState.players.forEach((p) => {
      // console.log("p");
      p.facs.forEach((elem) => {
        let fpos = Victor.fromObject(elem.pos);
        path =
          window.drawn[elem.id] ||
          new Path.Rectangle(fpos.subtract(Victor(30, 30)).toArray(), [30, 30]);
        path.strokeColor = "black";
        path.onMouseDown = function (e) {
          // console.log("lol", f);
          window.selected.fac = elem;
          console.log(window.selected);
        };
        path.strokeColor = window.selected.fac === elem ? "blue" : "black";
        path.fillColor = "white";

        window.drawn[elem.id] = path;
      });
      p.units.forEach((elem) => {
        let pos = Victor.fromObject(elem.pos);
        path =
          window.drawn[elem.id] ||
          new Path.Rectangle(pos.subtract(Victor(15, 15)).toArray(), [15, 15]);
        path.strokeColor = "black";
        path.fillColor = "white";
        path.onMouseDown = function (e) {
          // console.log("lol", f);
          window.selected.unit = elem;
          console.log(window.selected);
        };
        path.strokeColor = window.selected.unit === elem ? "blue" : "black";
        window.drawn[elem.id] = path;
      });
    });
    // On each frame, rotate the path by 3 degrees:
    Object.keys(window.drawn).forEach((k) => {
      window.drawn[k].rotate(1);
    });
    // path.rotate(0.25);
    view.draw();
  };
  // this.setInterval(() => {
  //   console.log(window.selected);
  // }, 1000);

  // // Create a simple drawing tool:
  // var tool = new Tool();
  // var path;

  // // Define a mousedown and mousedrag handler
  // tool.onMouseDown = function (event) {
  //   path = new Path();
  //   path.strokeColor = "black";
  //   path.add(event.point);
  // };

  // tool.onMouseDrag = function (event) {
  //   path.add(event.point);
  // };
};

function buyBlueprint() {
  console.log("bought blueprint!");
  let nos = getMakerObj().newobj;
  if (
    window.self &&
    window.self.blueprints
      .map((e) => JSON.stringify(e.stats))
      .includes(JSON.stringify(nos))
  ) {
    alert("you cannot buy the same blueprint twice");
    return;
  }
  emitAction(ACTION_TYPES.BUY_BLUEPRINT, {
    stats: nos,
    name: "lol",
  });
}

function endTurn() {
  console.log("ended turn");
  emitAction(ACTION_TYPES.END_TURN);
}

function emitAction(type, data) {
  socket.emit("action", {
    type,
    data,
  });
}

// on each update...
socket.on("game_state", (state) => {
  console.log(state);
  window.gameState = state;

  window.self = getSelf(socket.id, gameState);
  // console.log(window.self);
  refreshBlueprints(window.self.blueprints);
});

function getSelf(socket_id, gameState) {
  let { players, socket_player_map } = gameState;
  return players.filter((e) => e.id == socket_player_map[socket_id])[0];
}
function getBlueprint(blueprint_id) {
  return window.self.blueprints.filter((e) => e.id == blueprint_id)[0];
}
function showdetail(blueprint_id) {
  // console.log(window.self.blueprints);
  let stats = getBlueprint(blueprint_id).stats;
  document.getElementById("info").innerText = dispStatText(stats);
}
function showdefaultdetail() {
  document.getElementById("info").innerText = dispText();
}
function buyUnit(blueprint_id) {
  let factory_id = window.selected.fac.id;
  console.log("bought unit @ ", factory_id);
  emitAction(ACTION_TYPES.BUY_UNIT, {
    blueprint_id,
    factory_id,
  });
}
function refreshBlueprints(blueprints) {
  let st = "";
  // disabled=${window.selected.fac}

  blueprints.forEach((e) => {
    st += `<button id="${e.id}" 
    onmouseover="showdetail('${e.id}')" 
    onmouseleave="showdefaultdetail()"
    onclick="buyUnit('${e.id}')"
    >${e.name} ($${e.unit_cost})</button><br>`;
  });
  document.getElementById("unitselection").innerHTML = st;
}
