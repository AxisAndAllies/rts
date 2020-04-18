//@ts-check
"use strict";
const { generateID } = require("./util");
const Blueprint = require("./blueprint");
class Player {
  constructor(name, starting_money) {
    this.name = name;
    this.blueprints = [];
    this.money = starting_money;
    this.facs = [];
    this.units = [];
    this.id = name || generateID();
    this.ended_turn = false;

    this.finished_setup = false;
  }
  buyBlueprint(stats, name) {
    const cost = this.blueprintCost;
    if (this.money < cost) {
      return false;
    }
    this.money -= cost;
    this.blueprints.push(new Blueprint(name, this.id, stats));

    this.finished_setup = this.blueprints.length >= 4;
    return true;
  }
  get blueprintCost() {
    // first 4 blueprints free
    if (this.blueprints.length < 4) {
      return 0;
    }
    return this.blueprints.length * 250 + 250;
  }
  addMoney(amount) {
    this.money += amount;
  }
  buyUnit(blueprint_id, factory_id) {
    let blueprint = this.blueprints.filter((b) => b.id == blueprint_id)[0];
    let factory = this.facs.filter((f) => f.id == factory_id)[0];

    let cost = blueprint.unit_cost;
    if (this.money < cost) {
      return false;
    }
    this.money -= cost;
    factory.queueUnit(blueprint);
    console.log(`queued unit ${blueprint.name}`);
    return true;
  }
  upgradeFac(fac_id) {
    let fac = this.facs.filter((f) => f.id == fac_id)[0];
    let { cost } = fac.nextUpgrade;
    if (this.money < cost) {
      return false;
    }
    this.money -= cost;
    console.log(`${this.name} upgrading ${fac_id} buildspeed`);
    fac.upgradeBuildSpeed();
  }
  getMyUnitById(unit_id) {
    return this.units.filter((u) => u.id == unit_id)[0];
  }
  setUnitAutoTarget(unit_id, algorithm) {
    this.getMyUnitById(unit_id).setAutoTarget(algorithm);
  }
  setUnitMoveTarget(unit_id, newpos) {
    this.getMyUnitById(unit_id).setMoveTarget(newpos);
  }
  setUnitShootTargets(unit_id, shoot_targets) {
    this.getMyUnitById(unit_id).setShootTargets(shoot_targets);
  }
}

module.exports = Player;
