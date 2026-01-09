/* ========= DASH ROYALE – PHASE 2 ========= */

/* ---------- SCREENS ---------- */
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* ---------- DATA ---------- */
const allCards = [
  {id:1,name:"Knight",emoji:"🗡️",cost:3},
  {id:2,name:"Archer",emoji:"🏹",cost:3},
  {id:3,name:"Giant",emoji:"🗿",cost:5},
  {id:4,name:"Wizard",emoji:"🪄",cost:4},
  {id:5,name:"Barbarian",emoji:"🪓",cost:4},
  {id:6,name:"Dragon",emoji:"🐉",cost:5},
  {id:7,name:"Elf",emoji:"🧝",cost:4},
  {id:8,name:"Ice Golem",emoji:"❄️",cost:4},
  {id:9,name:"Fire Spirit",emoji:"🔥",cost:2},
  {id:10,name:"Lava Hound",emoji:"🌋",cost:6}
];

/* ---------- SAVE ---------- */
let deck = JSON.parse(localStorage.getItem("deck")) || [];
let crowns = Number(localStorage.getItem("crowns")) || 0;
let levels = JSON.parse(localStorage.getItem("levels")) || {};

allCards.forEach(c=>{
  if(!levels[c.id]) levels[c.id]=1;
});

function saveAll(){
  localStorage.setItem("deck",JSON.stringify(deck));
  localStorage.setItem("crowns",crowns);
  localStorage.setItem("levels",JSON.stringify(levels));
}

/* ---------- MENU ---------- */
function startGame(){
  if(deck.length===0) return alert("Build a deck first!");
  showScreen("game");
  renderBattle();
}

function openDeckBuilder(){
  renderDeckBuilder();
  showScreen("deckBuilder");
}

function openUpgrades(){
  renderUpgrades();
  showScreen("upgrades");
}

/* ---------- DECK BUILDER ---------- */
function renderDeckBuilder(){
  const deckDiv=document.getElementById("deckSlots");
  const allDiv=document.getElementById("allCards");
  deckDiv.innerHTML="";
  allDiv.innerHTML="";

  deck.forEach(card=>{
    const d=cardBox(card);
    d.onclick=()=>{
      deck=deck.filter(c=>c.id!==card.id);
      saveAll(); renderDeckBuilder();
    };
    deckDiv.appendChild(d);
  });

  allCards.forEach(card=>{
    const d=cardBox(card);
    if(deck.some(c=>c.id===card.id)) d.classList.add("disabled");
    d.onclick=()=>{
      if(deck.length>=8) return;
      if(deck.some(c=>c.id===card.id)) return;
      deck.push(card);
      saveAll(); renderDeckBuilder();
    };
    allDiv.appendChild(d);
  });
}

/* ---------- UPGRADES ---------- */
function upgradeCost(lvl){ return lvl*5; }

function renderUpgrades(){
  const u=document.getElementById("upgradeCards");
  document.getElementById("crownCount").innerText=crowns;
  u.innerHTML="";

  allCards.forEach(card=>{
    const lvl=levels[card.id];
    const cost=upgradeCost(lvl);
    const d=cardBox(card,true);

    const info=document.createElement("div");
    info.innerHTML=`
      <div>Level ${lvl}${lvl>=10?" ⚡ EVO":""}</div>
      <button ${crowns<cost?"disabled":""}>Upgrade (${cost} 👑)</button>
    `;
    info.querySelector("button").onclick=()=>{
      if(crowns<cost) return;
      crowns-=cost;
      levels[card.id]++;
      if(levels[card.id]===11) levels[card.id]="EVO";
      saveAll();
      renderUpgrades();
    };

    d.appendChild(info);
    u.appendChild(d);
  });
}

/* ---------- ADMIN ---------- */
function adminLogin(){
  const p=prompt("Admin password");
  if(p==="littlebrother6"){
    const c=Number(prompt("Set crowns"));
    if(!isNaN(c)){ crowns=c; saveAll(); alert("Crowns updated"); }
  }
}

/* ---------- BATTLE ---------- */
const canvas=document.getElementById("battlefield");
const ctx=canvas.getContext("2d");
canvas.width=900; canvas.height=600;

function renderBattle(){
  ctx.clearRect(0,0,900,600);
  ctx.fillStyle="#3b82f6";
  ctx.fillRect(0,0,900,600);

  // towers
  ctx.font="50px Arial";
  ctx.fillText("🏰",100,300);
  ctx.fillText("🏰",800,300);

  // hand (4 rotating)
  deck.slice(0,4).forEach((c,i)=>{
    ctx.font="28px Arial";
    ctx.fillText(c.emoji,200+i*120,560);
    ctx.fillText("Lv "+levels[c.id],200+i*120,585);
  });
}

/* ---------- WIN ---------- */
function winBattle(){
  crowns+=3;
  saveAll();
  alert("You won! +3 👑");
  showScreen("menu");
}

/* ---------- CARD UI ---------- */
function cardBox(card,upgrade=false){
  const lvl=levels[card.id];
  const d=document.createElement("div");
  d.className="card";
  if(lvl>=3) d.classList.add("red");
  if(lvl>=5) d.classList.add("purple");
  if(lvl>=10) d.classList.add("evo");

  d.innerHTML=`
    <div class="emoji">${card.emoji}</div>
    <div class="name">${card.name}</div>
    <div class="cost">${card.cost}💧</div>
    ${upgrade?"":`<div class="lvl">Lv ${lvl}</div>`}
  `;
  return d;
}
