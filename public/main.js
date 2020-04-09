// const Victor = require("victor");

// Make the paper scope global, by injecting it into window:
// import paper from "./lib/paper-full";

paper.install(window);
// disable arrow key scrolling page
window.addEventListener(
  "keydown",
  function (e) {
    // space and arrow keys
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
      e.preventDefault();
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

// TODO: add TTL for shots?
window.drawn_shots = [];
//

window.buyBlueprint = () => {
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
  st += `<span>${k}: </span><input type="text" value="${CONSTRAINTS_TESTING[k]}" id="${k}" oninput="updateMaker()"</input><br>`;
});
console.log(st);
document.getElementById("maker").innerHTML = st;
updateMaker();

// Setup directly from canvas id:
paper.setup("canvas");
const background = new Path.Rectangle([0, 0], [1200, 900]);
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

const SELECTED_COLOR = "blue";

view.onFrame = function (event) {
  // console.log(this.gameState);
  if (!window.gameState) {
    return;
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
    showUnitDetail(focusedUnit.cur_stats);
    hoveredRange.position = focusedUnit.pos;
    // can't set radius directly so this hack instead
    hoveredRange.scale(
      focusedUnit.cur_stats.range / (hoveredRange.bounds.width / 2)
    );
    hoveredRange.rotate(0.5);
  } else {
    showDefaultDetail();
    resetHoveredRange();
  }

  if (focusedUnit) {
    hoveredMoveTarget.position = focusedUnit.move_target || outOfBounds;
    hoveredAttackTarget.position = focusedUnit.shoot_targets.length
      ? getUnitById(focusedUnit.shoot_targets[0]).pos
      : outOfBounds;
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
      opacity: 0.5,
    });
    // console.log("drew shot", laser.from, laser.to);
    window.drawn_shots.push(laser);
    // path.path.opacity = 0.5;
  });

  window.gameState.control_points.forEach((cp) => {});

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
    console.log(window.selected);
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
        new Path.Line(midpt, [0, 0]),
        new Path.Line(midpt, [0, 0]),
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
    // console.log("lol", f);
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
      window.selected.unit.shoot_targets.push(elem.id);
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
    renderedUnit.strokeColor = "#555";
    // renderedUnit.position = Victor(-50, -50).toArray();
  }
  renderedUnit.children[2].to = elem.move_target || renderedUnit.position;
  renderedUnit.children[3].to = elem.shoot_targets[0] || renderedUnit.position;
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
  window.drawn_shots = [];
  // console.log(window.self);
  refreshBlueprints(window.self.blueprints);
});

// webpack hot reloading...
// if (module.hot) {
//   module.hot.accept();
//   module.hot.dispose(function () {
//     clearInterval(timer);
//   });
// }
