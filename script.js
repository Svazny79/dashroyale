/***********************
 DASH ROYALE – FULL GAME
 ANIMATED VERSION
***********************/

const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");

let currentScreen = "menu";
let crowns = 0;
let elixir = 10;
let units = [];
let floatingTexts = [];
let lastTime = 0;
let currentArena = "Training Camp";

/* ===================== CARDS ===================== */
const allCards = [
  { id:1,name:"Knight",emoji:"🗡️",cost:3,hp:300,dmg:40,speed:0.35,level:1 },
  { id:2,name:"Archer",emoji:"🏹",cost:3,hp:220,dmg:30,speed:0.45,level:1 },
  { id:3,name:"Giant",emoji:"🗿",cost:5,hp:900,dmg:60,speed:0.25,level:1 },
  { id:4,name:"Wizard",emoji:"🪄",cost:4,hp:260,dmg:55,speed:0.4,level:1 },
  { id:5,name:"Mini Pekka",emoji:"🤖",cost:4,hp:500,dmg:95,speed:0.45,level:1 },
  { id:6,name:"Skeletons",emoji:"💀",cost:1,hp:120,dmg:25,speed:0.6,level:1 },

  // Arena cards
  { id:7,name:"Baby Dragon",emoji:"🐉",cost:4,hp:420,dmg:50,speed:0.4,level:1,arena:"Barbarian Bowl" },
  { id:8,name:"Prince",emoji:"🏇",cost:5,hp:450,dmg:85,speed:0.5,level:1,arena:"Barbarian Bowl" },
  { id:9,name:"Goblin Gang",emoji:"👹",cost:2,hp:150,dmg:25,speed:0.6,level:1,arena:"Barbarian Bowl" },
  { id:10,name:"Mega Minion",emoji:"🦾",cost:3,hp:350,dmg:60,speed:0.5,level:1,arena:"Barbarian Bowl" }
];

let deck = [];
let hand = [];

/* ===================== ARENAS ===================== */
const arenas = [
  { name:"Training Camp", unlocked:true },
  { name:"Barbarian Bowl", unlocked:false }
];

/* ===================== TOWERS ===================== */
function resetTowers(){
  return {
    player:[
      {emoji:"🏰",hp:2352,max:2352,x:80,y:560,dead:false,shake:0},
      {emoji:"🏰",hp:2352,max:2352,x:300,y:560,dead:false,shake:0},
      {emoji:"👑",hp:3096,max:3096,x:190,y:590,dead:false,shake:0}
    ],
    enemy:[
      {emoji:"🏰",hp:2352,max:2352,x:80,y:80,dead:false,shake:0},
      {emoji:"🏰",hp:2352,max:2352,x:300,y:80,dead:false,shake:0},
      {emoji:"👑",hp:3096,max:3096,x:190,y:50,dead:false,shake:0}
    ]
  };
}
let towers = resetTowers();

/* ===================== SAVE ===================== */
function saveGame(){
  localStorage.setItem("dashSave",JSON.stringify({
    crowns,
    deck:deck.map(c=>c.id),
    levels:allCards.map(c=>({id:c.id,l:c.level})),
    arenas
  }));
}

function loadGame(){
  const s = JSON.parse(localStorage.getItem("dashSave"));
  if(!s){
    deck = allCards.filter(c=>!c.arena).slice(0,8);
    return;
  }
  crowns = s.crowns || 0;
  s.levels.forEach(d=>{
    const c = allCards.find(x=>x.id===d.id);
    if(c) c.level=d.l;
  });
  s.arenas.forEach(a=>{
    const ar = arenas.find(x=>x.name===a.name);
    if(ar) ar.unlocked=a.unlocked;
  });
  deck = s.deck.map(id=>allCards.find(c=>c.id===id)).filter(Boolean);
}

/* ===================== UI ===================== */
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  currentScreen=id;
  if(id==="game") startGame();
  if(id==="deck") renderDeck();
  if(id==="upgrades") renderUpgrades();
  if(id==="arenas") renderArenas();
}

/* ===================== ADMIN ===================== */
document.getElementById("adminBtn").onclick=()=>{
  if(prompt("Password")==="littlebrother6"){
    crowns=parseInt(prompt("Set crowns"))||crowns;
    saveGame();
    alert("Admin updated");
  }
};

/* ===================== GAME ===================== */
function startGame(){
  towers = resetTowers();
  units=[];
  floatingTexts=[];
  elixir=10;
  hand=deck.slice(0,4);
  requestAnimationFrame(loop);
}

/* ===================== DRAW ARENA ===================== */
function drawArena(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#2ecc71";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // River
  ctx.fillStyle="#3498db";
  ctx.fillRect(0,290,canvas.width,40);

  // Bridges
  ctx.fillStyle="#8b4513";
  ctx.fillRect(100,270,60,80);
  ctx.fillRect(260,270,60,80);
}

/* ===================== SPAWN ===================== */
function playCard(card){
  if(elixir<card.cost) return;
  elixir-=card.cost;
  units.push({
    ...card,
    owner:"player",
    x:canvas.width/2,
    y:520,
    hpNow:card.hp,
    cd:0,
    alpha:1,
    scale:1
  });
  deck.push(deck.shift());
  hand=deck.slice(0,4);
  renderHand();
  saveGame();
}

/* ===================== COMBAT ===================== */
function closestTarget(u){
  const enemies = units.filter(x=>x.owner!==u.owner && x.hpNow>0);
  if(enemies.length){
    return enemies.sort((a,b)=>Math.abs(a.y-u.y)-Math.abs(b.y-u.y))[0];
  }
  const side = u.owner==="player"?"enemy":"player";
  return towers[side].filter(t=>!t.dead).sort((a,b)=>Math.abs(a.y-u.y)-Math.abs(b.y-u.y))[0];
}

function update(dt){
  units.forEach(u=>{
    if(u.hpNow<=0){
      u.alpha-=0.05;
      u.scale-=0.03;
      return;
    }
    const t = closestTarget(u);
    if(!t) return;
    const dy = t.y-u.y;
    if(Math.abs(dy)<28){
      u.cd-=dt;
      if(u.cd<=0){
        if(t.hp!==undefined){
          t.hp-=u.dmg;
          t.shake=5;
          floatingTexts.push({x:t.x,y:t.y,text:`-${u.dmg}`,alpha:1});
          if(t.hp<=0){
            t.dead=true;
            if(t.emoji==="👑"){
              crowns+= u.owner==="player"?3:0;
              saveGame();
              alert("GAME OVER");
              showScreen("menu");
            }
          }
        }else{
          t.hpNow-=u.dmg;
          floatingTexts.push({x:t.x,y:t.y,text:`-${u.dmg}`,alpha:1});
        }
        u.cd=800;
      }
    }else{
      u.y+=Math.sign(dy)*u.speed*dt;
    }
  });
  units=units.filter(u=>u.alpha>0);
}

/* ===================== DRAW ===================== */
function drawUnits(){
  ctx.font="26px Arial";
  units.forEach(u=>{
    ctx.globalAlpha=u.alpha;
    ctx.save();
    ctx.translate(u.x,u.y);
    ctx.scale(u.scale,u.scale);
    ctx.fillText(u.emoji,-10,0);
    ctx.restore();
    ctx.globalAlpha=1;
  });
}

function drawTowers(){
  ["player","enemy"].forEach(side=>{
    towers[side].forEach(t=>{
      if(t.dead) return;
      ctx.save();
      ctx.translate(t.x+(Math.random()*t.shake),t.y);
      ctx.fillText(t.emoji,0,0);
      ctx.restore();
      t.shake=Math.max(0,t.shake-1);
    });
  });
}

function drawFloating(){
  floatingTexts.forEach(f=>{
    ctx.globalAlpha=f.alpha;
    ctx.fillStyle="white";
    ctx.fillText(f.text,f.x,f.y);
    f.y-=0.4;
    f.alpha-=0.02;
    ctx.globalAlpha=1;
  });
  floatingTexts=floatingTexts.filter(f=>f.alpha>0);
}

/* ===================== LOOP ===================== */
function loop(t){
  const dt=t-lastTime; lastTime=t;
  drawArena();
  update(dt);
  drawUnits();
  drawTowers();
  drawFloating();
  if(currentScreen==="game") requestAnimationFrame(loop);
}

/* ===================== HAND ===================== */
function renderHand(){
  const h=document.getElementById("hand");
  h.innerHTML="";
  hand.forEach(c=>{
    const d=document.createElement("div");
    d.className="card";
    d.innerHTML=`${c.emoji}<br>${c.name}<br>${c.cost}💧`;
    d.onclick=()=>playCard(c);
    h.appendChild(d);
  });
}

/* ===================== DECK BUILDER ===================== */
function renderDeck(){
  const d=document.getElementById("deckCards");
  d.innerHTML="";
  deck.forEach((c,i)=>{
    const el=document.createElement("div");
    el.className="card";
    el.draggable=true;
    el.innerHTML=`${c.emoji}<br>${c.name}`;
    el.ondragstart=e=>e.dataTransfer.setData("i",i);
    el.ondrop=e=>{
      const f=e.dataTransfer.getData("i");
      [deck[f],deck[i]]=[deck[i],deck[f]];
      renderDeck(); saveGame();
    };
    el.ondragover=e=>e.preventDefault();
    d.appendChild(el);
  });
}

/* ===================== UPGRADES ===================== */
function renderUpgrades(){
  const u=document.getElementById("upgradeCards");
  u.innerHTML="";
  allCards.forEach(c=>{
    const b=document.createElement("button");
    b.textContent=`${c.emoji} ${c.name} Lv ${c.level}`;
    b.onclick=()=>{
      if(crowns>0){crowns--;c.level++;saveGame();renderUpgrades();}
    };
    u.appendChild(b);
  });
}

/* ===================== ARENAS ===================== */
function renderArenas(){
  const a=document.getElementById("arenaList");
  a.innerHTML="";
  arenas.forEach(ar=>{
    const d=document.createElement("div");
    d.textContent=ar.name+(ar.unlocked?" ✅":" 🔒");
    d.onclick=()=>{
      if(!ar.unlocked){
        if(crowns>=10){
          crowns-=10; ar.unlocked=true; saveGame(); renderArenas();
        }
      }else{
        currentArena=ar.name;
        showScreen("game");
      }
    };
    a.appendChild(d);
  });
}

/* ===================== INIT ===================== */
loadGame();
renderHand();
