const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ================= GAME STATE =================
let elixir = 10;
let troops = [];
let floatingTexts = [];
let gameStarted = false;
let timeRemaining = 0;

let draggingCard = null;
let pointerX = 0;
let pointerY = 0;
let selectedCard = null;

// ================= TIMER =================
const timerDisplay = document.getElementById("timer");
const timerButtons = document.querySelectorAll("#timer-options button");

timerButtons.forEach(btn => {
  btn.onclick = () => {
    timeRemaining = parseInt(btn.dataset.time);
    gameStarted = true;
    document.getElementById("timer-options").style.display = "none";
    updateTimer();
    startTimer();
  };
});

function updateTimer() {
  if (!gameStarted) {
    timerDisplay.innerText = "Set Time";
    return;
  }
  const m = Math.floor(timeRemaining / 60);
  const s = timeRemaining % 60;
  timerDisplay.innerText = `Time: ${m}:${s.toString().padStart(2,"0")}`;
}

function startTimer() {
  const interval = setInterval(() => {
    if (!gameStarted) return;
    if (timeRemaining <= 0) {
      gameStarted = false;
      clearInterval(interval);
      checkWinner();
      return;
    }
    timeRemaining--;
    updateTimer();
  }, 1000);
}

function checkWinner() {
  const player = towers.filter(t => t.team==="player").length;
  const enemy = towers.filter(t => t.team==="enemy").length;
  timerDisplay.innerText =
    player > enemy ? "You Win! 🏆" :
    enemy > player ? "You Lose 😢" :
    "Draw 🤝";
}

// ================= HELPERS =================
function distance(a,b){
  return Math.hypot(a.x-b.x,a.y-b.y);
}

// ================= TROOP =================
class Troop {
  constructor(x,y,team,emoji,hp,speed,dmg,range){
    this.x=x; this.y=y; this.team=team;
    this.emoji=emoji;
    this.hp=hp; this.maxHp=hp;
    this.speed=speed;
    this.damage=dmg;
    this.range=range;
    this.cooldown=0;
    this.attacking=false;
  }

  update(enemies,towers){
    if(!gameStarted) return;

    let target = enemies.sort((a,b)=>distance(this,a)-distance(this,b))[0];

    if(!target){
      target = towers
        .filter(t=>t.team!==this.team)
        .sort((a,b)=>distance(this,a)-distance(this,b))[0];
    }

    if(!target) return;

    const d = distance(this,target);

    if(d<=this.range){
      this.attack(target);
    } else {
      const ang = Math.atan2(target.y-this.y,target.x-this.x);
      this.x += Math.cos(ang)*Math.abs(this.speed);
      this.y += Math.sin(ang)*Math.abs(this.speed);
      this.attacking=false;
    }

    if(this.cooldown>0) this.cooldown--;
  }

  attack(target){
    this.attacking=true;
    if(this.cooldown<=0){
      target.hp -= this.damage;
      floatingTexts.push(new FloatingText(target.x,target.y-20,`-${this.damage}`));
      this.cooldown=45;
    }
  }

  draw(){
    ctx.font="24px serif";
    const shake=this.attacking?(Math.random()*4-2):0;
    ctx.fillText(this.emoji,this.x-12+shake,this.y+12+shake);
    ctx.fillStyle=this.team==="player"?"#b14cff":"#ff3333";
    ctx.fillRect(this.x-12,this.y-18,(this.hp/this.maxHp)*24,4);
  }
}

// ================= TOWER =================
class Tower {
  constructor(x,y,team,emoji,hp){
    this.x=x; this.y=y; this.team=team;
    this.emoji=emoji;
    this.hp=hp; this.maxHp=hp;
    this.range=220;
    this.cooldown=0;
  }

  update(targets){
    if(!gameStarted) return;
    if(this.cooldown>0){this.cooldown--;return;}
    const t = targets.sort((a,b)=>distance(this,a)-distance(this,b))[0];
    if(t && distance(this,t)<=this.range){
      t.hp -= 20;
      floatingTexts.push(new FloatingText(t.x,t.y-20,"-20"));
      this.cooldown=50;
    }
  }

  draw(){
    ctx.font="40px serif";
    ctx.fillText(this.emoji,this.x-20,this.y+40);
    ctx.fillStyle=this.team==="player"?"#b14cff":"#ff3333";
    ctx.fillRect(this.x-20,this.y-10,(this.hp/this.maxHp)*40,6);
  }
}

// ================= FLOATING TEXT =================
class FloatingText {
  constructor(x,y,text){
    this.x=x; this.y=y; this.text=text; this.alpha=1;
  }
  update(){ this.y-=0.5; this.alpha-=0.02; }
  draw(){
    ctx.globalAlpha=this.alpha;
    ctx.fillStyle="#ffd700";
    ctx.font="18px serif";
    ctx.fillText(this.text,this.x,this.y);
    ctx.globalAlpha=1;
  }
}

// ================= TOWERS =================
let towers = [
  new Tower(40,100,"player","🏰",500),
  new Tower(40,300,"player","🏰",500),
  new Tower(140,200,"player","👑",800),
  new Tower(860,100,"enemy","🏰",500),
  new Tower(860,300,"enemy","🏰",500),
  new Tower(760,200,"enemy","👑",800)
];

// ================= CARDS =================
const cardConfig = {
  knight:{emoji:"🗡️",hp:180,speed:1,dmg:15,cost:3},
  archer:{emoji:"🏹",hp:120,speed:1.1,dmg:12,cost:2},
  giant:{emoji:"🗿",hp:350,speed:0.6,dmg:25,cost:5},
  pekka:{emoji:"🤖",hp:250,speed:0.8,dmg:35,cost:5},
  wizard:{emoji:"🪄",hp:150,speed:1,dmg:20,cost:4},
  goblin:{emoji:"👺",hp:100,speed:1.5,dmg:10,cost:2}
};

// ================= CARD INPUT =================
document.querySelectorAll("#cards button").forEach(btn=>{
  const type=btn.dataset.type;
  btn.onclick=()=>{
    selectedCard={type,cost:cardConfig[type].cost};
    document.querySelectorAll("#cards button").forEach(b=>b.classList.remove("selected"));
    btn.classList.add("selected");
  };
  btn.onpointerdown=e=>{
    e.preventDefault();
    draggingCard={type,cost:cardConfig[type].cost};
  };
});

document.onpointermove=e=>{
  const r=canvas.getBoundingClientRect();
  pointerX=e.clientX-r.left;
  pointerY=e.clientY-r.top;
};

document.onpointerup=e=>{
  if(draggingCard) placeCard(e.clientX,e.clientY);
  draggingCard=null;
};

canvas.onclick=e=>placeCard(e.clientX,e.clientY);

function placeCard(cx,cy){
  if(!gameStarted) return;
  const r=canvas.getBoundingClientRect();
  const x=cx-r.left,y=cy-r.top;
  if(x>canvas.width/2) return;

  const card=draggingCard||selectedCard;
  if(!card||elixir<card.cost) return;
  elixir-=card.cost;

  const c=cardConfig[card.type];
  troops.push(new Troop(x,y,"player",c.emoji,c.hp,c.speed,c.dmg,30));
  selectedCard=null;
}

// ================= ENEMY AI =================
setInterval(()=>{
  if(!gameStarted) return;
  const keys=Object.keys(cardConfig);
  const t=keys[Math.floor(Math.random()*keys.length)];
  const c=cardConfig[t];
  troops.push(new Troop(820,Math.random()*400+50,"enemy",c.emoji,c.hp,-c.speed,c.dmg,30));
},2500);

// ================= LOOP =================
function loop(){
  ctx.fillStyle="#2e7c31";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  towers.forEach(t=>{
    t.draw();
    t.update(troops.filter(tr=>tr.team!==t.team));
  });

  troops.forEach(t=>t.update(
    troops.filter(e=>e.team!==t.team),
    towers
  ));

  // REMOVE DEAD TROOPS
  troops = troops.filter(t=>t.hp>0);

  // REMOVE DEAD TOWERS
  towers = towers.filter(t=>t.hp>0);

  troops.forEach(t=>t.draw());

  floatingTexts.forEach(f=>{f.update();f.draw();});
  floatingTexts=floatingTexts.filter(f=>f.alpha>0);

  if(draggingCard){
    ctx.globalAlpha=0.6;
    ctx.font="24px serif";
    ctx.fillText(cardConfig[draggingCard.type].emoji,pointerX-12,pointerY+12);
    ctx.globalAlpha=1;
  }

  document.getElementById("elixir").innerText="Elixir: "+elixir;
  requestAnimationFrame(loop);
}

setInterval(()=>{ if(elixir<10 && gameStarted) elixir++; },1000);
loop();
