// ===== CANVAS =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ===== GAME STATE =====
let timeLeft = 180;
let elixir = 10;
const maxElixir = 10;
let selectedCard = null;

// ===== CARDS =====
const cards = {
  knight:{hp:260,dmg:22,speed:1,cost:3,color:"#64748b"},
  archer:{hp:150,dmg:15,speed:1.2,cost:2,color:"#22c55e"},
  giant:{hp:500,dmg:30,speed:0.6,cost:5,color:"#a16207"},
  wizard:{hp:200,dmg:28,speed:0.9,cost:4,color:"#9333ea"},
  goblin:{hp:100,dmg:12,speed:1.6,cost:2,color:"#16a34a"},
  pekka:{hp:380,dmg:45,speed:0.7,cost:4}
};

let deck = Object.keys(cards);
let hand = deck.slice(0,4);

// ===== ENTITIES =====
let troops = [];
let towers = [];

// ===== TOWERS =====
function createTower(x,y,team){
  return {x,y,team,hp:600,maxHp:600,cool:0};
}

towers.push(
  createTower(80,140,"player"),
  createTower(80,310,"player"),
  createTower(820,140,"enemy"),
  createTower(820,310,"enemy")
);

// ===== UI =====
const cardsDiv = document.getElementById("cards");

function updateCards(){
  cardsDiv.innerHTML="";
  hand.forEach(c=>{
    const b=document.createElement("button");
    b.innerText=c.toUpperCase()+"\n"+cards[c].cost;
    b.disabled = elixir < cards[c].cost;
    b.onclick=()=>selectedCard=c;
    cardsDiv.appendChild(b);
  });
}
updateCards();

// ===== INPUT =====
canvas.onclick = e => {
  if(!selectedCard) return;
  if(elixir < cards[selectedCard].cost) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  elixir -= cards[selectedCard].cost;

  troops.push({
    x,y,
    team:"player",
    ...cards[selectedCard],
    maxHp:cards[selectedCard].hp,
    cooldown:0
  });

  selectedCard = null;
  updateCards();
};

// ===== DRAW MAP =====
function drawRiver(){
  ctx.fillStyle="#0284c7";
  ctx.fillRect(0,215,900,20);

  ctx.fillStyle="#94a3b8";
  ctx.fillRect(410,205,80,40);
  ctx.fillRect(410,245,80,40);
}

// ===== DRAW =====
function drawTower(t){
  ctx.fillStyle = t.team==="player" ? "#a855f7" : "#ef4444";
  ctx.fillRect(t.x-18,t.y-18,36,36);

  ctx.fillStyle="#000";
  ctx.fillRect(t.x-18,t.y-25,36,5);
  ctx.fillStyle="#22c55e";
  ctx.fillRect(t.x-18,t.y-25,(t.hp/t.maxHp)*36,5);
}

function drawTroop(t){
  ctx.fillStyle=t.color;
  ctx.beginPath();
  ctx.arc(t.x,t.y,10,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#22c55e";
  ctx.fillRect(t.x-12,t.y-18,(t.hp/t.maxHp)*24,4);
}

// ===== UPDATE =====
function updateTroop(t){
  const enemies=[...troops.filter(o=>o.team!==t.team),...towers.filter(o=>o.team!==t.team)];
  if(!enemies.length) return;

  const target=enemies.sort((a,b)=>
    Math.hypot(t.x-a.x,t.y-a.y)-Math.hypot(t.x-b.x,t.y-b.y)
  )[0];

  const dist=Math.hypot(t.x-target.x,t.y-target.y);

  if(dist<20){
    if(t.cooldown<=0){
      target.hp-=t.dmg;
      t.cooldown=30;
    }
  } else {
    const a=Math.atan2(target.y-t.y,target.x-t.x);
    t.x+=Math.cos(a)*t.speed;
    t.y+=Math.sin(a)*t.speed;
  }

  t.cooldown--;
}

// ===== LOOP =====
function gameLoop(){
  ctx.clearRect(0,0,900,450);

  ctx.fillStyle="#166534";
  ctx.fillRect(0,0,900,450);

  drawRiver();
  towers.forEach(drawTower);
  troops.forEach(drawTroop);
  troops.forEach(updateTroop);

  troops = troops.filter(t=>t.hp>0);
  towers = towers.filter(t=>t.hp>0);

  document.getElementById("elixir-fill").style.width =
    (elixir/maxElixir*100)+"%";

  requestAnimationFrame(gameLoop);
}
gameLoop();

// ===== TIMERS =====
setInterval(()=>{
  if(elixir<maxElixir){
    elixir++;
    updateCards();
  }
},1000);

setInterval(()=>{
  if(timeLeft<=0) return;
  timeLeft--;
  document.getElementById("timer").innerText =
    "Time: "+Math.floor(timeLeft/60)+":"+String(timeLeft%60).padStart(2,"0");
},1000);
