/*************************
  SAVE / LOAD
*************************/
let crowns = Number(localStorage.getItem("crowns")) || 0;
let currentArena = Number(localStorage.getItem("arena")) || 1;
let deck = JSON.parse(localStorage.getItem("deck")) || ["knight","archer","giant","goblin"];
let levels = JSON.parse(localStorage.getItem("levels")) || {};
let gameInterval = null;

function save(){
  localStorage.setItem("crowns",crowns);
  localStorage.setItem("arena",currentArena);
  localStorage.setItem("deck",JSON.stringify(deck));
  localStorage.setItem("levels",JSON.stringify(levels));
}

/*************************
  ARENAS
*************************/
const arenas = [
  {id:1,name:"Goblin Stadium",need:0,color:"#3bb273",
   cards:["knight","archer","goblin","skeleton","giant"]},
  {id:2,name:"Bone Pit",need:50,color:"#9ca3af",
   cards:["knight","archer","goblin","skeleton","giant","wizard","prince"]},
  {id:3,name:"Barbarian Bowl",need:120,color:"#d97706",
   cards:["knight","archer","goblin","skeleton","giant","wizard","prince","miniPekka","balloon"]}
];

/*************************
  CARDS
*************************/
const cards = {
  knight:{emoji:"🗡️",cost:3,hp:120,dmg:15,speed:0.6},
  archer:{emoji:"🏹",cost:2,hp:70,dmg:10,speed:0.7},
  goblin:{emoji:"👺",cost:2,hp:60,dmg:12,speed:0.9},
  skeleton:{emoji:"💀",cost:1,hp:40,dmg:8,speed:1},
  giant:{emoji:"🗿",cost:5,hp:300,dmg:25,speed:0.4},
  wizard:{emoji:"🪄",cost:4,hp:90,dmg:20,speed:0.6},
  prince:{emoji:"🐎",cost:4,hp:160,dmg:30,speed:0.8},
  miniPekka:{emoji:"🤖",cost:4,hp:140,dmg:35,speed:0.7},
  balloon:{emoji:"🎈",cost:5,hp:200,dmg:40,speed:0.5}
};

Object.keys(cards).forEach(c=>levels[c]=levels[c]||1);

/*************************
  UI NAV
*************************/
function hideAll(){
  menu.classList.add("hidden");
  gameScreen.classList.add("hidden");
  deckScreen.classList.add("hidden");
  upgradeScreen.classList.add("hidden");
}
function goMenu(){
  hideAll();
  menu.classList.remove("hidden");
  crownCount.innerText = `👑 ${crowns}`;
  drawArenas();
}

/*************************
  ARENA UI
*************************/
function drawArenas(){
  arenaContainer.innerHTML="";
  arenas.forEach(a=>{
    const d=document.createElement("div");
    d.className="arenaCard";
    if(crowns<a.need)d.classList.add("locked");
    if(a.id===currentArena)d.classList.add("active");
    d.innerHTML=`
      <div class="arenaMap" style="background:${a.color}"></div>
      <h3>${a.name}</h3>
      <p>${a.need===0?"Unlocked":a.need+" 👑"}</p>
    `;
    if(crowns>=a.need){
      d.onclick=()=>{currentArena=a.id;save();drawArenas();}
    }
    arenaContainer.appendChild(d);
  });
}

/*************************
  DECK BUILDER
*************************/
function openDeck(){
  hideAll();
  deckScreen.classList.remove("hidden");
  renderDeck();
}
function renderDeck(){
  activeDeck.innerHTML="";
  allCards.innerHTML="";
  deck.forEach(n=>drawDeckCard(n,true));
  arenas.find(a=>a.id===currentArena).cards.forEach(n=>{
    if(!deck.includes(n))drawDeckCard(n,false);
  });
}
function drawDeckCard(name,inDeck){
  const c=cards[name],lvl=levels[name];
  const d=document.createElement("div");
  d.className="bigCard";
  if(lvl>=5)d.classList.add("level-purple");
  else if(lvl>=3)d.classList.add("level-red");
  d.innerHTML=`
    <div class="emoji">${c.emoji}</div>
    <div class="name">${name.toUpperCase()}</div>
    <div class="level">Level ${lvl}</div>
    <div class="cost">${inDeck?"IN DECK":c.cost+" 💧"}</div>
  `;
  d.onclick=()=>{
    if(inDeck)deck=deck.filter(x=>x!==name);
    else if(deck.length<8)deck.push(name);
    save();renderDeck();
  };
  (inDeck?activeDeck:allCards).appendChild(d);
}

/*************************
  UPGRADES
*************************/
function openUpgrades(){
  hideAll();
  upgradeScreen.classList.remove("hidden");
  drawUpgrades();
}
function drawUpgrades(){
  upgradeContainer.innerHTML="";
  Object.keys(cards).forEach(n=>{
    const lvl=levels[n],cost=lvl*3;
    const d=document.createElement("div");
    d.className="bigCard";
    if(lvl>=5)d.classList.add("level-purple");
    else if(lvl>=3)d.classList.add("level-red");
    d.innerHTML=`
      <div class="emoji">${cards[n].emoji}</div>
      <div class="name">${n.toUpperCase()}</div>
      <div class="level">Level ${lvl}</div>
      <div class="cost">${cost} 👑</div>
    `;
    const b=document.createElement("button");
    b.innerText="Upgrade";
    b.onclick=()=>{
      if(crowns>=cost){
        crowns-=cost;
        levels[n]++;
        save();
        drawUpgrades();
      }
    };
    d.appendChild(b);
    upgradeContainer.appendChild(d);
  });
}

/*************************
  GAME CORE
*************************/
const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

let elixir=10;
let units=[];
let towers=[];
let scoreP=0,scoreE=0;
let timeLeft=180;

function startGame(){
  hideAll();
  gameScreen.classList.remove("hidden");
  resetGame();
  startTimer(180);
}

function resetGame(){
  units=[];
  towers=createTowers();
  scoreP=0;
  scoreE=0;
  elixir=10;
  buildHand();
}

/*************************
  TIMER
*************************/
function startTimer(seconds){
  clearInterval(gameInterval);
  timeLeft = seconds;
  updateTimerUI();
  gameInterval=setInterval(()=>{
    timeLeft--;
    updateTimerUI();
    if(timeLeft<=0){
      clearInterval(gameInterval);
      endGame();
    }
  },1000);
}
function updateTimerUI(){
  const m=Math.floor(timeLeft/60);
  const s=timeLeft%60;
  timer.innerText=`${m}:${s.toString().padStart(2,"0")}`;
}

/*************************
  END GAME
*************************/
function endGame(winner=null){
  let message="";
  if(winner==="player"){
    crowns += SCORE_TO_WIN;
    message = "You destroyed the King Tower! 👑 +3";
  }else if(winner==="enemy"){
    message = "Enemy destroyed your King Tower! 😢";
  }else if(scoreP>scoreE){
    crowns += scoreP;
    message = "You win! 👑 +" + scoreP;
  }else if(scoreE>scoreP){
    message = "You lose 😢";
  }else{
    message = "Draw!";
  }
  alert(message);
  save();
  goMenu();
}

/*************************
  TOWERS
*************************/
function createTowers(){
  return [
    {x:200,y:420,hp:400,team:"player",king:false},
    {x:700,y:420,hp:400,team:"player",king:false},
    {x:450,y:470,hp:700,team:"player",king:true},
    {x:200,y:100,hp:400,team:"enemy",king:false},
    {x:700,y:100,hp:400,team:"enemy",king:false},
    {x:450,y:50,hp:700,team:"enemy",king:true}
  ];
}

/*************************
  HAND / DRAG
*************************/
function buildHand(){
  hand.innerHTML="";
  deck.forEach(name=>{
    const c=cards[name];
    const d=document.createElement("div");
    d.className="card";
    d.draggable=true;
    d.innerHTML=`
      <div class="emoji">${c.emoji}</div>
      <div class="name">${name}</div>
      <div class="cost">${c.cost}💧</div>`;
    d.ondragstart=e=>e.dataTransfer.setData("card",name);
    hand.appendChild(d);
  });
}
canvas.ondragover=e=>e.preventDefault();
canvas.ondrop=e=>{
  const name=e.dataTransfer.getData("card");
  if(elixir<cards[name].cost)return;
  elixir-=cards[name].cost;
  units.push(createUnit(name,e.offsetX,e.offsetY,"player"));
};

/*************************
  UNITS
*************************/
function createUnit(name,x,y,team){
  const c=cards[name];
  return {
    name,emoji:c.emoji,team,
    x,y,
    hp:c.hp*levels[name],
    dmg:c.dmg*levels[name],
    speed:c.speed,
    target:null
  };
}

/*************************
  LOOP
*************************/
function loop(){
  drawMap();
  updateUnits();
  drawUnits();
  drawTowers();
  updateHUD();
  checkKingTowers();
  requestAnimationFrame(loop);
}
loop();

/*************************
  MAP
*************************/
function drawMap(){
  const a=arenas.find(x=>x.id===currentArena);
  ctx.fillStyle=a.color;
  ctx.fillRect(0,0,900,520);
  ctx.fillStyle="#2563eb";
  ctx.fillRect(0,240,900,40);
  ctx.fillStyle="#92400e";
  ctx.fillRect(250,240,60,40);
  ctx.fillRect(590,240,60,40);
}

/*************************
  HUD
*************************/
function updateHUD(){
  score.innerText=`👑 ${scoreP} - ${scoreE}`;
  elixirFill.style.width=(elixir/10*100)+"%";
}

/*************************
  DRAW
*************************/
function drawUnits(){
  units.forEach(u=>{
    ctx.font="26px serif";
    ctx.fillText(u.emoji,u.x,u.y);
  });
}
function drawTowers(){
  towers.forEach(t=>{
    ctx.fillStyle=t.team==="player"?"purple":"red";
    ctx.fillRect(t.x-20,t.y-20,40,40);
  });
}

/*************************
  UPDATE
*************************/
function updateUnits(){
  units.forEach(u=>{
    const enemies=units.filter(e=>e.team!==u.team);
    if(!u.target||u.target.hp<=0){
      u.target=enemies.sort((a,b)=>dist(u,a)-dist(u,b))[0];
    }
    if(u.target){
      if(dist(u,u.target)<30){
        u.target.hp-=u.dmg*0.02;
      }else{
        u.y+=u.team==="player"?-u.speed:u.speed;
      }
    }
  });
  units=units.filter(u=>u.hp>0);
}

/*************************
  KING TOWER CHECK
*************************/
function checkKingTowers(){
  const playerKing=towers.find(t=>t.team==="player"&&t.king);
  const enemyKing=towers.find(t=>t.team==="enemy"&&t.king);

  if(playerKing.hp<=0){
    endGame("enemy");
  }else if(enemyKing.hp<=0){
    endGame("player");
  }
}

/*************************
  UTILS
*************************/
function dist(a,b){
  return Math.hypot(a.x-b.x,a.y-b.y);
}

/*************************
  START
*************************/
goMenu();
