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
    return Math.random().toString(36).substring(2, 15)
}

class Player {
  constructor(name, starting_money) {
    this.name = name;
    this.blueprints = [];
    this.money = starting_money;
    this.facs = [];
    this.units = [];
    this.id = generateID();
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
  buyUnit(blueprint, factory) {
    cost = blueprint.unit_cost;
    if (this.money < cost) {
      return false;
    }
    this.money -= cost;
    factory.createUnit(blueprint, null);
    return true;
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
    this.id = generateID()
  }
  setMoveTarget(newpos) {
    this.move_target = newpos;
  }
  setShootTargets(units) {
    this.shoot_targets = units;
  }
  update(millis) {}
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
    this.id = generateID()
  }
}

class Factory {
  constructor(owner_id, pos) {
    this.owner_id = owner_id;
    this.pos = pos;
    this.id = generateID()
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
  //   takeDamage(damage){

  //   }
}

class Game {
  constructor() {
    this.players = [];
    this.players.push(new Player("me", 80000));
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
      NEXT_TURN: () => this.nextTurn,
      BUY_UNIT: () => p.buyUnit(data.blueprint, data.factory),
      BUY_BLUEPRINT: () => p.buyBlueprint(data.blueprint),
      MOVE_UNIT: () => 
    };
  }
  nextTurn() {}
  update(dt) {}
}
