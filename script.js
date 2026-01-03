const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= GAME STATE ================= */
let timeLeft = 180;
let overtime = false;

let elixir = 10;
const maxElixir = 10;

let playerCrowns = 0;
let enemyCrowns = 0;

let selectedCard = null;
let draggingCard = null;

/* ================= CARDS ================= */
const cardPool = {
  knight:{emoji:"🗡️",hp:260,dmg:22,speed:1,cost:3},
  archer:{emoji:"🏹",hp:150,dmg:15,speed:1.2,cost:2},
  giant:{emoji:"🗿",hp:500,dmg:30,speed:0.6,cost:5},
  wizard:{emoji:"🪄",hp:200,dmg:28,speed:0.9,cost:4},
  goblin:{emoji:"👺",hp:100,dmg:12,speed:1.6,cost:2},
  pekka:{emoji:"🤖",hp:380,dmg:45,speed:0.7,cost:4},
  valk:{emoji:"🪓",hp:300,dmg:20,speed:1,cost:4},
  dragon:{emoji:"🐉",hp:280,dmg:18,speed:1.1,cost:4}
};

/* ================= DECK ================= */
let deck = Object.keys(cardPool).sort(()=>Math.random()-0.5);
let hand = deck.splice(0,4);

/* ================= ENTITIES ================= */
let troops = [];
let towers = [];

/* ================= TOWERS ================= */
function tower(x,y,team,king=false){
  return {
    x,y,team,king,
    emoji: king ? "👑" : "🏰",
    hp: king ? 1200 : 600,
    maxHp: king ? 1200 : 600
  };
}

// Player
towers.push(
  tower(100,150,"player"),
  tower(100,350,"player"),
  tower(50,250,"player",true)
);

// Enemy
towers.push(
  tower(800,150,"enemy"),
  tower(800,350,"enemy"),
  tower(850,250,"enemy",true)
);

/* ================= UI ================= */
const cardsDiv = document.getElementById("cards");
const scoreDiv = document.getElementById("score");

function updateCards(){
  cardsDiv.innerHTML="";
  hand.forEach(c=>{
    const b=document.createElement("button");
    b.innerText=cardPool[c].emoji+"\n"+cardPool[c].cost;
    b.draggable=true;
    b.onmousedown=()=>selectedCard=c;
    b.ondragstart=()=>draggingCard=c;
    cardsDiv.appendChild(b);
  });
}
updateCards();

/* ================= INPUT ================= */
canvas.ondragover=e=>e.preventDefault();
canvas.ondrop=e=>{
  e.preventDefault();
  placeTroop(e.clientX,e.clientY,draggingCard,"player");
  draggingCard=null;
};

canvas.onclick=e=>{
  if(selectedCard){
    placeTroop(e.clientX,e.clientY,selectedCard,"player");
    selectedCard=null;
  }
};

/* ================= PLACE TROOP ================= */
function placeTroop(cx,cy,card,team){
  if(!card || elixir < cardPool[card].cost) return;

  const rect=canvas.getBoundingClientRect();
  const x=cx-rect.left;
  const y=cy-rect.top;

  if(team==="player") elixir-=cardPool[card].cost;

  troops.push({
    x,y,team,
    ...cardPool[card],
    maxHp:cardPool[card].hp,
    cooldown:0
  });

  // deck rotation
  if(team==="player"){
    deck.push(card);
    hand.shift();
    hand.push(deck.shift());
    updateCards();
  }
}

/* ================= ENEMY AI ================= */
setInterval(()=>{
  if(elixir<3) return;
  const card=Object.keys(cardPool)[Math.floor(Math.random()*8)];
  placeTroop(600,Math.random()*200+150,card,"enemy");
},3000);

/* ================= DRAW MAP ================= */
function drawRiver(){
  ctx.fillStyle="#0284c7";
  ctx.fillRect(0,240,900,20);
  ctx.fillStyle="#94a3b8";
  ctx.fillRect(420,230,60,40);
  ctx.fillRect(420,250,60,40);
}

function drawEntity(e){
  ctx.font="24px serif";
  ctx.textAlign="center";
  ctx.fillText(e.emoji,e.x,e.y+8);

  ctx.fillStyle="#22c55e";
  ctx.fillRect(e.x-14,e.y-22,(e.hp/e.maxHp)*28,4);
}

/* ================= UPDATE ================= */
function updateTroop(t){
  const enemies=[...troops.filter(o=>o.team!==t.team),...towers.filter(o=>o.team!==t.team)];
  if(!enemies.length) return;

  const target=enemies.sort((a,b)=>Math.hypot(t.x-a.x,t.y-a.y)-Math.hypot(t.x-b.x,t.y-b.y))[0];
  const d=Math.hypot(t.x-target.x,t.y-target.y);

  if(d<22){
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

/* ================= GAME LOOP ================= */
function loop(){
  ctx.clearRect(0,0,900,500);
  ctx.fillStyle="#166534";
  ctx.fillRect(0,0,900,500);

  drawRiver();

  towers.forEach(drawEntity);
  troops.forEach(drawEntity);
  troops.forEach(updateTroop);

  troops=troops.filter(t=>t.hp>0);
  towers=towers.filter(t=>{
    if(t.hp<=0){
      if(t.king){
        if(t.team==="enemy") alert("YOU WIN 👑");
        else alert("YOU LOSE 💀");
      } else {
        if(t.team==="enemy") playerCrowns++;
        else enemyCrowns++;
        scoreDiv.innerText=`👑 ${playerCrowns} - ${enemyCrowns} 👑`;
      }
      return false;
    }
    return true;
  });

  document.getElementById("elixir-fill").style.width=(elixir/maxElixir*100)+"%";
  requestAnimationFrame(loop);
}
loop();

/* ================= TIMERS ================= */
setInterval(()=>{
  if(elixir<maxElixir) elixir+= overtime ? 2 : 1;
},1000);

setInterval(()=>{
  if(timeLeft>0){
    timeLeft--;
  } else if(!overtime){
    overtime=true;
    document.getElementById("timer").innerText="OVERTIME!";
    return;
  }
  document.getElementById("timer").innerText=
    overtime ? "OVERTIME!" :
    "Time: "+Math.floor(timeLeft/60)+":"+String(timeLeft%60).padStart(2,"0");
},1000);
