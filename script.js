const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= STATE ================= */
let gameStarted = false;
let paused = false;
let timeRemaining = 0;

let elixir = 10;
let enemyElixir = 10;

let troops = [];
let towers = [];
let selectedCard = null;

/* ================= UI ================= */
const timerDisplay = document.getElementById("timer");
const timerOptions = document.getElementById("timer-options");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const elixirDisplay = document.getElementById("elixir");

/* ================= HELPERS ================= */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* ================= CARDS ================= */
const cards = {
  knight: { emoji: "🗡️", hp: 220, dmg: 18, speed: 1.1, range: 28, cost: 3 },
  archer: { emoji: "🏹", hp: 130, dmg: 14, speed: 0.9, range: 120, cost: 2 },
  wizard: { emoji: "🪄", hp: 160, dmg: 22, speed: 0.8, range: 130, cost: 4 },
  giant: { emoji: "🗿", hp: 380, dmg: 26, speed: 0.6, range: 30, cost: 5 }
};

/* ================= CARD SELECTION ================= */
document.querySelectorAll("#cards button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("#cards button")
      .forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
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
  constructor(x, y, team) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.hp = 500;
    this.maxHp = 500;
    this.range = 200;
    this.cool = 0;
  }

  update() {
    if (this.cool > 0) this.cool--;

    const enemies = troops.filter(t => t.team !== this.team);
    const target = enemies.sort((a, b) => dist(this, a) - dist(this, b))[0];
    if (!target || dist(this, target) > this.range) return;

    if (this.cool <= 0) {
      target.hp -= 30;
      this.cool = 45;
    }
  }

  draw() {
    ctx.font = "38px serif";
    ctx.fillText("🏰", this.x - 20, this.y + 35);

    ctx.fillStyle = this.team === "player" ? "#b14cff" : "#ff3333";
    ctx.fillRect(this.x - 20, this.y - 12, (this.hp / this.maxHp) * 40, 5);
  }
}

/* ================= TROOP ================= */
class Troop {
  constructor(x, y, team, data) {
    this.x = x;
    this.y = y;
    this.team = team;
    Object.assign(this, data);
    this.maxHp = this.hp;
    this.cool = 0;
  }

  update() {
    if (this.cool > 0) this.cool--;

    const enemyTroops = troops.filter(t => t.team !== this.team);
    const enemyTowers = towers.filter(t => t.team !== this.team);
    const targets = enemyTroops.concat(enemyTowers);
    if (targets.length === 0) return;

    const target = targets.sort((a, b) => dist(this, a) - dist(this, b))[0];
    const d = dist(this, target);

    if (d <= this.range) {
      if (this.cool <= 0) {
        target.hp -= this.dmg;
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

/* ================= INPUT ================= */
canvas.onclick = e => {
  if (!gameStarted || paused || !selectedCard) return;
  const card = cards[selectedCard];
  if (elixir < card.cost) return;

  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  if (x > canvas.width / 2) return;

  elixir -= card.cost;
  troops.push(new Troop(x, y, "player", card));
};

/* ================= ENEMY AI ================= */
setInterval(() => {
  if (!gameStarted) return;

  enemyElixir = Math.min(10, enemyElixir + 1);
  if (enemyElixir >= 4) {
    enemyElixir -= 4;
    troops.push(new Troop(850, 225, "enemy", cards.knight));
  }
}, 2600);

/* ================= ELIXIR ================= */
setInterval(() => {
  if (gameStarted) elixir = Math.min(10, elixir + 1);
}, 1000);

/* ================= LOOP ================= */
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  towers.forEach(t => t.update());
  troops.forEach(t => t.update());

  troops = troops.filter(t => t.hp > 0);
  towers = towers.filter(t => t.hp > 0);

  towers.forEach(t => t.draw());
  troops.forEach(t => t.draw());

  elixirDisplay.innerText = `Elixir: ${elixir}`;

  requestAnimationFrame(loop);
}

/* ================= CONTROLS ================= */
pauseBtn.onclick = () => paused = !paused;
restartBtn.onclick = () => location.reload();

/* ================= TIMER TICK ================= */
setInterval(() => {
  if (gameStarted && timeRemaining > 0) {
    timeRemaining--;
    updateTimer();
  }
}, 1000);

/* ================= START ================= */
towers.push(
  new Tower(70, 120, "player"),
  new Tower(70, 330, "player"),
  new Tower(830, 120, "enemy"),
  new Tower(830, 330, "enemy")
);

loop();
