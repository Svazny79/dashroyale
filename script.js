/* ===== SCREENS ===== */
const menu = document.getElementById("menu");
const gameScreen = document.getElementById("gameScreen");
const deckScreen = document.getElementById("deckScreen");
const upgradeScreen = document.getElementById("upgradeScreen");

function showMenu(){menu.classList.remove("hidden");gameScreen.classList.add("hidden");deckScreen.classList.add("hidden");upgradeScreen.classList.add("hidden");updateCrownsUI()}
function showDeckBuilder(){deckScreen.classList.remove("hidden");menu.classList.add("hidden")}
function showUpgradeScreen(){upgradeScreen.classList.remove("hidden");menu.classList.add("hidden")}

/* ===== CROWNS ===== */
let crowns = Number(localStorage.getItem("crowns"))||0;
function updateCrownsUI(){document.getElementById("crownCount").innerText=`Crowns: ${crowns} 👑`}
function addCrowns(amount){crowns+=amount;localStorage.setItem("crowns",crowns);updateCrownsUI()}

/* ===== SET TIME ===== */
let timeLeft=180;
function setTime(t){timeLeft=t;document.getElementById("set-time-menu").classList.add("hidden")}

/* ===== CANVAS ===== */
const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

/* ===== GAME STATE ===== */
let elixir=10,maxElixir=10,gameOver=false,paused=false;
let playerCrowns=0,enemyCrowns=0;

/* ===== LANES ===== */
const lanes=[{x:260},{x:640}];

/* ===== CARDS ===== */
const cards={knight:{emoji:"🗡️",hp:300,dmg:25,speed:1,cost:3},
archer:{emoji:"🏹",hp:170,dmg:18,speed:1.2,cost:2},
giant:{emoji:"🗿",hp:650,dmg:35,speed:0.6,cost:5},
wizard:{emoji:"🪄",hp:260,dmg:32,speed:0.9,cost:4},
goblin:{emoji:"👺",hp:120,dmg:14,speed:1.6,cost:2},
skeleton:{emoji:"💀",hp:70,dmg:10,speed:1.8,cost:1},
fireball:{emoji:"🔥",spell:true,dmg:140,cost:4},
arrows:{emoji:"🏹",spell:true,dmg:90,cost:3}};

/* ===== DECK ===== */
let deck,hand;

/* ===== ENTITIES ===== */
let troops=[],towers=[],projectiles=[];

/* ===== TOWERS ===== */
function createTower(x,y,team,king=false){return {x,y,team,king,size:king?52:44,hp:king?1800:1000,maxHp:king?1800:1000,emoji:king?"👑":"🏰",cooldown:0}}
function resetTowers(){towers=[createTower(260,430,"player"),createTower(640,430,"player"),createTower(450,490,"player",true),
createTower(260,70,"enemy"),createTower(640,70,"enemy"),createTower(450,20,"enemy",true)]}

/* ===== RESET GAME ===== */
function resetGame(){timeLeft=180;elixir=10;gameOver=false;playerCrowns=0;enemyCrowns=0;troops=[];projectiles=[];resetTowers();deck=Object.keys(cards).sort(()=>Math.random()-0.5);hand=deck.splice(0,4);drawHand()}

/* ===== UI ===== */
const cardsDiv=document.getElementById("cards");
const scoreDiv=document.getElementById("score");
const timerDiv=document.getElementById("timer");
function drawHand(){cardsDiv.innerHTML="";hand.forEach(c=>{const d=document.createElement("div");d.className="card";if(elixir>=cards[c].cost)d.classList.add("ready");d.draggable=true;d.dataset.card=c;d.innerHTML=`${cards[c].emoji}<br>${cards[c].cost}`;cardsDiv.appendChild(d)})}

/* ===== DRAG & DROP ===== */
let dragged=null;
cardsDiv.addEventListener("dragstart",e=>{dragged=e.target.dataset.card});
canvas.addEventListener("dragover",e=>e.preventDefault());
canvas.addEventListener("drop",e=>{if(gameOver||paused)return;e.preventDefault();if(!dragged)return;const rect=canvas.getBoundingClientRect();const x=e.clientX-rect.left;const y=e.clientY-rect.top;if(y<260)return;const card=cards[dragged];if(elixir<card.cost)return;elixir-=card.cost;if(card.spell){castSpell(dragged,x,y)}else{const lane=x<450?0:1;troops.push({x:lanes[lane].x,y:y,lane,team:"player",emoji:card.emoji,hp:card.hp,maxHp:card.hp,dmg:card.dmg,speed:card.speed,cooldown:0})}deck.push(dragged);hand.shift();hand.push(deck.shift());drawHand();dragged=null})

/* ===== SPELLS ===== */
function castSpell(type,x,y){troops.forEach(t=>{if(Math.hypot(t.x-x,t.y-y)<70&&t.team==="enemy")t.hp-=cards[type].dmg});towers.forEach(t=>{if(Math.hypot(t.x-x,t.y-y)<80&&t.team==="enemy")t.hp-=cards[type].dmg})}

/* ===== ENEMY AI ===== */
setInterval(()=>{if(gameOver||paused)return;const pool=Object.keys(cards).filter(c=>!cards[c].spell);const c=pool[Math.floor(Math.random()*pool.length)];const lane=Math.random()<0.5?0:1;troops.push({x:lanes[lane].x,y:120,lane,team:"enemy",emoji:cards[c].emoji,hp:cards[c].hp,maxHp:cards[c].hp,dmg:cards[c].dmg,speed:cards[c].speed,cooldown:0})},3500);

/* ===== MAP ===== */
function drawMap(){ctx.fillStyle="#14532d";ctx.fillRect(0,0,900,520);ctx.fillStyle="#0284c7";ctx.fillRect(0,240,900,40);ctx.fillStyle="#8b4513";lanes.forEach(l=>{ctx.fillRect(l.x-25,240,50,40)})}

/* ===== DRAW ENTITY ===== */
function drawEntity(e){ctx.font=`${e.size||30}px serif`;ctx.textAlign="center";ctx.fillText(e.emoji,e.x,e.y+10);ctx.fillStyle=e.team==="player"?"#a855f7":"#ef4444";ctx.fillRect(e.x-25,e.y-(e.size||30),(e.hp/e.maxHp)*50,6)}

/* ===== PROJECTILES ===== */
function shoot(from,to){projectiles.push({x:from.x,y:from.y,tx:to.x,ty:to.y,dmg:45})}

/* ===== UPDATE ===== */
function updateTroop(t){const enemies=[...troops.filter(o=>o.team!==t.team&&o.lane===t.lane),...towers.filter(o=>o.team!==t.team)];if(!enemies.length){t.y+=t.team==="player"?-t.speed:t.speed;return}const target=enemies[0];const d=Math.hypot(t.x-target.x,t.y-target.y);if(d<36){if(t.cooldown<=0){target.hp-=t.dmg;t.cooldown=30}}else{const a=Math.atan2(target.y-t.y,target.x-t.x);t.x+=Math.cos(a)*t.speed;t.y+=Math.sin(a)*t.speed}t.cooldown--}
function updateTower(t){if(t.cooldown>0){t.cooldown--;return}const targets=troops.filter(o=>o.team!==t.team);if(!targets.length)return;shoot(t,targets[0]);t.cooldown=45}

/* ===== GAME LOOP ===== */
function loop(){ctx.clearRect(0,0,900,520);drawMap();if(!gameOver&&!paused){towers.forEach(updateTower);troops.forEach(updateTroop)}projectiles.forEach(p=>{const a=Math.atan2(p.ty-p.y,p.tx-p.x);p.x+=Math.cos(a)*6;p.y+=Math.sin(a)*6;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill()});troops.forEach(drawEntity);towers.forEach(drawEntity);troops=troops.filter(t=>t.hp>0);towers=towers.filter(t=>{if(t.hp<=0){if(t.king){gameOver=true;if(t.team==="enemy"){playerCrowns=3;addCrowns(5)}else{enemyCrowns=3;addCrowns(1)}scoreDiv.innerText=`👑 ${playerCrowns} - ${enemyCrowns}`;setTimeout(showMenu,2000)}else{t.team==="enemy"?playerCrowns++:enemyCrowns++}scoreDiv.innerText=`👑 ${playerCrowns} - ${enemyCrowns}`;return false}return true});document.getElementById("elixir-fill").style.width=(elixir/maxElixir*100)+"%";requestAnimationFrame(loop)}
loop();

/* ===== TIMERS ===== */
setInterval(()=>{if(!gameOver&&!paused&&elixir<maxElixir)elixir++;drawHand()},1000);
setInterval(()=>{if(!gameOver&&!paused&&timeLeft>0)timeLeft--;timerDiv.innerText=`${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,"0")}`},1000);

/* ===== PAUSE / RESTART ===== */
function pauseGame(){paused=!paused}
function restartGame(){resetGame();gameOver=false;paused=false}

/* ===== START ===== */
updateCrownsUI();
showMenu();
