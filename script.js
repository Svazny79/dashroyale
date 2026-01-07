// ================== GLOBAL STATE ==================
let crowns = 0;
let elixir = 10;
let units = [];
let currentScreen = "menu";
let deck = [];
let hand = [];
let lastTime = 0;
let currentArena = "Training Camp"; // default arena

const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");

// ================== CARD DATA ==================
const allCards = [
  { id: 1, name: "Knight", emoji: "🗡️", cost: 3, hp: 300, dmg: 40, speed: 0.4, level: 1 },
  { id: 2, name: "Archer", emoji: "🏹", cost: 3, hp: 200, dmg: 30, speed: 0.5, level: 1 },
  { id: 3, name: "Giant", emoji: "🗿", cost: 5, hp: 800, dmg: 60, speed: 0.25, level: 1 },
  { id: 4, name: "Wizard", emoji: "🪄", cost: 4, hp: 250, dmg: 50, speed: 0.4, level: 1 },
  { id: 5, name: "Balloon", emoji: "🎈", cost: 5, hp: 350, dmg: 70, speed: 0.35, level: 1 },
  { id: 6, name: "Healer", emoji: "💉", cost: 4, hp: 280, dmg: 20, speed: 0.4, level: 1 },
  { id: 7, name: "Mini Pekka", emoji: "🤖", cost: 4, hp: 500, dmg: 90, speed: 0.45, level: 1 },
  { id: 8, name: "Skeletons", emoji: "💀", cost: 1, hp: 120, dmg: 25, speed: 0.6, level: 1 },
  // New unlockable cards for arenas
  { id: 9, name: "Baby Dragon", emoji: "🐉", cost: 4, hp: 400, dmg: 50, speed: 0.4, level: 1, arena: "Barbarian Bowl" },
  { id: 10, name: "Mega Minion", emoji: "🦾", cost: 3, hp: 350, dmg: 60, speed: 0.5, level: 1, arena: "Barbarian Bowl" },
  { id: 11, name: "Prince", emoji: "🏇", cost: 5, hp: 450, dmg: 80, speed: 0.45, level: 1, arena: "Barbarian Bowl" },
  { id: 12, name: "Goblin Gang", emoji: "👹", cost: 2, hp: 150, dmg: 25, speed: 0.6, level: 1, arena: "Barbarian Bowl" }
];

// ================== ARENAS ==================
const arenas = [
  { name: "Training Camp", unlocked: true },
  { name: "Barbarian Bowl", unlocked: false }
];

// ================== TOWERS ==================
let towers = {
  player: [
    { name: "Princess", emoji: "🏰", hp: 2352, x: 60, y: 560 },
    { name: "Princess", emoji: "🏰", hp: 2352, x: 300, y: 560 },
    { name: "King", emoji: "👑", hp: 3096, x: 185, y: 590 }
  ],
  enemy: [
    { name: "Princess", emoji: "🏰", hp: 2352, x: 60, y: 70 },
    { name: "Princess", emoji: "🏰", hp: 2352, x: 300, y: 70 },
    { name: "King", emoji: "👑", hp: 3096, x: 185, y: 40 }
  ]
};

// ================== SAVE / LOAD ==================
function saveGame() {
  localStorage.setItem("dashRoyaleSave", JSON.stringify({
    crowns,
    deck: deck.map(c => c.id),
    cards: allCards.map(c => ({ id: c.id, level: c.level })),
    arenas: arenas.map(a => ({ name: a.name, unlocked: a.unlocked }))
  }));
}

function loadGame() {
  const save = JSON.parse(localStorage.getItem("dashRoyaleSave"));
  if (!save) {
    deck = allCards.filter(c => !c.arena).slice(0, 8);
    return;
  }

  crowns = save.crowns || 0;

  save.cards.forEach(saved => {
    const card = allCards.find(c => c.id === saved.id);
    if (card) card.level = saved.level;
  });

  save.arenas.forEach(a => {
    const arena = arenas.find(ar => ar.name === a.name);
    if (arena) arena.unlocked = a.unlocked;
  });

  deck = save.deck.map(id => allCards.find(c => c.id === id)).filter(Boolean);
}

// ================== SCREEN HANDLING ==================
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(name).classList.remove("hidden");
  currentScreen = name;

  if (name === "game") startGame();
  if (name === "deck") renderDeckBuilder();
  if (name === "upgrades") renderUpgrades();
  if (name === "arenas") renderArenasScreen();
}

// ================== ADMIN ==================
document.getElementById("adminBtn").onclick = () => {
  const pass = prompt("Admin Password:");
  if (pass === "littlebrother6") {
    crowns = parseInt(prompt("Set crowns:"), 10) || crowns;
    saveGame();
    alert("Crowns updated");
  }
};

// ================== GAME ==================
function startGame() {
  units = [];
  elixir = 10;
  hand = deck.slice(0, 4);
  drawArena(currentArena);
  renderHand();
  requestAnimationFrame(gameLoop);
}

// ================== DRAW ARENA ==================
function drawArena(arenaName) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Different arenas get different colors
  if (arenaName === "Training Camp") ctx.fillStyle = "#3cb371";
  else if (arenaName === "Barbarian Bowl") ctx.fillStyle = "#228B22";
  else ctx.fillStyle = "#3cb371";

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // River
  ctx.fillStyle = "#1e90ff";
  ctx.fillRect(0, 290, canvas.width, 40);

  // Bridges
  ctx.fillStyle = "#8b4513";
  ctx.fillRect(90, 270, 60, 80);
  ctx.fillRect(270, 270, 60, 80);

  ctx.font = "32px Arial";
  ["player", "enemy"].forEach(side => {
    towers[side].forEach(t => {
      if (t.hp > 0) ctx.fillText(t.emoji, t.x, t.y);
    });
  });
}

// ================== HAND ==================
function renderHand() {
  const h = document.getElementById("hand");
  h.innerHTML = "";

  hand.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <span>${card.emoji}</span>
      <small>${card.name}</small>
      <small>${card.cost}💧</small>
    `;
    div.onclick = () => playCard(card);
    h.appendChild(div);
  });
}

function playCard(card) {
  if (elixir < card.cost) return;
  elixir -= card.cost;
  updateElixir();
  spawnUnit(card);

  deck.push(deck.shift());
  hand = deck.slice(0, 4);
  renderHand();
  saveGame();
}

// ================== SPAWN UNITS ==================
function spawnUnit(card) {
  units.push({
    ...card,
    owner: "player",
    x: canvas.width / 2,
    y: 520,
    currentHp: card.hp,
    attackCooldown: 0
  });
}

// ================== GAME LOOP ==================
function gameLoop(time) {
  const delta = time - lastTime;
  lastTime = time;

  updateUnits(delta);
  drawArena(currentArena);
  drawUnits();
  drawTowers();

  if (currentScreen === "game") requestAnimationFrame(gameLoop);
}

// ================== UNIT / COMBAT ==================
function updateUnits(delta) {
  units.forEach(unit => {
    if (unit.currentHp <= 0) return;

    const enemyUnits = units.filter(u => u.owner !== unit.owner && u.currentHp > 0);
    let target = enemyUnits[0];

    if (!target) {
      const enemySide = unit.owner === "player" ? "enemy" : "player";
      target = towers[enemySide].filter(t => t.hp > 0).reduce((closest, t) => {
        const d = Math.abs(unit.y - t.y);
        if (!closest || d < closest.d) return { tower: t, d };
        return closest;
      }, null);
      if (target) target = target.tower || target;
    }

    if (!target) return;

    const dist = Math.abs((target.y || target.y) - unit.y);

    if (dist < 30) {
      unit.attackCooldown -= delta;
      if (unit.attackCooldown <= 0) {
        if (target.hp !== undefined) {
          target.hp -= unit.dmg;
          if (target.hp <= 0 && target.name === "King") {
            alert(`${unit.owner} wins!`);
            crowns += unit.owner === "player" ? 3 : 0;
            saveGame();
            showScreen("menu");
          }
        } else {
          target.currentHp -= unit.dmg;
        }
        unit.attackCooldown = 800;
      }
    } else {
      unit.y += unit.owner === "player" ? -unit.speed * delta : unit.speed * delta;
    }
  });

  units = units.filter(u => u.currentHp > 0 && u.y > 0 && u.y < canvas.height);
}

// ================== DRAW UNITS ==================
function drawUnits() {
  ctx.font = "26px Arial";
  units.forEach(u => {
    ctx.fillText(u.emoji, u.x - 10, u.y);
    ctx.fillStyle = "purple";
    ctx.fillRect(u.x - 15, u.y + 5, 30 * (u.currentHp / u.hp), 4);
  });
}

// ================== DRAW TOWERS ==================
function drawTowers() {
  ["player", "enemy"].forEach(side => {
    towers[side].forEach(t => {
      if (t.hp <= 0) return;
      ctx.fillStyle = t.name === "King" ? "red" : "purple";
      ctx.fillRect(t.x - 15, t.y + 10, 30 * (t.hp / (t.name === "King" ? 3096 : 2352)), 5);
    });
  });
}

// ================== ELIXIR ==================
function updateElixir() {
  document.getElementById("elixirFill").style.width = (elixir * 10) + "%";
}

// ================== DECK BUILDER ==================
function renderDeckBuilder() {
  const d = document.getElementById("deckCards");
  d.innerHTML = "";

  deck.forEach((card, i) => {
    const div = document.createElement("div");
    div.className = "card";
    div.draggable = true;
    div.innerHTML = `${card.emoji}<br>${card.name}`;
    div.ondragstart = e => e.dataTransfer.setData("i", i);
    div.ondragover = e => e.preventDefault();
    div.ondrop = e => {
      const from = e.dataTransfer.getData("i");
      [deck[from], deck[i]] = [deck[i], deck[from]];
      renderDeckBuilder();
      saveGame();
    };
    d.appendChild(div);
  });
}

// ================== UPGRADES ==================
function renderUpgrades() {
  const u = document.getElementById("upgradeCards");
  u.innerHTML = "";
  allCards.forEach(c => {
    const b = document.createElement("button");
    b.textContent = `${c.emoji} ${c.name} Lv ${c.level}`;
    b.onclick = () => {
      if (crowns > 0) {
        crowns--;
        c.level++;
        saveGame();
        renderUpgrades();
      }
    };
    u.appendChild(b);
  });
}

// ================== ARENAS SCREEN ==================
function renderArenasScreen() {
  const aDiv = document.getElementById("arenaList");
  aDiv.innerHTML = "";

  arenas.forEach(ar => {
    const div = document.createElement("div");
    div.className = "arena";
    div.textContent = ar.name + (ar.unlocked ? " ✅" : " 🔒");

    div.onclick = () => {
      if (!ar.unlocked) {
        if (crowns >= 10) {
          if (confirm(`Spend 10 crowns to unlock ${ar.name}?`)) {
            crowns -= 10;
            ar.unlocked = true;
            saveGame();
            alert(`${ar.name} unlocked!`);
            renderArenasScreen();
          }
        } else alert("Not enough crowns!");
      } else {
        currentArena = ar.name;
        showScreen("game");
      }
    };

    aDiv.appendChild(div);
  });
}

// ================== INIT ==================
loadGame();
updateElixir();
