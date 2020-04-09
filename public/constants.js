const CONSTRAINTS_UNITS = {
  dmg: "dmg/shot",
  health: "hp",

  range: "m",
  speed: "m/sec",

  //   shortReload: "sec"
  reload: "sec",
  turn: "deg/sec",
};
const CONSTRAINTS_TESTING = {
  dmg: 1,
  health: 4,

  range: 100,
  speed: 30,

  reload: 1,
  turn: 40,
};
const CONSTRAINTS_MIN = {
  dmg: 1,
  health: 1,

  range: 5,
  speed: 1,

  reload: 1,
  turn: 5,
};
const CONSTRAINTS_MAX = {
  dmg: 100,
  health: 100,

  range: 200,
  speed: 30,

  reload: 30,
  turn: 360,
};

const ACTION_TYPES = {
  END_TURN: "END_TURN",
  BUY_UNIT: "BUY_UNIT",
  BUY_BLUEPRINT: "BUY_BLUEPRINT",
  SET_UNIT_MOVE: "SET_UNIT_MOVE",
  SET_UNIT_ATTACK: "SET_UNIT_ATTACK",
};
