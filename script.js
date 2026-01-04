/**********************
  GLOBAL ELEMENTS
**********************/
const menu = document.getElementById("menu");
const gameScreen = document.getElementById("gameScreen");
const deckScreen = document.getElementById("deckScreen");
const upgradeScreen = document.getElementById("upgradeScreen");
const upgradeContainer = document.getElementById("upgradeContainer");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const cardsDiv = document.getElementById("cards");
const timerDiv = document.getElementById("timer");
const scoreDiv = document.getElementById("score");
const elixirFill = document.getElementById("elixir-fill");

/**********************
  MENU BUTTONS
**********************/
function showMenu(){
  menu.classList.remove("hidden");
  gameScreen.classList.add("hidden");
  deckScreen.classList.add("hidden");
  upgradeScreen.classList.add("hidden");
  document.getElementById("set-time-menu").classList.remove("hidden");
  updateCrownsUI();
}
function showDeckBuilder(){deckScreen.classList.remove("hidden");menu.classList.add("hidden"); renderDeckBuilder();}
function showUpgradeScreen(){upgradeScreen.classList.remove("hidden");menu.classList.add("hidden"); drawUpgradeScreen();}
function startGame(){menu.classList.add("hidden");gameScreen.classList.remove("hidden");document.getElementById("set-time-menu").classList.add("hidden");resetGame();}

/**********************
  CROWNS
**********************/
let crowns = Number(localStorage.getItem("crowns")) || 0;
function updateCrownsUI(){document.getElementById("crownCount").innerText = `Crowns: ${crowns} 👑`;}
function addCrowns(n){crowns+=n;localStorage.setItem("crowns",crowns);updateCrownsUI();}

/**********************
  TIME
**********************/
let timeLeft = 180;
function setTime(t){timeLeft=t;updateTimerUI();}
function updateTimerUI(){timerDiv.innerText=`${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,"0")}`}

/**********************
  CARDS AND LEVELS
**********************/
let cardLevels = JSON.parse(localStorage.getItem("cardLevels"))||{};
const baseCards = {
  knight:{emoji:"🗡️",hp:300,dmg:25,speed:1,cost:3},
  archer:{emoji:"🏹",hp:170,dmg:18,speed:1.2,cost:2},
  giant:{emoji:"🗿",hp:650,dmg:35,speed:0.6,cost:5},
  wizard:{emoji:"🪄",hp:260,dmg:32,speed:0.9,cost:4},
  goblin:{emoji:"👺",hp:120,dmg:14,speed:1.6,cost:2},
  skeleton:{emoji:"💀",hp:70,dmg:10,speed:1.8,cost:1},
  fireball:{emoji:"🔥",spell:true,dmg:140,cost:4},
  arrows:{emoji:"🏹",spell:true,dmg:90,cost:3},
  prince:{emoji:"🐎",hp:320,dmg:30,speed:1.4,cost:4},
  miniPekka:{emoji:"🤖",hp:280,dmg:45,speed:1.0,cost:4},
  healer:{emoji:"💉",hp:200,dmg:0,speed:0.8,cost:3},
  balloon:{emoji:"🎈",hp:150,dmg:60,speed:0.7,cost:5},
  musketeer:{emoji:"👩‍🚀",hp:200,dmg:25,speed:1.0,cost:3},
  skeletonArmy:{emoji:"💀💀",hp:100,dmg:15,speed:1.5,cost:3},
  barbarian:{emoji:"🪓",hp:180,dmg:20,speed:1.3,cost:2},
  cannon:{emoji:"💣",hp:250,dmg:35,speed:0.5,cost:4},
  fireSpirit:{emoji:"🔥",hp:80,dmg:40,speed:2.0,cost:2}
};

// Initialize cardLevels
Object.keys(baseCards).forEach(c=>{
  if(!cardLevels[c] && !baseCards[c].spell) cardLevels[c]=1;
});

/**********************
  DECK
**********************/
let deck = [];
let activeDeck = [];
// Ensure deck always has 8 cards at start
if(deck.length===0){
  deck = Object.keys(baseCards).filter(c=>!baseCards[c].spell).slice(0,8);
}

/**********************
  UPGRADE SCREEN
**********************/
function drawUpgradeScreen(){
  upgradeContainer.innerHTML = "";
  upgradeScreen.style.backgroundColor = "#0284c7"; // blue
  Object.keys(baseCards).forEach(name => {
    if(baseCards[name].spell) return;
    const div = document.createElement("div");
    div.className = "upgradeCard";
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    div.innerHTML = `${baseCards[name].emoji} ${displayName} Lvl ${cardLevels[name]}`;
    const cost = cardLevels[name]*3;
    const btn = document.createElement("button");
    btn.innerText = `Upgrade (${cost} 👑)`;
    btn.onclick = () => upgradeCard(name);
    div.appendChild(btn);
    upgradeContainer.appendChild(div);
  });
}

function upgradeCard(name){
  const cost = cardLevels[name]*3;
  if(crowns < cost){alert("Not enough crowns!"); return;}
  crowns -= cost; cardLevels[name]++;
  localStorage.setItem("crowns",crowns);
  localStorage.setItem("cardLevels",JSON.stringify(cardLevels));
  addCrowns(0); drawUpgradeScreen();
}

/**********************
  DECK BUILDER
**********************/
function renderDeckBuilder(){
  const allDiv = document.getElementById("allCards");
  const deckDiv = document.getElementById("activeDeck");
  allDiv.innerHTML = ""; deckDiv.innerHTML = "";
  Object.keys(baseCards).forEach(name=>{
    if(baseCards[name].spell) return;
    const c=baseCards[name];
    const cardDiv = document.createElement("div");
    cardDiv.innerText = c.emoji+"\n"+name.charAt(0).toUpperCase()+name.slice(1)+"\n("+c.cost+")";
    cardDiv.style.cursor="pointer";
    cardDiv.onclick=()=>{
      if(activeDeck.length<8 && !activeDeck.includes(name)){activeDeck.push(name); renderDeckBuilder();}
    }
    allDiv.appendChild(cardDiv);
  });
  activeDeck.forEach(name=>{
    const c=baseCards[name];
    const div = document.createElement("div");
    div.innerText = c.emoji+"\n"+name.charAt(0).toUpperCase()+name.slice(1);
    div.style.cursor="pointer";
    div.onclick=()=>{
      activeDeck = activeDeck.filter(n=>n!==name); renderDeckBuilder();
    }
    deckDiv.appendChild(div);
  });
}

function saveDeck(){
  if(activeDeck.length!==8){alert("Deck must have 8 cards!"); return;}
  deck = [...activeDeck]; alert("Deck saved!");
}

/**********************
  GAME STATE
**********************/
let elixir = 10,maxElixir=10,gameOver=false,paused=false,playerScore=0,enemyScore=0;
const lanes=[{x:260},{x:640}];
let hand=[], troops=[], towers=[], projectiles=[], deathAnimations=[];

/**********************
  TOWERS
**********************/
function createTower(x,y,team,king=false){return {x,y,team,king,size:king?56:48,hp:king?1800:1000,maxHp:king?1800:1000,emoji:king?"👑":"🏰",cooldown:0};}
function resetTowers(){towers=[createTower(260,430,"player"),createTower(640,430,"player"),createTower(450,490,"player",true),createTower(260,70,"enemy"),createTower(640,70,"enemy"),createTower(450,20,"enemy",true)];}

/**********************
  RESET GAME
**********************/
function resetGame(){
  if(deck.length===0){
    deck = Object.keys(baseCards).filter(c=>!baseCards[c].spell).slice(0,8);
  }
  elixir=10;gameOver=false;paused=false;playerScore=0;enemyScore=0;troops=[];projectiles=[];deathAnimations=[];
  resetTowers();
  hand = deck.length>=4 ? deck.slice(0,4) : Object.keys(baseCards).filter(c=>!baseCards[c].spell).slice(0,4);
  drawHand();
  updateTimerUI();
  scoreDiv.innerText=`👑 0 - 0`;
}

/**********************
  HAND UI
**********************/
function drawHand(){
  cardsDiv.innerHTML="";
  hand.forEach(cardName=>{
    const c=baseCards[cardName];
    const div=document.createElement("div");
    div.className="card";
    if(elixir>=c.cost) div.classList.add("ready");
    div.draggable=true;
    div.dataset.card=cardName;
    div.innerHTML=`${c.emoji}<br>${c.cost}`;
    cardsDiv.appendChild(div);
  });
}

/**********************
  DRAG & DROP
**********************/
let draggedCard=null;
cardsDiv.addEventListener("dragstart",e=>{draggedCard=e.target.dataset.card;});
canvas.addEventListener("dragover",e=>e.preventDefault());
canvas.addEventListener("drop",e=>{
  if(gameOver||paused) return;e.preventDefault();if(!draggedCard) return;
  const card=baseCards[draggedCard];if(elixir<card.cost) return;
  const rect=canvas.getBoundingClientRect();
  const x=e.clientX-rect.left;const y=e.clientY-rect.top;if(y<260) return;
  elixir-=card.cost;
  if(card.spell){castSpell(draggedCard,x,y);}
  else{
    const lane=x<450?0:1;const lvl=cardLevels[draggedCard]||1;
    troops.push({x:lanes[lane].x,y,lane,team:"player",emoji:card.emoji,hp:Math.floor(card.hp*(1+0.1*(lvl-1))), maxHp:Math.floor(card.hp*(1+0.1*(lvl-1))), dmg:Math.floor(card.dmg*(1+0.1*(lvl-1))), speed:card.speed, cooldown:0});
  }
  deck.push(draggedCard); hand.shift(); hand.push(deck.shift()); drawHand(); draggedCard=null;
});

/**********************
  SPELLS
**********************/
function castSpell(type,x,y){
  troops.forEach(t=>{if(t.team==="enemy"&&Math.hypot(t.x-x,t.y-y)<70) t.hp-=baseCards[type].dmg;});
  towers.forEach(t=>{if(t.team==="enemy"&&Math.hypot(t.x-x,t.y-y)<80) t.hp-=baseCards[type].dmg;});
}

/**********************
  ENEMY AI
**********************/
setInterval(()=>{
  if(gameOver||paused) return;
  const pool=Object.keys(baseCards).filter(c=>!baseCards[c].spell);
  const name=pool[Math.floor(Math.random()*pool.length)];
  const lane=Math.random()<0.5?0:1;const lvl=cardLevels[name]||1;
  troops.push({x:lanes[lane].x,y:120,lane,team:"enemy",emoji:baseCards[name].emoji,hp:Math.floor(baseCards[name].hp*(1+0.1*(lvl-1))), maxHp:Math.floor(baseCards[name].hp*(1+0.1*(lvl-1))), dmg:Math.floor(baseCards[name].dmg*(1+0.1*(lvl-1))), speed:baseCards[name].speed,cooldown:0});
},3500);

/**********************
  MAP + DRAW
**********************/
function drawMap(){
  ctx.fillStyle="#14532d";ctx.fillRect(0,0,900,520); // battlefield
  ctx.fillStyle="#0284c7";ctx.fillRect(0,240,900,40); // river
  ctx.fillStyle="#8b4513";lanes.forEach(l=>{ctx.fillRect(l.x-25,240,50,40);}); // bridges
}
function drawEntity(e){ctx.font=`${e.size||30}px serif`;ctx.textAlign="center";ctx.fillText(e.emoji,e.x,e.y+10);ctx.fillStyle=e.team==="player"?"#a855f7":"#ef4444";ctx.fillRect(e.x-25,e.y-(e.size||30),(e.hp/e.maxHp)*50,6);}

/**********************
  UPDATE LOGIC + DEATH ANIMATIONS
**********************/
function updateTroop(t){const enemies=[...troops.filter(o=>o.team!==t.team&&o.lane===t.lane),...towers.filter(o=>o.team!==t.team)];if(!enemies.length){t.y+=t.team==="player"?-t.speed:t.speed;return;}const target=enemies[0];const dist=Math.hypot(t.x-target.x,t.y-target.y);if(dist<36 && t.cooldown<=0){target.hp-=t.dmg;t.cooldown=30;}else{const a=Math.atan2(target.y-t.y,target.x-t.x);t.x+=Math.cos(a)*t.speed;t.y+=Math.sin(a)*t.speed;} t.cooldown--}

/**********************
  LOOP
**********************/
function loop(){
  ctx.clearRect(0,0,900,520);
  drawMap();
  if(!paused&&!gameOver){troops.forEach(updateTroop);}

  // REMOVE DEAD TROOPS + TRIGGER DEATH ANIMATION
  troops = troops.filter(t => {
    if (t.hp <= 0) { deathAnimations.push({x:t.x, y:t.y, emoji:t.emoji, size:30, alpha:1}); return false; }
    return true;
  });

  // REMOVE DEAD TOWERS + DEATH ANIMATION
  towers = towers.filter(t => {
    if (t.hp <= 0){
      deathAnimations.push({x:t.x, y:t.y, emoji:t.emoji, size:t.size||30, alpha:1});
      if(t.king){
        gameOver = true;
        if(t.team==="enemy"){playerScore=3; addCrowns(5);} 
        else{enemyScore=3; addCrowns(1);}
        setTimeout(showMenu,2000);
      } else { t.team==="enemy"?playerScore++:enemyScore++; }
      scoreDiv.innerText = `👑 ${playerScore} - ${enemyScore}`;
      return false;
    }
    return true;
  });

  // DRAW TROOPS + TOWERS
  troops.forEach(drawEntity);
  towers.forEach(drawEntity);

  // DRAW DEATH ANIMATIONS
  deathAnimations.forEach((a,i)=>{
    ctx.save();
    ctx.globalAlpha = a.alpha;
    ctx.font = `${a.size}px serif`;
    ctx.textAlign = "center";
    ctx.fillText(a.emoji, a.x, a.y+10);
    ctx.restore();
    a.alpha -= 0.05; a.size -= 0.5;
    if(a.alpha <= 0) deathAnimations.splice(i,1);
  });

  elixirFill.style.width=`${(elixir/maxElixir)*100}%`;
  requestAnimationFrame(loop);
}
loop();

/**********************
  TIMERS + ELIXIR
**********************/
setInterval(()=>{if(!paused&&!gameOver&&elixir<maxElixir){elixir++;drawHand();}},1000);
setInterval(()=>{if(!paused&&!gameOver&&timeLeft>0){timeLeft--;updateTimerUI();}},1000);

/**********************
  PAUSE / RESTART
**********************/
function pauseGame(){paused=!paused;}
function restartGame(){resetGame();gameOver=false;paused=false;}

/**********************
  START
**********************/
updateCrownsUI();showMenu();
