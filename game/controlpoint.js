//@ts-check
"use strict";
const Victor = require("victor");
const { generateID } = require("./util");
class ControlPoint {
  static MAX_OWNERSHIP_LEVEL = 100;
  constructor(
    pos,
    addPlayerMoney,
    baseResourcesPerSecond = 2000,
    captureRange = 50
  ) {
    this.owner_id = null;
    this.pos = pos;
    // initial capture time
    this.ownershipLevel = 100;
    this.baseResourcesPerSecond = baseResourcesPerSecond;
    this.addPlayerMoney = addPlayerMoney;
    this.captureRange = captureRange;
    this.id = this.owner_id + "_" + generateID();
  }
  capture(capturer_id, numUnits, dt) {
    // 1 unit captures a control point in 10 sec
    const shift =
      (((numUnits * dt) / 1000) * ControlPoint.MAX_OWNERSHIP_LEVEL) / 10;
    if (capturer_id == this.owner_id) {
      // reinforce owner's ownership level if needed
      this.ownershipLevel = Math.min(
        this.ownershipLevel + shift,
        ControlPoint.MAX_OWNERSHIP_LEVEL
      );
    } else {
      // console.log(`${shift}, capturing...`);
      this.ownershipLevel -= shift;
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
  update(capturers, dt) {
    // capture progress
    if (capturers.length == 1) {
      // only capture if not contested
      let { player_id, numUnits } = capturers[0];
      this.capture(player_id, numUnits, dt);
    }

    // owner resources gain
    if (!this.owner_id) return;

    let amount = (this.baseResourcesPerSecond * dt) / 1000;
    // console.log(
    //   `*** control point ${this.id} adding ${amount} money to owner: ${this.owner_id}`
    // );
    this.addPlayerMoney(this.owner_id, amount);
  }
}

module.exports = ControlPoint;
