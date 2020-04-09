const Victor = require("victor");
const { calcCost, generateID } = require("./util");
class ControlPoint {
  static MAX_OWNERSHIP_LEVEL = 100;
  constructor(
    pos,
    getPlayerById,
    getUnitById,
    baseResourcesPerSecond = 2000,
    captureRange = 50
  ) {
    this.owner_id = null;
    this.pos = pos;
    this.ownershipLevel = 0;
    this.baseResourcesPerSecond = baseResourcesPerSecond;
    this.getPlayerById = getPlayerById;
    this.getUnitById = getUnitById;
    this.captureRange = captureRange;
    this.id = this.owner_id + "_" + generateID();
  }
  capture(capturer_id, numUnits, dt) {
    // 1 unit captures a control point in 10 sec
    const shift = (((numUnits * dt) / 1000) * MAX_OWNERSHIP_LEVEL) / 10;
    if (capturer_id == this.owner_id) {
      // reinforce owner's ownership level if needed
      this.ownershipLevel = Math.min(
        this.ownershipLevel + shift,
        ControlPoint.MAX_OWNERSHIP_LEVEL
      );
    } else {
      const remainder = this.ownershipLevel - shift;
      this.ownershipLevel = remainder;
      if (this.ownershipLevel <= 0) {
        this.ownershipLevel *= -1;
        // if you've got leftover forces, shift to reinforcing ownership level
        this.owner_id = capturer_id;
        console.log(
          `*** control point ${this.id} captured by: ${capturer_id}!`
        );
      }
    }
    this.ownershipLevel = Math.min(
      this.ownershipLevel,
      ControlPoint.MAX_OWNERSHIP_LEVEL
    );
    // Ownership Level should always be non-negative!!!
    if (this.ownershipLevel < 0) {
      console.error(`Invalid ownership level ${this.ownershipLevel}`);
    }

    // const units = unit_ids.map((id) => this.getUnitById(id));
    // const owners = units.map((u) => u.owner_id);
    // if (owners.)
  }
  update(capturer_id, numUnits, dt) {
    //TODO: make fairer capture + get resources in same turn situation (ban or lessen)...

    // capture progress
    this.capture(capturer_id, numUnits, dt);

    // owner resources gain
    if (!this.owner_id) return;
    console.log(
      `*** control point ${this.id} adding money to owner: ${this.owner_id}`
    );
    this.getPlayerById(this.owner_id).addMoney(
      this.baseResourcesPerSecond * dt
    );
  }
  //   takeDamage(damage){

  //   }
}

module.exports = ControlPoint;