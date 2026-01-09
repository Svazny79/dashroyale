/* ===== DASH ROYALE – ARENAS UPDATE ===== */

/* ---------- SCREENS ---------- */
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* ---------- SAVE ---------- */
let crowns = Number(localStorage.getItem("crowns")) || 0;
let deck = JSON.parse(localStorage.getItem("deck")) || [];
let levels = JSON.parse(localStorage.getItem("levels")) || {};
let unlockedArenas = JSON.parse(localStorage.getItem("arenas")) || [0];
let selectedArena = Number(localStorage.getItem("selectedArena")) || 0;

function saveAll(){
  localStorage.setItem("crowns",crowns);
  localStorage.setItem("deck",JSON.stringify(deck));
  localStorage.setItem("levels",JSON.stringify(levels));
  localStorage.setItem("arenas",JSON.stringify(unlockedArenas));
  localStorage.setItem("selectedArena",selectedArena);
}

/* ---------- ARENAS ---------- */
const arenas = [
  {id:0,name:"Training Camp",cost:0,theme:"#4ade80"},
  {id:1,name:"Barbarian Bowl",cost:10,theme:"#16a34a"},
  {id:2,name:"Frozen Peak",cost:25,theme:"#60a5fa"},
  {id:3,name:"Lava Pit",cost:50,theme:"#ef4444"},
  {id:4,name:"Shadow Arena",cost:100,theme:"#7c3aed"}
];

/* ---------- CARDS ---------- */
const baseCards = [
  {id:1,name:"Knight",emoji:"🗡️",cost:3},
  {id:2,name:"Archer",emoji:"🏹",cost:3},
  {id:3,name:"Giant",emoji:"🗿",cost:5},
  {id:4,name:"Wizard",emoji:"🪄",cost:4}
];

const arenaCards = {
  1:[
    {id:101,name:"Barbarian",emoji:"🪓",cost:4},
    {id:102,name:"Hog",emoji:"🐗",cost:4},
    {id:103,name:"Spear Goblin",emoji:"🟢",cost:3},
    {id:104,name:"Cannon",emoji:"🎯",cost:3}
  ],
  2:[
    {id:201,name:"Ice Wizard",emoji:"❄️",cost:4},
    {id:202,name:"Snow Golem",emoji:"☃️",cost:4},
    {id:203,name:"Frost Archer",emoji:"🏹❄️",cost:3},
    {id:204,name:"Ice Spirit",emoji:"🧊",cost:1}
  ],
  3:[
    {id:301,name:"Fire Dragon",emoji:"🐉🔥",cost:5},
    {id:302,name:"Lava Hound",emoji:"🌋",cost:6},
    {id:303,name:"Fire Spirit",emoji:"🔥",cost:2},
    {id:304,name:"Inferno",emoji:"♨️",cost:4}
  ],
  4:[
    {id:401,name:"Shadow Knight",emoji:"🗡️🖤",cost:4},
    {id:402,name:"Dark Archer",emoji:"🏹🖤",cost:3},
    {id:403,name:"Phantom",emoji:"👻",cost:4},
    {id:404,name:"Void Golem",emoji:"⚫",cost:5}
  ]
};

function getAllCards(){
  let cards=[...baseCards];
  unlockedArenas.forEach(a=>{
    if(arenaCards[a]) cards=cards.concat(arenaCards[a]);
  });
  cards.forEach(c=>{ if(!levels[c.id]) levels[c.id]=1; });
  return cards;
}

/* ---------- MENU ---------- */
function startGame(){
  if(deck.length===0) return alert("Build a deck first!");
  showScreen("game");
  drawArena();
}

function openArenas(){
  renderArenas();
  showScreen("arenas");
}

function openDeckBuilder(){
  renderDeck();
  showScreen("deckBuilder");
}

function openUpgrades(){
  renderUpgrades();
  showScreen("upgrades");
}

/* ---------- ARENA SCREEN ---------- */
function renderArenas(){
  const a=document.getElementById("arenaList");
  a.innerHTML="";
  arenas.forEach(ar=>{
    const d=document.createElement("div");
    d.className="arenaCard";
    d.innerHTML=`<canvas width="180" height="100"></canvas>
    <h3>${ar.name}</h3>
    <p>${ar.cost} 👑</p>`;
    drawArenaPreview(d.querySelector("canvas"),ar.theme);

    if(unlockedArenas.includes(ar.id)){
      d.onclick=()=>{
        selectedArena=ar.id;
        saveAll();
        alert("Arena selected!");
      };
    }else{
      const b=document.createElement("button");
      b.innerText="GET";
      b.onclick=()=>{
        if(crowns<ar.cost) return alert("Not enough crowns");
        crowns=0;
        unlockedArenas.push(ar.id);
        selectedArena=ar.id;
        saveAll();
        renderArenas();
      };
      d.appendChild(b);
    }
    a.appendChild(d);
  });
}

function drawArenaPreview(c,color){
  const x=c.getContext("2d");
  x.fillStyle=color; x.fillRect(0,0,180,100);
  x.fillStyle="#2563eb"; x.fillRect(0,45,180,10);
  x.fillStyle="#92400e";
  x.fillRect(80,35,20,30);
  x.fillRect(80,55,20,30);
}

/* ---------- DECK BUILDER ---------- */
function renderDeck(){
  const d=document.getElementById("deckSlots");
  const a=document.getElementById("allCards");
  d.innerHTML=""; a.innerHTML="";
  const cards=getAllCards();

  deck.forEach(c=>{
    const el=cardBox(c);
    el.onclick=()=>{
      deck=deck.filter(x=>x.id!==c.id);
      saveAll(); renderDeck();
    };
    d.appendChild(el);
  });

  cards.forEach(c=>{
    const el=cardBox(c);
    if(deck.some(x=>x.id===c.id)) el.classList.add("disabled");
    el.onclick=()=>{
      if(deck.length>=8) return;
      if(deck.some(x=>x.id===c.id)) return;
      deck.push(c); saveAll(); renderDeck();
    };
    a.appendChild(el);
  });
}

/* ---------- UPGRADES ---------- */
function upgradeCost(l){return l*5;}

function renderUpgrades(){
  const u=document.getElementById("upgradeCards");
  document.getElementById("crownCount").innerText=crowns;
  u.innerHTML="";
  getAllCards().forEach(c=>{
    const l=levels[c.id];
    const el=cardBox(c,true);
    const b=document.createElement("button");
    b.innerText="Upgrade ("+upgradeCost(l)+" 👑)";
    b.disabled=crowns<upgradeCost(l);
    b.onclick=()=>{
      crowns-=upgradeCost(l);
      levels[c.id]++;
      saveAll(); renderUpgrades();
    };
    el.appendChild(b);
    u.appendChild(el);
  });
}

/* ---------- ADMIN ---------- */
function adminLogin(){
  if(prompt("Password")==="littlebrother6"){
    crowns=Number(prompt("Set crowns"));
    saveAll();
  }
}

/* ---------- BATTLE ---------- */
const canvas=document.getElementById("battlefield");
const ctx=canvas.getContext("2d");
canvas.width=900; canvas.height=600;

function drawArena(){
  const ar=arenas[selectedArena];
  ctx.fillStyle=ar.theme;
  ctx.fillRect(0,0,900,600);
  ctx.fillStyle="#2563eb";
  ctx.fillRect(0,280,900,40);
  ctx.fillStyle="#92400e";
  ctx.fillRect(430,250,40,100);
  ctx.fillRect(430,350,40,100);
  ctx.font="48px Arial";
  ctx.fillText("🏰",80,320);
  ctx.fillText("🏰",780,320);
}

/* ---------- CARD UI ---------- */
function cardBox(c){
  const l=levels[c.id];
  const d=document.createElement("div");
  d.className="card";
  if(l>=3)d.classList.add("red");
  if(l>=5)d.classList.add("purple");
  if(l>=10)d.classList.add("evo");
  d.innerHTML=`<div class="emoji">${c.emoji}</div>
  <div>${c.name}</div>
  <div>💧${c.cost}</div>
  <div>Lv ${l}</div>`;
  return d;
}
