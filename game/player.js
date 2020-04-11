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
    this.id = generateID();
    this.ended_turn = false;
  }
  buyBlueprint(stats, name) {
    const cost = this.blueprintCost;
    if (this.money < cost) {
      return false;
    }
    this.money -= cost;
    this.blueprints.push(new Blueprint(name, this.id, stats));
    return true;
  }
  get blueprintCost() {
    // return Math.pow(this.blueprints.length, 2) * 10000;
    return this.blueprints.length * 10000;
  }
  addMoney(amount) {
    this.money += amount;
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
    factory.queueUnit(blueprint);
    console.log(`queued unit ${blueprint.name}`);
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
