/* ================= DASH ROYALE – PHASE 1 ================= */

/* ---------- CANVAS ---------- */
const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");
canvas.width = 900;
canvas.height = 600;

/* ---------- SCREENS ---------- */
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* ---------- CARD DATA ---------- */
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

/* ---------- DECK ---------- */
let deck = [];

/* ---------- SAVE / LOAD ---------- */
function saveDeck(){
  localStorage.setItem("dashRoyaleDeck", JSON.stringify(deck));
}
function loadDeck(){
  const d = JSON.parse(localStorage.getItem("dashRoyaleDeck"));
  if(d) deck = d;
}
loadDeck();

/* ---------- OPEN BUILDER ---------- */
function openDeckBuilder(){
  renderDeckBuilder();
  showScreen("deckBuilder");
}

/* ---------- RENDER ---------- */
function renderDeckBuilder(){
  const deckDiv = document.getElementById("deckSlots");
  const allDiv = document.getElementById("allCards");

  deckDiv.innerHTML="";
  allDiv.innerHTML="";

  // DECK SLOTS
  deck.forEach(card=>{
    const d=document.createElement("div");
    d.className="card";
    d.innerHTML=`
      <div class="emoji">${card.emoji}</div>
      <div class="name">${card.name}</div>
      <div class="cost">${card.cost}💧</div>
    `;
    d.onclick=()=>{
      deck = deck.filter(c=>c.id!==card.id);
      saveDeck();
      renderDeckBuilder();
    };
    deckDiv.appendChild(d);
  });

  // ALL CARDS
  allCards.forEach(card=>{
    const inDeck = deck.some(c=>c.id===card.id);
    const d=document.createElement("div");
    d.className="card";
    if(inDeck) d.classList.add("disabled");
    d.innerHTML=`
      <div class="emoji">${card.emoji}</div>
      <div class="name">${card.name}</div>
      <div class="cost">${card.cost}💧</div>
    `;
    d.onclick=()=>{
      if(deck.length>=8 || inDeck) return;
      deck.push(card);
      saveDeck();
      renderDeckBuilder();
    };
    allDiv.appendChild(d);
  });
}

/* ---------- GAME START (USES DECK) ---------- */
function startGame(){
  if(deck.length===0){
    alert("Build a deck first!");
    return;
  }
  showScreen("game");
  drawBattle();
}

/* ---------- SIMPLE BATTLE DRAW ---------- */
function drawBattle(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#4CAF50";
  ctx.fillRect(0,0,900,600);

  // show hand (first 4 cards of deck)
  deck.slice(0,4).forEach((c,i)=>{
    ctx.font="22px Arial";
    ctx.fillText(c.emoji, 120*i+40, 560);
    ctx.fillText(c.cost+"💧", 120*i+30, 585);
  });
}
