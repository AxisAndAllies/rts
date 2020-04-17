"use strict";
// manually call this from console to enable :)
window.setGodMode = (addMoney = 9999999, instantBuild = true) => {
  emitAction(ACTION_TYPES.GOD_MODE, {
    player_id: window.self?.id,
    addMoney,
    instantBuild,
  });
};
window.upgradeFac = () => {
  if (!window.selected?.fac) {
    alert("no fac selected");
    return;
  }
  emitAction(ACTION_TYPES.UPGRADE_BUILD_SPEED, {
    player_id: window.self?.id,
    fac_id: window.selected?.fac?.id,
  });
};

window.clearQueue = () => {
  if (!window.selected?.fac) {
    alert("no fac selected");
    return;
  }
  emitAction(ACTION_TYPES.CLEAR_FAC_QUEUE, {
    player_id: window.self?.id,
    fac_id: window.selected?.fac?.id,
  });
};

window.exportGame = () => {
  emitAction(ACTION_TYPES.EXPORT_GAME_STATE, {});
};

window.buyBlueprint = () => {
  // short tutorial if new
  // if (!window.self.blueprints.length)
  //   alert(
  //     `Keyboard shortcuts:\n\n[W,A,S,D] - pan\n[Z / X] - zoom in/out\n[C] - reset zoom\n[Enter] - end turn`
  //   );

  // console.log("bought blueprint!");
  let nos = getMakerObj().newobj;
  if (
    window.self?.blueprints
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
};

window.setAutoTarget = () => {
  if (!window.selected.units.length) {
    return;
  }
  console.log(`set autotarget to !${event.target.value}`);
  emitAction(ACTION_TYPES.SET_AUTOTARGET, {
    unit_ids: window.selected.units.map((u) => u.id),
    algorithm: event.target.value,
  });

  document.getElementById("autotarget").value = event.target.value;
};

window.endTurn = () => {
  if (!window.self || !window.self.finished_setup) {
    alert("Has not finished setup yet");
    return;
  }
  console.log("ended turn");
  emitAction(ACTION_TYPES.END_TURN);
};

function emitAction(type, data) {
  if (window.self?.ended_turn && type != ACTION_TYPES.END_TURN) {
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
  let coverage = Math.pow(speed * 5 + range * Math.sqrt(turn) * 4, 1.5); // b/c of kiting

  // accuracy is more important as damage increases/reload increases
  let efficient_dps =
    Math.pow(Math.sqrt((dmg + 2) / reload), 0.8) *
    ((accuracy / 100) * 0.75 + 0.25);

  // speed^2 to correct for value of moving fast
  // dps * health = damage output over lifespan
  // sqrt(turn) b/c difference between 5 and 10 deg way more valuable than 180 to 360 deg.
  let cost =
    coverage *
    efficient_dps *
    (dmg + health + speed * 2) *
    Math.sqrt(health + 2) *
    0.002;
  cost = Math.max(cost, 1000);
  return Math.round(cost);
}

// needs to be synced w/ backend player field
function newBlueprintCost() {
  // first 4 blueprints free
  let { self } = window;
  if (!self || self.blueprints.length < 4) {
    return 0;
  }
  return self.blueprints.length * 10000 + 10000;
}

function formatMoney(number) {
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function dispUnitStatText({ base_stats, cur_stats, autoTarget, owner_id }) {
  let disp = "";
  if (!base_stats || !cur_stats) return disp;
  Object.keys(cur_stats).forEach((k) => {
    if (owner_id == window.self.id)
      disp += `${k}: ${
        cur_stats[k] != base_stats[k] ? cur_stats[k] + "/" : ""
      } ${base_stats[k]}\n`;
    else {
      // obfuscate enemy unit stats :)
      let rem = Math.round(base_stats[k] - cur_stats[k]);
      disp += `${k}: ${"/".repeat(Math.round(cur_stats[k]))}${".".repeat(
        rem
      )}\n`;
    }
  });
  disp += `COST: ${formatMoney(calcCost(base_stats))}`;
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
  disp += `COST: ${formatMoney(calcCost(stats))}`;
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

  let hasBlueprint = window.self?.blueprints
    .map((e) => JSON.stringify(e.stats))
    .includes(JSON.stringify(newobj));

  document.getElementById("buy").disabled = hasBlueprint;
  document.getElementById("buy").innerText = `$${newBlueprintCost()}`;
  if (hasBlueprint) {
    document.getElementById("unitcost").innerText = `Already have blueprint.`;
  } else {
    document.getElementById("unitcost").innerText = `unit cost: ${formatMoney(
      calcCost(newobj)
    )}`;
  }
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
  // disabled=${window.selected.fac}
  let unitSelect = document.getElementById("unitselection");
  let showButtons = () => {
    let st = "";
    blueprints
      .sort((a, b) => a.unit_cost - b.unit_cost)
      .forEach((e) => {
        st += `<button id="${e.id}" 
        onmouseover="showBlueprintDetail('${e.id}')" 

        onclick="buyUnit('${e.id}')"
        >${e.name} (${formatMoney(e.unit_cost)})</button><br>`;
      });
    unitSelect.innerHTML = st;
  };
  unitSelect.innerHTML = ["[ UNITS ]"];
  // showButtons();
  document
    .getElementById("unitselection")
    .addEventListener("mouseleave", () => {
      unitSelect.innerHTML = ["[ UNITS ]"];
    });
  document
    .getElementById("unitselection")
    .addEventListener("mouseenter", () => {
      showButtons();
    });
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

function showUnitHistory(unit) {
  let hist = "";
  Object.keys(unit?.history || {}).forEach(
    // round to 2 decimals
    (k) => (hist += `${k}: ${Math.round(unit.history[k] * 100) / 100}\n`)
  );
  document.getElementById("unithistory").innerText = hist;
}

function showUnitDetail(unit) {
  // TODO: show base stats also
  document.getElementById("info").innerText = dispUnitStatText(unit);
}
function showBlueprintDetail(blueprint_id, player_id = window.self.id) {
  let stats = getBlueprint(blueprint_id, player_id).stats;
  document.getElementById("info").innerText = dispStatText(stats);
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
