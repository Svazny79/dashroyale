/**********************************************************
 * DASH ROYALE – CORE GAME SCRIPT
 * All logic lives here (as requested)
 **********************************************************/

/* ===================== DOM ===================== */
const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");
const deckBuilderScreen = document.getElementById("deckBuilderScreen");
const upgradeScreen = document.getElementById("upgradeScreen");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const cardHand = document.getElementById("cardHand");
const elixirFill = document.getElementById("elixirFill");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const crownDisplay = document.getElementById("crownDisplay");

const allCardsDiv = document.getElementById("allCards");
const activeDeckDiv = document.getElementById("activeDeck");
const upgradeGrid = document.getElementById("upgradeGrid");

/* ===================== GAME STATE ===================== */
let gameTime = 180;
let timerInterval;

let crowns = 0;
let playerScore = 0;
let enemyScore = 0;

let elixir = 10;
const MAX_ELIXIR = 10;

let draggingCard = null;
let units = [];

/* ===================== CARDS ===================== */
const baseCards = {
  Knight: { emoji:"🗡️", cost:3, hp:700, dmg:80, speed:0.6 },
  Archer: { emoji:"🏹", cost:3, hp:350, dmg:100, speed:0.7 },
  Giant:  { emoji:"🗿", cost:5, hp:2000, dmg:120, speed:0.35 },
  MiniPekka:{ emoji:"🤖", cost:4, hp:900, dmg:200, speed:0.6 },
  Wizard: { emoji:"🧙", cost:5, hp:500, dmg:160, speed:0.55 },
  Skeleton:{ emoji:"💀", cost:1, hp:120, dmg:45, speed:0.9 },
  Valkyrie:{ emoji:"🪓", cost:4, hp:1200, dmg:130, speed:0.5 },
  Prince: { emoji:"🐎", cost:5, hp:1500, dmg:220, speed:0.7 }
};

let cardLevels = {};
Object.keys(baseCards).forEach(c => cardLevels[c] = 1);

let activeDeck = Object.keys(baseCards).slice(0, 8);

/* ===================== TOWERS ===================== */
const PRINCESS_HP = 2352;
const KING_HP = 3096;

let playerTowers, enemyTowers;

/* ===================== NAVIGATION ===================== */
function startGame(){
  menuScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  resetGame();
}

function backToMenu(){
  gameScreen.classList.add("hidden");
  deckBuilderScreen.classList.add("hidden");
  upgradeScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
}

function openDeckBuilder(){
  menuScreen.classList.add("hidden");
  deckBuilderScreen.classList.remove("hidden");
  renderDeckBuilder();
}

function openUpgrades(){
  menuScreen.classList.add("hidden");
  upgradeScreen.classList.remove("hidden");
  renderUpgrades();
}

/* ===================== TIMER ===================== */
function setGameTime(t){
  gameTime = t;
}

function startTimer(){
  clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    gameTime--;
    timerEl.innerText =
      Math.floor(gameTime/60)+":"+(gameTime%60).toString().padStart(2,"0");
    if(gameTime<=0) endGame();
  },1000);
}

/* ===================== GAME RESET ===================== */
function resetGame(){
  units = [];
  elixir = MAX_ELIXIR;
  updateElixir();

  playerTowers = [
    {x:200,y:400,hp:PRINCESS_HP,max:PRINCESS_HP, enemy:false},
    {x:700,y:400,hp:PRINCESS_HP,max:PRINCESS_HP, enemy:false},
    {x:450,y:470,hp:KING_HP,max:KING_HP, enemy:false, king:true}
  ];

  enemyTowers = [
    {x:200,y:120,hp:PRINCESS_HP,max:PRINCESS_HP, enemy:true},
    {x:700,y:120,hp:PRINCESS_HP,max:PRINCESS_HP, enemy:true},
    {x:450,y:60,hp:KING_HP,max:KING_HP, enemy:true, king:true}
  ];

  drawHand();
  startTimer();
  requestAnimationFrame(gameLoop);
}

/* ===================== ELIXIR ===================== */
setInterval(()=>{
  if(gameScreen.classList.contains("hidden")) return;
  elixir = Math.min(MAX_ELIXIR, elixir + 0.1);
  updateElixir();
},100);

function updateElixir(){
  elixirFill.style.width = (elixir / MAX_ELIXIR * 100) + "%";
}

/* ===================== HAND ===================== */
function drawHand(){
  cardHand.innerHTML = "";
  activeDeck.forEach(name=>{
    const c = baseCards[name];
    const lvl = cardLevels[name];

    const div = document.createElement("div");
    div.className = "card";
    if(lvl>=5) div.classList.add("level-purple");
    else if(lvl>=3) div.classList.add("level-red");

    div.innerHTML = `
      <div class="emoji">${c.emoji}</div>
      <div class="name">${name}</div>
      <div class="level">Lvl ${lvl}</div>
      <div class="cost">${c.cost}</div>
    `;

    div.onmousedown = () => draggingCard = name;
    div.onclick = () => placeCard(name, canvas.width/2, canvas.height-80);

    cardHand.appendChild(div);
  });
}

/* ===================== PLACEMENT ===================== */
canvas.addEventListener("mouseup", e=>{
  if(!draggingCard) return;
  const rect = canvas.getBoundingClientRect();
  placeCard(
    draggingCard,
    e.clientX - rect.left,
    e.clientY - rect.top
  );
  draggingCard = null;
});

function placeCard(name,x,y){
  const c = baseCards[name];
  if(elixir < c.cost) return;
  elixir -= c.cost;
  updateElixir();

  const lvl = cardLevels[name];
  units.push({
    name,
    emoji:c.emoji,
    x,y,
    hp:c.hp * (1 + lvl*0.15),
    maxHp:c.hp * (1 + lvl*0.15),
    dmg:c.dmg * (1 + lvl*0.15),
    speed:c.speed,
    enemy:false
  });
}

/* ===================== ENEMY AI ===================== */
setInterval(()=>{
  if(gameScreen.classList.contains("hidden")) return;
  const names = Object.keys(baseCards);
  const name = names[Math.floor(Math.random()*names.length)];
  const c = baseCards[name];

  units.push({
    name,
    emoji:c.emoji,
    x:Math.random()*canvas.width,
    y:80,
    hp:c.hp,
    maxHp:c.hp,
    dmg:c.dmg,
    speed:c.speed,
    enemy:true
  });
},3500);

/* ===================== GAME LOOP ===================== */
function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawArena();
  drawTowers(playerTowers);
  drawTowers(enemyTowers);

  units.forEach(u=>{
    u.y += u.enemy ? u.speed : -u.speed;
    drawUnit(u);
    handleCombat(u);
  });

  units = units.filter(u=>u.hp>0);
  requestAnimationFrame(gameLoop);
}

/* ===================== DRAWING ===================== */
function drawArena(){
  ctx.fillStyle="#2563eb";
  ctx.fillRect(0,250,canvas.width,40);

  ctx.fillStyle="#8b5a2b";
  ctx.fillRect(280,250,40,40);
  ctx.fillRect(580,250,40,40);
}

function drawTowers(arr){
  arr.forEach(t=>{
    ctx.fillStyle="#555";
    ctx.fillRect(t.x-25,t.y-25,50,50);

    ctx.fillStyle = t.enemy ? "#ef4444" : "#9333ea";
    ctx.fillRect(
      t.x-25,
      t.y-35,
      50*(t.hp/t.max),
      6
    );

    ctx.fillStyle="white";
    ctx.font="12px Arial";
    ctx.fillText(Math.floor(t.hp),t.x-20,t.y-40);
  });
}

function drawUnit(u){
  ctx.font="26px Arial";
  ctx.fillText(u.emoji,u.x-12,u.y+12);
}

/* ===================== COMBAT ===================== */
function handleCombat(u){
  const targets = u.enemy ? playerTowers : enemyTowers;
  targets.forEach(t=>{
    if(Math.abs(u.x-t.x)<30 && Math.abs(u.y-t.y)<30){
      t.hp -= u.dmg*0.02;
      if(t.hp<=0){
        if(t.king){
          endGame(u.enemy ? "enemy" : "player");
        }
      }
    }
  });
}

/* ===================== END GAME ===================== */
function endGame(winner){
  clearInterval(timerInterval);
  if(winner==="player"){
    playerScore+=3;
    crowns+=3;
  } else if(winner==="enemy"){
    enemyScore+=3;
  }
  scoreEl.innerText=`👑 ${playerScore} - ${enemyScore}`;
  crownDisplay.innerText=`👑 Crowns: ${crowns}`;
  backToMenu();
}

/* ===================== DECK BUILDER ===================== */
function renderDeckBuilder(){
  allCardsDiv.innerHTML="";
  activeDeckDiv.innerHTML="";

  Object.keys(baseCards).forEach(name=>{
    const c=baseCards[name], lvl=cardLevels[name];
    const div=document.createElement("div");
    div.className="bigCard";
    if(lvl>=5)div.classList.add("level-purple");
    else if(lvl>=3)div.classList.add("level-red");
    div.innerHTML=`<div class="emoji">${c.emoji}</div>
                   <div class="name">${name}</div>
                   <div class="level">Lvl ${lvl}</div>`;
    div.onclick=()=>{
      if(activeDeck.length<8 && !activeDeck.includes(name)){
        activeDeck.push(name);
        renderDeckBuilder();
      }
    };
    allCardsDiv.appendChild(div);
  });

  activeDeck.forEach(name=>{
    const c=baseCards[name], lvl=cardLevels[name];
    const div=document.createElement("div");
    div.className="bigCard";
    div.innerHTML=`<div class="emoji">${c.emoji}</div>
                   <div class="name">${name}</div>
                   <div class="level">IN DECK</div>`;
    div.onclick=()=>{
      activeDeck=activeDeck.filter(n=>n!==name);
      renderDeckBuilder();
    };
    activeDeckDiv.appendChild(div);
  });
}

function saveDeck(){
  backToMenu();
}

/* ===================== UPGRADES ===================== */
function renderUpgrades(){
  upgradeGrid.innerHTML="";
  Object.keys(baseCards).forEach(name=>{
    const lvl=cardLevels[name];
    const div=document.createElement("div");
    div.className="bigCard";
    if(lvl>=5)div.classList.add("level-purple");
    else if(lvl>=3)div.classList.add("level-red");
    div.innerHTML=`<div class="emoji">${baseCards[name].emoji}</div>
                   <div class="name">${name}</div>
                   <div class="level">Lvl ${lvl}</div>
                   <button>Upgrade (${lvl*3} 👑)</button>`;
    div.querySelector("button").onclick=()=>{
      if(crowns>=lvl*3){
        crowns-=lvl*3;
        cardLevels[name]++;
        crownDisplay.innerText=`👑 Crowns: ${crowns}`;
        renderUpgrades();
      }
    };
    upgradeGrid.appendChild(div);
  });
}
