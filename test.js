/**
 * Run with `node test.js`
 */

const { calcCost } = require("./game/util");

const testunits = [
  {
    dmg: 9,
    health: 1,

    range: 250,
    speed: 5,

    reload: 2,
    turn: 25,
    accuracy: 90,
  },
  {
    dmg: 2,
    health: 20,

    range: 10,
    speed: 35,

    reload: 2,
    turn: 30,
    accuracy: 20,
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

const costs = [182, 65, 79];

let testCalcCost = () => {
  [0, 1, 2].forEach((i) => {
    // console.log(calcCost(testunits[i]));
    console.assert(calcCost(testunits[i]) === costs[i]);
  });
};

testCalcCost();
