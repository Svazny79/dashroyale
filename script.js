/* ================= CANVAS ================= */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

/* ================= GAME STATE ================= */
let gameState = "menu"; // menu | playing | ended

/* ================= DATA ================= */
let crowns = 0;
let elixir = 10;
let units = [];
let playerTowers = [];
let enemyTowers = [];
let score = { player: 0, enemy: 0 };

/* ================= ARENAS ================= */
const arenas = [
  {
    name: "Goblin Stadium",
    cost: 0,
    bg: "#22c55e",
    river: true,
    unlockCards: []
  },
  {
    name: "Barbarian Bowl",
    cost: 50,
    bg: "#fbbf24",
    river: true,
    unlockCards: ["Barbarian", "Valkyrie", "Elite Barb", "Rage Goblin"]
  },
  {
    name: "P.E.K.K.A's Playhouse",
    cost: 150,
    bg: "#9ca3af",
    river: false,
    unlockCards: ["Mini P.E.K.K.A", "P.E.K.K.A", "Dark Knight", "Iron Golem"]
  },
  {
    name: "Spell Valley",
    cost: 300,
    bg: "#6d28d9",
    river: true,
    unlockCards: ["Wizard", "Fireball", "Lightning", "Ice Spirit"]
  }
];

let unlockedArenas = { "Goblin Stadium": true };
let currentArena = "Goblin Stadium";

/* ================= CARDS ================= */
const baseCards = {
  Knight:{emoji:"🗡️",hp:600,damage:20,speed:1,cost:3},
  Archer:{emoji:"🏹",hp:400,damage:15,speed:1.2,cost:3},
  Giant:{emoji:"🗿",hp:1500,damage:30,speed:0.6,cost:5},
  Goblin:{emoji:"👺",hp:300,damage:12,speed:1.6,cost:2},

  // Arena unlocks
  Barbarian:{emoji:"🪓",hp:800,damage:25,speed:1,cost:4},
  Valkyrie:{emoji:"🌀",hp:1000,damage:35,speed:0.9,cost:4},
  "Elite Barb":{emoji:"⚔️",hp:900,damage:40,speed:1.4,cost:5},
  "Rage Goblin":{emoji:"🔥",hp:500,damage:28,speed:2,cost:3},

  "Mini P.E.K.K.A":{emoji:"🤖",hp:900,damage:55,speed:1,cost:4},
  "P.E.K.K.A":{emoji:"🦾",hp:2000,damage:90,speed:0.5,cost:7},
  "Dark Knight":{emoji:"🖤",hp:1100,damage:45,speed:1,cost:4},
  "Iron Golem":{emoji:"🪨",hp:2500,damage:60,speed:0.4,cost:8},

  Wizard:{emoji:"🧙",hp:600,damage:45,speed:1,cost:5},
  Fireball:{emoji:"🔥",hp:1,damage:100,speed:0,cost:4},
  Lightning:{emoji:"⚡",hp:1,damage:150,speed:0,cost:6},
  "Ice Spirit":{emoji:"❄️",hp:200,damage:20,speed:2,cost:1}
};

let cardLevels = {};
Object.keys(baseCards).forEach(c=>cardLevels[c]=1);

/* ================= DECK ================= */
let activeDeck = ["Knight","Archer","Giant","Goblin"];
let hand = [];

/* ================= LOAD / SAVE ================= */
function saveProgress(){
  localStorage.setItem("dash_crowns", crowns);
  localStorage.setItem("dash_levels", JSON.stringify(cardLevels));
  localStorage.setItem("dash_deck", JSON.stringify(activeDeck));
  localStorage.setItem("dash_arenas", JSON.stringify(unlockedArenas));
  localStorage.setItem("dash_arena", currentArena);
}

function loadProgress(){
  crowns = Number(localStorage.getItem("dash_crowns")) || 0;
  cardLevels = JSON.parse(localStorage.getItem("dash_levels")) || cardLevels;
  activeDeck = JSON.parse(localStorage.getItem("dash_deck")) || activeDeck;
  unlockedArenas = JSON.parse(localStorage.getItem("dash_arenas")) || unlockedArenas;
  currentArena = localStorage.getItem("dash_arena") || "Goblin Stadium";
}

/* ================= GAME START ================= */
function startGame(){
  gameState = "playing";
  units = [];
  elixir = 10;
  setupTowers();
  drawHand();
  menuScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  requestAnimationFrame(gameLoop);
}

/* ================= TOWERS ================= */
function setupTowers(){
  playerTowers = [
    {x:canvas.width/2,y:canvas.height-60,hp:3096,emoji:"👑",king:true},
    {x:canvas.width/4,y:canvas.height-120,hp:2352,emoji:"🏰"},
    {x:canvas.width*3/4,y:canvas.height-120,hp:2352,emoji:"🏰"}
  ];
  enemyTowers = [
    {x:canvas.width/2,y:60,hp:3096,emoji:"👑",king:true},
    {x:canvas.width/4,y:120,hp:2352,emoji:"🏰"},
    {x:canvas.width*3/4,y:120,hp:2352,emoji:"🏰"}
  ];
}

/* ================= LOOP ================= */
function gameLoop(){
  if(gameState!=="playing") return;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawArena();
  updateUnits();
  drawUnits();
  drawTowers();

  requestAnimationFrame(gameLoop);
}

/* ================= ARENA DRAW ================= */
function drawArena(){
  const a=arenas.find(ar=>ar.name===currentArena);
  ctx.fillStyle=a.bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if(a.river){
    ctx.fillStyle="#2563eb";
    ctx.fillRect(0,canvas.height/2-25,canvas.width,50);
    ctx.fillStyle="#92400e";
    ctx.fillRect(canvas.width/3-20,canvas.height/2-25,40,50);
    ctx.fillRect(canvas.width*2/3-20,canvas.height/2-25,40,50);
  }
}

/* ================= UNITS ================= */
function spawnUnit(card,x,y,team){
  units.push({
    ...baseCards[card],
    x,y,team,
    hp:baseCards[card].hp*cardLevels[card]
  });
}

function updateUnits(){
  units.forEach(u=>{
    const enemies = units.filter(e=>e.team!==u.team);
    const towers = u.team==="player"?enemyTowers:playerTowers;
    let target=null,dist=99999;

    enemies.forEach(e=>{
      const d=Math.hypot(e.x-u.x,e.y-u.y);
      if(d<dist){dist=d;target=e;}
    });

    if(!target){
      towers.forEach(t=>{
        const d=Math.hypot(t.x-u.x,t.y-u.y);
        if(d<dist){dist=d;target=t;}
      });
    }

    if(!target) return;

    if(dist>40){
      u.x+=Math.sign(target.x-u.x)*u.speed;
      u.y+=Math.sign(target.y-u.y)*u.speed;
    } else {
      target.hp-=u.damage;
    }
  });

  units=units.filter(u=>u.hp>0);
  checkTowers();
}

/* ================= DRAW ================= */
function drawUnits(){
  units.forEach(u=>{
    ctx.font="28px Arial";
    ctx.fillText(u.emoji,u.x-10,u.y+10);
  });
}

function drawTowers(){
  [...playerTowers,...enemyTowers].forEach(t=>{
    ctx.font="36px Arial";
    ctx.fillText(t.emoji,t.x-18,t.y+12);
    ctx.fillStyle=t.king?"white":"yellow";
    ctx.fillText(Math.max(0,Math.floor(t.hp)),t.x-20,t.y+30);
  });
}

/* ================= END GAME ================= */
function checkTowers(){
  playerTowers=playerTowers.filter(t=>t.hp>0);
  enemyTowers=enemyTowers.filter(t=>t.hp>0);

  if(!enemyTowers.some(t=>t.king)){
    crowns+=20;
    alert("YOU WIN 👑");
    saveProgress();
    backToMenu();
  }
  if(!playerTowers.some(t=>t.king)){
    alert("YOU LOSE");
    backToMenu();
  }
}

/* ================= HAND ================= */
function drawHand(){
  cardHand.innerHTML="";
  hand = activeDeck.slice(0,4);
  hand.forEach(c=>{
    const d=document.createElement("div");
    d.className="card";
    d.innerHTML=`<div>${baseCards[c].emoji}</div><div>${c}</div><div>${baseCards[c].cost}💧</div>`;
    d.onclick=()=>{
      if(elixir>=baseCards[c].cost){
        elixir-=baseCards[c].cost;
        spawnUnit(c,canvas.width/2,canvas.height-80,"player");
      }
    };
    cardHand.appendChild(d);
  });
}

/* ================= ARENA MENU ================= */
function renderArenaScreen(){
  arenaList.innerHTML="";
  arenas.forEach(a=>{
    const d=document.createElement("div");
    d.className="arenaCard";
    d.innerHTML=`<canvas width="120" height="60"></canvas>
                 <div>${a.name}</div>
                 <div>${unlockedArenas[a.name]?"Unlocked":"Get ("+a.cost+"👑)"}</div>`;
    d.onclick=()=>{
      if(unlockedArenas[a.name]){
        currentArena=a.name;
      } else if(crowns>=a.cost){
        crowns=0;
        unlockedArenas[a.name]=true;
        a.unlockCards.forEach(c=>activeDeck.push(c));
      }
      saveProgress();
      renderArenaScreen();
    };
    arenaList.appendChild(d);
  });
}

/* ================= MENU ================= */
function backToMenu(){
  gameState="menu";
  gameScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
}

/* ================= INIT ================= */
loadProgress();
renderArenaScreen();
drawHand();
