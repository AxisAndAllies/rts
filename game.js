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

function calcCost(obj) {
  let { dmg, health, range, speed, reload, turn } = obj;
  let realistic_range = speed / 2 + Math.pow(range, 1.5); // b/c of kiting
  let dps = dmg / reload;

  // speed^2 to correct for value of moving fast
  // dps * health = damage output over lifespan
  // sqrt(turn) b/c difference between 5 and 10 deg way more valuable than 180 to 360 deg.
  cost = realistic_range * dps * health * Math.sqrt(turn) + speed * speed;
  cost = Math.max(cost, 100);
  return Math.round(cost);
}

function generateID() {
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
    cost = Math.pow(this.blueprints.length, 2) * 10000;
    if (this.money < cost) {
      return false;
    }
    this.money -= cost;
    this.blueprints.push(new Blueprint(name, this.id, stats));
    return true;
  }
  buyUnit(blueprint_id, factory_id) {
    blueprint = blueprints.filter((b) => b.id == blueprint_id)[0];
    factory = facs.filter((b) => b.id == factory_id)[0];

    cost = blueprint.unit_cost;
    if (this.money < cost) {
      return false;
    }
    this.money -= cost;
    factory.createUnit(blueprint, null);
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
    this.stats = stats;
    this.pos = pos;
    this.owner_id = owner_id;
    this.move_target = null;
    this.shoot_targets = [];
    this.id = generateID();
  }
  setMoveTarget(newpos) {
    // TODO: collision?
    this.move_target = newpos;
  }
  setShootTargets(unit_ids) {
    // TODO: no friendly fire??
    this.shoot_targets = unit_ids;
  }
  update(millis) {
    //move target
    // shoot
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
    spread = new Point(Math.random() * 2 - 1, math.Random() * 2 - 1) * 200;
    success = this.owner.buyBlueprint();
    if (success) {
      return new Unit(
        blueprint.id,
        blueprint.stats,
        pos + spread,
        this.owner_id
      );
    }
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
    this.players.push(new Player("me", 80000));
    this.RESOLVE_TIMESPAN = 5000; // millis
    this.cur_resolve_timespan = this.RESOLVE_TIMESPAN;
  }
  getState() {
    return {
      players: this.players,
    };
  }
  handlePlayerAction(type, id, data) {
    let candidates = players.filter((e) => e.id == id);
    if (candidates.length != 1) {
      console.error("duplicate players");
    }
    let p = candidates[0];
    let switcher = {
      END_TURN: () => {
        p.ended_turn = true;
        console.log(p, " ended turn");
      },
      BUY_UNIT: () => {
        p.buyUnit(data.blueprint, data.factory);
        console.log(p, " bought unit ", data.blueprint, data.factory);
      },
      BUY_BLUEPRINT: () => {
        p.buyBlueprint(data.blueprint);
        console.log(p, " bought blueprint ", data.blueprint);
      },
      SET_UNIT_MOVE: () => {
        p.setUnitMoveTarget(data.unit_id, data.newpos);
        console.log(p, " move target ", data.unit_id, data.newpos);
      },
      SET_UNIT_ATTACK: () => {
        p.setUnitMoveTarget(data.unit_id, data.target_ids);
        console.log(p, " set attack target ", data.unit_id, data.target_ids);
      },
    };
  }
  everyoneReady() {
    return this.players.every((p) => p.ended_turn);
  }
  //   nextTurn() {
  //       const everyoneReady =
  //   }
  update(dt) {
    if (!everyoneReady) return;
    //   console.log()
    // each player update the
    // each fac update them
    this.players.forEach((p) => {
      p.facs.update(dt);
    });
    // each unit update them
    this.players.forEach((p) => {
      p.units.update(dt);
    });
    // kill dead
    this.players.forEach((p) => {
      p.units = p.units.filter((u) => u.health > 0);
    });
    // check conditions???
    this.cur_resolve_timespan -= dt;
    if (this.cur_resolve_timespan < 0) {
      console.log("finished resolving...");
      this.cur_resolve_timespan = this.RESOLVE_TIMESPAN;
      this.players.forEach((p) => {
        p.ended_turn = false;
      });
    }
  }
}
