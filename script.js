const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ===== STATE ===== */
let timeLeft = 180;
let overtime = false;
let elixir = 10;
const maxElixir = 10;

let playerCrowns = 0;
let enemyCrowns = 0;

let stats = JSON.parse(localStorage.getItem("dashStats")) || {
  wins:0, losses:0, crowns:0
};

/* ===== LANES ===== */
const lanes = {
  left: { x: 300 },
  right:{ x: 600 }
};

/* ===== CARDS ===== */
const cards = {
  knight:{emoji:"🗡️",hp:260,dmg:22,speed:1,cost:3},
  archer:{emoji:"🏹",hp:150,dmg:15,speed:1.2,cost:2},
  giant:{emoji:"🗿",hp:500,dmg:30,speed:0.6,cost:5},
  wizard:{emoji:"🪄",hp:200,dmg:28,speed:0.9,cost:4},
  goblin:{emoji:"👺",hp:100,dmg:12,speed:1.6,cost:2},
  pekka:{emoji:"🤖",hp:380,dmg:45,speed:0.7,cost:4},
  fireball:{emoji:"🔥",spell:true,cost:4,damage:120},
  arrows:{emoji:"🏹",spell:true,cost:3,damage:80}
};

/* ===== DECK ===== */
let deck = Object.keys(cards).sort(()=>Math.random()-0.5);
let hand = deck.splice(0,4);

/* ===== ENTITIES ===== */
let troops = [];
let towers = [];

/* ===== TOWERS ===== */
function tower(x,y,team,king=false){
  return {x,y,team,king,emoji:king?"👑":"🏰",hp:king?1200:600,maxHp:king?1200:600};
}

// Player
towers.push(
  tower(300,420,"player"),
  tower(600,420,"player"),
  tower(450,470,"player",true)
);

// Enemy
towers.push(
  tower(300,80,"enemy"),
  tower(600,80,"enemy"),
  tower(450,30,"enemy",true)
);

/* ===== UI ===== */
const cardsDiv = document.getElementById("cards");
const scoreDiv = document.getElementById("score");

function updateCards(){
  cardsDiv.innerHTML="";
  hand.forEach(c=>{
    const b=document.createElement("button");
    b.innerText=cards[c].emoji+"\n"+cards[c].cost;
    b.onclick=()=>selectCard(c);
    cardsDiv.appendChild(b);
  });
}
updateCards();

let selectedCard=null;

/* ===== INPUT (CLICK + TOUCH) ===== */
function selectCard(c){
  if(elixir<cards[c].cost) return;
  selectedCard=c;
}

canvas.addEventListener("click",placeInput);
canvas.addEventListener("touchstart",e=>{
  placeInput(e.touches[0]);
});

function placeInput(e){
  if(!selectedCard) return;
  const rect=canvas.getBoundingClientRect();
  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;

  const lane = x < 450 ? "left" : "right";
  placeCard(selectedCard,lane);
  selectedCard=null;
}

/* ===== PLACE ===== */
function placeCard(card,lane){
  if(elixir<cards[card].cost) return;
  elixir-=cards[card].cost;

  if(cards[card].spell){
    troops.push({spell:true,x:lanes[lane].x,y:250,damage:cards[card].damage});
  } else {
    troops.push({
      x:lanes[lane].x,
      y:380,
      lane,
      team:"player",
      ...cards[card],
      maxHp:cards[card].hp,
      cooldown:0
    });
  }

  deck.push(card);
  hand.shift();
  hand.push(deck.shift());
  updateCards();
}

/* ===== ENEMY AI ===== */
setInterval(()=>{
  if(elixir<3) return;
  const c=Object.keys(cards)[Math.floor(Math.random()*6)];
  const lane=Math.random()<0.5?"left":"right";
  troops.push({
    x:lanes[lane].x,
    y:120,
    lane,
    team:"enemy",
    ...cards[c],
    maxHp:cards[c].hp,
    cooldown:0
  });
},3000);

/* ===== DRAW ===== */
function drawRiver(){
  ctx.fillStyle="#0284c7";
  ctx.fillRect(0,240,900,20);
  ctx.fillStyle="#94a3b8";
  ctx.fillRect(270,230,60,40);
  ctx.fillRect(570,230,60,40);
}

function drawEntity(e){
  ctx.font="24px serif";
  ctx.textAlign="center";
  ctx.fillText(e.emoji,e.x,e.y+8);
  ctx.fillStyle="#22c55e";
  ctx.fillRect(e.x-14,e.y-22,(e.hp/e.maxHp)*28,4);
}

/* ===== UPDATE ===== */
function updateTroop(t){
  if(t.spell){
    towers.forEach(o=>{ if(o.team==="enemy") o.hp-=t.damage; });
    t.hp=0;
    return;
  }

  const enemies=[...troops.filter(o=>o.team!==t.team && o.lane===t.lane),
                 ...towers.filter(o=>o.team!==t.team && Math.abs(o.x-t.x)<50)];
  if(!enemies.length) return;

  const target=enemies[0];
  const d=Math.abs(t.y-target.y);

  if(d<25){
    if(t.cooldown<=0){
      target.hp-=t.dmg;
      t.cooldown=30;
    }
  } else {
    t.y += (t.team==="player"?-1:1)*t.speed;
  }
  t.cooldown--;
}

/* ===== LOOP ===== */
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
        if(t.team==="enemy"){stats.wins++;alert("YOU WIN 👑");}
        else{stats.losses++;alert("YOU LOSE 💀");}
        localStorage.setItem("dashStats",JSON.stringify(stats));
      } else {
        if(t.team==="enemy"){playerCrowns++;stats.crowns++;}
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

/* ===== TIMERS ===== */
setInterval(()=>{
  if(elixir<maxElixir) elixir+=overtime?2:1;
},1000);

setInterval(()=>{
  if(timeLeft>0) timeLeft--;
  else overtime=true;
  document.getElementById("timer").innerText=
    overtime?"OVERTIME!":"Time: "+Math.floor(timeLeft/60)+":"+String(timeLeft%60).padStart(2,"0");
},1000);
