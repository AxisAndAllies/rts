// needs to be synced w/ frontend
// function calcCost(obj) {
//   let { dmg, health, range, speed, reload, turn } = obj;
//   let realistic_range = speed / 2 + Math.pow(range, 1.5); // b/c of kiting
//   realistic_range /= 2; // scaling factor
//   let dps = dmg / reload;

//   // speed^2 to correct for value of moving fast
//   // dps * health = damage output over lifespan
//   // sqrt(turn) b/c difference between 5 and 10 deg way more valuable than 180 to 360 deg.
//   let cost = realistic_range * dps * health * Math.sqrt(turn) + speed * speed;
//   cost = Math.max(cost, 100);
//   return Math.round(cost);
// }

function calcCost(obj) {
  let { dmg, health, range, speed, reload, turn, accuracy } = obj;
  let coverage = Math.pow(speed + range * Math.sqrt(turn) * 4, 1.5); // b/c of kiting

  // accuracy is more important as damage increases/reload increases
  let efficient_dps = (dmg / reload) * Math.pow(accuracy / 100, 2);

  // speed^2 to correct for value of moving fast
  // dps * health = damage output over lifespan
  // sqrt(turn) b/c difference between 5 and 10 deg way more valuable than 180 to 360 deg.
  let cost = coverage * efficient_dps * health * speed * 0.005;
  cost = Math.max(cost, 1000);
  return Math.round(cost);
}

function generateID() {
  // adapted from https://gist.github.com/6174/6062387
  return Math.random().toString(36).substring(2, 15);
}

module.exports = {
  calcCost,
  generateID,
};
