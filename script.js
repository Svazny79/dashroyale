const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= GAME STATE ================= */
let gameStarted = false;
let paused = false;
let overtime = false;

let timeRemaining = 0;
let timerInterval;

let elixir = 10;
let enemyElixir = 10;
let maxElixir = 10;
let doubleElixir = false;

let troops = [];
let floatingTexts = [];
let towers = [];

let playerCrowns = 0;
let enemyCrowns = 0;

let selectedCard = null;

/* ================= UI ================= */
const timerDisplay = document.getElementById("timer");
const timerOptions = document.getElementById("timer-options");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

pauseBtn.onclick = () => {
  if (!gameStarted) return;
  paused = !paused;
  pauseBtn.innerText = paused ? "Resume" : "Pause";
};

restartBtn.onclick = restartGame;

/* ================= TIMER ================= */
document.querySelectorAll("#timer-options button").forEach(btn => {
  btn.onclick = () => startGame(parseInt(btn.dataset.time));
});

function startGame(seconds) {
  restartGame();
  gameStarted = true;
  paused = false;
  timerOptions.style.display = "none";

  timeRemaining = seconds;
  updateTimer();

  timerInterval = setInterval(() => {
    if (paused) return;

    if (timeRemaining <= 0) {
      if (playerCrowns === enemyCrowns) {
        overtime = true;
        doubleElixir = true;
        timerDisplay.innerText = "OVERTIME 🔥";
      } else {
        endGame();
      }
      clearInterval(timerInterval);
      return;
    }

    timeRemaining--;
    updateTimer();
  }, 1000);
}

function updateTimer() {
  const m = Math.floor(timeRemaining / 60);
  const s = timeRemaining % 60;
  timerDisplay.innerText = gameStarted
    ? `${m}:${s.toString().padStart(2, "0")}`
    : "Set Time";
}

/* ================= HELPERS ================= */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* ================= FLOATING DAMAGE ================= */
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
    ctx.font = "16px serif";
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
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
    this.cooldown = 0;
  }

  update(enemies) {
    if (paused || this.hp <= 0) return;

    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }

    const target = enemies.sort((a, b) => dist(this, a) - dist(this, b))[0];
    if (!target || dist(this, target) > this.range) return;

    target.hp -= 30;
    floatingTexts.push(new FloatingText(target.x, target.y, "-30"));
    this.cooldown = 45;
  }

  draw() {
    if (this.hp <= 0) return;

    ctx.font = "40px serif";
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
    this.cooldown = 0;
  }

  update(enemies, enemyTowers) {
    if (paused || this.hp <= 0) return;

    const targets = enemies.concat(enemyTowers);
    const target = targets.sort((a, b) => dist(this, a) - dist(this, b))[0];
    if (!target) return;

    const d = dist(this, target);

    if (d <= this.range) {
      if (this.cooldown <= 0) {
        target.hp -= this.dmg;
        floatingTexts.push(new FloatingText(target.x, target.y, `-${this.dmg}`));
        this.cooldown = 35;
      }
    } else {
      const angle = Math.atan2(target.y - this.y, target.x - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    }

    if (this.cooldown > 0) this.cooldown--;
  }

  draw() {
    if (this.hp <= 0) return;

    ctx.font = "26px serif";
    ctx.fillText(this.emoji, this.x - 13, this.y + 13);

    ctx.fillStyle = this.team === "player" ? "#b14cff" : "#ff3333";
    ctx.fillRect(this.x - 12, this.y - 18, (this.hp / this.maxHp) * 24, 4);
  }
}

/* ================= CARDS ================= */
const cards = {
  knight: { emoji: "🗡️", hp: 200, dmg: 18, speed: 1.2, range: 28, cost: 3 },
  archer: { emoji: "🏹", hp: 130, dmg: 14, speed: 0.9, range: 130, cost: 2 },
  wizard: { emoji: "🪄", hp: 160, dmg: 22, speed: 0.8, range: 140, cost: 4 },
  giant: { emoji: "🗿", hp: 380, dmg: 26, speed: 0.6, range: 30, cost: 5 }
};

/* ================= TOWERS SETUP ================= */
function resetTowers() {
  towers = [
    new Tower(60, 120, "player"),
    new Tower(60, 320, "player"),
    new Tower(160, 220, "player", true),

    new Tower(840, 120, "enemy"),
    new Tower(840, 320, "enemy"),
    new Tower(740, 220, "enemy", true)
  ];
}

/* ================= INPUT ================= */
canvas.onclick = e => {
  if (!gameStarted || paused || !selectedCard) return;
  if (elixir < cards[selectedCard].cost) return;

  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  if (x > canvas.width / 2) return;

  elixir -= cards[selectedCard].cost;
  troops.push(new Troop(x, y, "player", cards[selectedCard]));
  selectedCard = null;
};

/* ================= ENEMY AI ================= */
setInterval(() => {
  if (!gameStarted || paused) return;

  enemyElixir = Math.min(maxElixir, enemyElixir + 1);
  if (enemyElixir >= 4) {
    enemyElixir -= 4;
    troops.push(new Troop(780, 220, "enemy", cards.knight));
  }
}, 2600);

/* ================= ELIXIR ================= */
setInterval(() => {
  if (!gameStarted || paused) return;
  elixir = Math.min(maxElixir, elixir + (doubleElixir ? 2 : 1));
}, 1000);

/* ================= GAME LOOP ================= */
function loop() {
  ctx.fillStyle = overtime ? "#5a1a1a" : "#2e7c31";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  towers.forEach(t =>
    t.update(troops.filter(tr => tr.team !== t.team))
  );

  troops.forEach(t =>
    t.update(
      troops.filter(e => e.team !== t.team),
      towers.filter(tw => tw.team !== t.team)
    )
  );

  towers = towers.filter(t => t.hp > 0);
  troops = troops.filter(t => t.hp > 0);

  towers.forEach(t => t.draw());
  troops.forEach(t => t.draw());

  floatingTexts.forEach(f => {
    f.update();
    f.draw();
  });
  floatingTexts = floatingTexts.filter(f => f.alpha > 0);

  document.getElementById("elixir").innerText =
    `Elixir: ${elixir} | 👑 ${playerCrowns} - ${enemyCrowns}`;

  requestAnimationFrame(loop);
}

/* ================= END / RESET ================= */
function endGame() {
  gameStarted = false;
  timerDisplay.innerText =
    playerCrowns > enemyCrowns ? "YOU WIN 🏆" : "YOU LOSE 😢";
}

function restartGame() {
  clearInterval(timerInterval);
  gameStarted = false;
  paused = false;
  overtime = false;
  doubleElixir = false;

  elixir = 10;
  enemyElixir = 10;
  troops = [];
  floatingTexts = [];

  playerCrowns = 0;
  enemyCrowns = 0;

  resetTowers();
  timerOptions.style.display = "block";
  timerDisplay.innerText = "Set Time";
}

resetTowers();
loop();
