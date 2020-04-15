// "use strict";

// const Victor = require("victor");

// Make the paper scope global, by injecting it into window:
// import paper from "./lib/paper-full";

paper.install(window);
// disable arrow key scrolling page
window.addEventListener(
  "keydown",
  function (e) {
    // space and arrow keys, enter key
    if ([32, 37, 38, 39, 40, 13].indexOf(e.keyCode) > -1) {
      e.preventDefault();
    }
    if (e.keyCode == 13) {
      // press Enter to end turn.
      window.endTurn();
      // this.alert("Turn ended.");
    }
  },
  false
);

//
window.gameState = null;
window.self = null;

function resetWindowSelected() {
  window.selected = {
    units: window.selected?.units || [],
    fac: null,
  };
}
resetWindowSelected();
window.hovered = {};

// maps id to drawn path, ensuring each elem gets drawn exactly once
window.drawn = {};

window.drawn_shots = [];
//

console.log(`Maybe just type 'setGodMode()'`);

console.log(
  `Keyboard shortcuts:\n\n[W,A,S,D] - pan\n[Z / X] - zoom in/out\n[C] - reset zoom\n[Enter] - end turn`
);

showDefaultDetail();

// Setup directly from canvas id:
paper.setup("canvas");

const background = new Path.Rectangle([0, 0], [1200, 1200]);
background.fillColor = "#e7e7e7";
background.strokeColor = COLORS.NEUTRAL;
addShadow(background, 6, background.position, 0);

const outOfBounds = Victor(-300, -300);

const hoveredRange = new Path.Circle({
  center: outOfBounds,
  radius: 1,
  strokeColor: "#888",
  dashArray: [4, 8],
});
const hoveredMoveTarget = new Path.Rectangle({
  center: outOfBounds,
  size: [10, 10],
  strokeColor: "green",
  strokeWidth: 1,
});

const hoveredAttackTarget = new Path.Rectangle({
  center: outOfBounds,
  size: [24, 24],
  strokeWidth: 2,
  strokeColor: "maroon",
  rotation: 45,
});
const hoveredHealthBar = new Path.Line({
  from: outOfBounds,
  to: outOfBounds,
  strokeColor: "green",
});
const massSelector = new Path.Rectangle({
  center: outOfBounds,
  size: [5, 5],
  strokeColor: "teal",
  dashArray: [2, 4],
});

setInterval(() => {
  hoveredAttackTarget.tweenTo({ opacity: 0.2 }, 750).then(() => {
    hoveredAttackTarget.tweenTo({ opacity: 1 }, 750);
  });
}, 1500);
// const hoveredText = new PointText(outOfBounds);
// hoveredText.justification = "center";
// hoveredText.fillColor = "black";
// hoveredText.content = "hi";
let curMassSelectorMode = MOUSE_MODES.SELECT;
let massSelectorStart = outOfBounds;
let viewOriginalCenter = {
  x: background.bounds.width / 2,
  y: background.bounds.height / 2,
};
let mouseLoc = { x: 0, y: 0 };
// let shiftHeld = false;

let viewShift = Victor(0, 0);
function addViewShift(vec) {
  // fast direction change...
  if (vec.x * viewShift.x < 0) {
    viewShift.x = 0;
  }
  if (vec.y * viewShift.y < 0) {
    viewShift.y = 0;
  }
  viewShift.add(vec);
}
setInterval(() => {
  // smooth panning
  if (Math.pow(viewShift.x, 2) + Math.pow(viewShift.y, 2) > 4) {
    let normed = viewShift.clone().divide(Victor(10, 10));
    viewShift.subtract(normed);
    view.center = Victor.fromObject(view.center).add(normed);
  }
}, 20);

tool = new Tool();
tool.onKeyDown = function ({ key }) {
  let centeredZoom = (factor) => {
    let c = Victor.fromObject(view.center);
    let p = Victor.fromObject(mouseLoc);
    p.subtract(c); // distance in project coords
    p.multiply(Victor((factor - 1) / factor, (factor - 1) / factor));
    c.add(p);
    view.center = c;
  };
  if (key == "z") {
    let factor = 1.5;
    if (view.zoom < 2) view.zoom *= factor;

    centeredZoom(factor);

    // Prevent the key event from bubbling
    return false;
  }
  if (key == "x") {
    let factor = 1 / 1.5;
    if (view.zoom > 0.7) view.zoom *= factor;
    centeredZoom(factor);
    // Prevent the key event from bubbling
    return false;
  }
  if (key == "c") {
    view.zoom = 1;
    view.center = viewOriginalCenter;
    // view.center = Victor(background.size
  }
  if (key == "w") {
    addViewShift(Victor(0, -100));
  }
  if (key == "a") {
    addViewShift(Victor(-100, 0));
  }
  if (key == "s") {
    addViewShift(Victor(0, 100));
  }
  if (key == "d") {
    addViewShift(Victor(100, 0));
  }
  if (key == "shift") {
    console.log("shift");
    // shiftHeld = true;
  }
};
background.onMouseDown = function (e) {
  // when clicking outside any objects
  let btn = e.event.button;

  resetWindowSelected();
  massSelectorStart = e.point;
  // left/right click
  switch (btn) {
    case 0:
      curMassSelectorMode = MOUSE_MODES.SELECT;
      break;
    // case 1:
    //   curMassSelectorMode = MOUSE_MODES.DRAG;
    //   break;
    case 2:
      curMassSelectorMode = MOUSE_MODES.MOVE;
      break;
  }
  console.log(`mouse mode ${curMassSelectorMode}`);
};
tool.onMouseDrag = function (e) {
  // console.log(e.delta);
  // if (shiftHeld)
  // console.log(e);
  // view.center = Victor.fromObject(view.center).subtract(
  //   Victor.fromObject(e.delta)
  // );
};
view.onMouseMove = function (e) {
  // // update mouseLoc
  mouseLoc = e.point;
  // if (curMassSelectorMode == MOUSE_MODES.DRAG) {
  //   let diff = Victor.fromObject(mouseLoc).subtract(
  //     Victor.fromObject(massSelectorStart)
  //   );
  //   console.log(diff);
  //   view.center = Victor.fromObject(viewOriginalCenter).add(diff);
  //   return;
  // }

  if (curMassSelectorMode == MOUSE_MODES.SELECT) {
    massSelector.strokeColor = "teal";
  } else {
    massSelector.strokeColor = "brown";
  }
  if (massSelectorStart == outOfBounds) return;
  massSelector.position = [
    (massSelectorStart.x + e.point.x) / 2 - 1,
    (massSelectorStart.y + e.point.y) / 2 - 1,
  ];
  massSelector.scale(
    (Math.abs(massSelectorStart.x - e.point.x) - 3.1) /
      massSelector.bounds.width,
    (Math.abs(massSelectorStart.y - e.point.y) - 3.1) /
      massSelector.bounds.height
  );
};
background.onMouseUp = function (e) {
  let btn = e.event.button;
  if (btn == 0) {
    const selunits = window.self.units.filter((u) =>
      massSelector.bounds.contains(u.pos)
    );
    console.log("selected", selunits);
    window.selected.units = selunits;
  } else if (btn == 2) {
    // if (window.selected.units.some((u) => u.owner_id != window.self.id)) {
    //   // can't move enemy units, this block should never execute
    //   console.log("contains enemy, deselected");
    //   window.selected.units = []; // deselects
    //   return;
    // }
    let { x, y } = e.point;
    emitAction(ACTION_TYPES.SET_UNIT_MOVE, {
      unit_ids: window.selected.units.map((u) => u.id),
      to: {
        minX: Math.min(massSelectorStart.x, x),
        maxX: Math.max(massSelectorStart.x, x),
        minY: Math.min(massSelectorStart.y, y),
        maxY: Math.max(massSelectorStart.y, y),
      },
    });
  }
  // reset mass selector
  massSelectorStart = outOfBounds;
  massSelector.position = outOfBounds;
  massSelector.scale(
    5 / massSelector.bounds.width,
    5 / massSelector.bounds.height
  );
};

function resetHoveredRange() {
  hoveredRange.position = outOfBounds;
  hoveredRange.scale(1 / (hoveredRange.bounds.width / 2));
}
// function resetHoveredText() {
//   hoveredText.position = outOfBounds;
//   hoveredText.justification = "center";
//   hoveredText.fillColor = "black";
//   hoveredText.content = "";
//   hoveredText.scale(100 / view.zoom / hoveredText.bounds.height);
// }
function resetHoveredMoveTarget() {
  hoveredMoveTarget.position = outOfBounds;
}
function resetHoveredAttackTarget() {
  hoveredAttackTarget.position = outOfBounds;
}
function resetHoveredHealth() {
  hoveredHealthBar.segments = [outOfBounds, outOfBounds];
}

view.onFrame = function (event) {
  // console.log(this.gameState);
  if (!window.gameState) {
    return;
  }

  if (window.selected?.fac) {
    document.getElementById(
      "clearqueue"
    ).innerText = `Clear Queue $${window.selected.fac.buildQueue
      .map((e) => Number(e.remaining))
      .reduce((a, v) => a + v, 0)}`;
  }

  const income = window.gameState?.control_points
    .filter((cp) => cp.owner_id == window.self.id)
    .reduce((a, v) => a + v.baseResourcesPerSecond * 5, 0);
  document.getElementById(
    "money"
  ).innerText = `$${window.self?.money} (+ $${income})`;

  document.getElementById("name").innerText = `${window.self?.name}`;
  updateMakerText();
  // console.log(window.selected.fac);
  if (window.self?.facs) {
    document.getElementById("facQueue").innerText = "";
    window.self.facs.forEach((fac) => {
      let q = fac.buildQueue;
      let text = `Fac ${fac.id.split("_")[1]}:\n`;
      if (q.length) {
        text +=
          `${q[0].remaining / fac.buildSpeed} secs...\n` +
          q.map(
            ({ blueprint }) => `${blueprint.name} ($${blueprint.unit_cost})\n`
          );
      } else {
        text += "Nothing queued to build.";
      }
      document.getElementById("facQueue").innerText += text;
    });
  } else {
    document.getElementById(
      "facQueue"
    ).innerText = `Select a fac to view build queue.`;
  }

  // do this to "refresh" units
  const hoveredUnit = window.hovered.unit
    ? getUnitById(window.hovered.unit.id)
    : null;
  const selectedUnit = window.selected.units[0]
    ? getUnitById(window.selected.units[0]?.id)
    : null;
  const focusedUnit = hoveredUnit || selectedUnit;
  if (focusedUnit) {
    hoveredRange.position = focusedUnit.pos;
    // can't set radius directly so this hack instead
    hoveredRange.scale(
      focusedUnit.cur_stats.range / (hoveredRange.bounds.width / 2)
    );
    hoveredRange.rotate(0.5);

    // show healthbar
    let healthbarLen = Math.sqrt(focusedUnit.cur_stats.health) * 4 + 5;
    let size = focusedUnit.size || 15;
    let { pos } = focusedUnit;
    hoveredHealthBar.segments = [
      [-healthbarLen / 2 + pos.x, -size / 2 - 9 + pos.y],
      [healthbarLen / 2 + pos.x, -size / 2 - 9 + pos.y],
    ];

    showUnitDetail(focusedUnit);
    showUnitHistory(focusedUnit);

    document.getElementById("autotarget").value =
      focusedUnit.autoTarget.algorithm;
  } else {
    // showUnitDetail({
    //   base_stats: {
    //     dmg: 0,
    //     health: 0,

    //     range: 0,
    //     speed: 0,

    //     reload: 0,
    //     turn: 0,
    //     accuracy: 0,
    //   },
    //   cur_stats: {
    //     dmg: 0,
    //     health: 0,

    //     range: 0,
    //     speed: 0,

    //     reload: 0,
    //     turn: 0,
    //     accuracy: 0,
    //   },
    // });
    // showUnitHistory({
    //   history: {
    //     distMoved: 0,
    //     controlPointsCaptured: 0,
    //     dmgTheoreticallyDealt: 0,
    //     dmgActuallyDealt: 0,
    //     shotsHit: 0,
    //     shotsMissed: 0,
    //     numKills: 0,
    //     totalCostKilled: 0,
    //   },
    // });
    resetHoveredRange();
    resetHoveredHealth();
  }

  // if (selectedUnit) {
  //   hoveredText.position = Victor.fromObject(selectedUnit.pos).subtract(
  //     Victor(50, 100)
  //   );
  //   hoveredText.justification = "center";
  //   hoveredText.fillColor = "black";
  //   hoveredText.content = dispUnitStatText(selectedUnit);
  //   hoveredText.scale(100 / view.zoom / hoveredText.bounds.height);
  // } else {
  //   resetHoveredText();
  // }

  Object.keys(window.drawn).forEach((k) => {
    // return;
    if (!k.includes("_movetarg")) return;
    // console.log(window.selected?.units.map((u) => u.id));
    // console.log(k.split("_")[0]);
    if (
      !window.selected?.units
        .map((u) => u.id)
        .includes(k.replace("_movetarg", ""))
    ) {
      // console.log("bll");
      window.drawn[k].remove();
      delete window.drawn[k];
    }
  });
  // only show if unit belongs to owner
  window.selected.units.forEach((u) => {
    let key = `${u.id}_movetarg`;
    let renderedMoveTarget =
      window.drawn[key] ||
      new Path.Rectangle({
        center: u.move_target,
        size: [10, 10],
        strokeColor: "green",
      });
    renderedMoveTarget.position = u.move_target || outOfBounds;
    window.drawn[key] = renderedMoveTarget;
  });
  if (focusedUnit) {
    if (focusedUnit.owner_id == window.self.id) {
      hoveredMoveTarget.position = focusedUnit.move_target;
      hoveredAttackTarget.position = focusedUnit.shoot_targets.length
        ? getUnitById(focusedUnit.shoot_targets[0]).pos
        : outOfBounds;

      document.getElementById("autotarget").style.visibility = "visible";
    }
  } else {
    document.getElementById("autotarget").style.visibility = "hidden";
    resetHoveredMoveTarget();
    resetHoveredAttackTarget();
  }

  // draw shots
  window.gameState.cur_shots.forEach(({ shooter_id, target_id, dmg }) => {
    let shooter = getUnitById(shooter_id);
    let targ = getUnitById(target_id);
    if (!targ || !shooter) return;
    // TODO: use dmg to influence how strong laser looks...
    let laser = new Path.Line({
      from: Victor.fromObject(shooter.pos).toArray(),
      to: Victor.fromObject(targ.pos).toArray(),
      strokeColor: dmg > 0 ? unitColor(shooter) : "white",
      strokeWidth: 3,
      opacity: 0.3,
    });
    // console.log("drew shot", laser.from, laser.to);
    window.drawn_shots.push({ path: laser, createdAt: Date.now() });
    // path.path.opacity = 0.5;
  });

  window.gameState.control_points.forEach((elem) => {
    let renderedControlPoint =
      window.drawn[elem.id] ||
      new CompoundPath({
        children: [
          new Path.RegularPolygon({
            center: elem.pos,
            sides: 8,
            radius: elem.captureRange,
            // fillColor: "blue",
            // opacity: 0.3,
          }),
          new Path.Circle({
            center: elem.pos,
            radius: elem.captureRange,
          }),
        ],
      });
    let newrad = (elem.ownershipLevel / 100) * elem.captureRange || 0.00001;
    renderedControlPoint.children[1].scale(
      newrad / (renderedControlPoint.children[1].bounds.width / 2 || 0.00001)
    );
    let color = !elem.owner_id
      ? COLORS.NEUTRAL
      : elem.owner_id == window.self.id
      ? COLORS.SELF
      : COLORS.NEUTRAL;
    renderedControlPoint.strokeColor = color;
    // renderedControlPoint.fillColor = "blue";
    // renderedControlPoint.opacity = 0.3;
    renderedControlPoint.rotate(0.25);
    addShadow(renderedControlPoint, 8, elem.pos, 0);
    window.drawn[elem.id] = renderedControlPoint;
  });

  window.gameState.players.forEach((p) => {
    p.facs.forEach((elem) => {
      renderFac(p, elem);
    });
    p.units.forEach((elem) => {
      renderUnit(p, elem);
    });
  });
  Object.keys(window.drawn).forEach((k) => {
    // window.drawn[k].rotate(1);
  });
};

function renderFac(p, elem) {
  let pos = Victor.fromObject(elem.pos);
  size = 30;
  const renderedFactory =
    window.drawn[elem.id] || new Path.Rectangle([0, 0], [size, size]);
  renderedFactory.position = pos.subtract(Victor(size / 2, size / 2)).toArray();
  renderedFactory.fillColor = "white";
  renderedFactory.rotation = elem.orientation || 0;
  renderedFactory.onMouseDown = function (e) {
    // can't select enemy fac
    if (elem.owner_id != window.self.id) {
      return;
    }
    window.selected.fac = elem;
    console.log(window.selected.fac);
  };
  renderedFactory.strokeColor =
    window.selected.fac === elem ? COLORS.SELECTED : unitColor(elem);
  addShadow(renderedFactory, size / 2, elem.pos, 0);
  window.drawn[elem.id] = renderedFactory;
}

function addShadow(render, blursize, pos, orient) {
  render.shadowBlur = blursize;
  render.shadowColor = "#888";
  let factor = 35 / view.zoom;
  let light = Victor.fromObject(view.center)
    .subtract(Victor.fromObject(pos))
    // .norm()
    .divide(Victor(factor, factor))
    .invert();
  render.shadowOffset = light.rotateDeg(orient);
}

function renderUnit(p, elem) {
  let pos = Victor.fromObject(elem.pos);
  let { health, dmg, range, turn, reload, accuracy, speed } = elem.base_stats;
  let size = Math.sqrt(health) + 10;
  let midpt = [size / 2, size / 2];
  let cost = calcCost(elem.base_stats);
  const renderedUnit =
    window.drawn[elem.id] ||
    // NOTE: compound path only accepts one parent style, child styles no effect
    new CompoundPath({
      children: [
        speed > 20
          ? new Path.RegularPolygon({
              center: midpt,
              sides: 3,
              radius: size * 0.75,
              rotation: 60,
            }) //triangles are speedy
          : new Path.Rectangle({
              point: [0, 0],
              size: [size, size],
            }),
        new Path.Rectangle(
          [size / 2 - Math.sqrt(dmg) / 2, size / 2],
          [Math.sqrt(dmg), Math.sqrt(range) * 2]
        ),
        new Path.Circle({
          center: midpt,
          radius: turn > 30 ? size / 4 : 1,
        }),
        new Path.Circle({
          center: midpt,
          radius: turn > 50 ? size / 2 : 1,
        }),
        new Path.RegularPolygon({
          center: midpt,
          sides: Math.min(10, Math.floor(cost / 100000) + 4),
          radius: cost > 100000 ? size : 1,
          rotation: 180,
        }),
      ],
      applyMatrix: false,
    });

  addShadow(renderedUnit, size / 2, elem.pos, elem.orientation);

  let posvec = Victor.fromObject(pos);
  let shift = posvec.clone().subtract(Victor.fromObject(renderedUnit.position));
  // reverse-interpolation :)
  if (shift.length() > 10 && shift.length() > 0) {
    // shift.divide(Victor(2, 2));
    console.log(shift);
  }
  // posvec.add(shift);
  // if (shift.length() > 0) console.log(posvec, shift);
  renderedUnit.position = posvec;
  renderedUnit.rotation = -elem.orientation || 0;
  // if (path.rotation) console.log(path.rotation);
  renderedUnit.onMouseDown = function (e) {
    let btn = e.event.button;
    if (btn == 0) {
      // can only select your own units
      if (elem.owner_id == window.self.id) window.selected.units[0] = elem;
      else {
        alert("Cannot select enemy units.");
      }
    } else {
      // right click
      // can't attack yourself
      if (elem.owner_id == window.self.id) {
        window.selected.units = []; // deselects
        return;
      }
      // add newest target to FRONT of attack queue
      let targs = window.selected.units[0].shoot_targets;
      targs.unshift(elem.id);
      window.selected.units.forEach((u) => (u.shoot_targets = targs));
      emitAction(ACTION_TYPES.SET_UNIT_ATTACK, {
        unit_ids: window.selected.units.map((u) => u.id),
        // everyone that's selected is going to have the same shoot targets :)
        shoot_targets: targs,
      });
    }
    console.log(elem);
  };
  renderedUnit.onMouseEnter = function (e) {
    window.hovered.unit = elem;
  };
  renderedUnit.onMouseLeave = function (e) {
    window.hovered.unit = null;
  };
  renderedUnit.strokeColor = window.selected.units
    .map((u) => u.id)
    .includes(elem.id)
    ? COLORS.SELECTED
    : unitColor(elem);
  if (elem.cur_stats.health <= 0) {
    renderedUnit.strokeColor = "#555"; // dead
    // renderedUnit.position = Victor(-50, -50).toArray();
  }
  // let healthbarLen = Math.sqrt(elem.cur_stats.health) * 4 + 5;
  // renderedUnit.children[2].segments = [
  //   [-healthbarLen / 2, -size / 2 - 9],
  //   [healthbarLen / 2, -size / 2 - 9],
  // ];
  // renderedUnit.children[3].strokeColor = "#cdc";
  renderedUnit.fillColor = "white";
  // renderedUnit.fillColor.alpha = 0.8;
  // renderedUnit.visible = true;
  window.drawn[elem.id] = renderedUnit;
}

//*********************************************** */

var socket = io();

// on each update...
socket.on("game_state", (state) => {
  console.log(state);

  // remove dead units
  if (window.gameState)
    window.gameState.players.forEach((p) => {
      p.units
        .filter(
          (u) =>
            !state.players
              .filter((e) => e.id == p.id)[0]
              .units.map((e) => e.id)
              .includes(u.id)
        )
        .forEach((elem) => {
          window.drawn[elem.id].remove();
        });
    });

  window.gameState = state;

  window.self = getSelf(socket.id, gameState);

  // update selected units
  window.selected.units.forEach((u) => {
    Object.assign(u, ...window.self.units.filter((su) => su.id == u.id));
  });
  window.hovered.unit = null;

  // clear shots on game update
  window.drawn_shots.forEach((ds) => ds.path.remove());
  refreshBlueprints(window.self.blueprints);

  // shows last active blueprint on page refresh
  if (!document.getElementById("maker").innerHTML) {
    let st = "";
    Object.keys(CONSTRAINTS_MIN).forEach((k) => {
      v = CONSTRAINTS_TESTING[k];
      if (window.self?.blueprints.length)
        v = window.self.blueprints[window.self.blueprints.length - 1].stats[k];
      st += `<span>${k}: </span><input type="number" min=${CONSTRAINTS_MIN[k]} max=${CONSTRAINTS_MAX[k]} value="${v}" id="${k}"</input><br>`;
    });
    document.getElementById("maker").innerHTML = st;
  }
});

// webpack hot reloading...
// if (module.hot) {
//   module.hot.accept();
//   module.hot.dispose(function () {
//     clearInterval(timer);
//   });
// }
