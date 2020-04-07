// const CONSTRAINTS_UNITS = {
//   dmg: "dmg/shot",
//   health: "hp",

//   range: "m",
//   speed: "m/sec",

//   //   shortReload: "sec"
//   reload: "sec",
//   turn: "deg/sec",
// };
// const CONSTRAINTS_MIN = {
//   dmg: 1,
//   health: 1,

//   range: 1,
//   speed: 1,

//   reload: 1,
//   turn: 5,
// };
// const CONSTRAINTS_MAX = {
//   dmg: 100,
//   health: 100,

//   range: 200,
//   speed: 30,

//   reload: 30,
//   turn: 360,
// };

const Victor = require("victor");
const Player = require("./player");
const Factory = require("./factory");

class Game {
  static RESOLVE_TIMESPAN = 5000;
  constructor(initial_state) {
    this.players = [];
    this.cur_resolve_timespan = Game.RESOLVE_TIMESPAN;
    this.socket_player_map = {}; // maps socket_id to player_id
    this.cur_shots = [];
    Object.assign(this, initial_state);
  }
  addNewPlayer(socket_id) {
    // TODO: add name support later
    let newp = new Player("player " + socket_id, 80000);
    // let loc = Victor(Math.random(), Math.random());

    // let newloc = loc * Victor(800, 800);
    // actual
    // let loc = Victor().randomize(Victor(0, 0), Victor(900, 900));
    // testing
    let loc = Victor().randomize(Victor(400, 400), Victor(600, 600));

    newp.facs.push(new Factory(newp.id, loc));
    this.players.push(newp);
    this.socket_player_map[socket_id] = newp.id;
    console.log("new player added ", newp);
  }
  removePlayer(socket_id) {
    this.players = this.players.filter(
      (e) => e.id != this.socket_player_map[socket_id]
    );
  }
  get state() {
    return {
      players: this.players,
      socket_player_map: this.socket_player_map,
      cur_resolve_timespan: this.cur_resolve_timespan,
      cur_shots: this.cur_shots,
    };
  }
  handlePlayerAction(type, socket_id, data) {
    const player_id = this.socket_player_map[socket_id];
    let candidates = this.players.filter((e) => e.id == player_id);
    if (candidates.length > 1) {
      console.error("duplicate players.");
    }
    let p = candidates[0];
    let switcher = {
      END_TURN: () => {
        p.ended_turn = true;
        console.log(p.id, " ended turn");
      },
      BUY_UNIT: () => {
        p.buyUnit(data.blueprint_id, data.factory_id);
        console.log(p.id, " bought unit ", data.blueprint_id, data.factory_id);
      },
      BUY_BLUEPRINT: () => {
        // data.stats[k];
        p.buyBlueprint(data.stats, data.name);
        console.log(p.id, " bought blueprint ", data.stats, data.name);
      },
      SET_UNIT_MOVE: () => {
        p.setUnitMoveTarget(data.unit_id, data.newpos);
        console.log(p.id, " move target ", data.unit_id, data.newpos);
      },
      SET_UNIT_ATTACK: () => {
        p.setUnitShootTargets(data.unit_id, data.shoot_targets);
        console.log(
          p.id,
          " set attack target ",
          data.unit_id,
          data.shoot_targets
        );
      },
    };
    // execute handler
    switcher[type]();
    console.log(p);
  }
  getUnitById(id) {
    let res = null;
    this.players.forEach((p) => {
      p.units.forEach((u) => {
        if (u.id == id) res = u;
      });
    });
    return res;
  }
  everyoneReady() {
    return this.players.length && this.players.every((p) => p.ended_turn);
  }
  //   nextTurn() {
  //       const everyoneReady =
  //   }
  update(dt) {
    // returns whether game updated
    if (!this.everyoneReady()) return false;
    // console.log("bro2");
    // clear shots :)
    this.cur_shots = [];

    // tally up dead
    let dead_unit_ids = [];
    this.players.forEach((p) => {
      dead_unit_ids = dead_unit_ids.concat(
        p.units.filter((u) => u.cur_stats.health <= 0).map((u) => u.id)
      );
    });
    if (dead_unit_ids.length) {
      console.log(JSON.stringify(dead_unit_ids), " died.");
    }

    // remove dead
    this.players.forEach((p) => {
      p.units = p.units.filter((u) => u.cur_stats.health > 0);
      // remove dead units from targets
      p.units.forEach((u) => {
        u.shoot_targets = u.shoot_targets.filter(
          (id) => !dead_unit_ids.includes(id)
        );
      });
    });

    // console.log("o");
    // each player update the
    // each fac update them
    this.players.forEach((p) => {
      p.facs.forEach((f) => f.update(dt));
      // console.log(p.ended_turn);
    });

    // each unit update them
    function dealDamage(shooter_id, target_id, dmg) {
      let targ = this.getUnitById(target_id);
      targ.takeDamage(dmg);
      // let shooter = this.getUnitById(shooter_id);
      this.cur_shots.push({ shooter_id, target_id, dmg });
    }
    function getUnitPosFn(id) {
      let unit = this.getUnitById(id);
      return unit.pos;
    }
    this.players.forEach((p) => {
      // console.log(p.id, " player's units updating");
      p.units.forEach((u) => {
        // gotta bind, always gotta bind
        u.update(dt, dealDamage.bind(this), getUnitPosFn.bind(this));
      });
    });

    // check conditions???
    this.cur_resolve_timespan -= dt;
    // console.log(this.cur_resolve_timespan, dt);
    if (this.cur_resolve_timespan < 0) {
      console.log("finished resolving", this.state);
      this.cur_resolve_timespan = Game.RESOLVE_TIMESPAN;
      this.players.forEach((p) => {
        p.ended_turn = false;
      });
    }
    return true;
  }
  printStub() {
    // prints random things for debugging, can be called anywhere :)
    console.log("whtisgg");
  }
}

let game = new Game();

if (module.hot) {
  // Reload this module and its dependencies, when they change (optional)
  module.hot.accept();

  // Gets called before reload (optional)
  module.hot.store((stash) => {
    console.log("reloading...");
    stash.game = game;
    console.log(game.state);
  });

  // Gets called after reload, if there was a store (optional)
  module.hot.restore((stash) => {
    console.log("reloaded.");
    game = stash.game;
    console.log(game.state);
  });

  // Replaces class methods and accessors (optional)
  module.hot.patch(Game);
}

module.exports = game;
