/**
 * Run with `node test.js`
 */

const { calcCost } = require("./game/util");

const testunits = [
  {
    dmg: 9,
    health: 1,

    range: 200,
    speed: 5,

    reload: 3,
    turn: 15,
    accuracy: 90,
  },
  {
    dmg: 2,
    health: 30,

    range: 90,
    speed: 20,

    reload: 2,
    turn: 30,
    accuracy: 60,
  },
  {
    dmg: 3,
    health: 6,

    range: 70,
    speed: 25,

    reload: 6,
    turn: 25,
    accuracy: 50,
  },
];

const costs = [18811, 70953, 11549];

let testCalcCost = () => {
  console.assert(calcCost(testunits[0]) === costs[0]);
  console.assert(calcCost(testunits[1]) === costs[1]);
  console.assert(calcCost(testunits[2]) === costs[2]);
};

testCalcCost();
