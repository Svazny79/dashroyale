const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let elixir = 10;
let troops = [];
let arrows = [];

// DRAG STATE
let draggingCard = null;
let mouseX = 0;
let mouseY = 0;

// ================= TROOP =================
class Troop {
  constructor(x, y, team, hp, speed, damage, range) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.hp = hp;
    this.speed = speed;
    this.damage = damage;
    this.range = range;
    this.cooldown = 0;
  }

  update(enemies) {
    const target = enemies.find(e => Math.abs(e.x - this.x) < this.range);

    if (target) {
      if (this.cooldown <= 0) {
        target.hp -= this.damage;
        this.cooldown = 60;
      }
    } else {
      this.x += this.speed;
    }

    if (this.cooldown > 0) this.cooldown--;
  }

  draw() {
    ctx.fillStyle = this.team === "player" ? "#00bfff" : "#ff3333";
    ctx.fillRect(this.x, this.y, 22, 22);

    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y - 5, (this.hp / 200) * 22, 3);
  }
}

// ================= TOWER =================
class Tower {
  constructor(x, team, hp) {
    this.x = x;
    this.y = 200;
    this.team = team;
    this.hp = hp;
    this.range = 220;
    this.cooldown = 0;
  }

  update(targets) {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }

    const target = targets.find(t => Math.abs(t.x - this.x) < this.range);
    if (target) {
      arrows.push(new Arrow(this.x + 20, this.y + 40, target));
      this.cooldown = 50;
    }
  }

  draw() {
    ctx.fillStyle = this.team === "player" ? "#1ecbff" : "#ff5555";
    ctx.fillRect(this.x, this.y, 40, 80);

    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y - 8, (this.hp / 800) * 40, 5);
  }
}

// ================= PROJECTILE =================
class Arrow {
  constructor(x, y, target) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.hit = false;
  }

  update() {
    this.x += (this.target.x - this.x) * 0.12;
    this.y += (this.target.y - this.y) * 0.12;

    if (Math.abs(this.x - this.target.x) < 6) {
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
const towers = [
  new Tower(30, "player", 500),
  new Tower(30, "player", 500),
  new Tower(120, "player", 800),
  new Tower(830, "enemy", 500),
  new Tower(830, "enemy", 500),
  new Tower(740, "enemy", 800)
];

// ================= CARD DRAGGING =================
document.querySelectorAll("#cards button").forEach(btn => {
  btn.addEventListener("mousedown", e => {
    draggingCard = {
      type: btn.dataset.type,
      cost: Number(btn.dataset.cost)
    };
    btn.classList.add("dragging");
  });

  btn.addEventListener("mouseup", () => {
    btn.classList.remove("dragging");
  });
});

// Track mouse movement
document.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

// Drop card
canvas.addEventListener("mouseup", () => {
  if (!draggingCard) return;
  if (elixir < draggingCard.cost) {
    draggingCard = null;
    return;
  }

  // Player side only
  if (mouseX > canvas.width / 2) {
    draggingCard = null;
    return;
  }

  elixir -= draggingCard.cost;

  let hp = 150, speed = 1, dmg = 15, range = 30;
  if (draggingCard.type === "giant") { hp = 350; speed = 0.5; dmg = 25; }
  if (draggingCard.type === "pekka") { hp = 250; dmg = 35; }

  troops.push(new Troop(mouseX, mouseY, "player", hp, speed, dmg, range));
  draggingCard = null;
});

// ================= ENEMY AI =================
setInterval(() => {
  troops.push(new Troop(800, 260, "enemy", 150, -1, 15, 30));
}, 3000);

// ================= GAME LOOP =================
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  towers.forEach(t => {
    t.draw();
    t.update(
      t.team === "player"
        ? troops.filter(e => e.team === "enemy")
        : troops.filter(e => e.team === "player")
    );
  });

  troops.forEach(t => {
    t.update(
      t.team === "player"
        ? troops.filter(e => e.team === "enemy")
        : troops.filter(e => e.team === "player")
    );
    t.draw();
  });

  arrows.forEach(a => {
    a.update();
    a.draw();
  });

  arrows = arrows.filter(a => !a.hit);
  troops = troops.filter(t => t.hp > 0);

  // GHOST CARD FOLLOWING CURSOR
  if (draggingCard) {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "gold";
    ctx.fillRect(mouseX - 11, mouseY - 11, 22, 22);
    ctx.globalAlpha = 1;
  }

  document.getElementById("elixir").innerText = "Elixir: " + elixir;

  requestAnimationFrame(gameLoop);
}

setInterval(() => {
  if (elixir < 10) elixir++;
}, 1000);

gameLoop();
