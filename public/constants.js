"use strict";

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
  speed: 35,

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

  range: 250,
  speed: 35,

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
  UPGRADE_BUILD_SPEED: "UPGRADE_BUILD_SPEED",
  EXPORT_GAME_STATE: "EXPORT_GAME_STATE",
  GOD_MODE: "GOD_MODE",
};

const MOUSE_MODES = {
  SELECT: "select",
  MOVE: "move",
  DRAG: "drag",
};

const COLORS = {
  SELF: "navy",
  ENEMY: "tomato",
  NEUTRAL: "#aaa",
  SELECTED: "dodgerblue",
};
