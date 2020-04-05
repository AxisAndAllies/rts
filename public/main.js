// Make the paper scope global, by injecting it into window:
paper.install(window);

function calcCost(obj) {
  let { dmg, health, range, speed, reload, turn } = obj;
  let realistic_range = speed / 2 + Math.pow(range, 1.5); // b/c of kiting
  let dps = dmg / reload;

  // speed^2 to correct for value of moving fast
  // dps * health = damage output over lifespan
  // sqrt(turn) b/c difference between 5 and 10 deg way more valuable than 180 to 360 deg.
  cost = realistic_range * dps * health * Math.sqrt(turn) + speed * speed;
  cost = Math.max(cost, 100);
  return Math.round(cost);
}

function formatMoney(number) {
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function dispText() {
  let disp = "";
  Object.keys(CONSTRAINTS_MAX).forEach((k) => {
    disp +=
      k +
      ": " +
      CONSTRAINTS_MIN[k] +
      " - " +
      CONSTRAINTS_MAX[k] +
      " " +
      CONSTRAINTS_UNITS[k] +
      "\n";
  });
  disp +=
    "COST: $" + calcCost(CONSTRAINTS_MIN) + " - $" + calcCost(CONSTRAINTS_MAX);
  //   console.log(disp);
  return disp;
}

function updateMaker() {
  let newobj = {};
  let invalid = false;
  Object.keys(CONSTRAINTS_MIN).forEach((k) => {
    newobj[k] = document.getElementById(k).value;
    if (newobj[k] < CONSTRAINTS_MIN[k] || newobj[k] > CONSTRAINTS_MAX[k]) {
      invalid = true;
    }
  });
  //   console.log(newobj);
  document.getElementById("maker");
  document.getElementById("buy").disabled = invalid;

  document.getElementById("buy").innerText = formatMoney(calcCost(newobj));
}

window.onload = function () {
  document.getElementById("info").innerText = dispText();
  let st = "";
  Object.keys(CONSTRAINTS_MIN).forEach((k) => {
    //min=${CONSTRAINTS_MIN[k]} max=${CONSTRAINTS_MAX[k]}
    st += `<span>${k}: </span><input type="text" value="${CONSTRAINTS_MIN[k]}" id="${k}" oninput="updateMaker()"</input><br>`;
  });
  console.log(st);
  document.getElementById("maker").innerHTML = st;
  updateMaker();

  // Setup directly from canvas id:
  paper.setup("canvas");
  //   var path = new Path();
  //   path.strokeColor = "black";
  //   var start = new Point(100, 100);
  //   path.moveTo(start);
  //   path.lineTo(start.add([200, -50]));
  //   view.draw();

  //   var path = new Path.Rectangle([75, 75], [100, 100]);
  //   path.strokeColor = "black";

  //   view.onFrame = function (event) {
  //     // On each frame, rotate the path by 3 degrees:
  //     path.rotate(3);
  //   };

  //   // Create a simple drawing tool:
  //   var tool = new Tool();
  //   var path;

  //   // Define a mousedown and mousedrag handler
  //   tool.onMouseDown = function (event) {
  //     path = new Path();
  //     path.strokeColor = "black";
  //     path.add(event.point);
  //   };

  //   tool.onMouseDrag = function (event) {
  //     path.add(event.point);
  //   };
};
