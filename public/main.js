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
    }
  },
  false
);

//
window.gameState = null;
window.self = null;
window.selected = {};
window.hovered = {};

// maps id to drawn path, ensuring each elem gets drawn exactly once
window.drawn = {};

window.drawn_shots = [];
//

window.buyBlueprint = () => {
  console.log("bought blueprint!");
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

window.endTurn = () => {
  console.log("ended turn");
  emitAction(ACTION_TYPES.END_TURN);
};

showDefaultDetail();
let st = "";
Object.keys(CONSTRAINTS_MIN).forEach((k) => {
  //min=${CONSTRAINTS_MIN[k]} max=${CONSTRAINTS_MAX[k]}
  // set to CONSTRAINTS_MIN
  st += `<span>${k}: </span><input type="text" value="${CONSTRAINTS_TESTING[k]}" id="${k}"</input><br>`;
});
console.log(st);
document.getElementById("maker").innerHTML = st;

// Setup directly from canvas id:
paper.setup("canvas");
const background = new Path.Rectangle([0, 0], [1200, 1200]);
background.fillColor = "#eee";
background.onMouseDown = function (e) {
  // when clicking outside any objects
  let btn = e.event.button;
  if (btn == 0) {
    // deselect all things on left click on background
    window.selected = {};
  } else {
    // btn=2 is right click

    // can't move enemy units
    if (window.selected.unit.owner_id != window.self.id) {
      window.selected.unit = null; // deselects
      return;
    }
    let { x, y } = e.point;
    emitAction(ACTION_TYPES.SET_UNIT_MOVE, {
      unit_id: window.selected.unit.id,
      newpos: { x, y },
    });
  }
  console.log(e.point, e.event.button);
};

const outOfBounds = Victor(0, 0);

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
});
const hoveredAttackTarget = new Path.Rectangle({
  center: outOfBounds,
  size: [15, 15],
  strokeWidth: 2,
  strokeColor: "maroon",
  rotation: 45,
});
const hoveredHealthBar = new Path.Line({
  from: outOfBounds,
  to: [20, 20],
  strokeColor: "green",
});
function resetHoveredRange() {
  hoveredRange.position = outOfBounds;
  hoveredRange.scale(1 / (hoveredRange.bounds.width / 2));
}
function resetHoveredMoveTarget() {
  hoveredMoveTarget.position = outOfBounds;
}
function resetHoveredAttackTarget() {
  hoveredAttackTarget.position = outOfBounds;
}
function resetHoveredHealth() {
  hoveredHealthBar.segments = [outOfBounds, [20, 20]];
}

const SELECTED_COLOR = "blue";

view.onFrame = function (event) {
  // console.log(this.gameState);
  if (!window.gameState) {
    return;
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
  const selectedUnit = window.selected.unit
    ? getUnitById(window.selected.unit.id)
    : null;
  const focusedUnit = hoveredUnit || selectedUnit;
  if (focusedUnit) {
    showUnitDetail(focusedUnit);
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
  } else {
    showUnitDetail({});
    resetHoveredRange();
    resetHoveredHealth();
  }

  if (focusedUnit) {
    // only show if unit belongs to owner
    if (focusedUnit.owner_id == window.self.id) {
      hoveredMoveTarget.position = focusedUnit.move_target || outOfBounds;
      hoveredAttackTarget.position = focusedUnit.shoot_targets.length
        ? getUnitById(focusedUnit.shoot_targets[0]).pos
        : outOfBounds;
    }
  } else {
    resetHoveredMoveTarget();
    resetHoveredAttackTarget();
  }

  // draw shots
  window.gameState.cur_shots.forEach(({ shooter_id, target_id, dmg }) => {
    let shooter = getUnitById(shooter_id);
    let targ = getUnitById(target_id);
    // TODO: use dmg to influence how strong laser looks...
    let laser = new Path.Line({
      from: Victor.fromObject(shooter.pos).toArray(),
      to: Victor.fromObject(targ.pos).toArray(),
      strokeColor: unitColor(shooter),
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
    renderedControlPoint.strokeColor = !elem.owner_id
      ? "#aaa"
      : elem.owner_id == window.self.id
      ? "black"
      : "red";
    // renderedControlPoint.fillColor = "blue";
    // renderedControlPoint.opacity = 0.3;
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
    window.selected.fac === elem ? SELECTED_COLOR : unitColor(elem);

  window.drawn[elem.id] = renderedFactory;
}

function renderUnit(p, elem) {
  let pos = Victor.fromObject(elem.pos);
  let size = 15;
  let midpt = [size / 2, size / 2];
  const renderedUnit =
    window.drawn[elem.id] ||
    // NOTE: compound path only accepts one parent style, child styles no effect
    new CompoundPath({
      children: [
        new Path.Rectangle({
          point: [0, 0],
          size: [size, size],
          // fillColor: "white",
        }),
        new Path.Rectangle(midpt, [3, size]),
        // new Path.Line([0, 0], [0, 0]),
      ],
      applyMatrix: false,
    });

  renderedUnit.position = pos.toArray();

  // small hack to not display dead things...
  if (elem.cur_stats.health <= 0) {
    // path.position = Victor(-50, -50).toArray();
  }
  renderedUnit.rotation = -elem.orientation || 0;
  // if (path.rotation) console.log(path.rotation);
  renderedUnit.onMouseDown = function (e) {
    let btn = e.event.button;
    if (btn == 0) {
      // can only select your own units
      if (elem.owner_id == window.self.id) window.selected.unit = elem;
      else {
        alert("Cannot select enemy units.");
      }
    } else {
      // right click
      // can't attack yourself
      if (elem.owner_id == window.self.id) {
        window.selected.unit = null; // deselects
        return;
      }
      // add newest target to FRONT of attack queue
      window.selected.unit.shoot_targets.unshift(elem.id);
      emitAction(ACTION_TYPES.SET_UNIT_ATTACK, {
        unit_id: window.selected.unit.id,
        shoot_targets: window.selected.unit.shoot_targets,
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
  renderedUnit.strokeColor =
    window.selected.unit === elem ? SELECTED_COLOR : unitColor(elem);
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
  renderedUnit.fillColor.alpha = 0.3;
  renderedUnit.visible = true;
  window.drawn[elem.id] = renderedUnit;
}

//*********************************************** */
var socket = io();

// on each update...
socket.on("game_state", (state) => {
  console.log(state);
  window.gameState = state;

  window.self = getSelf(socket.id, gameState);

  // clear shots on game update
  window.drawn_shots.forEach((ds) => ds.path.remove());
  refreshBlueprints(window.self.blueprints);
});

// webpack hot reloading...
// if (module.hot) {
//   module.hot.accept();
//   module.hot.dispose(function () {
//     clearInterval(timer);
//   });
// }
