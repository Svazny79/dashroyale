const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ================= STATE =================
let elixir = 10;
let maxElixir = 10;
let doubleElixir = false;
let gameStarted = false;
let paused = false;
let overtime = false;
let timeRemaining = 0;
let timerInterval = null;

let troops = [];
let spells = [];
let floatingTexts = [];

let playerCrowns = 0;
let enemyCrowns = 0;

let selectedCard = null;

// ================= BUTTONS =================
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const timerDisplay = document.getElementById("timer");
const timerOptions = document.getElementById("timer-options");

pauseBtn.onclick = () => {
  if (!gameStarted) return;
  paused = !paused;
  pauseBtn.innerText = paused ? "Resume" : "Pause";
};

restartBtn.onclick = () => restartGame();

// ================= TIMER =================
document.querySelectorAll("#timer-options button").forEach(btn => {
  btn.onclick = () => startGame(parseInt(btn.dataset.time));
});

function startGame(seconds) {
  restartGame();
  gameStarted = true;
  paused = false;
  pauseBtn.innerText = "Pause";
  timerOptions.style.display = "none";
  timeRemaining = seconds;
  updateTimer();

  timerInterval = setInterval(() => {
    if (!gameStarted || paused) return;

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

// ================= CLASSES =================
class FloatingText {
  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.a = 1;
  }
  update() { this.y -= 0.6; this.a -= 0.02; }
  draw() {
    ctx.globalAlpha = this.a;
    ctx.fillStyle = "#ffd700";
    ctx.font = "18px serif";
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

class Tower {
  constructor(x, y, team, type) {
    this.x = x; this.y = y;
    this.team = team; this.type = type;
    this.hp = type === "king" ? 800 : 500;
    this.maxHp = this.hp;
    this.range = 240;
    this.cool = 0;
  }
  update(targets) {
    if (!gameStarted || paused) return;
    if (this.cool > 0) { this.cool--; return; }
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

class Troop {
  constructor(x, y, team, data) {
    Object.assign(this, { x, y, team });
    Object.assign(this, data);
    this.maxHp = this.hp;
    this.cool = 0;
  }
  update(enemies, towers) {
    if (!gameStarted || paused) return;
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

// ================= CONFIG =================
const cards = {
  knight:{emoji:"🗡️",hp:180,dmg:15,speed:1,range:30,cost:3},
  archer:{emoji:"🏹",hp:120,dmg:12,speed:0.8,range:120,cost:2,ranged:true},
  wizard:{emoji:"🪄",hp:150,dmg:20,speed:0.7,range:130,cost:4,ranged:true},
  giant:{emoji:"🗿",hp:350,dmg:25,speed:0.6,range:30,cost:5}
};

// ================= TOWERS =================
let towers;
function resetTowers(){
  towers = [
    new Tower(40,120,"player","princess"),
    new Tower(40,320,"player","princess"),
    new Tower(140,220,"player","king"),
    new Tower(860,120,"enemy","princess"),
    new Tower(860,320,"enemy","princess"),
    new Tower(760,220,"enemy","king")
  ];
}

// ================= INPUT =================
canvas.onclick = e => {
  if (!selectedCard || !gameStarted || paused) return;
  if (elixir < cards[selectedCard].cost) return;

  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  if (x > canvas.width / 2) return;

  elixir -= cards[selectedCard].cost;
  troops.push(new Troop(x, y, "player", cards[selectedCard]));
  selectedCard = null;
};

// ================= RESTART =================
function restartGame(){
  clearInterval(timerInterval);
  gameStarted = false;
  paused = false;
  overtime = false;
  doubleElixir = false;
  timeRemaining = 0;
  elixir = 10;
  playerCrowns = 0;
  enemyCrowns = 0;
  troops = [];
  spells = [];
  floatingTexts = [];
  resetTowers();
  timerOptions.style.display = "block";
  updateTimer();
}

// ================= LOOP =================
function loop(){
  ctx.fillStyle = overtime ? "#5b1a1a" : "#2e7c31";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  towers.forEach(t=>{
    t.update(troops.filter(tr=>tr.team!==t.team));
    t.draw();
  });

  troops.forEach(t=>t.update(
    troops.filter(e=>e.team!==t.team),
    towers
  ));

  troops = troops.filter(t=>t.hp>0);

  troops.forEach(t=>t.draw());
  floatingTexts.forEach(f=>{f.update();f.draw();});
  floatingTexts = floatingTexts.filter(f=>f.a>0);

  document.getElementById("elixir").innerText =
    `Elixir: ${elixir} | 👑 ${playerCrowns} - ${enemyCrowns}`;

  requestAnimationFrame(loop);
}

// ================= ELIXIR =================
setInterval(()=>{
  if (!gameStarted || paused) return;
  elixir = Math.min(maxElixir, elixir + (doubleElixir ? 2 : 1));
},1000);

resetTowers();
loop();
