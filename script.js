const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ================= STATE =================
let elixir = 10;
let maxElixir = 10;
let doubleElixir = false;
let gameStarted = false;
let overtime = false;
let timeRemaining = 0;
let timerInterval = null;

let troops = [];
let spells = [];
let floatingTexts = [];

let playerCrowns = 0;
let enemyCrowns = 0;

let selectedCard = null;

// ================= TIMER =================
const timerDisplay = document.getElementById("timer");
const timerOptions = document.getElementById("timer-options");

updateTimerText();

document.querySelectorAll("#timer-options button").forEach(btn => {
  btn.addEventListener("click", () => {
    const seconds = parseInt(btn.dataset.time);
    startGame(seconds);
  });
});

function startGame(seconds) {
  if (timerInterval) clearInterval(timerInterval);

  timeRemaining = seconds;
  gameStarted = true;
  overtime = false;
  doubleElixir = false;

  timerOptions.style.display = "none";
  updateTimerText();

  timerInterval = setInterval(() => {
    if (!gameStarted) return;

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
    updateTimerText();
  }, 1000);
}

function updateTimerText() {
  if (!gameStarted) {
    timerDisplay.innerText = "Set Time";
    return;
  }
  const m = Math.floor(timeRemaining / 60);
  const s = timeRemaining % 60;
  timerDisplay.innerText = `Time ${m}:${s.toString().padStart(2, "0")}`;
}

// ================= HELPERS =================
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ================= FLOATING TEXT =================
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
    ctx.font = "18px serif";
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

// ================= TOWER =================
class Tower {
  constructor(x, y, team, type) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.type = type;
    this.hp = type === "king" ? 800 : 500;
    this.maxHp = this.hp;
    this.range = 240;
    this.cool = 0;
  }
  update(targets) {
    if (!gameStarted) return;
    if (this.cool > 0) {
      this.cool--;
      return;
    }
    const t = targets.sort((a, b) => dist(this, a) - dist(this, b))[0];
    if (t && dist(this, t) <= this.range) {
      t.hp -= 25;
      floatingTexts.push(new FloatingText(t.x, t.y, "-25"));
      this.cool = 45;
    }
  }
  draw() {
    ctx.font = "40px serif";
    ctx.fillText(this.type === "king" ? "👑" : "🏰", this.x - 20, this.y + 40);
    ctx.fillStyle = this.team === "player" ? "#b14cff" : "#ff3333";
    ctx.fillRect(this.x - 20, this.y - 12, (this.hp / this.maxHp) * 40, 6);
  }
}

// ================= TROOP =================
class Troop {
  constructor(x, y, team, data) {
    Object.assign(this, { x, y, team });
    Object.assign(this, data);
    this.maxHp = this.hp;
    this.cool = 0;
  }
  update(enemies, towers) {
    if (!gameStarted) return;

    const targets = enemies.concat(towers.filter(t => t.team !== this.team));
    const target = targets.sort((a, b) => dist(this, a) - dist(this, b))[0];
    if (!target) return;

    const d = dist(this, target);

    if (d <= this.range) {
      if (this.cool <= 0) {
        target.hp -= this.dmg;
        floatingTexts.push(new FloatingText(target.x, target.y, `-${this.dmg}`));
        this.cool = 40;
      }
    } else if (!this.ranged) {
      const a = Math.atan2(target.y - this.y, target.x - this.x);
      this.x += Math.cos(a) * this.speed;
      this.y += Math.sin(a) * this.speed;
    }

    if (this.cool > 0) this.cool--;
  }
  draw() {
    ctx.font = "24px serif";
    ctx.fillText(this.emoji, this.x - 12, this.y + 12);
    ctx.fillStyle = this.team === "player" ? "#b14cff" : "#ff3333";
    ctx.fillRect(this.x - 12, this.y - 18, (this.hp / this.maxHp) * 24, 4);
  }
}

// ================= SPELL =================
class Spell {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.life = 20;
  }
  update() {
    this.life--;
    troops.forEach(t => {
      if (dist(this, t) < 80) t.hp -= this.type === "fireball" ? 120 : 60;
    });
    towers.forEach(t => {
      if (dist(this, t) < 80) t.hp -= this.type === "fireball" ? 100 : 40;
    });
  }
  draw() {
    ctx.font = "32px serif";
    ctx.fillText(this.type === "fireball" ? "🔥" : "🏹", this.x - 16, this.y + 16);
  }
}

// ================= CARDS =================
const cards = {
  knight: { emoji: "🗡️", hp: 180, dmg: 15, speed: 1, range: 30, cost: 3 },
  archer: { emoji: "🏹", hp: 120, dmg: 12, speed: 0.8, range: 120, cost: 2, ranged: true },
  wizard: { emoji: "🪄", hp: 150, dmg: 20, speed: 0.7, range: 130, cost: 4, ranged: true },
  giant: { emoji: "🗿", hp: 350, dmg: 25, speed: 0.6, range: 30, cost: 5 },
  fireball: { spell: true, cost: 4 },
  arrows: { spell: true, cost: 3 }
};

// ================= TOWERS =================
let towers = [
  new Tower(40, 120, "player", "princess"),
  new Tower(40, 320, "player", "princess"),
  new Tower(140, 220, "player", "king"),
  new Tower(860, 120, "enemy", "princess"),
  new Tower(860, 320, "enemy", "princess"),
  new Tower(760, 220, "enemy", "king")
];

// ================= INPUT =================
canvas.addEventListener("click", e => {
  if (!selectedCard || !gameStarted) return;
  if (elixir < cards[selectedCard].cost) return;

  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  if (x > canvas.width / 2) return;

  elixir -= cards[selectedCard].cost;
  const c = cards[selectedCard];

  if (c.spell) spells.push(new Spell(x, y, selectedCard));
  else troops.push(new Troop(x, y, "player", c));

  selectedCard = null;
});

// ================= ENEMY AI =================
let enemyElixir = 10;
setInterval(() => {
  if (!gameStarted) return;
  enemyElixir = Math.min(10, enemyElixir + 1);

  if (enemyElixir >= 5) {
    enemyElixir -= 5;
    troops.push(new Troop(820, 220, "enemy", cards.giant));
  }
}, 2600);

// ================= LOOP =================
function loop() {
  ctx.fillStyle = overtime ? "#5b1a1a" : "#2e7c31";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  towers.forEach(t => {
    t.update(troops.filter(tr => tr.team !== t.team));
    t.draw();
  });

  troops.forEach(t => t.update(
    troops.filter(e => e.team !== t.team),
    towers
  ));

  spells.forEach(s => { s.update(); s.draw(); });

  troops = troops.filter(t => t.hp > 0);
  spells = spells.filter(s => s.life > 0);

  towers = towers.filter(t => {
    if (t.hp <= 0) {
      if (t.type === "king") {
        t.team === "player" ? enemyCrowns = 3 : playerCrowns = 3;
        endGame();
      } else {
        t.team === "player" ? enemyCrowns++ : playerCrowns++;
      }
      return false;
    }
    return true;
  });

  document.getElementById("elixir").innerText =
    `Elixir: ${elixir} | 👑 ${playerCrowns} - ${enemyCrowns}`;

  requestAnimationFrame(loop);
}

function endGame() {
  gameStarted = false;
  timerDisplay.innerText =
    playerCrowns > enemyCrowns ? "YOU WIN 🏆" :
    enemyCrowns > playerCrowns ? "YOU LOSE 😢" :
    "DRAW 🤝";
}

// ================= ELIXIR =================
setInterval(() => {
  if (!gameStarted) return;
  elixir = Math.min(maxElixir, elixir + (doubleElixir ? 2 : 1));
}, 1000);

loop();
