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

function generateID() {
  // adapted from https://gist.github.com/6174/6062387
  return Math.random().toString(36).substring(2, 15);
}

class Player {
  constructor(name, starting_money) {
    this.name = name;
    this.blueprints = [];
    this.money = starting_money;
    this.facs = [];
    this.units = [];
    this.id = generateID();
    this.ended_turn = false;
  }
  buyBlueprint(stats, name) {
    let cost = Math.pow(this.blueprints.length, 2) * 10000;
    if (this.money < cost) {
      return false;
    }
    this.money -= cost;
    this.blueprints.push(new Blueprint(name, this.id, stats));
    return true;
  }
  buyUnit(blueprint_id, factory_id) {
    let blueprint = this.blueprints.filter((b) => b.id == blueprint_id)[0];
    let factory = this.facs.filter((b) => b.id == factory_id)[0];
    // console.log(
    //   blueprint,
    //   factory,
    //   blueprint_id,
    //   factory_id,
    //   this.blueprints,
    //   this.facs
    // );
    let cost = blueprint.unit_cost;
    if (this.money < cost) {
      return false;
    }
    this.money -= cost;
    this.units.push(factory.createUnit(blueprint, null));
    return true;
  }
  setUnitMoveTarget(unit_id, newpos) {
    this.units.filter((u) => u.id == unit_id)[0].setMoveTarget(newpos);
  }
  setUnitShootTarget(unit_id, target_ids) {
    this.units.filter((u) => u.id == unit_id)[0].setShootTargets(target_ids);
  }
}

class Unit {
  constructor(blueprint_id = "", stats, pos, owner_id) {
    this.blueprint_id = blueprint_id;
    //
    this.base_stats = stats;
    this.cur_stats = stats;
    //
    this.pos = pos;
    this.orientation = 0;
    //

    this.owner_id = owner_id;
    this.move_target = null;
    this.shoot_targets = [];
    this.id = generateID();
  }
  setMoveTarget(newpos) {
    // TODO: collision?
    this.move_target = Victor.fromObject(newpos).clone();
  }
  setShootTargets(unit_ids) {
    // TODO: no friendly fire??
    this.shoot_targets = unit_ids;
  }
  update(millis) {
    //move target
    // shoot
    let dir = Victor.fromObject(this.move_target)
      .clone()
      .subtract(this.pos.clone())
      .normalize();
    let speed = (this.cur_stats.speed * millis) / 1000;
    let dv = dir.multiply(Victor(speed, speed));
    // console.log(JSON.stringify(dv));
    this.pos.add(dv);
    // console.log(this.pos);
  }
  takeDamage(dmg) {
    this.health -= dmg;
    if (this.health < 0) {
    }
  }
}

class Blueprint {
  constructor(name, owner_id, stats) {
    this.name = name;
    this.owner_id = owner_id;
    this.stats = stats;
    this.unit_cost = calcCost(stats);
    this.id = generateID();
  }
}

class Factory {
  constructor(owner_id, pos) {
    this.owner_id = owner_id;
    this.pos = pos;
    this.id = generateID();
  }
  createUnit(blueprint) {
    // support POS arg later
    // create unit at random pos around factory
    let spread = Victor(Math.random() * 2 - 1, Math.random() * 2 - 1).multiply(
      Victor(40, 40)
    );
    return new Unit(
      blueprint.id,
      blueprint.stats,
      this.pos.clone().add(spread),
      this.owner_id
    );
  }
  update(dt) {
    // TODO: later on, take time to create units
  }
  //   takeDamage(damage){

  //   }
}

class Game {
  constructor() {
    this.players = [];
    this.RESOLVE_TIMESPAN = 5000; // millis
    this.cur_resolve_timespan = this.RESOLVE_TIMESPAN;
    this.socket_player_map = {}; // maps socket_id to player_id
  }
  addNewPlayer(socket_id) {
    // TODO: add name support later
    let newp = new Player("player " + socket_id, 80000);
    // let loc = Victor(Math.random(), Math.random());

    // let newloc = loc * Victor(800, 800);
    let loc = Victor().randomize(Victor(0, 0), Victor(900, 900));

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
  getState() {
    return {
      players: this.players,
      socket_player_map: this.socket_player_map,
      cur_resolve_timespan: this.cur_resolve_timespan,
    };
  }
  handlePlayerAction(type, socket_id, data) {
    const player_id = this.socket_player_map[socket_id];
    let candidates = this.players.filter((e) => e.id == player_id);
    if (candidates.length > 1) {
      console.error("duplicate players");
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
        p.setUnitMoveTarget(data.unit_id, data.target_ids);
        console.log(p.id, " set attack target ", data.unit_id, data.target_ids);
      },
    };
    // execute handler
    switcher[type]();
    console.log(p);
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
    // console.log("o");
    // each player update the
    // each fac update them
    this.players.forEach((p) => {
      p.facs.forEach((f) => f.update(dt));
      // console.log(p.ended_turn);
    });
    // each unit update them
    this.players.forEach((p) => {
      // console.log(p.id, " player's units updating");
      p.units.forEach((u) => u.update(dt));
    });
    // kill dead
    this.players.forEach((p) => {
      p.units = p.units.filter((u) => u.cur_stats.health > 0);
      // TODO: remove from all other unit's shoot_targets??? --> or handle when processing targets...
    });
    // check conditions???
    this.cur_resolve_timespan -= dt;
    // console.log(this.cur_resolve_timespan);
    if (this.cur_resolve_timespan < 0) {
      console.log("finished resolving.", this.getState());
      this.cur_resolve_timespan = this.RESOLVE_TIMESPAN;
      this.players.forEach((p) => {
        p.ended_turn = false;
      });
    }
    return true;
  }
}

module.exports = Game;
