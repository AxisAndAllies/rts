// const Victor = require("victor");

// Make the paper scope global, by injecting it into window:
// import paper from "./lib/paper-full";

paper.install(window);

window.onload = function () {
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
  // var path = new Path();
  // path.strokeColor = "black";
  // var start = new Point(100, 100);
  // path.moveTo(start);
  // path.lineTo(start.add([200, -50]));
  const path = new Path.Rectangle([0, 0], [1200, 900]);
  path.fillColor = "#eee";
  path.onMouseDown = function (e) {
    // when clicking outside any objects
    let btn = e.event.button;
    if (btn == 0) {
      window.selected = {};
      // left click
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
  // view.draw();

  // windo;

  // path.onMouseDown = () => {
  //   path.strokeColor = "red";
  // };

  const SELECTED_COLOR = "blue";

  // let _path = new Path.Line({
  //   from: [0, 0],
  //   to: [200, 200],
  //   strokeColor: "red",
  //   strokeWidth: 3,
  //   opacity: 0.3,
  // });
  // // _path.strokeColor.opacity = 0.3;
  // var circle2 = new Path.Circle({
  //   center: new Point(120, 50),
  //   radius: 35,
  //   fillColor: "blue",
  //   strokeColor: "blue",
  //   strokeWidth: 10,
  //   opacity: 0.3,
  // });

  view.onFrame = function (event) {
    // console.log(this.gameState);
    if (!window.gameState) {
      return;
    }

    // draw shots
    // window.drawn_shots = [];
    // add TTL for shots??

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
        let pos = Victor.fromObject(elem.pos);
        size = 30;
        const path =
          window.drawn[elem.id] || new Path.Rectangle([0, 0], [size, size]);
        path.position = pos.subtract(Victor(size / 2, size / 2)).toArray();
        path.fillColor = "white";
        path.rotation = elem.orientation || 0;
        path.onMouseDown = function (e) {
          // can't select enemy fac
          if (elem.owner_id != window.self.id) {
            return;
          }
          window.selected.fac = elem;
          console.log(window.selected);
        };
        path.strokeColor =
          window.selected.fac === elem ? SELECTED_COLOR : unitColor(elem);

        window.drawn[elem.id] = path;
      });
      p.units.forEach((elem) => {
        let pos = Victor.fromObject(elem.pos);
        let size = 15;
        let midpt = [size / 2, size / 2];
        const path =
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
              new Path.Circle({
                center: midpt,
                radius: elem.cur_stats.range,
                // strokeColor: "#cdc",
                visible: false,
              }),
            ],
            applyMatrix: false,
          });

        path.position = pos.subtract(Victor(size / 2, size / 2)).toArray();

        // small hack to not display dead things...
        if (elem.cur_stats.health <= 0) {
          // path.position = Victor(-50, -50).toArray();
        }
        path.rotation = elem.orientation || 0;
        // if (path.rotation) console.log(path.rotation);
        path.onMouseDown = function (e) {
          // console.log("lol", f);
          let btn = e.event.button;
          if (btn == 0) {
            // can only select your own units
            if (elem.owner_id == window.self.id) window.selected.unit = elem;
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
        path.onMouseEnter = function (e) {
          // TODO: show range on hover...
          showUnitDetail(elem.cur_stats);
          // path.fillColor.alpha = 0.3;
          path.children[4].visible = true;
        };
        path.onMouseLeave = function (e) {
          // path.fillColor.alpha = 0.3;
          path.children[4].visible = false;
          showDefaultDetail();
        };
        path.strokeColor =
          window.selected.unit === elem ? SELECTED_COLOR : unitColor(elem);
        if (elem.cur_stats.health <= 0) {
          path.strokeColor = "#555";
          // path.position = Victor(-50, -50).toArray();
        }
        path.children[2].to = elem.move_target || path.position;
        path.children[3].to = elem.shoot_targets[0] || path.position;
        // path.children[3].strokeColor = "#cdc";
        path.fillColor = "white";
        path.fillColor.alpha = 0.3;
        path.visible = true;
        window.drawn[elem.id] = path;
      });
    });
    Object.keys(window.drawn).forEach((k) => {
      // window.drawn[k].rotate(1);
    });
    // view.draw();
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
