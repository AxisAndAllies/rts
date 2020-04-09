function emitAction(type, data) {
  if (window.self && window.self.ended_turn) {
    // can't make actions while game is resolving :)
    console.log("can't make actions while game is resolving :)");
    return;
  }
  console.log("acttion emitted: ", type, data);
  socket.emit("action", {
    type,
    data,
  });
}

function calcCost(obj) {
  let { dmg, health, range, speed, reload, turn } = obj;
  let realistic_range = speed / 2 + Math.pow(range, 1.5); // b/c of kiting
  let dps = dmg / reload;

  // speed^2 to correct for value of moving fast
  // dps * health = damage output over lifespan
  // sqrt(turn) b/c difference between 5 and 10 deg way more valuable than 180 to 360 deg.
  let cost = realistic_range * dps * health * Math.sqrt(turn) + speed * speed;
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
    "COST: $" + calcCost(CONSTRAINTS_MIN) + " -  $" + calcCost(CONSTRAINTS_MAX);
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

// isomorphic
function getUnitById(id) {
  let res = null;
  window.gameState.players.forEach((p) => {
    p.units.forEach((u) => {
      if (u.id == id) res = u;
    });
  });
  return res;
}
function unitColor(e) {
  return e.owner_id == window.self.id ? "black" : "red";
}
function refreshBlueprints(blueprints) {
  let st = "";
  // disabled=${window.selected.fac}

  blueprints.forEach((e) => {
    st += `<button id="${e.id}" 
    onmouseover="showBlueprintDetail('${e.id}')" 
    onmouseleave="showDefaultDetail()"
    onclick="buyUnit('${e.id}')"
    >${e.name} ($${e.unit_cost})</button><br>`;
  });
  document.getElementById("unitselection").innerHTML = st;
}

function getSelf(socket_id, gameState) {
  let { players, socket_player_map } = gameState;
  return players.filter((e) => e.id == socket_player_map[socket_id])[0];
}
function getPlayer(player_id) {
  return window.gameState.players.filter((e) => e.id == player_id)[0];
}
function getBlueprint(blueprint_id, player_id) {
  return getPlayer(player_id).blueprints.filter((e) => e.id == blueprint_id)[0];
}

function showUnitDetail(stats) {
  document.getElementById("info").innerText = dispStatText(stats);
}
function showBlueprintDetail(blueprint_id, player_id = window.self.id) {
  // console.log(window.self.blueprints);
  let stats = getBlueprint(blueprint_id, player_id).stats;
  document.getElementById("info").innerText = dispStatText(stats);
}
function showDefaultDetail() {
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
