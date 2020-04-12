"use strict";
function emitAction(type, data) {
  if (window.self?.ended_turn) {
    let numwait = window.gameState.players.filter((p) => !p.ended_turn).length;
    alert(
      ` ${
        numwait
          ? "You've ended your turn already. Waiting on " + numwait + " others."
          : "Can't issue commands while game resolving."
      }`
    );
    return;
  }
  console.log("action emitted: ", type, data);
  socket.emit("action", {
    type,
    data,
  });
}

function calcCost(obj) {
  let { dmg, health, range, speed, reload, turn, accuracy } = obj;
  let coverage = Math.pow(speed + range * Math.sqrt(turn) * 4, 1.5); // b/c of kiting

  // accuracy is more important as damage increases/reload increases
  let efficient_dps = (dmg / reload) * ((accuracy / 100) * 0.75 + 0.25);

  // speed^2 to correct for value of moving fast
  // dps * health = damage output over lifespan
  // sqrt(turn) b/c difference between 5 and 10 deg way more valuable than 180 to 360 deg.
  let cost =
    coverage * efficient_dps * (health + speed * 2) * Math.sqrt(health) * 0.004;
  cost = Math.max(cost, 1000);
  return Math.round(cost);
}

// needs to be synced w/ backend player field
function newBlueprintCost() {
  return window.self?.blueprints.length * 5000 + 5000 || 0;
}

function formatMoney(number) {
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function dispUnitStatText({ base_stats, cur_stats, autoTarget, owner_id }) {
  let disp = "";
  if (!base_stats || !cur_stats) return disp;
  Object.keys(cur_stats).forEach((k) => {
    if (owner_id == window.self.id)
      disp += `${k}: ${base_stats[k]} (${cur_stats[k]})\n`;
    else {
      // obfuscate enemy unit stats :)
      let rem = Math.round(base_stats[k] - cur_stats[k]);
      disp += `${k}: ${"/".repeat(Math.round(cur_stats[k]))}${".".repeat(
        rem
      )}\n`;
    }
  });
  disp += "COST: $" + calcCost(base_stats);
  if (owner_id == window.self.id) {
    disp += `\nAI: <${autoTarget.algorithm}>`;
  }
  //   console.log(disp);
  return disp;
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

function updateMakerText() {
  let { invalid, newobj } = getMakerObj();
  //   console.log(newobj);
  document.getElementById("maker");
  document.getElementById("buy").disabled = invalid;

  document.getElementById(
    "buy"
  ).innerText = `$${newBlueprintCost()} (unit cost: ${formatMoney(
    calcCost(newobj)
  )})`;
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
  return e.owner_id == window.self.id ? COLORS.SELF : COLORS.ENEMY;
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

function showUnitDetail(unit) {
  // TODO: show base stats also
  document.getElementById("info").innerText = dispUnitStatText(unit);
}
function showBlueprintDetail(blueprint_id, player_id = window.self.id) {
  let stats = getBlueprint(blueprint_id, player_id).stats;
  document.getElementById("blueprintInfo").innerText = dispStatText(stats);
}
function showDefaultDetail() {
  document.getElementById("blueprintInfo").innerText = dispText();
}
function buyUnit(blueprint_id) {
  if (!window.selected.fac) window.selected.fac = window.self.facs[0];
  let factory_id = window.selected.fac?.id;
  console.log("bought unit @ ", factory_id);
  emitAction(ACTION_TYPES.BUY_UNIT, {
    blueprint_id,
    factory_id,
  });
}
