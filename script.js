/**********************************************************
 * DASH ROYALE – FULL SCRIPT WITH ARENAS & ANIMATIONS
 **********************************************************/

/* ===================== DOM ===================== */
const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");
const deckBuilderScreen = document.getElementById("deckBuilderScreen");
const upgradeScreen = document.getElementById("upgradeScreen");
const arenaScreen = document.getElementById("arenaScreen");

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

const arenaListDiv = document.getElementById("arenaList");
const menuButtonsDiv = document.querySelector(".menuButtons");

/* ===================== GAME STATE ===================== */
let gameTime = 180;
let timerInterval;
let gameActive = false;

let crowns = 0;
let playerScore = 0;
let enemyScore = 0;

let elixir = 10;
const MAX_ELIXIR = 10;

let draggingCard = null;
let units = [];
let projectiles = [];
let particles = [];
let handIndex = 0;

let currentArena = "Goblin Stadium";
let unlockedArenas = { "Goblin Stadium": true };

/* ===================== CARDS ===================== */
const baseCards = {
  Knight: { emoji:"🗡️", cost:3, hp:700, dmg:80, speed:0.6, arena:"Goblin Stadium" },
  Archer: { emoji:"🏹", cost:3, hp:350, dmg:100, speed:0.7, arena:"Goblin Stadium" },
  Giant:  { emoji:"🗿", cost:5, hp:2000, dmg:120, speed:0.35, arena:"Goblin Stadium" },
  MiniPekka:{ emoji:"🤖", cost:4, hp:900, dmg:200, speed:0.6, arena:"Barbarian Bowl", effect:"slash" },
  Wizard: { emoji:"🧙", cost:5, hp:500, dmg:160, speed:0.55, arena:"Barbarian Bowl", effect:"magic" },
  Skeleton:{ emoji:"💀", cost:1, hp:120, dmg:45, speed:0.9, arena:"Goblin Stadium" },
  Valkyrie:{ emoji:"🪓", cost:4, hp:1200, dmg:130, speed:0.5, arena:"Barbarian Bowl", effect:"spin" },
  Prince: { emoji:"🐎", cost:5, hp:1500, dmg:220, speed:0.7, arena:"Barbarian Bowl", effect:"charge" },
  Fireball:{ emoji:"🔥", cost:4, hp:0, dmg:250, speed:1, arena:"Spell Valley", effect:"fire" }
};

let cardLevels = {};
Object.keys(baseCards).forEach(c => cardLevels[c] = 1);

let activeDeck = Object.keys(baseCards).filter(c=>baseCards[c].arena==="Goblin Stadium");

/* ===================== ARENAS ===================== */
const arenas = [
  { name:"Goblin Stadium", cost:0, img:"images/goblin_small.png", bgColor:"#22c55e", river:false },
  { name:"Barbarian Bowl", cost:100, img:"images/barbarian_small.png", bgColor:"#fde68a", river:false },
  { name:"P.E.K.K.A's Playhouse", cost:300, img:"images/pekka_small.png", bgColor:"#a1a1aa", river:false },
  { name:"Spell Valley", cost:500, img:"images/spell_small.png", bgColor:"#6366f1", river:true }
];

/* ===================== TOWERS ===================== */
const PRINCESS_HP = 2352;
const KING_HP = 3096;

let playerTowers, enemyTowers;

/* ===================== NAVIGATION ===================== */
function startGame(){
  menuScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameActive = true;
  resetGame();
}

function backToMenu(){
  gameScreen.classList.add("hidden");
  deckBuilderScreen.classList.add("hidden");
  upgradeScreen.classList.add("hidden");
  arenaScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
  gameActive = false;
}

/* ===================== ARENA SCREEN ===================== */
function renderArenaScreen(){
  arenaScreen.classList.remove("hidden");
  arenaListDiv.innerHTML = "";
  arenas.forEach(a=>{
    const div = document.createElement("div");
    div.className="arenaCard";
    div.innerHTML = `
      <img src="${a.img}" width="150"><br>
      <b>${a.name}</b><br>
      ${unlockedArenas[a.name] ? "Unlocked" : `Cost: ${a.cost} 👑`}
    `;
    const btn = document.createElement("button");
    btn.innerText = unlockedArenas[a.name] ? "Select" : "Get";
    btn.onclick = ()=>{
      if(unlockedArenas[a.name]){
        currentArena=a.name;
        alert(a.name+" selected!");
      } else if(crowns>=a.cost){
        crowns -= a.cost;
        unlockedArenas[a.name]=true;
        currentArena=a.name;
        crownDisplay.innerText=`👑 Crowns: ${crowns}`;
        alert(a.name+" unlocked and selected!");
        saveProgress();
        renderArenaScreen();
      } else {
        alert("Not enough crowns!");
      }
    };
    div.appendChild(btn);
    arenaListDiv.appendChild(div);
  });
}

/* ===================== TIMER ===================== */
function setGameTime(t){
  gameTime = t;
  updateTimer();
}

function startTimer(){
  clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    if(!gameActive) return;
    gameTime--;
    updateTimer();
    if(gameTime<=0) endGame();
  },1000);
}

function updateTimer(){
  timerEl.innerText =
    Math.floor(gameTime/60)+":"+(gameTime%60).toString().padStart(2,"0");
}

/* ===================== GAME RESET ===================== */
function resetGame(){
  units = [];
  projectiles = [];
  particles = [];
  elixir = MAX_ELIXIR;
  handIndex = 0;
  updateElixir();

  playerTowers = [
    {x:200,y:400,hp:PRINCESS_HP,max:PRINCESS_HP, enemy:false, king:false, emoji:"🏰", cooldown:0},
    {x:700,y:400,hp:PRINCESS_HP,max:PRINCESS_HP, enemy:false, king:false, emoji:"🏰", cooldown:0},
    {x:450,y:470,hp:KING_HP,max:KING_HP, enemy:false, king:true, emoji:"👑", cooldown:0}
  ];

  enemyTowers = [
    {x:200,y:120,hp:PRINCESS_HP,max:PRINCESS_HP, enemy:true, king:false, emoji:"🏰", cooldown:0},
    {x:700,y:120,hp:PRINCESS_HP,max:PRINCESS_HP, enemy:true, king:false, emoji:"🏰", cooldown:0},
    {x:450,y:60,hp:KING_HP,max:KING_HP, enemy:true, king:true, emoji:"👑", cooldown:0}
  ];

  // Update activeDeck for selected arena
  activeDeck = Object.keys(baseCards).filter(c=>unlockedArenas[baseCards[c].arena] || baseCards[c].arena===currentArena);
  drawHand();
  startTimer();
  requestAnimationFrame(gameLoop);
}

/* ===================== ELIXIR ===================== */
setInterval(()=>{
  if(!gameActive) return;
  elixir = Math.min(MAX_ELIXIR, elixir + 0.1);
  updateElixir();
},100);

function updateElixir(){
  elixirFill.style.width = (elixir / MAX_ELIXIR * 100) + "%";
}

/* ===================== HAND ===================== */
function drawHand(){
  cardHand.innerHTML = "";
  for(let i=0;i<4;i++){
    let idx = (handIndex + i)%activeDeck.length;
    const name = activeDeck[idx];
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
    div.onclick = () => {
      placeCard(name, canvas.width/2, canvas.height-80);
      handIndex = (handIndex+1)%activeDeck.length;
      drawHand();
    };

    cardHand.appendChild(div);
  }
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
  handIndex = (handIndex+1)%activeDeck.length;
  drawHand();
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
    enemy:false,
    target:null,
    effect:c.effect
  });
}

/* ===================== ENEMY AI ===================== */
setInterval(()=>{
  if(!gameActive) return;
  const names = Object.keys(baseCards).filter(c=>baseCards[c].arena===currentArena || unlockedArenas[baseCards[c].arena]);
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
    enemy:true,
    target:null,
    effect:c.effect
  });
},3500);

/* ===================== GAME LOOP ===================== */
function gameLoop(){
  if(!gameActive) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawArenaBackground();
  drawTowers(playerTowers);
  drawTowers(enemyTowers);

  units.forEach(u=>{
    updateUnitTarget(u);
    moveUnit(u);
    drawUnit(u);
    attackTarget(u);
    drawCardEffect(u);
  });

  projectiles.forEach(p=>{
    p.x += p.vx;
    p.y += p.vy;
    ctx.fillStyle = p.enemy ? "#ef4444" : "#9333ea";
    ctx.beginPath();
    ctx.arc(p.x,p.y,5,0,Math.PI*2);
    ctx.fill();

    if(Math.abs(p.x-p.target.x)<15 && Math.abs(p.y-p.target.y)<15){
      p.target.hp -= p.dmg;
      p.hit = true;
      spawnParticle(p.x,p.y,p.enemy?"#ef4444":"#9333ea");
    }
  });
  projectiles = projectiles.filter(p=>!p.hit);

  // Update particles
  particles.forEach(p=>{
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.03;
    ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x,p.y,3,0,Math.PI*2);
    ctx.fill();
  });
  particles = particles.filter(p=>p.alpha>0);

  fireTowers(playerTowers);
  fireTowers(enemyTowers);

  units = units.filter(u=>u.hp>0);

  requestAnimationFrame(gameLoop);
}

/* ===================== ANIMATIONS ===================== */
function spawnParticle(x,y,color){
  const rgb = color==="red" ? "239,68,68" : "147,51,234";
  for(let i=0;i<5;i++){
    particles.push({
      x,y,
      vx:(Math.random()-0.5)*2,
      vy:(Math.random()-0.5)*2,
      color:rgb,
      alpha:1
    });
  }
}

function drawCardEffect(u){
  if(!u.effect) return;
  ctx.font="20px Arial";
  switch(u.effect){
    case "fire":
      ctx.fillStyle="orange";
      ctx.fillText("🔥", u.x-10, u.y-20);
      break;
    case "slash":
      ctx.fillStyle="gray";
      ctx.fillText("✂️", u.x-10, u.y-20);
      break;
    case "magic":
      ctx.fillStyle="purple";
      ctx.fillText("✨", u.x-10, u.y-20);
      break;
    case "spin":
      ctx.fillStyle="brown";
      ctx.fillText("🌀", u.x-10, u.y-20);
      break;
    case "charge":
      ctx.fillStyle="red";
      ctx.fillText("⚡", u.x-10, u.y-20);
      break;
  }
}

/* ===================== ARENA BACKGROUND ===================== */
function drawArenaBackground(){
  const arena = arenas.find(a=>a.name===currentArena);
  ctx.fillStyle = arena.bgColor;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  if(arena.river){
    ctx.fillStyle="#2563eb";
    ctx.fillRect(0,canvas.height/2-20,canvas.width,40);
    // Optional: animate waves
  }
}

/* ===================== UNIT LOGIC ===================== */
function updateUnitTarget(u){
  const enemies = units.filter(other=>other.enemy!==u.enemy);
  const allTargets = [...enemies, ...(u.enemy?playerTowers:enemyTowers)];
  if(allTargets.length===0) { u.target=null; return; }
  u.target = allTargets.reduce((a,b)=>{
    const da=Math.hypot(a.x-u.x,a.y-u.y);
    const db=Math.hypot(b.x-u.x,b.y-u.y);
    return da<db?a:b;
  });
}

function moveUnit(u){
  if(!u.target) return;
  const dx = u.target.x - u.x;
  const dy = u.target.y - u.y;
  const dist = Math.hypot(dx,dy);
  if(dist>20){
    u.x += dx/dist*u.speed;
    u.y += dy/dist*u.speed;
  }
}

function attackTarget(u){
  if(!u.target) return;
  const dx = u.target.x - u.x;
  const dy = u.target.y - u.y;
  const dist = Math.hypot(dx,dy);
  if(dist<=20){
    u.target.hp -= u.dmg*0.02;
    if(u.target.hp<=0){
      if(u.target.king) endGame(u.enemy?"enemy":"player");
      u.target=null;
    }
  }
}

/* ===================== DRAWING ===================== */
function drawTowers(arr){
  arr.forEach(t=>{
    ctx.font="28px Arial";
    ctx.fillText(t.emoji,t.x-12,t.y+12);

    ctx.fillStyle = t.enemy ? "#ef4444" : "#9333ea";
    ctx.fillRect(t.x-25, t.y-35, 50*(t.hp/t.max), 6);

    ctx.fillStyle="white";
    ctx.font="12px Arial";
    ctx.fillText(Math.floor(t.hp),t.x-20,t.y-40);
  });
}

function drawUnit(u){
  ctx.font="26px Arial";
  ctx.fillText(u.emoji,u.x-12,u.y+12);
}

/* ===================== TOWER FIRING ===================== */
function fireTowers(arr){
  arr.forEach(t=>{
    if(t.cooldown>0) { t.cooldown--; return; }
    let targets = units.filter(u=>u.enemy!==t.enemy);
    if(targets.length===0) return;
    let nearest = targets.reduce((a,b)=>{
      const da=Math.hypot(a.x-t.x,a.y-t.y);
      const db=Math.hypot(b.x-t.x,b.y-t.y);
      return da<db?a:b;
    });
    projectiles.push({
      x:t.x,
      y:t.y,
      vx:(nearest.x-t.x)*0.05,
      vy:(nearest.y-t.y)*0.05,
      target:nearest,
      dmg:50,
      enemy:t.enemy,
      hit:false
    });
    t.cooldown = 60;
  });
}

/* ===================== END GAME ===================== */
function endGame(winner){
  clearInterval(timerInterval);
  gameActive=false;
  if(winner==="player"){ playerScore+=3; crowns+=3; }
  else if(winner==="enemy"){ enemyScore+=3; }
  scoreEl.innerText=`👑 ${playerScore} - ${enemyScore}`;
  crownDisplay.innerText=`👑 Crowns: ${crowns}`;
  saveProgress();
  backToMenu();
}

/* ===================== DECK BUILDER & UPGRADES ===================== */
function renderDeckBuilder(){
  allCardsDiv.innerHTML = "";
  activeDeckDiv.innerHTML = "";
  Object.keys(baseCards).forEach(name=>{
    const c=baseCards[name];
    if(c.arena!==currentArena && !unlockedArenas[c.arena]) return;
    const lvl=cardLevels[name];
    const div=document.createElement("div");
    div.className="bigCard";
    if(lvl>=5) div.classList.add("level-purple");
    else if(lvl>=3) div.classList.add("level-red");
    div.innerHTML=`<div class="emoji">${c.emoji}</div>
                   <div class="name">${name}</div>
                   <div class="level">Lvl ${lvl}</div>`;
    div.onclick = ()=>{
      if(!activeDeck.includes(name)){
        activeDeck.push(name);
        drawHand();
      } else {
        activeDeck = activeDeck.filter(n=>n!==name);
        drawHand();
      }
      saveProgress();
      renderDeckBuilder();
    };
    (activeDeck.includes(name)?activeDeckDiv:allCardsDiv).appendChild(div);
  });
}

function renderUpgrades(){
  upgradeGrid.innerHTML="";
  Object.keys(baseCards).forEach(name=>{
    const c=baseCards[name];
    const lvl=cardLevels[name];
    const div=document.createElement("div");
    div.className="bigCard";
    if(lvl>=5) div.classList.add("level-purple");
    else if(lvl>=3) div.classList.add("level-red");
    div.innerHTML=`<div class="emoji">${c.emoji}</div>
                   <div class="name">${name}</div>
                   <div class="level">Lvl ${lvl}</div>
                   <button>Upgrade</button>`;
    div.querySelector("button").onclick=()=>{
      cardLevels[name]++;
      saveProgress();
      renderUpgrades();
    };
    upgradeGrid.appendChild(div);
  });
}

/* ===================== LOCAL STORAGE ===================== */
function saveProgress(){
  localStorage.setItem("dash_crowns", crowns);
  localStorage.setItem("dash_levels", JSON.stringify(cardLevels));
  localStorage.setItem("dash_deck", JSON.stringify(activeDeck));
  localStorage.setItem("dash_arenas", JSON.stringify(unlockedArenas));
  localStorage.setItem("dash_arenaSelected", currentArena);
  localStorage.setItem("dash_time", gameTime);
}

function loadProgress(){
  crowns = Number(localStorage.getItem("dash_crowns")) || 0;
  cardLevels = JSON.parse(localStorage.getItem("dash_levels")) || cardLevels;
  activeDeck = JSON.parse(localStorage.getItem("dash_deck")) || Object.keys(baseCards);
  unlockedArenas = JSON.parse(localStorage.getItem("dash_arenas")) || {"Goblin Stadium": true};
  currentArena = localStorage.getItem("dash_arenaSelected") || "Goblin Stadium";
  gameTime = Number(localStorage.getItem("dash_time")) || 180;
  crownDisplay.innerText = `👑 Crowns: ${crowns}`;
}

/* ===================== ADMIN BUTTON ===================== */
const adminBtn = document.createElement("button");
adminBtn.innerText="Admin";
adminBtn.className="bigButton";
adminBtn.onclick = ()=>{
  const pwd = prompt("Enter admin password:");
  if(pwd==="littlebrother6"){
    const c = prompt("Set crowns:");
    if(!isNaN(c)) { crowns=Number(c); crownDisplay.innerText=`👑 Crowns: ${crowns}`; saveProgress(); }
    alert("Admin access granted!");
  } else alert("Wrong password!");
};
menuButtonsDiv.appendChild(adminBtn);

/* ===================== INIT ===================== */
loadProgress();
drawHand();
renderDeckBuilder();
renderUpgrades();
renderArenaScreen();
updateTimer();
