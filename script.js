/**********************
  GLOBAL ELEMENTS
**********************/
const menu = document.getElementById("menu");
const gameScreen = document.getElementById("gameScreen");
const deckScreen = document.getElementById("deckScreen");
const upgradeScreen = document.getElementById("upgradeScreen");

const allCardsDiv = document.getElementById("allCards");
const activeDeckDiv = document.getElementById("activeDeck");
const upgradeContainer = document.getElementById("upgradeContainer");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const cardsDiv = document.getElementById("cards");
const timerDiv = document.getElementById("timer");
const scoreDiv = document.getElementById("score");
const elixirFill = document.getElementById("elixir-fill");

/**********************
  MENU NAV
**********************/
function hideAll(){
  menu.classList.add("hidden");
  gameScreen.classList.add("hidden");
  deckScreen.classList.add("hidden");
  upgradeScreen.classList.add("hidden");
}

function showMenu(){
  hideAll();
  menu.classList.remove("hidden");
  updateCrownsUI();
}

function showDeckBuilder(){
  hideAll();
  deckScreen.classList.remove("hidden");
  renderDeckBuilder();
}

function showUpgradeScreen(){
  hideAll();
  upgradeScreen.classList.remove("hidden");
  drawUpgradeScreen();
}

function startGame(){
  hideAll();
  gameScreen.classList.remove("hidden");
  resetGame();
}

/**********************
  TIME
**********************/
let timeLeft = 180;
function setTime(t){ timeLeft = t; updateTimerUI(); }
function updateTimerUI(){
  timerDiv.innerText =
    Math.floor(timeLeft/60)+":"+String(timeLeft%60).padStart(2,"0");
}

/**********************
  CROWNS
**********************/
let crowns = Number(localStorage.getItem("crowns")) || 0;
function updateCrownsUI(){
  document.getElementById("crownCount").innerText = `Crowns: ${crowns} 👑`;
}
function addCrowns(n){
  crowns += n;
  localStorage.setItem("crowns", crowns);
  updateCrownsUI();
}

/**********************
  CARDS DATA
**********************/
const baseCards = {
  knight:{emoji:"🗡️",hp:300,dmg:25,speed:1,cost:3},
  archer:{emoji:"🏹",hp:170,dmg:18,speed:1.2,cost:2},
  giant:{emoji:"🗿",hp:650,dmg:35,speed:0.6,cost:5},
  wizard:{emoji:"🪄",hp:260,dmg:32,speed:0.9,cost:4},
  goblin:{emoji:"👺",hp:120,dmg:14,speed:1.6,cost:2},
  skeleton:{emoji:"💀",hp:70,dmg:10,speed:1.8,cost:1},
  prince:{emoji:"🐎",hp:320,dmg:30,speed:1.4,cost:4},
  miniPekka:{emoji:"🤖",hp:280,dmg:45,speed:1.0,cost:4},
  healer:{emoji:"💉",hp:200,dmg:0,speed:0.8,cost:3},
  balloon:{emoji:"🎈",hp:150,dmg:60,speed:0.7,cost:5}
};

let cardLevels = JSON.parse(localStorage.getItem("cardLevels")) || {};
Object.keys(baseCards).forEach(c=>{
  if(!cardLevels[c]) cardLevels[c] = 1;
});

/**********************
  DECK
**********************/
let deck = JSON.parse(localStorage.getItem("deck")) || Object.keys(baseCards).slice(0,8);
let activeDeck = [...deck];

/**********************
  DECK BUILDER
**********************/
function renderDeckBuilder(){
  allCardsDiv.innerHTML = "";
  activeDeckDiv.innerHTML = "";

  Object.keys(baseCards).forEach(name=>{
    const lvl = cardLevels[name];
    const c = baseCards[name];
    const card = document.createElement("div");
    card.className = "bigCard";

    if(lvl >= 5) card.classList.add("level-purple");
    else if(lvl >= 3) card.classList.add("level-red");

    card.innerHTML = `
      <div class="emoji">${c.emoji}</div>
      <div class="name">${name.toUpperCase()}</div>
      <div class="level">Level ${lvl}</div>
      <div class="cost">Cost: ${c.cost}</div>
    `;

    card.onclick = ()=>{
      if(activeDeck.length < 8 && !activeDeck.includes(name)){
        activeDeck.push(name);
        renderDeckBuilder();
      }
    };

    allCardsDiv.appendChild(card);
  });

  activeDeck.forEach(name=>{
    const lvl = cardLevels[name];
    const c = baseCards[name];
    const card = document.createElement("div");
    card.className = "bigCard";

    if(lvl >= 5) card.classList.add("level-purple");
    else if(lvl >= 3) card.classList.add("level-red");

    card.innerHTML = `
      <div class="emoji">${c.emoji}</div>
      <div class="name">${name.toUpperCase()}</div>
      <div class="level">Level ${lvl}</div>
      <div class="cost">IN DECK</div>
    `;

    card.onclick = ()=>{
      activeDeck = activeDeck.filter(n=>n!==name);
      renderDeckBuilder();
    };

    activeDeckDiv.appendChild(card);
  });
}

function saveDeck(){
  if(activeDeck.length !== 8){
    alert("Deck must have 8 cards");
    return;
  }
  deck = [...activeDeck];
  localStorage.setItem("deck", JSON.stringify(deck));
  alert("Deck Saved!");
}

/**********************
  UPGRADES
**********************/
function drawUpgradeScreen(){
  upgradeContainer.innerHTML = "";

  Object.keys(baseCards).forEach(name=>{
    const lvl = cardLevels[name];
    const c = baseCards[name];
    const card = document.createElement("div");
    card.className = "bigCard";

    if(lvl >= 5) card.classList.add("level-purple");
    else if(lvl >= 3) card.classList.add("level-red");

    const cost = lvl * 3;

    card.innerHTML = `
      <div class="emoji">${c.emoji}</div>
      <div class="name">${name.toUpperCase()}</div>
      <div class="level">Level ${lvl}</div>
      <div class="cost">${cost} 👑</div>
    `;

    const btn = document.createElement("button");
    btn.innerText = "Upgrade";
    btn.onclick = ()=>{
      if(crowns < cost){ alert("Not enough crowns"); return; }
      crowns -= cost;
      cardLevels[name]++;
      localStorage.setItem("cardLevels", JSON.stringify(cardLevels));
      localStorage.setItem("crowns", crowns);
      drawUpgradeScreen();
      updateCrownsUI();
    };

    card.appendChild(btn);
    upgradeContainer.appendChild(card);
  });
}

/**********************
  GAME STATE
**********************/
let elixir = 10;
let troops = [];
let towers = [];
let hand = [];
let playerScore = 0;
let enemyScore = 0;
let gameOver = false;

/**********************
  TOWERS
**********************/
function resetTowers(){
  towers = [
    {x:260,y:430,hp:1000,maxHp:1000,team:"player",emoji:"🏰"},
    {x:640,y:430,hp:1000,maxHp:1000,team:"player",emoji:"🏰"},
    {x:450,y:480,hp:1800,maxHp:1800,team:"player",emoji:"👑",king:true},
    {x:260,y:80,hp:1000,maxHp:1000,team:"enemy",emoji:"🏰"},
    {x:640,y:80,hp:1000,maxHp:1000,team:"enemy",emoji:"🏰"},
    {x:450,y:40,hp:1800,maxHp:1800,team:"enemy",emoji:"👑",king:true}
  ];
}

/**********************
  GAME RESET
**********************/
function resetGame(){
  elixir = 10;
  troops = [];
  playerScore = enemyScore = 0;
  gameOver = false;
  resetTowers();
  hand = deck.slice(0,4);
  drawHand();
  updateTimerUI();
  scoreDiv.innerText = "👑 0 - 0";
}

/**********************
  HAND UI
**********************/
function drawHand(){
  cardsDiv.innerHTML = "";
  hand.forEach(name=>{
    const c = baseCards[name];
    const div = document.createElement("div");
    div.className = "card";
    if(elixir >= c.cost) div.classList.add("ready");
    div.draggable = true;
    div.dataset.card = name;
    div.innerHTML = `
      <div class="emoji">${c.emoji}</div>
      <div class="name">${name}</div>
      <div class="cost">${c.cost}</div>
    `;
    cardsDiv.appendChild(div);
  });
}

/**********************
  DRAG & DROP
**********************/
let dragged = null;
cardsDiv.addEventListener("dragstart",e=>{
  dragged = e.target.dataset.card;
});
canvas.addEventListener("dragover",e=>e.preventDefault());
canvas.addEventListener("drop",e=>{
  if(!dragged) return;
  const c = baseCards[dragged];
  if(elixir < c.cost) return;
  elixir -= c.cost;

  const rect = canvas.getBoundingClientRect();
  troops.push({
    x:e.clientX-rect.left,
    y:e.clientY-rect.top,
    team:"player",
    emoji:c.emoji,
    hp:c.hp*(1+0.1*(cardLevels[dragged]-1)),
    dmg:c.dmg,
    speed:c.speed
  });

  deck.push(dragged);
  hand.shift();
  hand.push(deck.shift());
  drawHand();
  dragged = null;
});

/**********************
  GAME LOOP
**********************/
function loop(){
  ctx.clearRect(0,0,900,520);

  // River
  ctx.fillStyle="#0284c7";
  ctx.fillRect(0,240,900,40);

  // Bridges
  ctx.fillStyle="#8b4513";
  ctx.fillRect(235,240,50,40);
  ctx.fillRect(615,240,50,40);

  troops.forEach(t=>{
    t.y += t.team==="player" ? -t.speed : t.speed;
    ctx.font="30px serif";
    ctx.fillText(t.emoji,t.x,t.y);
  });

  towers.forEach(t=>{
    ctx.font="34px serif";
    ctx.fillText(t.emoji,t.x,t.y);
  });

  elixirFill.style.width = (elixir/10*100)+"%";
  requestAnimationFrame(loop);
}
loop();

/**********************
  TIMERS
**********************/
setInterval(()=>{
  if(elixir < 10) elixir++;
  drawHand();
},1000);

setInterval(()=>{
  if(timeLeft>0){ timeLeft--; updateTimerUI(); }
},1000);

/**********************
  START
**********************/
updateCrownsUI();
showMenu();
