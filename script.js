/***********************
 DASH ROYALE – FULL GAME
***********************/

const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");

let crowns = 0;
let currentScreen = "menu";
let currentArena = "Training Camp";

/* ================= SAVE ================= */
function saveGame(){
  localStorage.setItem("dashRoyaleSave", JSON.stringify({
    crowns,
    deck: deck.map(c=>c.id),
    arenas,
    levels: cards.map(c=>({id:c.id,level:c.level}))
  }));
}

function loadGame(){
  const s = JSON.parse(localStorage.getItem("dashRoyaleSave"));
  if(!s) return;
  crowns = s.crowns || 0;
  s.arenas.forEach(a=>{
    const ar = arenas.find(x=>x.name===a.name);
    if(ar) ar.unlocked = a.unlocked;
  });
  s.levels.forEach(l=>{
    const c = cards.find(x=>x.id===l.id);
    if(c) c.level = l.level;
  });
  deck = s.deck.map(id=>cards.find(c=>c.id===id)).filter(Boolean);
}

/* ================= ARENAS ================= */
const arenas = [
  {name:"Training Camp",cost:0,unlocked:true},
  {name:"Barbarian Bowl",cost:10,unlocked:false},
  {name:"Forest Arena",cost:20,unlocked:false},
  {name:"Frozen Peak",cost:30,unlocked:false},
  {name:"Volcano Pit",cost:40,unlocked:false}
];

/* ================= CARDS ================= */
const cards = [
  {id:1,name:"Knight",emoji:"🗡️",arena:"Training Camp",level:1},
  {id:2,name:"Archer",emoji:"🏹",arena:"Training Camp",level:1},
  {id:3,name:"Giant",emoji:"🗿",arena:"Training Camp",level:1},
  {id:4,name:"Wizard",emoji:"🪄",arena:"Training Camp",level:1},

  {id:5,name:"Barbarian",emoji:"🪓",arena:"Barbarian Bowl",level:1},
  {id:6,name:"Baby Dragon",emoji:"🐉",arena:"Barbarian Bowl",level:1},

  {id:7,name:"Hunter",emoji:"🐻",arena:"Forest Arena",level:1},
  {id:8,name:"Witch",emoji:"🧙‍♀️",arena:"Forest Arena",level:1},

  {id:9,name:"Ice Wizard",emoji:"❄️",arena:"Frozen Peak",level:1},
  {id:10,name:"Snow Golem",emoji:"☃️",arena:"Frozen Peak",level:1},

  {id:11,name:"Lava Hound",emoji:"🌋",arena:"Volcano Pit",level:1},
  {id:12,name:"Fire Spirit",emoji:"🔥",arena:"Volcano Pit",level:1}
];

let deck = cards.slice(0,8);

/* ================= UI ================= */
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  currentScreen=id;
  if(id==="deck") renderDeck();
  if(id==="upgrades") renderUpgrades();
  if(id==="arenas") renderArenas();
}

/* ================= LEVELS ================= */
function levelLabel(c){
  if(c.level<10) return "Lv "+c.level;
  if(c.level===10) return "EVO";
  return "EVO "+c.level;
}

function upgradeCost(l){
  if(l<5) return l;
  if(l<9) return l+2;
  if(l<10) return 15;
  return 25;
}

/* ================= DECK BUILDER ================= */
function unlockedCards(){
  return cards.filter(c=>{
    const a = arenas.find(x=>x.name===c.arena);
    return a && a.unlocked;
  });
}

function renderDeck(){
  const d=document.getElementById("deckCards");
  d.innerHTML="";
  unlockedCards().forEach(c=>{
    const el=document.createElement("div");
    el.className="card";
    if(c.level>=5) el.classList.add("glow");
    if(c.level>=10) el.classList.add("evo");

    el.innerHTML=`
      <div class="emoji">${c.emoji}</div>
      <div class="name">${c.name}</div>
      <div class="level">${levelLabel(c)}</div>
    `;

    el.onclick=()=>{
      if(deck.includes(c)) deck=deck.filter(x=>x!==c);
      else if(deck.length<8) deck.push(c);
      saveGame();
      renderDeck();
    };
    d.appendChild(el);
  });
}

/* ================= UPGRADES ================= */
function renderUpgrades(){
  const u=document.getElementById("upgradeCards");
  u.innerHTML="";
  unlockedCards().forEach(c=>{
    const cost=upgradeCost(c.level);
    const el=document.createElement("div");
    el.className="card";
    if(c.level>=5) el.classList.add("glow");
    if(c.level>=10) el.classList.add("evo");

    el.innerHTML=`
      <div class="emoji">${c.emoji}</div>
      <div class="name">${c.name}</div>
      <div class="level">${levelLabel(c)}</div>
      <div class="cost">${cost} 👑</div>
    `;
    el.onclick=()=>{
      if(crowns>=cost){
        crowns-=cost;
        c.level++;
        saveGame();
        renderUpgrades();
      }
    };
    u.appendChild(el);
  });
}

/* ================= ARENAS ================= */
function renderArenas(){
  const a=document.getElementById("arenaList");
  a.innerHTML="";
  arenas.forEach(ar=>{
    const el=document.createElement("div");
    el.className="arenaCard";
    el.textContent=ar.name+(ar.unlocked?"":" 🔒");
    el.onclick=()=>{
      if(!ar.unlocked){
        if(crowns>=ar.cost){
          crowns-=ar.cost;
          ar.unlocked=true;
          saveGame();
          renderArenas();
        }
      }else{
        currentArena=ar.name;
        showScreen("game");
      }
    };
    a.appendChild(el);
  });
}

/* ================= ADMIN ================= */
document.getElementById("adminBtn").onclick=()=>{
  if(prompt("Password")==="littlebrother6"){
    crowns=parseInt(prompt("Set crowns"))||crowns;
    saveGame();
  }
};

/* ================= GAME ================= */
let hand=[];
let handIndex=0;
let dragging=null;

function startGame(){
  hand=deck.slice(0,4);
  setInterval(()=>{
    hand.shift();
    hand.push(deck[handIndex++%deck.length]);
  },3000);
}

canvas.addEventListener("mousedown",e=>{
  const y=e.offsetY;
  if(y>canvas.height-100){
    dragging=hand[Math.floor(e.offsetX/100)];
  }
});

canvas.addEventListener("mouseup",e=>{
  if(dragging){
    spawnUnit(dragging,e.offsetX,e.offsetY);
    dragging=null;
  }
});

/* ================= UNITS ================= */
let units=[];

function spawnUnit(card,x,y){
  units.push({
    emoji:card.emoji,
    x,y,
    hp:100+card.level*20
  });
}

function update(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // river
  ctx.fillStyle="#1e90ff";
  ctx.fillRect(0,canvas.height/2-20,canvas.width,40);

  // units
  units.forEach(u=>{
    ctx.font="30px Arial";
    ctx.fillText(u.emoji,u.x,u.y);
  });

  // hand
  hand.forEach((c,i)=>{
    ctx.fillText(c.emoji,20+i*100,canvas.height-40);
  });

  requestAnimationFrame(update);
}

/* ================= INIT ================= */
loadGame();
startGame();
update();
