const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ===== GAME STATE ===== */
let timeLeft = 180;
let overtime = false;
let elixir = 10;
const maxElixir = 10;

let playerCrowns = 0;
let enemyCrowns = 0;

/* ===== LANES ===== */
const lanes = [
  { x: 260 },
  { x: 640 }
];

/* ===== CARDS ===== */
const cards = {
  knight:{emoji:"🗡️",hp:300,dmg:25,speed:1,cost:3},
  archer:{emoji:"🏹",hp:170,dmg:18,speed:1.2,cost:2},
  giant:{emoji:"🗿",hp:650,dmg:35,speed:0.6,cost:5},
  wizard:{emoji:"🪄",hp:260,dmg:32,speed:0.9,cost:4},
  goblin:{emoji:"👺",hp:120,dmg:14,speed:1.6,cost:2},
  pekka:{emoji:"🤖",hp:520,dmg:55,speed:0.7,cost:4},
  skeleton:{emoji:"💀",hp:70,dmg:10,speed:1.8,cost:1},
  fireball:{emoji:"🔥",spell:true,dmg:140,cost:4},
  arrows:{emoji:"🏹",spell:true,dmg:90,cost:3}
};

/* ===== DECK ===== */
let deck = Object.keys(cards).sort(()=>Math.random()-0.5);
let hand = deck.splice(0,4);

/* ===== ENTITIES ===== */
let troops = [];
let projectiles = [];
let towers = [];

/* ===== TOWERS (BIGGER) ===== */
function createTower(x,y,team,king=false){
  return {
    x,y,team,king,
    size: king?46:38,
    hp: king?1600:900,
    maxHp: king?1600:900,
    cooldown:0,
    emoji: king?"👑":"🏰"
  };
}

towers.push(
  createTower(260,430,"player"),
  createTower(640,430,"player"),
  createTower(450,480,"player",true),

  createTower(260,70,"enemy"),
  createTower(640,70,"enemy"),
  createTower(450,20,"enemy",true)
);

/* ===== UI ===== */
const cardsDiv = document.getElementById("cards");
const scoreDiv = document.getElementById("score");

function drawHand(){
  cardsDiv.innerHTML="";
  hand.forEach(c=>{
    const d=document.createElement("div");
    d.className="card";
    if(elixir>=cards[c].cost) d.classList.add("ready");
    d.draggable=true;
    d.dataset.card=c;
    d.innerHTML=`${cards[c].emoji}<br>${cards[c].cost}`;
    cardsDiv.appendChild(d);
  });
}
drawHand();

/* ===== DRAG ===== */
let dragged=null;
cardsDiv.addEventListener("dragstart",e=>{
  dragged=e.target.dataset.card;
});
canvas.addEventListener("dragover",e=>e.preventDefault());
canvas.addEventListener("drop",e=>{
  e.preventDefault();
  if(!dragged) return;

  const rect=canvas.getBoundingClientRect();
  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;
  if(y<260) return;

  const card=cards[dragged];
  if(elixir<card.cost) return;
  elixir-=card.cost;

  if(card.spell){
    castSpell(dragged,x,y);
  }else{
    const lane = x<450?0:1;
    troops.push({
      x:lanes[lane].x,
      y:y,
      lane,
      team:"player",
      emoji:card.emoji,
      hp:card.hp,
      maxHp:card.hp,
      dmg:card.dmg,
      speed:card.speed,
      cooldown:0,
      walk:0
    });
  }

  deck.push(dragged);
  hand.shift();
  hand.push(deck.shift());
  drawHand();
  dragged=null;
});

/* ===== SPELLS ===== */
function castSpell(type,x,y){
  troops.forEach(t=>{
    if(Math.hypot(t.x-x,t.y-y)<60 && t.team==="enemy"){
      t.hp-=cards[type].dmg;
    }
  });
  towers.forEach(t=>{
    if(Math.hypot(t.x-x,t.y-y)<70 && t.team==="enemy"){
      t.hp-=cards[type].dmg;
    }
  });
}

/* ===== ENEMY AI ===== */
setInterval(()=>{
  const pool=Object.keys(cards).filter(c=>!cards[c].spell);
  const c=pool[Math.floor(Math.random()*pool.length)];
  const lane=Math.random()<0.5?0:1;

  troops.push({
    x:lanes[lane].x,
    y:120,
    lane,
    team:"enemy",
    emoji:cards[c].emoji,
    hp:cards[c].hp,
    maxHp:cards[c].hp,
    dmg:cards[c].dmg,
    speed:cards[c].speed,
    cooldown:0,
    walk:0
  });
},3500);

/* ===== MAP ===== */
function drawMap(){
  ctx.fillStyle="#14532d";
  ctx.fillRect(0,0,900,520);

  ctx.fillStyle="#0284c7";
  ctx.fillRect(0,240,900,40);

  ctx.fillStyle="#8b4513";
  lanes.forEach(l=>{
    ctx.fillRect(l.x-25,240,50,40);
  });
}

/* ===== DRAW ENTITY ===== */
function drawEntity(e){
  ctx.font=`${e.size||26}px serif`;
  ctx.textAlign="center";
  ctx.fillText(e.emoji,e.x,e.y+10);

  ctx.fillStyle=e.team==="player"?"#a855f7":"#ef4444";
  ctx.fillRect(e.x-20,e.y-(e.size||26),(e.hp/e.maxHp)*40,5);
}

/* ===== PROJECTILES ===== */
function shoot(from,to){
  projectiles.push({
    x:from.x,y:from.y,
    tx:to.x,ty:to.y,
    team:from.team,
    dmg:45
  });
}

/* ===== UPDATE ===== */
function updateTroop(t){
  t.walk+=0.1;
  const enemies=[
    ...troops.filter(o=>o.team!==t.team && o.lane===t.lane),
    ...towers.filter(o=>o.team!==t.team)
  ];
  if(!enemies.length){
    t.y+=t.team==="player"?-t.speed:t.speed;
    return;
  }
  const target=enemies[0];
  const d=Math.hypot(t.x-target.x,t.y-target.y);
  if(d<34){
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

/* ===== TOWER ATTACK ===== */
function updateTower(t){
  if(t.cooldown>0){t.cooldown--;return;}
  const targets=troops.filter(o=>o.team!==t.team);
  if(!targets.length) return;
  const target=targets[0];
  shoot(t,target);
  t.cooldown=45;
}

/* ===== LOOP ===== */
function loop(){
  ctx.clearRect(0,0,900,520);
  drawMap();

  towers.forEach(updateTower);
  troops.forEach(updateTroop);

  projectiles.forEach(p=>{
    const a=Math.atan2(p.ty-p.y,p.tx-p.x);
    p.x+=Math.cos(a)*6;
    p.y+=Math.sin(a)*6;
    ctx.fillStyle="#fff";
    ctx.beginPath();
    ctx.arc(p.x,p.y,3,0,Math.PI*2);
    ctx.fill();
  });

  troops.forEach(drawEntity);
  towers.forEach(drawEntity);

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
  drawHand();
},1000);

setInterval(()=>{
  if(timeLeft>0) timeLeft--;
  else overtime=true;
  document.getElementById("timer").innerText=
    overtime?"OVERTIME":
    `${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,"0")}`;
},1000);
