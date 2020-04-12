/**
 * NOTE: to ADD a new unit attribute:
 * 1. simply add it to the consts below
 * 2. update the `calcCost` function on both backend and frontend
 * 3. implement its behavior
 */

const CONSTRAINTS_UNITS = {
  dmg: "dmg/shot",
  health: "hp",

  range: "m",
  speed: "m/sec",

  //   shortReload: "sec"
  reload: "sec",
  turn: "deg/sec",
  accuracy: "%",
};
const CONSTRAINTS_TESTING = {
  dmg: 1,
  health: 4,

  range: 80,
  speed: 30,

  reload: 1,
  turn: 30,
  accuracy: 50,
};
const CONSTRAINTS_MIN = {
  dmg: 1,
  health: 1,

  range: 10,
  speed: 1,

  reload: 1,
  turn: 5,
  accuracy: 25,
};
const CONSTRAINTS_MAX = {
  dmg: 100,
  health: 100,

  range: 200,
  speed: 30,

  reload: 30,
  turn: 360,
  accuracy: 100,
};

const ACTION_TYPES = {
  END_TURN: "END_TURN",
  BUY_UNIT: "BUY_UNIT",
  BUY_BLUEPRINT: "BUY_BLUEPRINT",
  SET_UNIT_MOVE: "SET_UNIT_MOVE",
  SET_UNIT_ATTACK: "SET_UNIT_ATTACK",
  SET_AUTOTARGET: "SET_AUTOTARGET",
  CLEAR_FAC_QUEUE: "CLEAR_FAC_QUEUE",
};
