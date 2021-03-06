//@ts-check
"use strict";

const Victor = require("victor");
const { generateID } = require("./util");
const Unit = require("./unit");
class Factory {
  constructor(owner_id, pos, buildSpeed = 125) {
    this.owner_id = owner_id;
    this.pos = pos;
    this.id = this.owner_id + "_" + generateID();
    this.buildQueue = [];
    this.buildSpeed = buildSpeed;
    this.baseBuildSpeed = buildSpeed;

    this.nextUpgrade = {
      cost: this.buildSpeed + 250,
      buildSpeed: this.buildSpeed + this.baseBuildSpeed / 5,
    };
  }
  upgradeBuildSpeed() {
    this.buildSpeed = this.nextUpgrade.buildSpeed;
    this.nextUpgrade = {
      cost: this.nextUpgrade.cost + 250,
      buildSpeed: this.nextUpgrade.buildSpeed + this.baseBuildSpeed / 5,
    };
    return this.buildSpeed;
  }
  queueUnit(blueprint) {
    this.buildQueue.push({
      blueprint: blueprint,
      remaining: blueprint.unit_cost,
    });
  }
  clearQueue(addPlayerMoney) {
    addPlayerMoney(
      this.buildQueue.map((e) => Number(e.remaining)).reduce((a, v) => a + v)
    );
    this.buildQueue = [];
  }
  createUnit(blueprint) {
    // support POS arg later
    // create unit at random pos around factory
    let spread = new Victor(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).multiply(new Victor(40, 40));
    return new Unit(
      blueprint.id,
      blueprint.stats,
      this.pos.clone().add(spread),
      this.owner_id
    );
  }
  update(dt) {
    let buildPower = (this.buildSpeed * dt) / 1000;
    let createdUnits = [];
    if (!this.buildQueue.length) {
      return createdUnits;
    }
    while (buildPower >= this.buildQueue[0].remaining) {
      // finished unit

      buildPower = -this.buildQueue[0].remaining;
      let bp = this.buildQueue.shift().blueprint;
      createdUnits.push(this.createUnit(bp));
      console.log(`finished unit ${bp.name}`);
      if (!this.buildQueue.length) {
        break;
      }
    }
    // leftover
    if (this.buildQueue.length) {
      this.buildQueue[0].remaining -= buildPower;
    }
    // returns all new created units
    return createdUnits;
  }
  //   takeDamage(damage){

  //   }
}

module.exports = Factory;
