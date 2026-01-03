const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= STATE ================= */
let gameStarted = false;
let paused = false;
let overtime = false;

let timeRemaining = 0;
let elixir = 10;
let enemyElixir = 10;
let maxElixir = 10;
let doubleElixir = false;

let troops = [];
let towers = [];
let floatingTexts = [];

let playerCrowns = 0;
let enemyCrowns = 0;

let selectedCard = null;
let dragging = false;
let dragX = 0;
let dragY = 0;

/* ================= UI ================= */
const timerDisplay = document.getElementById("timer");
const timerOptions = document.getElementById("timer-options");
const elixirDisplay = document.getElementById("elixir");

/* ================= HELPERS ================= */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* ================= FLOATING TEXT ================= */
class FloatingText {
  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.a = 1;
  }
  update() {
    this.y -= 0.6;
    this.a -= 0.02;
  }
  draw() {
    ctx.globalAlpha = this.a;
    ctx.fillStyle = "#ffd700";
    ctx.font = "16px serif";
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

/* ================= CARDS ================= */
const cards = {
  knight: { emoji: "🗡️", hp: 230, dmg: 18, speed: 1.1, range: 28, cost: 3 },
  archer: { emoji: "🏹", hp: 130, dmg: 14, speed: 0.9, range: 120, cost: 2 },
  wizard: { emoji: "🪄", hp: 170, dmg: 24, speed: 0.8, range: 140, cost: 4 },
  giant: { emoji: "🗿", hp: 420, dmg: 26, speed: 0.6, range: 30, cost: 5 },
  pekka: { emoji: "🤖", hp: 300, dmg: 40, speed: 0.7, range: 30, cost: 4 },
  goblins: { emoji: "👺", hp: 90, dmg: 10, speed: 1.6, range: 22, cost: 2 },
  fireball: { spell: true, dmg: 120, radius: 70, cost: 4 },
  arrows: { spell: true, dmg: 80, radius: 90, cost: 3 }
};

/* ================= CARD SELECTION ================= */
document.querySelectorAll("#cards button").forEach(btn => {
  btn.onmousedown = () => {
    selectedCard = btn.dataset.card;
    dragging = true;
  };

  btn.onclick = () => {
    selectedCard = btn.dataset.card;
  };
});

/* ================= TIMER ================= */
document.querySelectorAll("#timer-options button").forEach(btn => {
  btn.onclick = () => {
    timeRemaining = parseInt(btn.dataset.time);
    gameStarted = true;
    timerOptions.style.display = "none";
    updateTimer();
  };
});

function updateTimer() {
  if (!gameStarted) {
    timerDisplay.innerText = "Set Time";
    return;
  }
  const m = Math.floor(timeRemaining / 60);
  const s = timeRemaining % 60;
  timerDisplay.innerText = `${m}:${s.toString().padStart(2, "0")}`;
}

/* ================= TOWER ================= */
class Tower {
  constructor(x, y, team, king = false) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.king = king;
    this.hp = king ? 900 : 500;
    this.maxHp = this.hp;
    this.range = 220;
    this.cool = 0;
  }
  update() {
    if (this.hp <= 0) return;
    if (this.cool > 0) this.cool--;
    const enemies = troops.filter(t => t.team !== this.team);
    const target = enemies.sort((a, b) => dist(this, a) - dist(this, b))[0];
    if (!target || dist(this, target) > this.range) return;
    if (this.cool <= 0) {
      target.hp -= 30;
      floatingTexts.push(new FloatingText(target.x, target.y, "-30"));
      this.cool = 45;
    }
  }
  draw() {
    ctx.font = "38px serif";
    ctx.fillText(this.king ? "👑" : "🏰", this.x - 20, this.y + 35);
    ctx.fillStyle = this.team === "player" ? "#b14cff" : "#ff3333";
    ctx.fillRect(this.x - 20, this.y - 12, (this.hp / this.maxHp) * 40, 5);
  }
}

/* ================= TROOP ================= */
class Troop {
  constructor(x, y, team, data) {
    Object.assign(this, data);
    this.x = x;
    this.y = y;
    this.team = team;
    this.maxHp = this.hp;
    this.cool = 0;
  }
  update() {
    if (this.hp <= 0) return;
    if (this.cool > 0) this.cool--;
    const targets =
      troops.filter(t => t.team !== this.team)
      .concat(towers.filter(t => t.team !== this.team));
    if (!targets.length) return;
    const target = targets.sort((a, b) => dist(this, a) - dist(this, b))[0];
    const d = dist(this, target);
    if (d <= this.range) {
      if (this.cool <= 0) {
        target.hp -= this.dmg;
        floatingTexts.push(new FloatingText(target.x, target.y, `-${this.dmg}`));
        this.cool = 35;
      }
    } else {
      const a = Math.atan2(target.y - this.y, target.x - this.x);
      this.x += Math.cos(a) * this.speed;
      this.y += Math.sin(a) * this.speed;
    }
  }
  draw() {
    ctx.font = "24px serif";
    ctx.fillText(this.emoji, this.x - 12, this.y + 12);
    ctx.fillStyle = this.team === "player" ? "#b14cff" : "#ff3333";
    ctx.fillRect(this.x - 12, this.y - 18, (this.hp / this.maxHp) * 24, 4);
  }
}

/* ================= SPELL ================= */
function castSpell(x, y, card) {
  [...troops, ...towers].forEach(t => {
    if (dist({ x, y }, t) <= card.radius) {
      t.hp -= card.dmg;
      floatingTexts.push(new FloatingText(t.x, t.y, `-${card.dmg}`));
    }
  });
}

/* ================= DRAG & DROP ================= */
canvas.onmousemove = e => {
  if (!dragging) return;
  const r = canvas.getBoundingClientRect();
  dragX = e.clientX - r.left;
  dragY = e.clientY - r.top;
};

canvas.onmouseup = () => {
  if (!dragging || !selectedCard) return;
  const card = cards[selectedCard];
  if (elixir < card.cost) return;

  if (card.spell) {
    elixir -= card.cost;
    castSpell(dragX, dragY, card);
  } else if (dragX <= canvas.width / 2) {
    elixir -= card.cost;
    troops.push(new Troop(dragX, dragY, "player", card));
  }

  dragging = false;
  selectedCard = null;
};

/* ================= ENEMY AI ================= */
setInterval(() => {
  if (!gameStarted) return;
  enemyElixir = Math.min(maxElixir, enemyElixir + 1);
  if (enemyElixir >= 4) {
    enemyElixir -= 4;
    troops.push(new Troop(850, 220, "enemy", cards.knight));
  }
}, 2600);

/* ================= ELIXIR ================= */
setInterval(() => {
  if (!gameStarted) return;
  elixir = Math.min(maxElixir, elixir + (doubleElixir ? 2 : 1));
}, 1000);

/* ================= LOOP ================= */
function loop() {
  ctx.fillStyle = overtime ? "#5b1a1a" : "#2e7c31";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  towers.forEach(t => t.update());
  troops.forEach(t => t.update());

  towers = towers.filter(t => t.hp > 0);
  troops = troops.filter(t => t.hp > 0);

  towers.forEach(t => t.draw());
  troops.forEach(t => t.draw());

  floatingTexts.forEach(f => { f.update(); f.draw(); });
  floatingTexts = floatingTexts.filter(f => f.a > 0);

  if (dragging && selectedCard && cards[selectedCard].emoji) {
    ctx.font = "28px serif";
    ctx.fillText(cards[selectedCard].emoji, dragX - 14, dragY + 14);
  }

  elixirDisplay.innerText = `Elixir: ${elixir}`;
  requestAnimationFrame(loop);
}

/* ================= TIMER ================= */
setInterval(() => {
  if (!gameStarted || timeRemaining <= 0) return;
  timeRemaining--;
  updateTimer();
  if (timeRemaining === 0 && playerCrowns === enemyCrowns) {
    overtime = true;
    doubleElixir = true;
    timerDisplay.innerText = "OVERTIME 🔥";
  }
}, 1000);

/* ================= START ================= */
towers.push(
  new Tower(70, 120, "player"),
  new Tower(70, 330, "player"),
  new Tower(160, 225, "player", true),
  new Tower(830, 120, "enemy"),
  new Tower(830, 330, "enemy"),
  new Tower(740, 225, "enemy", true)
);

loop();
