// ================== GLOBAL STATE ==================
let crowns = 0;
let elixir = 10;
let currentScreen = "menu";
let units = [];
let lastTime = 0;

const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");

// ================== DATA ==================
const cards = [
  { id: 1, name: "Knight", emoji: "🗡️", cost: 3, hp: 300, dmg: 40, speed: 0.4 },
  { id: 2, name: "Archer", emoji: "🏹", cost: 3, hp: 200, dmg: 30, speed: 0.5 },
  { id: 3, name: "Giant", emoji: "🗿", cost: 5, hp: 800, dmg: 60, speed: 0.25 },
  { id: 4, name: "Wizard", emoji: "🪄", cost: 4, hp: 250, dmg: 50, speed: 0.4 },
];

const arenas = [
  { name: "Training Camp", unlocked: true },
  { name: "Barbarian Bowl", unlocked: false }
];

// ================== SCREEN HANDLING ==================
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(name).classList.remove("hidden");
  currentScreen = name;

  if (name === "game") startGame();
  if (name === "deck") renderDeck();
  if (name === "upgrades") renderUpgrades();
  if (name === "arenas") renderArenas();
}

// ================== ADMIN ==================
document.getElementById("adminBtn").onclick = () => {
  const pass = prompt("Admin Password:");
  if (pass === "littlebrother6") {
    crowns = parseInt(prompt("Set crowns:"), 10) || crowns;
    alert("Crowns set to " + crowns);
  }
};

// ================== GAME ==================
function startGame() {
  units = [];
  elixir = 10;
  drawArena();
  renderHand();
  requestAnimationFrame(gameLoop);
}

function drawArena() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grass
  ctx.fillStyle = "#3cb371";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // River
  ctx.fillStyle = "#1e90ff";
  ctx.fillRect(0, 290, canvas.width, 40);

  // Bridges
  ctx.fillStyle = "#8b4513";
  ctx.fillRect(90, 270, 60, 80);
  ctx.fillRect(270, 270, 60, 80);

  // Towers (emoji)
  ctx.font = "32px Arial";
  ctx.fillText("🏰", 60, 560);
  ctx.fillText("🏰", 300, 560);
  ctx.fillText("👑", 185, 590);

  ctx.fillText("🏰", 60, 70);
  ctx.fillText("🏰", 300, 70);
  ctx.fillText("👑", 185, 40);
}

// ================== HAND ==================
function renderHand() {
  const hand = document.getElementById("hand");
  hand.innerHTML = "";

  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <span>${card.emoji}</span>
      <small>${card.name}</small>
      <small>${card.cost}💧</small>
    `;
    div.onclick = () => spawnUnit(card, "player");
    hand.appendChild(div);
  });
}

// ================== SPAWN UNITS ==================
function spawnUnit(card, owner) {
  if (elixir < card.cost) return;

  elixir -= card.cost;
  updateElixir();

  units.push({
    ...card,
    owner,
    x: owner === "player" ? canvas.width / 2 : canvas.width / 2,
    y: owner === "player" ? 520 : 100,
    currentHp: card.hp,
    target: null,
    attackCooldown: 0
  });
}

// ================== GAME LOOP ==================
function gameLoop(time) {
  const delta = time - lastTime;
  lastTime = time;

  updateUnits(delta);
  drawArena();
  drawUnits();

  if (currentScreen === "game") {
    requestAnimationFrame(gameLoop);
  }
}

// ================== UNIT LOGIC ==================
function updateUnits(delta) {
  units.forEach(unit => {
    if (unit.currentHp <= 0) return;

    // Find closest enemy
    const enemies = units.filter(u => u.owner !== unit.owner && u.currentHp > 0);
    let closest = null;
    let dist = Infinity;

    enemies.forEach(e => {
      const d = Math.abs(e.y - unit.y);
      if (d < dist) {
        dist = d;
        closest = e;
      }
    });

    if (closest && dist < 30) {
      // ATTACK
      unit.attackCooldown -= delta;
      if (unit.attackCooldown <= 0) {
        closest.currentHp -= unit.dmg;
        unit.attackCooldown = 800;
      }
    } else {
      // MOVE
      unit.y += unit.owner === "player" ? -unit.speed * delta : unit.speed * delta;
    }
  });

  // Remove dead units
  units = units.filter(u => u.currentHp > 0 && u.y > 0 && u.y < canvas.height);
}

// ================== DRAW UNITS ==================
function drawUnits() {
  ctx.font = "26px Arial";

  units.forEach(unit => {
    ctx.fillText(unit.emoji, unit.x - 10, unit.y);

    // Health bar
    const hpRatio = unit.currentHp / unit.hp;
    ctx.fillStyle = unit.owner === "player" ? "purple" : "red";
    ctx.fillRect(unit.x - 15, unit.y + 5, 30 * hpRatio, 4);
  });
}

// ================== ELIXIR ==================
function updateElixir() {
  document.getElementById("elixirFill").style.width = (elixir * 10) + "%";
}

// ================== DECK / UPGRADES / ARENAS ==================
function renderDeck() {
  document.getElementById("deckCards").innerHTML =
    cards.map(c => `${c.emoji} ${c.name}`).join("<br>");
}

function renderUpgrades() {
  const u = document.getElementById("upgradeCards");
  u.innerHTML = "";
  cards.forEach(c => {
    const b = document.createElement("button");
    b.textContent = `Upgrade ${c.name}`;
    b.onclick = () => {
      if (crowns > 0) {
        crowns--;
        c.hp += 50;
        c.dmg += 10;
      }
    };
    u.appendChild(b);
  });
}

function renderArenas() {
  const a = document.getElementById("arenaList");
  a.innerHTML = "";
  arenas.forEach(ar => {
    a.innerHTML += `<div class="arena">${ar.name}</div>`;
  });
}
