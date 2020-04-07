const Victor = require("victor");
const { calcCost, generateID } = require("./util");
const Unit = require("./unit");
class Factory {
  constructor(owner_id, pos) {
    this.owner_id = owner_id;
    this.pos = pos;
    this.id = this.owner_id + "_" + generateID();
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
    return;
    // TODO: later on, take time to create units
  }
  //   takeDamage(damage){

  //   }
}

module.exports = Factory;
