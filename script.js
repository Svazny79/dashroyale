const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let elixir = 10;
let troops = [];
let enemyTroops = [];

class Troop {
  constructor(x, y, team) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.hp = 100;
    this.speed = team === "player" ? 1 : -1;
  }

  update() {
    this.x += this.speed;
  }

  draw() {
    ctx.fillStyle = this.team === "player" ? "blue" : "red";
    ctx.fillRect(this.x, this.y, 20, 20);
  }
}

function spawnTroop() {
  if (elixir < 3) return;
  elixir -= 3;
  troops.push(new Troop(100, 250, "player"));
}

function spawnEnemy() {
  enemyTroops.push(new Troop(800, 250, "enemy"));
}

function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  troops.forEach(t => {
    t.update();
    t.draw();
  });

  enemyTroops.forEach(e => {
    e.update();
    e.draw();
  });

  document.getElementById("elixir").innerText = "Elixir: " + elixir;
}

setInterval(() => {
  if (elixir < 10) elixir++;
}, 1000);

setInterval(spawnEnemy, 3000);
setInterval(updateGame, 16);
