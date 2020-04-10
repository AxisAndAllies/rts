const Victor = require("victor");
const { generateID } = require("./util");
class Unit {
  constructor(blueprint_id = "", stats, pos, owner_id) {
    this.blueprint_id = blueprint_id;
    //
    this.base_stats = { ...stats };
    this.cur_stats = { ...stats };

    // spawn ready to fire :)
    this.cur_stats.reload = 0;
    //
    this.pos = pos;
    this.orientation = 0;
    //

    this.owner_id = owner_id;
    this.move_target = null;
    this.shoot_targets = [];
    this.id = this.owner_id + "_" + generateID();
  }
  setMoveTarget(newpos) {
    // TODO: collision?
    this.move_target = Victor.fromObject(newpos).clone();
  }
  setShootTargets(unit_ids) {
    // TODO: no friendly fire check on BE
    console.log(this.id, "set targets to ", unit_ids);
    this.shoot_targets = unit_ids;
  }
  shoot(targ, cb) {
    // enemy take damage
    cb(this.id, targ, this.cur_stats.dmg);
    // reset reloading
    this.cur_stats.reload = this.base_stats.reload;
  }
  update(millis, dealDamageFn, getUnitPosFn) {
    // reduce reload time
    this.cur_stats.reload = Math.max(this.cur_stats.reload - millis, 0);
    //move
    if (this.move_target) {
      let dir = Victor.fromObject(this.move_target)
        .clone()
        .subtract(this.pos.clone());

      // slow down if necessary to not overshoot target
      let speed = Math.min(
        (this.cur_stats.speed * millis) / 1000,
        dir.length()
      );
      let dv = dir.normalize().multiply(Victor(speed, speed));

      this.pos.add(dv);
    }

    // rotate if necessary
    if (this.shoot_targets.length == 0) {
      return;
    }
    let targ = this.shoot_targets[0];
    let tempvec = Victor.fromObject(getUnitPosFn(targ)).subtract(
      this.pos.clone()
    );
    // use vertical angle b/c that's the way paperJS does rotation
    let ang = tempvec.verticalAngleDeg();

    // TODO: need to better optimize which way to turn...(use modulo, use same sign, etc.)
    // https://math.stackexchange.com/questions/1366869/calculating-rotation-direction-between-two-angless
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
    // console.log("then... ", this.orientation);
    // shoot if aligned + in range
    if (
      Math.abs(ang - this.orientation) < 0.01 &&
      tempvec.length() < this.cur_stats.range
    ) {
      console.log(this.id, " fired a shot at ", targ);
      this.shoot(targ, dealDamageFn);
    }
  }
  takeDamage(dmg) {
    this.cur_stats.health -= dmg;
    console.log(`${this.id} took ${dmg} damage`);
  }
}
module.exports = Unit;
