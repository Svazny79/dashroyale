const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let timeLeft = 180;
let elixir = 10;
const maxElixir = 10;

let playerScore = 0;
let enemyScore = 0;

let selectedCard = null;
let draggingCard = null;

const cards = {
  knight:{hp:260,dmg:22,speed:1,cost:3,color:"#64748b"},
  archer:{hp:150,dmg:15,speed:1.2,cost:2,color:"#22c55e"},
  giant:{hp:500,dmg:30,speed:0.6,cost:5,color:"#a16207"},
  wizard:{hp:200,dmg:28,speed:0.9,cost:4,color:"#9333ea"},
  goblin:{hp:100,dmg:12,speed:1.6,cost:2,color:"#16a34a"},
  pekka:{hp:380,dmg:45,speed:0.7,cost:4}
};

let hand = Object.keys(cards);
let troops = [];
let towers = [];

function createTower(x,y,team){
  return {x,y,team,hp:600,maxHp:600,cool:0};
}

towers.push(
  createTower(80,150,"player"),
  createTower(80,300,"player"),
  createTower(820,150,"enemy"),
  createTower(820,300,"enemy")
);

const cardsDiv = document.getElementById("cards");

function updateCards(){
  cardsDiv.innerHTML="";
  hand.forEach(c=>{
    const b=document.createElement("button");
    b.innerText=c.toUpperCase()+"\n"+cards[c].cost;
    b.draggable=true;

    b.onmousedown=()=>selectedCard=c;
    b.ondragstart=()=>draggingCard=c;

    cardsDiv.appendChild(b);
  });
}
updateCards();

canvas.ondragover=e=>e.preventDefault();
canvas.ondrop=e=>{
  e.preventDefault();
  placeTroop(e.clientX,e.clientY,draggingCard);
  draggingCard=null;
};

canvas.onclick=e=>{
  if(selectedCard){
    placeTroop(e.clientX,e.clientY,selectedCard);
    selectedCard=null;
  }
};

function placeTroop(cx,cy,card){
  if(!card || elixir < cards[card].cost) return;

  const rect = canvas.getBoundingClientRect();
  const x = cx - rect.left;
  const y = cy - rect.top;

  elixir -= cards[card].cost;

  troops.push({
    x,y,
    team:"player",
    ...cards[card],
    maxHp:cards[card].hp,
    cooldown:0
  });
}

function drawRiver(){
  ctx.fillStyle="#0284c7";
  ctx.fillRect(0,215,900,20);

  ctx.fillStyle="#94a3b8";
  ctx.fillRect(410,205,80,40);
  ctx.fillRect(410,245,80,40);
}

function drawTower(t){
  ctx.fillStyle = t.team==="player"?"#a855f7":"#ef4444";
  ctx.fillRect(t.x-18,t.y-18,36,36);

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

function updateTroop(t){
  const enemies=[...troops.filter(o=>o.team!==t.team),...towers.filter(o=>o.team!==t.team)];
  if(!enemies.length) return;

  const target=enemies.sort((a,b)=>Math.hypot(t.x-a.x,t.y-a.y)-Math.hypot(t.x-b.x,t.y-b.y))[0];
  const d=Math.hypot(t.x-target.x,t.y-target.y);

  if(d<20){
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

function gameLoop(){
  ctx.clearRect(0,0,900,450);
  ctx.fillStyle="#166534";
  ctx.fillRect(0,0,900,450);

  drawRiver();
  towers.forEach(drawTower);
  troops.forEach(drawTroop);
  troops.forEach(updateTroop);

  troops = troops.filter(t=>t.hp>0);
  towers = towers.filter(t=>{
    if(t.hp<=0){
      if(t.team==="enemy") playerScore++;
      else enemyScore++;
      document.getElementById("score").innerText=`🏆 ${playerScore} - ${enemyScore} 🏆`;
      return false;
    }
    return true;
  });

  document.getElementById("elixir-fill").style.width=(elixir/maxElixir*100)+"%";
  requestAnimationFrame(gameLoop);
}
gameLoop();

setInterval(()=>{
  if(elixir<maxElixir) elixir++;
},1000);

setInterval(()=>{
  if(timeLeft<=0) return;
  timeLeft--;
  document.getElementById("timer").innerText=
    "Time: "+Math.floor(timeLeft/60)+":"+String(timeLeft%60).padStart(2,"0");
},1000);
