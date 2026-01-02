const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let elixir = 10;
let troops = [];
let arrows = [];
let floatingTexts = [];

let draggingCard = null;
let pointerX = 0;
let pointerY = 0;
let selectedCard = null;

// ================= TROOP =================
class Troop {
  constructor(x, y, team, emoji, hp, speed, damage, range) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.emoji = emoji;
    this.hp = hp;
    this.maxHp = hp;
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
        floatingTexts.push(new FloatingText(target.x, target.y - 20, `-${this.damage}`));
        this.cooldown = 60;
      }
    } else {
      this.x += this.speed;
    }
    if (this.cooldown > 0) this.cooldown--;
  }

  draw() {
    ctx.font = "24px serif";
    ctx.fillText(this.emoji, this.x - 12, this.y + 12);

    ctx.fillStyle = this.team === "player" ? "#b14cff" : "#ff3333";
    ctx.fillRect(this.x - 12, this.y - 18, (this.hp / this.maxHp) * 24, 4);
  }
}

// ================= TOWER =================
class Tower {
  constructor(x, y, team, emoji, hp) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.emoji = emoji;
    this.hp = hp;
    this.maxHp = hp;
    this.range = 220;
    this.cooldown = 0;
  }

  update(targets) {
    if (this.cooldown > 0) { this.cooldown--; return; }
    const target = targets.find(t => Math.abs(t.x - this.x) < this.range);
    if (target) {
      target.hp -= 20;
      floatingTexts.push(new FloatingText(target.x, target.y - 20, "-20"));
      this.cooldown = 50;
    }
  }

  draw() {
    ctx.font = "40px serif";
    ctx.fillText(this.emoji, this.x - 20, this.y + 40);

    ctx.fillStyle = this.team === "player" ? "#b14cff" : "#ff3333";
    ctx.fillRect(this.x - 20, this.y - 10, (this.hp / this.maxHp) * 40, 6);
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
    this.x += (this.target.x - this.x) * 0.15;
    this.y += (this.target.y - this.y) * 0.15;
    if (Math.abs(this.x - this.target.x) < 6) {
      this.target.hp -= 20;
      floatingTexts.push(new FloatingText(this.target.x, this.target.y - 20, "-20"));
      this.hit = true;
    }
  }

  draw() {
    ctx.font = "16px serif";
    ctx.fillText("🏹", this.x, this.y);
  }
}

// ================= FLOATING DAMAGE TEXT =================
class FloatingText {
  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.alpha = 1;
  }

  update() {
    this.y -= 0.5;
    this.alpha -= 0.02;
  }

  draw() {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = "#ffd700";
    ctx.font = "18px serif";
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

// ================= TOWERS =================
const towers = [
  new Tower(40, 150, "player", "🏰", 500),
  new Tower(40, 300, "player", "👑", 800),
  new Tower(860, 150, "enemy", "🏰", 500),
  new Tower(860, 300, "enemy", "👑", 800)
];

// ================= CARDS =================
const cardConfig = {
  knight: { emoji: "🗡️", hp: 180, speed: 1, dmg: 15, cost: 3 },
  archer: { emoji: "🏹", hp: 120, speed: 1.1, dmg: 12, cost: 2 },
  giant: { emoji: "🗿", hp: 350, speed: 0.5, dmg: 25, cost: 5 },
  pekka: { emoji: "🤖", hp: 250, speed: 0.8, dmg: 35, cost: 5 },
  wizard: { emoji: "🪄", hp: 150, speed: 1, dmg: 20, cost: 4 },
  goblin: { emoji: "👺", hp: 100, speed: 1.5, dmg: 10, cost: 2 },
};

// ================= CARD CLICK / DRAG =================
document.querySelectorAll("#cards button").forEach(btn => {
  const type = btn.dataset.type;

  btn.addEventListener("click", () => {
    selectedCard = { type: type, cost: cardConfig[type].cost };
    document.querySelectorAll("#cards button").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  });

  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    draggingCard = { type: type, cost: cardConfig[type].cost };
  });
});

document.addEventListener("pointermove", e => {
  const rect = canvas.getBoundingClientRect();
  pointerX = e.clientX - rect.left;
  pointerY = e.clientY - rect.top;
});

// ================= PLACE CARD =================
canvas.addEventListener("click", e => placeCard(e.clientX, e.clientY));
document.addEventListener("pointerup", e => {
  if (draggingCard) placeCard(e.clientX, e.clientY);
  draggingCard = null;
});

function placeCard(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  if (x > canvas.width / 2 || elixir <= 0) return;

  let card = draggingCard || selectedCard;
  if (!card || elixir < card.cost) return;
  elixir -= card.cost;

  const cfg = cardConfig[card.type];
  troops.push(new Troop(x, y, "player", cfg.emoji, cfg.hp, cfg.speed, cfg.dmg, 30));

  selectedCard = null;
  document.querySelectorAll("#cards button").forEach(b => b.classList.remove("selected"));
}

// ================= ENEMY AI =================
setInterval(() => {
  const x = 820;
  const y = Math.random() * 400 + 50;
  const keys = Object.keys(cardConfig);
  const type = keys[Math.floor(Math.random() * keys.length)];
  const cfg = cardConfig[type];
  troops.push(new Troop(x, y, "enemy", cfg.emoji, cfg.hp, -cfg.speed, cfg.dmg, 30));
}, 2500);

// ================= DRAW ARENA =================
function drawArena() {
  ctx.fillStyle = "#2e7c31";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ================= GAME LOOP =================
function gameLoop() {
  drawArena();

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

  arrows.forEach(a => { a.update(); a.draw(); });
  arrows = arrows.filter(a => !a.hit);
  troops = troops.filter(t => t.hp > 0);

  // Floating damage texts
  floatingTexts.forEach(ft => { ft.update(); ft.draw(); });
  floatingTexts = floatingTexts.filter(ft => ft.alpha > 0);

  // Ghost for dragging
  if (draggingCard) {
    ctx.globalAlpha = 0.6;
    const emoji = cardConfig[draggingCard.type].emoji;
    ctx.font = "24px serif";
    ctx.fillText(emoji, pointerX - 12, pointerY + 12);
    ctx.globalAlpha = 1;
  }

  document.getElementById("elixir").innerText = "Elixir: " + elixir;
  requestAnimationFrame(gameLoop);
}

setInterval(() => { if (elixir < 10) elixir++; }, 1000);
gameLoop();
