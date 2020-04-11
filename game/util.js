//@ts-check
"use strict";
const shortid = require("shortid");

// needs to be synced w/ frontend

function calcCost(obj) {
  let { dmg, health, range, speed, reload, turn, accuracy } = obj;
  let coverage = Math.pow(speed + range * Math.sqrt(turn) * 4, 1.5); // b/c of kiting

  // accuracy is more important as damage increases/reload increases
  let efficient_dps = (dmg / reload) * ((accuracy / 100) * 0.75 + 0.25);

  // speed^2 to correct for value of moving fast
  // dps * health = damage output over lifespan
  // sqrt(turn) b/c difference between 5 and 10 deg way more valuable than 180 to 360 deg.
  let cost = coverage * efficient_dps * health * speed * 0.005;
  cost = Math.max(cost, 1000);
  return Math.round(cost);
}

function generateID() {
  // maybe use https://www.npmjs.com/package/human-id for funny unit names?
  return shortid.generate();
}

module.exports = {
  calcCost,
  generateID,
};
