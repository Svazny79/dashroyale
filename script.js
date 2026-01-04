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
// Two lanes with bridges: top and bottom
const lanes = {
  top: { x: 200, y: 230 },    // bridge 1
  bottom: { x: 650, y: 230 }  // bridge 2
};

/* ===== CARDS ===== */
const cards = {
  knight:   { emoji:"🗡️", hp:260, dmg:22, speed:1,   cost:3 },
  archer:   { emoji:"🏹", hp:150, dmg:15, speed:1.2, cost:2 },
  giant:    { emoji:"🗿", hp:520, dmg:30, speed:0.6, cost:5 },
  wizard:   { emoji:"🪄", hp:220, dmg:28, speed:0.9, cost:4 },
  goblin:   { emoji:"👺", hp:100, dmg:12, speed:1.6, cost:2 },
  pekka:    { emoji:"🤖", hp:420, dmg:45, speed:0.7, cost:4 },
  minipekka:{ emoji:"⚔️", hp:280, dmg:55, speed:1.1, cost:4 },
  bomber:   { emoji:"💣", hp:180, dmg:40, speed:0.9, cost:3 },
  skeleton: { emoji:"💀", hp:60,  dmg:10, speed:1.8, cost:1 },
  hog:      { emoji:"🐗", hp:300, dmg:32, speed:1.6, cost:4 },
  fireball: { emoji:"🔥", spell:true, cost:4, damage:120 },
  arrows:   { emoji:"🏹", spell:true, cost:3, damage:80 }
};

/* ===== DECK ===== */
let deck = Object.keys(cards).sort(() => Math.random() - 0.5);
let hand = deck.splice(0, 4);

/* ===== ENTITIES ===== */
let troops = [];
let towers = [];

/* ===== TOWERS ===== */
function createTower(x, y, team, king=false) {
  return { x, y, team, king, emoji: king?"👑":"🏰", hp: king?1200:600, maxHp: king?1200:600 };
}

/* Player Towers */
towers.push(
  createTower(200, 400, "player"),
  createTower(650, 400, "player"),
  createTower(425, 450, "player", true)
);

/* Enemy Towers */
towers.push(
  createTower(200, 100, "enemy"),
  createTower(650, 100, "enemy"),
  createTower(425, 50, "enemy", true)
);

/* ===== UI ===== */
const cardsDiv = document.getElementById("cards");
const scoreDiv = document.getElementById("score");

function updateCardsUI() {
  cardsDiv.innerHTML = "";
  hand.forEach(card => {
    const btn = document.createElement("button");
    btn.innerText = `${cards[card].emoji}\n${cards[card].cost}`;
    btn.onclick = () => selectCard(card);
    cardsDiv.appendChild(btn);
  });
}
updateCardsUI();

let selectedCard = null;

/* ===== INPUT ===== */
function selectCard(card) {
  if (elixir < cards[card].cost) return;
  selectedCard = card;
}

canvas.addEventListener("click", e => {
  if (!selectedCard) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const lane = x < 450 ? "top" : "bottom";
  placeCard(selectedCard, lane);
  selectedCard = null;
});

canvas.addEventListener("touchstart", e => {
  if (!selectedCard) return;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const lane = x < 450 ? "top" : "bottom";
  placeCard(selectedCard, lane);
  selectedCard = null;
});

/* ===== PLACE CARD ===== */
function placeCard(card, lane) {
  if (elixir < cards[card].cost) return;
  elixir -= cards[card].cost;

  if (cards[card].spell) {
    troops.push({ spell:true, x:450, y:lanes[lane].y, damage:cards[card].damage, team:"player" });
  } else {
    troops.push({
      x: lanes[lane].x,
      y: lanes[lane].y + (cards[card].team==="player"?150:-150),
      lane,
      team: "player",
      emoji: cards[card].emoji,
      hp: cards[card].hp,
      maxHp: cards[card].hp,
      dmg: cards[card].dmg,
      speed: cards[card].speed,
      cooldown: 0
    });
  }

  deck.push(card);
  hand.shift();
  hand.push(deck.shift());
  updateCardsUI();
}

/* ===== ENEMY AI ===== */
setInterval(()=>{
  if(elixir<3) return;
  const choices = Object.keys(cards).filter(c=>!cards[c].spell);
  const card = choices[Math.floor(Math.random()*choices.length)];
  const lane = Math.random()<0.5?"top":"bottom";
  troops.push({
    x: lanes[lane].x,
    y: lanes[lane].y - 150,
    lane,
    team:"enemy",
    emoji:cards[card].emoji,
    hp:cards[card].hp,
    maxHp:cards[card].hp,
    dmg:cards[card].dmg,
    speed:cards[card].speed,
    cooldown:0
  });
},3000);

/* ===== DRAW RIVER & BRIDGES ===== */
function drawRiver() {
  // Horizontal river
  ctx.fillStyle="#0284c7";
  ctx.fillRect(0, 230, 900, 40);
  // Two vertical brown bridges
  ctx.fillStyle="#8b4513";
  ctx.fillRect(lanes.top.x, 230, 40, 40);
  ctx.fillRect(lanes.bottom.x, 230, 40, 40);
}

/* ===== DRAW ENTITY ===== */
function drawEntity(e) {
  ctx.font = "24px serif";
  ctx.textAlign="center";
  ctx.fillText(e.emoji, e.x, e.y+8);

  ctx.fillStyle = e.team === "player" ? "#a855f7" : "#ef4444";
  ctx.fillRect(e.x-14, e.y-22, (e.hp/e.maxHp)*28,4);
}

/* ===== UPDATE TROOP ===== */
function updateTroop(t){
  if(t.spell){
    towers.forEach(tw=>{if(tw.team==="enemy")tw.hp-=t.damage;});
    t.hp=0; return;
  }

  // Determine target: nearest enemy troop or tower in lane
  const targets=[...troops.filter(o=>o.team!==t.team && o.lane===t.lane),
                 ...towers.filter(o=>o.team!==t.team && Math.abs(o.x-t.x)<50)];

  if(targets.length===0){
    // Move along bridge path
    const bridgeX = lanes[t.lane].x + 20; // center of bridge
    if(Math.abs(t.x - bridgeX)>1) t.x += t.x<bridgeX?t.speed:-t.speed;
    else t.y += t.team==="player"?-t.speed:t.speed;
    return;
  }

  // Move toward target
  const target = targets[0];
  const dist = Math.hypot(t.x-target.x, t.y-target.y);

  if(dist<25){
    if(t.cooldown<=0){ target.hp-=t.dmg; t.cooldown=30; }
  } else {
    const angle=Math.atan2(target.y-t.y,target.x-t.x);
    t.x+=Math.cos(angle)*t.speed;
    t.y+=Math.sin(angle)*t.speed;
  }

  t.cooldown--;
}

/* ===== GAME LOOP ===== */
function loop(){
  ctx.clearRect(0,0,900,500);
  ctx.fillStyle="#166534";
  ctx.fillRect(0,0,900,500);

  drawRiver();

  towers.forEach(drawEntity);
  troops.forEach(drawEntity);
  troops.forEach(updateTroop);

  troops = troops.filter(t=>t.hp>0);
  towers = towers.filter(t=>{
    if(t.hp<=0){
      if(!t.king){
        t.team==="enemy"?playerCrowns++:enemyCrowns++;
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
  if(elixir<maxElixir) elixir += overtime?2:1;
},1000);

setInterval(()=>{
  if(timeLeft>0) timeLeft--;
  else overtime=true;

  document.getElementById("timer").innerText=
    overtime?"OVERTIME!":
    `Time: ${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,"0")}`;
},1000);
