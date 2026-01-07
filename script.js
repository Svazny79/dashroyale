// ---------- GLOBAL STATE ----------
let currentScreen = "menu";
let crowns = 0;
let elixir = 10;
let scorePlayer = 0;
let scoreEnemy = 0;
let activeArena = 0;

const cards = [
  { id: 1, name: "Knight", emoji: "🗡️", cost: 3, level: 1 },
  { id: 2, name: "Archer", emoji: "🏹", cost: 3, level: 1 },
  { id: 3, name: "Giant", emoji: "🗿", cost: 5, level: 1 },
  { id: 4, name: "Wizard", emoji: "🪄", cost: 4, level: 1 },
  { id: 5, name: "Balloon", emoji: "🎈", cost: 5, level: 1 },
  { id: 6, name: "Healer", emoji: "💉", cost: 4, level: 1 }
];

const arenas = [
  { name: "Training Camp", cost: 0, unlocked: true },
  { name: "Barbarian Bowl", cost: 5, unlocked: false },
  { name: "Skeleton Pit", cost: 10, unlocked: false }
];

// ---------- SCREEN HANDLER ----------
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(name).classList.remove("hidden");
  currentScreen = name;

  if (name === "game") startGame();
  if (name === "deck") renderDeck();
  if (name === "upgrades") renderUpgrades();
  if (name === "arenas") renderArenas();
}

// ---------- ADMIN ----------
document.getElementById("adminBtn").onclick = () => {
  const pass = prompt("Admin Password:");
  if (pass === "littlebrother6") {
    crowns = parseInt(prompt("Set crowns:"), 10) || crowns;
    alert("Crowns set to " + crowns);
  }
};

// ---------- GAME ----------
const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");

function startGame() {
  drawArena();
  renderHand();
}

function drawArena() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // River
  ctx.fillStyle = "#1e90ff";
  ctx.fillRect(0, 290, 420, 40);

  // Bridges
  ctx.fillStyle = "#8b4513";
  ctx.fillRect(80, 270, 60, 80);
  ctx.fillRect(280, 270, 60, 80);

  // Towers (EMOJIS)
  ctx.font = "30px Arial";
  ctx.fillText("🏰", 60, 550);
  ctx.fillText("🏰", 300, 550);
  ctx.fillText("👑", 180, 580);

  ctx.fillText("🏰", 60, 70);
  ctx.fillText("🏰", 300, 70);
  ctx.fillText("👑", 180, 40);
}

// ---------- HAND ----------
function renderHand() {
  const hand = document.getElementById("hand");
  hand.innerHTML = "";

  cards.slice(0, 4).forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    if (card.level >= 5) div.classList.add("purple");
    else if (card.level >= 3) div.classList.add("red");

    div.innerHTML = `
      <span>${card.emoji}</span>
      <small>${card.name}</small>
      <small>Lv ${card.level} • ${card.cost}</small>
    `;

    div.onclick = () => playCard(card);
    hand.appendChild(div);
  });
}

function playCard(card) {
  if (elixir < card.cost) return alert("Not enough elixir");
  elixir -= card.cost;
  updateElixir();
}

// ---------- ELIXIR ----------
function updateElixir() {
  document.getElementById("elixirFill").style.width = (elixir * 10) + "%";
}

// ---------- DECK BUILDER ----------
function renderDeck() {
  const d = document.getElementById("deckCards");
  d.innerHTML = "";
  cards.forEach(c => {
    d.innerHTML += `<div>${c.emoji} ${c.name} (Lv ${c.level})</div>`;
  });
}

// ---------- UPGRADES ----------
function renderUpgrades() {
  const u = document.getElementById("upgradeCards");
  u.innerHTML = "";
  cards.forEach(c => {
    const btn = document.createElement("button");
    btn.textContent = `${c.emoji} ${c.name} ➜ Upgrade`;
    btn.onclick = () => {
      if (crowns > 0) {
        crowns--;
        c.level++;
        renderUpgrades();
      }
    };
    u.appendChild(btn);
  });
}

// ---------- ARENAS ----------
function renderArenas() {
  const a = document.getElementById("arenaList");
  a.innerHTML = "";
  arenas.forEach((ar, i) => {
    const div = document.createElement("div");
    div.className = "arena";
    div.innerHTML = `<b>${ar.name}</b><br>Cost: ${ar.cost}`;
    if (!ar.unlocked && crowns >= ar.cost) {
      const btn = document.createElement("button");
      btn.textContent = "Get";
      btn.onclick = () => {
        crowns -= ar.cost;
        ar.unlocked = true;
        activeArena = i;
        renderArenas();
      };
      div.appendChild(btn);
    }
    a.appendChild(div);
  });
}
