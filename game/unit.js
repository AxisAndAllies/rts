//@ts-check
"use strict";
const Victor = require("victor");
const { generateID } = require("./util");
class Unit {
  static AUTO_TARGET = {
    closest: "closest",
    leastRotation: "leastRotation",
    mostValue: "mostValue",
    none: "none",
  };
  constructor(blueprint_id = "", stats, pos, owner_id) {
    this.blueprint_id = blueprint_id;
    //
    this.base_stats = { ...stats };
    this.cur_stats = { ...stats };

    // spawn ready to fire :)
    this.cur_stats.reload = 0;
    //
    this.pos = pos;
    this.orientation = Math.random() * 360;
    //

    this.owner_id = owner_id;
    this.move_target = null;
    this.shoot_targets = [];
    this.id = this.owner_id + "_" + generateID();

    // default
    this.autoTarget = {
      algorithm: Unit.AUTO_TARGET.leastRotation,
      // prioritizeThreats: true,
    };
    this.history = {
      distMoved: 0,
      controlPointsCaptured: 0,
      dmgTheoreticallyDealt: 0,
      dmgActuallyDealt: 0,
      shotsHit: 0,
      shotsMissed: 0,
      numKills: 0,
      totalCostKilled: 0,
    };
  }
  setMoveTarget(newpos) {
    // TODO: handle collisions?
    this.move_target = Victor.fromObject(newpos).clone();
  }
  setShootTargets(unit_ids) {
    // TODO: no friendly fire check on BE
    // console.log(this.id, "set targets to ", unit_ids);
    this.shoot_targets = unit_ids;
  }
  setAutoTarget(algorithm) {
    if (!Object.keys(Unit.AUTO_TARGET).includes(algorithm)) {
      console.log(`Error: ${algorithm} is unrecognized.`);
      return;
    }
    this.autoTarget.algorithm = algorithm;
  }
  shoot(targ, engageRange, cb) {
    // enemy take damage
    let { dmg, accuracy } = this.cur_stats;
    let rangeMultiplier =
      engageRange < 30
        ? 1
        : Math.min(1, -0.5 * (engageRange / this.cur_stats.range) + 1.25);
    console.log(engageRange);
    if (Math.random() * 100 < accuracy * rangeMultiplier) {
      cb(this.id, targ, dmg);
      console.log(`${this.id} hit ${targ} for ${dmg}!`);
      this.history.shotsHit += 1;
      this.history.dmgTheoreticallyDealt += dmg;
    } else {
      cb(this.id, targ, 0);
      console.log(`${this.id} missed ${targ}!`);
      this.history.shotsMissed += 1;
    }
    // reset reloading
    this.cur_stats.reload = this.base_stats.reload;
  }
  calcMove(millis) {
    // used for pre-move and move
    if (!this.move_target) return new Victor(0, 0);

    let dir = Victor.fromObject(this.move_target)
      .clone()
      .subtract(this.pos.clone());

    // slow down if necessary to not overshoot target
    let speed = Math.min((this.cur_stats.speed * millis) / 1000, dir.length());
    let dv = dir.normalize().multiply(new Victor(speed, speed));
    return dv;
  }
  update(millis, dealDamageFn, getUnitPosFn, willCollide = false) {
    // reduce reload time
    this.cur_stats.reload = Math.max(this.cur_stats.reload - millis / 1000, 0);
    if (!willCollide) {
      //move if won't collide
      let dv = this.calcMove(millis);
      this.pos.add(dv);
      this.history.distMoved += dv.length();
    }

    // rotate if necessary
    if (this.shoot_targets.length == 0) {
      return;
    }
    let targ = this.shoot_targets[0];
    let targobj = null;
    try {
      targobj = getUnitPosFn(targ);
    } catch (err) {
      console.log(`${this.id} turning toward ${targ}`);
      console.error(err);
      // return;
    }
    let tempvec = Victor.fromObject(targobj).subtract(this.pos);
    // use vertical angle b/c that's the way paperJS does rotation
    let ang = tempvec.verticalAngleDeg();
    this.turnTowards(ang, millis);

    // shoot if aligned + in range + reloaded
    // NOTE: ALL ANGLES IN DEGREES!!
    if (
      Math.abs(ang - this.orientation) % 360 < 0.1 &&
      tempvec.length() < this.cur_stats.range &&
      this.cur_stats.reload <= 0
    ) {
      // console.log(this.id, " fired a shot at ", targ);
      this.shoot(targ, tempvec.length(), dealDamageFn);
    }
  }
  turnTowards(ang, millis) {
    // NOTE: ALL ANGLES IN DEGREES!!
    // optimal turning algorithm
    // from https://math.stackexchange.com/questions/1366869/calculating-rotation-direction-between-two-angless
    let cur_ang = this.orientation;
    let turn = (this.cur_stats.turn * millis) / 1000;
    let angdiff = cur_ang - ang;
    if (angdiff > 180) angdiff -= 360;
    if (angdiff <= -180) angdiff += 360;

    let minturn = Math.min(Math.abs(angdiff), turn);
    if (angdiff > 0) {
      this.orientation -= minturn;
    } else if (angdiff < 0) {
      this.orientation += minturn;
    }
  }
  takeDamage(dmg) {
    // returns damage actually taken
    let dmgTaken = Math.min(this.cur_stats.health, dmg);
    this.cur_stats.health -= dmgTaken;
    // console.log(`${this.id} took ${dmg} damage`);
    return {
      dmgTaken: dmgTaken,
      healthLeft: this.cur_stats.health,
    };
  }
}
module.exports = Unit;
