/* ================= DASH ROYALE UPGRADED ================= */

/* ---------- CANVAS ---------- */
const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");
canvas.width=900; canvas.height=600;

/* ---------- STATE ---------- */
let screen="menu";
let crowns=50;
let elixir=5, maxElixir=10, doubleElixir=false, gameTime=180;
let currentArena="Training Camp";
let draggingCard=null;

/* ---------- ARENAS ---------- */
const arenas=[
  {name:"Training Camp", cost:0, unlocked:true, bg:"#4CAF50", cards:[]},
  {name:"Barbarian Bowl", cost:10, unlocked:false, bg:"#c2a26a", cards:[]},
  {name:"Forest Arena", cost:25, unlocked:false, bg:"#2e7d32", cards:[]},
  {name:"Frozen Peak", cost:50, unlocked:false, bg:"#cfefff", cards:[]},
  {name:"Volcano Pit", cost:80, unlocked:false, bg:"#3b1d1d", cards:[]}
];

/* ---------- CARDS ---------- */
const allCards=[
  {id:1,name:"Knight",emoji:"🗡️",hp:120,dmg:12,cost:3,arena:"Training Camp"},
  {id:2,name:"Archer",emoji:"🏹",hp:80,dmg:9,cost:3,arena:"Training Camp"},
  {id:3,name:"Giant",emoji:"🗿",hp:300,dmg:20,cost:5,arena:"Training Camp"},
  {id:4,name:"Wizard",emoji:"🪄",hp:90,dmg:15,cost:4,arena:"Training Camp"},

  {id:5,name:"Barbarian",emoji:"🪓",hp:130,dmg:14,cost:4,arena:"Barbarian Bowl"},
  {id:6,name:"Dragon",emoji:"🐉",hp:160,dmg:18,cost:5,arena:"Barbarian Bowl"},

  {id:7,name:"Elf",emoji:"🧝",hp:100,dmg:16,cost:4,arena:"Forest Arena"},
  {id:8,name:"Ice Golem",emoji:"❄️",hp:220,dmg:10,cost:4,arena:"Frozen Peak"},

  {id:9,name:"Lava Hound",emoji:"🌋",hp:260,dmg:22,cost:6,arena:"Volcano Pit"},
  {id:10,name:"Fire Spirit",emoji:"🔥",hp:60,dmg:20,cost:2,arena:"Volcano Pit"}
];

/* ---------- PLAYER ---------- */
let deck=[], hand=[], units=[], bullets=[], towers=[];

/* ---------- SAVE/LOAD ---------- */
function saveGame(){
  localStorage.setItem("dashRoyaleSave",JSON.stringify({crowns, arenas, deck}));
}
function loadGame(){
  const d=JSON.parse(localStorage.getItem("dashRoyaleSave"));
  if(!d) return;
  crowns=d.crowns;
  deck=d.deck||[];
  d.arenas.forEach(a=>{
    const ar=arenas.find(x=>x.name===a.name);
    if(ar) ar.unlocked=a.unlocked;
  });
}

/* ---------- SCREENS ---------- */
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  screen=id;
}

/* ---------- ARENA SHOP ---------- */
function renderArenas(){
  const wrap=document.getElementById("arenaList");
  wrap.innerHTML="";
  arenas.forEach(a=>{
    const d=document.createElement("div");
    d.className="arenaCard";
    d.innerHTML=`
      <canvas width="120" height="70"></canvas>
      <h3>${a.name}</h3>
      ${a.unlocked?"<button>Play</button>":
        `<button ${crowns<a.cost?"disabled":""}>Buy (${a.cost}👑)</button>`}
    `;
    const c=d.querySelector("canvas").getContext("2d");
    c.fillStyle=a.bg; c.fillRect(0,0,120,70);
    c.fillStyle="#1e90ff"; c.fillRect(0,30,120,10);

    d.querySelector("button").onclick=()=>{
      if(a.unlocked){
        startGame(a.name);
      }else if(crowns>=a.cost){
        crowns-=a.cost;
        a.unlocked=true;
        saveGame();
        renderArenas();
      }
    };
    wrap.appendChild(d);
  });
}

/* ---------- GAME START ---------- */
function startGame(arenaName){
  currentArena=arenaName;
  elixir=5; gameTime=180; doubleElixir=false;
  units=[]; bullets=[];
  setupTowers();
  buildHand();
  showScreen("game");
}

/* ---------- HAND ---------- */
function buildHand(){
  const pool=allCards.filter(c=>{
    const a=arenas.find(x=>x.name===c.arena);
    return a && a.unlocked;
  });
  hand=pool.sort(()=>0.5-Math.random()).slice(0,4);
}
function rotateHand(){
  hand.shift();
  const pool=allCards.filter(c=>{
    const a=arenas.find(x=>x.name===c.arena);
    return a && a.unlocked;
  });
  hand.push(pool[Math.floor(Math.random()*pool.length)]);
}

/* ---------- TOWERS ---------- */
function setupTowers(){
  towers=[
    {x:200,y:520,hp:2352,max:2352,side:"player",emoji:"🏰"},
    {x:700,y:520,hp:2352,max:2352,side:"player",emoji:"🏰"},
    {x:450,y:480,hp:3096,max:3096,side:"player",emoji:"👑"},
    {x:200,y:80,hp:2352,max:2352,side:"enemy",emoji:"🏰"},
    {x:700,y:80,hp:2352,max:2352,side:"enemy",emoji:"🏰"},
    {x:450,y:120,hp:3096,max:3096,side:"enemy",emoji:"👑"}
  ];
}

/* ---------- INPUT ---------- */
canvas.onmousedown=e=>{
  if(e.offsetY>500){
    draggingCard=hand[Math.floor(e.offsetX/120)];
  }
};
canvas.onmouseup=e=>{
  if(draggingCard && elixir>=draggingCard.cost){
    elixir-=draggingCard.cost;
    units.push({...draggingCard,x:e.offsetX,y:e.offsetY,side:"player"});
    rotateHand();
  }
  draggingCard=null;
};

/* ---------- COMBAT ---------- */
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function closest(u){
  const targets=[...units,...towers].filter(t=>t.side!==u.side && t.hp>0);
  return targets.sort((a,b)=>dist(u,a)-dist(u,b))[0];
}
function updateCombat(){
  units.forEach(u=>{
    const t=closest(u);
    if(!t) return;
    if(dist(u,t)<30){
      t.hp-=u.dmg*0.05;
    }else{
      u.y+=u.side==="player"?-0.4:0.4;
    }
  });
  units=units.filter(u=>u.hp>0);
  towers=towers.filter(t=>t.hp>0);
}

/* ---------- DRAW ---------- */
function drawArena(){
  const a=arenas.find(x=>x.name===currentArena);
  ctx.fillStyle=a.bg;
  ctx.fillRect(0,0,900,600);
  ctx.fillStyle="#1e90ff";
  ctx.fillRect(0,280,900,40);
  ctx.fillStyle="#8b5a2b";
  ctx.fillRect(200,260,40,80);
  ctx.fillRect(660,260,40,80);
}
function draw(){
  drawArena();
  units.forEach(u=>{
    ctx.font="26px Arial";
    ctx.fillText(u.emoji,u.x,u.y);
  });
  towers.forEach(t=>{
    ctx.font="36px Arial";
    ctx.fillText(t.emoji,t.x-18,t.y);
    ctx.fillStyle=t.side==="player"?"purple":"red";
    ctx.fillRect(t.x-30,t.y-40,60*(t.hp/t.max),6);
    ctx.fillStyle="white";
    ctx.font="12px Arial";
    ctx.fillText(Math.floor(t.hp),t.x-20,t.y-48);
  });
  ctx.fillStyle="purple";
  ctx.fillRect(20,580,(elixir/maxElixir)*200,10);
}

/* ---------- LOOP ---------- */
function loop(){
  if(screen==="game"){
    gameTime-=1/60;
    if(gameTime<60) doubleElixir=true;
    elixir=Math.min(maxElixir,elixir+(doubleElixir?0.03:0.015));
    updateCombat();
    draw();
  }
  requestAnimationFrame(loop);
}

loadGame();
loop();
