const { calcCost, generateID } = require("./util");
class Blueprint {
  constructor(name, owner_id, stats) {
    this.name = name;
    this.owner_id = owner_id;
    this.stats = stats;
    this.unit_cost = calcCost(stats);
    this.id = this.owner_id + "_" + generateID();
  }
}
module.exports = Blueprint;
