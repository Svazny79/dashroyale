const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= GAME STATE ================= */
let started = false;
let timeLeft = 0;
let overtime = false;

let elixir = 10;
let enemyElixir = 10;
const maxElixir = 10;

let troops = [];
let towers = [];
let floating = [];

let selectedCard = null;
let dragging = false;
let dragPos = { x: 0, y: 0 };

/* ================= UI ================= */
const timer = document.getElementById("timer");
const elixirUI = document.getElementById("elixir");

/* ================= UTILS ================= */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* ================= FLOATING TEXT ================= */
class FloatText {
  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.t = text;
    this.a = 1;
  }
  update() {
    this.y -= 0.5;
    this.a -= 0.02;
  }
  draw() {
    ctx.globalAlpha = this.a;
    ctx.fillStyle = "#ffd700";
    ctx.fillText(this.t, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

/* ================= CARDS ================= */
const cards = {
  knight: { emoji: "🗡️", hp: 240, dmg: 20, speed: 1.2, range: 30, cost: 3 },
  archer: { emoji: "🏹", hp: 140, dmg: 15, speed: 1, range: 120, cost: 2 },
  wizard: { emoji: "🪄", hp: 180, dmg: 25, speed: 0.9, range: 140, cost: 4 },
  giant: { emoji: "🗿", hp: 450, dmg: 28, speed: 0.6, range: 32, cost: 5 },
  goblins: { emoji: "👺", hp: 90, dmg: 10, speed: 1.8, range: 24, cost: 2 },
  pekka: { emoji: "🤖", hp: 320, dmg: 45, speed: 0.7, range: 30, cost: 4 },
  fireball: { spell: true, dmg: 120, radius: 80, cost: 4 },
  arrows: { spell: true, dmg: 80, radius: 100, cost: 3 }
};

/* ================= TROOP ================= */
class Troop {
  constructor(x, y, team, c) {
    Object.assign(this, c);
    this.x = x;
    this.y = y;
    this.team = team;
    this.maxHp = this.hp;
    this.cool = 0;
  }
  update() {
    if (this.cool > 0) this.cool--;
    const enemies = troops.filter(t => t.team !== this.team)
      .concat(towers.filter(t => t.team !== this.team));
    if (!enemies.length) return;

    const target = enemies.sort((a,b)=>dist(this,a)-dist(this,b))[0];
    const d = dist(this, target);

    if (d <= this.range) {
      if (this.cool === 0) {
        target.hp -= this.dmg;
        floating.push(new FloatText(target.x, target.y, `-${this.dmg}`));
        this.cool = 30;
      }
    } else {
      const a = Math.atan2(target.y - this.y, target.x - this.x);
      this.x += Math.cos(a) * this.speed;
      this.y += Math.sin(a) * this.speed;
    }
  }
  draw() {
    ctx.font = "24px serif";
    ctx.fillText(this.emoji, this.x - 12, this.y + 12);
    ctx.fillStyle = this.team === "player" ? "#a855f7" : "#ef4444";
    ctx.fillRect(this.x - 12, this.y - 18, (this.hp / this.maxHp) * 24, 4);
  }
}

/* ================= TOWER ================= */
class Tower {
  constructor(x, y, team, king=false) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.hp = king ? 900 : 500;
    this.maxHp = this.hp;
    this.range = 220;
    this.cool = 0;
    this.king = king;
  }
  update() {
    if (this.cool > 0) this.cool--;
    const enemies = troops.filter(t => t.team !== this.team);
    if (!enemies.length) return;
    const t = enemies.sort((a,b)=>dist(this,a)-dist(this,b))[0];
    if (dist(this,t) <= this.range && this.cool===0) {
      t.hp -= 30;
      floating.push(new FloatText(t.x, t.y, "-30"));
      this.cool = 40;
    }
  }
  draw() {
    ctx.font = "36px serif";
    ctx.fillText(this.king ? "👑" : "🏰", this.x - 18, this.y + 18);
    ctx.fillStyle = this.team === "player" ? "#a855f7" : "#ef4444";
    ctx.fillRect(this.x - 20, this.y - 20, (this.hp/this.maxHp)*40, 5);
  }
}

/* ================= SPELL ================= */
function castSpell(x, y, c) {
  [...troops, ...towers].forEach(t => {
    if (dist({x,y}, t) <= c.radius) {
      t.hp -= c.dmg;
      floating.push(new FloatText(t.x, t.y, `-${c.dmg}`));
    }
  });
}

/* ================= INPUT (MOUSE + TOUCH) ================= */
function startDrag(card) {
  selectedCard = card;
  dragging = true;
}

document.querySelectorAll("#cards button").forEach(b => {
  b.onmousedown = () => startDrag(b.dataset.card);
  b.ontouchstart = e => {
    e.preventDefault();
    startDrag(b.dataset.card);
  };
});

function moveDrag(x, y) {
  dragPos.x = x;
  dragPos.y = y;
}

canvas.onmousemove = e => {
  const r = canvas.getBoundingClientRect();
  moveDrag(e.clientX - r.left, e.clientY - r.top);
};

canvas.ontouchmove = e => {
  const r = canvas.getBoundingClientRect();
  moveDrag(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
};

function dropCard() {
  if (!dragging || !selectedCard) return;
  const c = cards[selectedCard];
  if (elixir < c.cost) return;

  elixir -= c.cost;
  if (c.spell) castSpell(dragPos.x, dragPos.y, c);
  else if (dragPos.x < canvas.width/2)
    troops.push(new Troop(dragPos.x, dragPos.y, "player", c));

  dragging = false;
  selectedCard = null;
}

canvas.onmouseup = dropCard;
canvas.ontouchend = dropCard;

/* ================= TIMER ================= */
document.querySelectorAll("#timer-options button").forEach(b=>{
  b.onclick=()=>{
    timeLeft=parseInt(b.dataset.time);
    started=true;
    document.getElementById("timer-options").style.display="none";
  };
});

setInterval(()=>{
  if(!started||timeLeft<=0)return;
  timeLeft--;
  timer.innerText=`${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,"0")}`;
  if(timeLeft===0) overtime=true;
},1000);

/* ================= ELIXIR ================= */
setInterval(()=>{
  if(!started)return;
  elixir=Math.min(maxElixir,elixir+1);
  enemyElixir=Math.min(maxElixir,enemyElixir+1);
},1000);

/* ================= ENEMY AI ================= */
setInterval(()=>{
  if(!started||enemyElixir<3)return;
  enemyElixir-=3;
  troops.push(new Troop(850,220,"enemy",cards.knight));
},2500);

/* ================= SETUP ================= */
towers.push(
  new Tower(80,120,"player"),
  new Tower(80,330,"player"),
  new Tower(160,225,"player",true),
  new Tower(820,120,"enemy"),
  new Tower(820,330,"enemy"),
  new Tower(740,225,"enemy",true)
);

/* ================= LOOP ================= */
function loop(){
  ctx.fillStyle=overtime?"#4c1d1d":"#166534";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  towers.forEach(t=>t.update());
  troops.forEach(t=>t.update());

  troops=troops.filter(t=>t.hp>0);
  towers=towers.filter(t=>t.hp>0);

  towers.forEach(t=>t.draw());
  troops.forEach(t=>t.draw());

  floating.forEach(f=>{f.update();f.draw();});
  floating=floating.filter(f=>f.a>0);

  if(dragging && selectedCard && cards[selectedCard].emoji){
    ctx.font="28px serif";
    ctx.fillText(cards[selectedCard].emoji,dragPos.x-14,dragPos.y+14);
  }

  elixirUI.innerText=`Elixir: ${elixir}`;
  requestAnimationFrame(loop);
}

loop();
