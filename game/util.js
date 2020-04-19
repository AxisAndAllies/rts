//@ts-check
"use strict";
// const shortid = require("shortid");
const animals = require("./lib/animals");

// needs to be synced w/ frontend

function calcCost(obj) {
  let { dmg, health, range, speed, reload, turn, accuracy } = obj;
  let coverage = Math.pow(speed * 5 + range * Math.sqrt(turn) * 3, 1.5); // b/c of kiting

  // accuracy is more important as damage increases/reload increases
  let efficient_dps =
    Math.pow((dmg + 2) / reload, 0.4) * ((accuracy / 100) * 0.75 + 0.25);

  // health more costly than dmg, b/c easy to waste dmg w/ overkill
  let cost =
    coverage *
    efficient_dps *
    (dmg / reload + health * 1.4 + 2) *
    (speed + 2) *
    Math.pow(health + 2, 0.4) *
    0.000005;
  cost = Math.max(cost, 25);
  return Math.round(cost);
}

function generateFriendlyID() {
  // eg. Weasel9, Gnat0, Falcon7, etc.
  return shuffle(animals)[0] + Math.round(Math.random() * 10);
}

function generateID() {
  // maybe use https://www.npmjs.com/package/human-id for funny unit names?
  // return shortid.generate().substring(0, 5);

  // thanks to: https://gist.github.com/6174/6062387
  return Math.random().toString(36).substring(2, 7);
}

function randomBetween(min, max, numTimes = 1) {
  // return random float between min and max
  // use numTimes to try to more uniformly generate random values by bucketing
  let res = [];
  let bucketsize = (max - min) / numTimes;
  for (let i = 0; i < numTimes; i++) {
    let _min = min + bucketsize * i;
    let _max = min + bucketsize * (i + 1);
    res.push(Math.random() * (_max - _min) + _min);
  }
  return shuffle(res);
}

/**
 * Randomly shuffle an array
 * https://stackoverflow.com/a/2450976/1293256
 * @param  {Array} array The array to shuffle
 * @return {Array}      The first item in the shuffled array
 */
var shuffle = function (array) {
  var currentIndex = array.length;
  var temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

module.exports = {
  calcCost,
  generateID,
  generateFriendlyID,
  randomBetween,
};
