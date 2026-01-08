const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");

/* ================= CORE STATE ================= */
let currentScreen = "menu";
let currentArena = "Training Camp";
let crowns = 20;

/* ================= ARENAS ================= */
const arenas = [
  { name: "Training Camp", cost: 0, unlocked: true },
  { name: "Barbarian Bowl", cost: 10, unlocked: false },
  { name: "Forest Arena", cost: 20, unlocked: false },
  { name: "Frozen Peak", cost: 30, unlocked: false },
  { name: "Volcano Pit", cost: 40, unlocked: false }
];

/* ================= CARDS ================= */
const cards = [
  { id:1, name:"Knight", emoji:"🗡️", arena:"Training Camp", dmg:10 },
  { id:2, name:"Archer", emoji:"🏹", arena:"Training Camp", dmg:8 },
  { id:3, name:"Giant", emoji:"🗿", arena:"Training Camp", dmg:15 },
  { id:4, name:"Wizard", emoji:"🪄", arena:"Training Camp", dmg:12 },

  { id:5, name:"Barbarian", emoji:"🪓", arena:"Barbarian Bowl", dmg:11 },
  { id:6, name:"Baby Dragon", emoji:"🐉", arena:"Barbarian Bowl", dmg:13 }
];

/* ================= GAME OBJECTS ================= */
let unlockedCards = [];
let hand = [];
let units = [];
let towers = [];
let draggingCard = null;

/* ================= SAVE ================= */
function saveGame(){
  localStorage.setItem("dashRoyaleSave", JSON.stringify({
    crowns,
    arenas
  }));
}
function loadGame(){
  const s = JSON.parse(localStorage.getItem("dashRoyaleSave"));
  if(!s) return;
  crowns = s.crowns;
  s.arenas.forEach(a=>{
    const ar = arenas.find(x=>x.name===a.name);
    if(ar) ar.unlocked = a.unlocked;
  });
}

/* ================= SCREENS ================= */
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  currentScreen = id;
  if(id==="arenas") renderArenas();
  if(id==="game") startGame();
}
document.getElementById("playBtn").onclick=()=>showScreen("arenas");

/* ================= ARENAS UI ================= */
function renderArenas(){
  const list = document.getElementById("arenaList");
  list.innerHTML="";
  arenas.forEach(ar=>{
    const div=document.createElement("div");
    div.className="arenaCard";
    div.innerHTML=`
      <canvas width="120" height="70"></canvas>
      <h3>${ar.name}</h3>
      <p>${ar.unlocked?"Unlocked":ar.cost+" 👑"}</p>
      <button>${ar.unlocked?"PLAY":"BUY"}</button>
    `;
    drawArenaPreview(div.querySelector("canvas"), ar.name);
    div.querySelector("button").onclick=()=>{
      if(ar.unlocked){
        currentArena=ar.name;
        showScreen("game");
      } else if(crowns>=ar.cost){
        crowns-=ar.cost;
        ar.unlocked=true;
        saveGame();
        renderArenas();
      }
    };
    list.appendChild(div);
  });
}
function drawArenaPreview(c,name){
  const p=c.getContext("2d");
  p.fillStyle=name==="Barbarian Bowl"?"#c2a26a":"#4CAF50";
  p.fillRect(0,0,c.width,c.height);
  p.fillStyle="#1e90ff";
  p.fillRect(0,c.height/2-5,c.width,10);
}

/* ================= GAME START ================= */
function startGame(){
  units=[];
  unlockedCards = cards.filter(c=>{
    const ar = arenas.find(a=>a.name===c.arena);
    return ar && ar.unlocked;
  });
  hand = unlockedCards.slice(0,4);
  setupTowers();
}

/* ================= TOWERS ================= */
function setupTowers(){
  towers = [
    // PLAYER
    { x:200,y:canvas.height-120,hp:2352,max:2352,emoji:"🏰",side:"player",alive:true },
    { x:canvas.width-200,y:canvas.height-120,hp:2352,max:2352,emoji:"🏰",side:"player",alive:true },
    { x:canvas.width/2,y:canvas.height-180,hp:3096,max:3096,emoji:"👑",side:"player",alive:true },

    // ENEMY
    { x:200,y:120,hp:2352,max:2352,emoji:"🏰",side:"enemy",alive:true },
    { x:canvas.width-200,y:120,hp:2352,max:2352,emoji:"🏰",side:"enemy",alive:true },
    { x:canvas.width/2,y:180,hp:3096,max:3096,emoji:"👑",side:"enemy",alive:true }
  ];
}

/* ================= INPUT ================= */
canvas.addEventListener("mousedown",e=>{
  if(e.offsetY>canvas.height-90){
    draggingCard = hand[Math.floor(e.offsetX/120)];
  }
});
canvas.addEventListener("mouseup",e=>{
  if(draggingCard){
    units.push({
      emoji:draggingCard.emoji,
      x:e.offsetX,
      y:e.offsetY,
      dmg:draggingCard.dmg,
      side:"player",
      hp:100
    });
    rotateHand();
    draggingCard=null;
  }
});
let handIndex=0;
function rotateHand(){
  hand.shift();
  hand.push(unlockedCards[handIndex++%unlockedCards.length]);
}

/* ================= COMBAT ================= */
function towerAttack(){
  towers.forEach(t=>{
    if(!t.alive) return;
    const enemies = units.filter(u=>u.side!==t.side);
    if(!enemies.length) return;
    const target = enemies.reduce((a,b)=>
      Math.hypot(b.x-t.x,b.y-t.y)<Math.hypot(a.x-t.x,a.y-t.y)?b:a
    );
    target.hp -= 0.5;
  });
}

/* ================= DRAW ================= */
function drawArena(){
  ctx.fillStyle="#4CAF50";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#1e90ff";
  ctx.fillRect(0,canvas.height/2-20,canvas.width,40);
}
function drawTowers(){
  towers.forEach(t=>{
    if(!t.alive) return;
    ctx.font="36px Arial";
    ctx.fillText(t.emoji,t.x-18,t.y);
    ctx.fillStyle=t.side==="player"?"purple":"red";
    ctx.fillRect(t.x-30,t.y-40,60*(t.hp/t.max),6);
    ctx.fillStyle="white";
    ctx.fillText(Math.floor(t.hp),t.x-20,t.y-50);
    if(t.hp<=0){
      t.alive=false;
      if(t.emoji==="👑"){
        crowns+=3;
        alert("KING TOWER DOWN! YOU WIN!");
        showScreen("menu");
        saveGame();
      }
    }
  });
}

/* ================= LOOP ================= */
function update(){
  if(currentScreen==="game"){
    drawArena();
    towerAttack();
    drawTowers();

    units=units.filter(u=>u.hp>0);
    units.forEach(u=>{
      ctx.font="30px Arial";
      ctx.fillText(u.emoji,u.x,u.y);
      u.y -= u.side==="player"?0.3:-0.3;
    });

    hand.forEach((c,i)=>{
      ctx.fillText(c.emoji,20+i*120,canvas.height-40);
    });
  }
  requestAnimationFrame(update);
}

loadGame();
update();
