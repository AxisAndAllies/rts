//@ts-check
"use strict";
// @ts-ignore
const fs = require("fs");

const Victor = require("victor");
const Player = require("./player");
const Unit = require("./unit");
const Factory = require("./factory");
const ControlPoint = require("./controlpoint");
const { calcCost } = require("./util");

class Game {
  static RESOLVE_TIMESPAN = 5000;
  static MAP_SIZE = 1200;
  constructor(initial_state) {
    this.players = [];
    this.control_points = [];
    this.cur_resolve_timespan = Game.RESOLVE_TIMESPAN;
    this.socket_player_map = {}; // maps socket_id to player_id
    this.cur_shots = [];

    // initialize control points
    let mapSize = Game.MAP_SIZE;
    let cps = [
      new Victor(200, 200),
      new Victor(mapSize - 200, mapSize - 200),
      new Victor(mapSize - 200, 200),
      new Victor(200, mapSize - 200),
    ];
    cps.forEach((pos) => {
      this.control_points.push(
        new ControlPoint(pos, this.addPlayerMoney.bind(this))
      );
    });
    this.control_points.push(
      new ControlPoint(
        new Victor(mapSize / 2, mapSize / 2),
        this.addPlayerMoney.bind(this)
      )
    );
    Object.assign(this, initial_state);
  }
  addNewPlayer(socket_id) {
    if (Object.keys(this.socket_player_map).includes(socket_id)) {
      console.log(`duplicate player ${socket_id}, failed to add.`);
      return;
    }
    // TODO: add name support later
    let randname = Math.round(Math.random() * 10000);
    let newp = new Player(`Player${randname}`, 80000);

    // @ts-ignore
    let loc = new Victor().randomize(
      new Victor(50, 50),
      new Victor(Game.MAP_SIZE, Game.MAP_SIZE)
    );

    newp.facs.push(new Factory(newp.id, loc));
    this.players.push(newp);
    this.socket_player_map[socket_id] = newp.id;
    console.log(`new player ${newp.name}: added on socket ${socket_id}`);
  }
  updatePlayerSocket(old_socket_id, new_socket_id) {
    this.socket_player_map[new_socket_id] = this.socket_player_map[
      old_socket_id
    ];
    delete this.socket_player_map[old_socket_id];
    console.log(`updated player socket ${old_socket_id} --> ${new_socket_id}`);
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
      control_points: this.control_points,
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
      SET_AUTOTARGET: () => {
        p.setUnitAutoTarget(data.unit_id, data.algorithm);
      },
    };
    // execute handler
    switcher[type]();
    // console.log(p);
  }
  getEnemyUnitsOf(player_id) {
    let res = [];
    this.players
      .filter((p) => p.id != player_id)
      .forEach((p) => {
        res.push(...p.units);
      });
    return res;
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
  addPlayerMoney(id, amount) {
    this.getPlayerById(id).addMoney(amount);
  }
  getPlayerById(id) {
    let p = this.players.filter((p) => p.id == id)[0];
    return p;
  }
  everyoneReady() {
    return this.players.length && this.players.every((p) => p.ended_turn);
  }

  update(dt) {
    // returns whether game updated
    if (
      !this.everyoneReady() &&
      this.cur_resolve_timespan == Game.RESOLVE_TIMESPAN
    )
      return false;
    // clear all shots :)
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

    // each fac update them
    this.players.forEach((p) => {
      p.facs.forEach((f) => {
        p.units.push(...f.update(dt));
      });
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
      let enemies = this.getEnemyUnitsOf(p.id);
      p.units.forEach((u) => {
        let dist = (enemy) =>
          Victor.fromObject(enemy.pos).subtract(u.pos).length();
        let rotateDist = (enemy) => {
          let tempvec = Victor.fromObject(enemy.pos).subtract(u.pos);
          return Math.abs(u.orientation - tempvec.verticalAngleDeg());
        };
        let range = u.cur_stats.range;

        // check any unit that could concievably get in range
        let in_range = enemies.filter(
          (e) => dist(e) < range + u.cur_stats.speed + e.cur_stats.speed
        );
        let algo = u.autoTarget.algorithm;
        if (algo != Unit.AUTO_TARGET.none) {
          let targs = [];
          switch (algo) {
            case Unit.AUTO_TARGET.none:
              break;
            case Unit.AUTO_TARGET.closest:
              targs = in_range.sort((a, b) => dist(a) - dist(b));
              break;
            case Unit.AUTO_TARGET.leastRotation:
              targs = in_range.sort((a, b) => dist(a) - dist(b));
              break;
            case Unit.AUTO_TARGET.mostValue:
              targs = in_range.sort(
                (a, b) => calcCost(a.base_stats) - calcCost(b.base_stats)
              );
              break;
          }
          if (targs.length) {
            console.log(`${u.id} using "${algo}" algo:`);
            u.setShootTargets(targs.map((t) => t.id));
          }
        }
        // gotta bind, always gotta bind
        u.update(dt, dealDamage.bind(this), getUnitPosFn.bind(this));
      });
    });

    // capturing
    this.control_points.forEach((cp) => {
      let capturers = [];
      this.players.forEach((p) => {
        // console.log(p.id, " player's units updating");
        let n = p.units.filter(
          (u) =>
            Victor.fromObject(u.pos).subtract(cp.pos.clone()).length() <=
            cp.captureRange
        ).length;
        if (n > 0) capturers.push({ player_id: p.id, numUnits: n });
      });
      // console.log(capturers);
      cp.update(capturers, dt);
    });

    // check conditions???
    this.cur_resolve_timespan -= dt;
    // console.log(this.cur_resolve_timespan, dt);
    if (this.cur_resolve_timespan < 0) {
      // console.log("finished resolving", this.state);
      console.log(`*** FINISHED RESOLVING.`);
      this.cur_resolve_timespan = Game.RESOLVE_TIMESPAN;
      this.players.forEach((p) => {
        p.ended_turn = false;
      });
    }

    // save game to file
    // let data = JSON.stringify(this.state, null, 2);
    // fs.writeFile("./gameState.json", data, (err) => {
    //   if (err) throw err;
    // });
    return true;
  }
  printStub() {
    // prints random things for debugging, can be called anywhere :)
    // console.log("whtisgg");
  }
}

if (process.env.NODE_ENV !== "production") {
  // @ts-ignore
  if (module.hot) {
    // Reload this module and its dependencies, when they change (optional)
    // @ts-ignore
    module.hot.accept();

    // Gets called before reload (optional)
    // @ts-ignore
    module.hot.store((stash) => {
      console.log("reloading...");
      // stash.game = game;
    });

    // Gets called after reload, if there was a store (optional)
    // @ts-ignore
    module.hot.restore((stash) => {
      console.log("reloaded.");
      // game = stash.game;
    });

    // Replaces class methods and accessors (optional)
    // @ts-ignore
    module.hot.patch(Game);
  }
}

module.exports = Game;
