const { calcCost, generateID } = require("./util");
const Blueprint = require("./blueprint");
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
  setUnitShootTargets(unit_id, shoot_targets) {
    this.units.filter((u) => u.id == unit_id)[0].setShootTargets(shoot_targets);
  }
}

module.exports = Player;
