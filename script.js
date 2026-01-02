const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let elixir = 10;
let selectedCard = null;
let troops = [];
let projectiles = [];
let gameOver = false;

// ================= TROOPS =================
class Troop {
  constructor(x, y, team, hp, speed) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.hp = hp;
    this.speed = speed;
  }

  update() {
    this.x += this.speed;
  }

  draw() {
    ctx.fillStyle = this.team === "player" ? "blue" : "red";
    ctx.fillRect(this.x, this.y, 22, 22);

    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y - 5, (this.hp / 150) * 22, 3);
  }
}

// ================= PROJECTILES =================
class Arrow {
  constructor(x, y, target) {
    this.x = x;
    this.y = y;
    this.target = target;
  }

  update() {
    this.x += (this.target.x - this.x) * 0.1;
    this.y += (this.target.y - this.y) * 0.1;

    if (Math.abs(this.x - this.target.x) < 5) {
      this.target.hp -= 20;
      this.hit = true;
    }
  }

  draw() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.x, this.y, 6, 2);
  }
}

// ================= TOWERS =================
class Tower {
  constructor(x, team, hp) {
    this.x = x;
    this.y = 200;
    this.team = team;
    this.hp = hp;
    this.range = 200;
    this.cooldown = 0;
  }

  update(targets) {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }

    const target = targets.find(
      t => Math.abs(t.x - this.x) < this.range
    );

    if (target) {
      projectiles.push(new Arrow(this.x, this.y, target));
      this.cooldown = 60;
    }
  }

  draw() {
    ctx.fillStyle = this.team === "player" ? "#00bfff" : "#ff3333";
    ctx.fillRect(this.x, this.y, 40, 80);

    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y - 8, (this.hp / 800) * 40, 5);
  }
}

// ================= TOWER SETUP =================
const towers = [
  // Player
  new Tower(20, "player", 500),
  new Tower(20, "player", 500),
  new Tower(120, "player", 800), // King

  // Enemy
  new Tower(840, "enemy", 500),
  new Tower(840, "enemy", 500),
  new Tower(740, "enemy", 800) // King
];

// ================= CARDS =================
function selectCard(type, cost) {
  if (elixir < cost) return;
  selectedCard = { type, cost };
  document.querySelectorAll("button").forEach(b => b.classList.remove("selected"));
  event.target.classList.add("selected");
}

canvas.addEventListener("click", e => {
  if (!selectedCard || gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (x > canvas.width / 2) return;

  elixir -= selectedCard.cost;

  let hp = 120, speed = 1;
  if (selectedCard.type === "giant") { hp = 300; speed = 0.5; }
  if (selectedCard.type === "pekka") { hp = 200; speed = 0.8; }

  troops.push(new Troop(x, y, "player", hp, speed));
  selectedCard = null;
  document.querySelectorAll("button").forEach(b => b.classList.remove("selected"));
});

// ================= ENEMY AI =================
setInterval(() => {
  troops.push(new Troop(800, 250, "enemy", 120, -1));
}, 3000);

// ================= GAME LOOP =================
function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  towers.forEach(t => {
    t.draw();
    t.update(t.team === "player"
      ? troops.filter(e => e.team === "enemy")
      : troops.filter(e => e.team === "player"));
  });

  troops.forEach(t => {
    t.update();
    t.draw();
  });

  projectiles.forEach(p => {
    p.update();
    p.draw();
  });

  projectiles = projectiles.filter(p => !p.hit);
  troops = troops.filter(t => t.hp > 0);

  document.getElementById("elixir").innerText = "Elixir: " + elixir;

  if (towers[5].hp <= 0) alert("🏆 YOU WIN!");
  if (towers[2].hp <= 0) alert("💀 YOU LOSE!");
}

setInterval(() => {
  if (elixir < 10) elixir++;
}, 1000);

setInterval(updateGame, 16);
