const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ===== STATE ===== */
let timeLeft = 180;
let overtime = false;
let elixir = 10;
const maxElixir = 10;

let playerCrowns = 0;
let enemyCrowns = 0;

/* ===== LANES / BRIDGES ===== */
const lanes = {
  top: { x: 240, y: 250 },
  bottom: { x: 640, y: 250 }
};

/* ===== CARDS ===== */
const cards = {
  knight:{emoji:"🗡️",hp:260,dmg:22,speed:1,cost:3},
  archer:{emoji:"🏹",hp:150,dmg:15,speed:1.2,cost:2},
  giant:{emoji:"🗿",hp:520,dmg:30,speed:0.6,cost:5},
  wizard:{emoji:"🪄",hp:220,dmg:28,speed:0.9,cost:4},
  goblin:{emoji:"👺",hp:100,dmg:12,speed:1.6,cost:2},
  pekka:{emoji:"🤖",hp:420,dmg:45,speed:0.7,cost:4},
  skeleton:{emoji:"💀",hp:60,dmg:10,speed:1.8,cost:1}
};

/* ===== DECK ===== */
let deck = Object.keys(cards).sort(() => Math.random() - 0.5);
let hand = deck.splice(0,4);

/* ===== ENTITIES ===== */
let troops = [];
let towers = [];

/* ===== TOWERS ===== */
function tower(x,y,team,king=false){
  return {x,y,team,king,hp:king?1200:600,maxHp:king?1200:600,emoji:king?"👑":"🏰"};
}

towers.push(
  tower(240,420,"player"),
  tower(640,420,"player"),
  tower(440,470,"player",true),
  tower(240,80,"enemy"),
  tower(640,80,"enemy"),
  tower(440,30,"enemy",true)
);

/* ===== UI ===== */
const cardsDiv = document.getElementById("cards");
const scoreDiv = document.getElementById("score");

function drawHand(){
  cardsDiv.innerHTML="";
  hand.forEach(c=>{
    const d=document.createElement("div");
    d.className="card";
    d.draggable=true;
    d.dataset.card=c;
    d.innerHTML=`${cards[c].emoji}<br>${cards[c].cost}`;
    cardsDiv.appendChild(d);
  });
}
drawHand();

/* ===== DRAG & DROP ===== */
let draggedCard = null;

cardsDiv.addEventListener("dragstart", e=>{
  if(!e.target.dataset.card) return;
  draggedCard = e.target.dataset.card;
});

canvas.addEventListener("dragover", e=>e.preventDefault());

canvas.addEventListener("drop", e=>{
  e.preventDefault();
  if(!draggedCard) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Player side only
  if(y < 260) return;

  // Determine lane
  const lane = x < 440 ? "top" : "bottom";

  if(elixir < cards[draggedCard].cost) return;

  elixir -= cards[draggedCard].cost;

  troops.push({
    x: lanes[lane].x,
    y: lanes[lane].y + 140,
    lane,
    team:"player",
    emoji:cards[draggedCard].emoji,
    hp:cards[draggedCard].hp,
    maxHp:cards[draggedCard].hp,
    dmg:cards[draggedCard].dmg,
    speed:cards[draggedCard].speed,
    cooldown:0
  });

  deck.push(draggedCard);
  hand.shift();
  hand.push(deck.shift());
  drawHand();
  draggedCard=null;
});

/* ===== ENEMY AI ===== */
setInterval(()=>{
  const choices=Object.keys(cards);
  const c=choices[Math.floor(Math.random()*choices.length)];
  const lane=Math.random()<0.5?"top":"bottom";
  troops.push({
    x:lanes[lane].x,
    y:lanes[lane].y-140,
    lane,
    team:"enemy",
    emoji:cards[c].emoji,
    hp:cards[c].hp,
    maxHp:cards[c].hp,
    dmg:cards[c].dmg,
    speed:cards[c].speed,
    cooldown:0
  });
},3500);

/* ===== DRAW MAP ===== */
function drawMap(){
  ctx.fillStyle="#14532d";
  ctx.fillRect(0,0,900,500);

  // River
  ctx.fillStyle="#0284c7";
  ctx.fillRect(0,230,900,40);

  // Bridges (vertical)
  ctx.fillStyle="#8b4513";
  ctx.fillRect(lanes.top.x-20,230,40,40);
  ctx.fillRect(lanes.bottom.x-20,230,40,40);
}

/* ===== DRAW ENTITY ===== */
function draw(e){
  ctx.font="24px serif";
  ctx.textAlign="center";
  ctx.fillText(e.emoji,e.x,e.y+8);
  ctx.fillStyle=e.team==="player"?"#a855f7":"#ef4444";
  ctx.fillRect(e.x-15,e.y-22,(e.hp/e.maxHp)*30,4);
}

/* ===== UPDATE TROOP ===== */
function update(t){
  const enemies=[
    ...troops.filter(o=>o.team!==t.team && o.lane===t.lane),
    ...towers.filter(o=>o.team!==t.team)
  ];

  if(!enemies.length){
    const bridgeX=lanes[t.lane].x;
    if(Math.abs(t.x-bridgeX)>1){
      t.x+=t.x<bridgeX?t.speed:-t.speed;
    }else{
      t.y+=t.team==="player"?-t.speed:t.speed;
    }
    return;
  }

  const target=enemies[0];
  const d=Math.hypot(t.x-target.x,t.y-target.y);

  if(d<26){
    if(t.cooldown<=0){
      target.hp-=t.dmg;
      t.cooldown=30;
    }
  }else{
    const a=Math.atan2(target.y-t.y,target.x-t.x);
    t.x+=Math.cos(a)*t.speed;
    t.y+=Math.sin(a)*t.speed;
  }

  t.cooldown--;
}

/* ===== LOOP ===== */
function loop(){
  ctx.clearRect(0,0,900,500);
  drawMap();

  towers.forEach(draw);
  troops.forEach(draw);
  troops.forEach(update);

  troops=troops.filter(t=>t.hp>0);
  towers=towers.filter(t=>{
    if(t.hp<=0 && !t.king){
      t.team==="enemy"?playerCrowns++:enemyCrowns++;
      scoreDiv.innerText=`👑 ${playerCrowns} - ${enemyCrowns}`;
      return false;
    }
    return true;
  });

  document.getElementById("elixir-fill").style.width=
    (elixir/maxElixir*100)+"%";

  requestAnimationFrame(loop);
}
loop();

/* ===== TIMERS ===== */
setInterval(()=>{
  if(elixir<maxElixir) elixir+=overtime?2:1;
},1000);

setInterval(()=>{
  if(timeLeft>0) timeLeft--;
  else overtime=true;
  document.getElementById("timer").innerText=
    overtime?"OVERTIME":
    `Time ${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,"0")}`;
},1000);
