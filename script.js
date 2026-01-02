const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let elixir = 10;
let troops = [];
let arrows = [];
let selectedCard = null;

// ================= TROOP =================
class Troop {
  constructor(x, y, team, emoji, hp, speed, damage, range) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.emoji = emoji;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.damage = damage;
    this.range = range;
    this.cooldown = 0;
  }

  update(enemies) {
    const target = enemies.find(e => Math.abs(e.x - this.x) < this.range);

    if (target) {
      if (this.cooldown <= 0) {
        target.hp -= this.damage;
        this.cooldown = 60;
      }
    } else {
      this.x += this.speed;
    }

    if (this.cooldown > 0) this.cooldown--;
  }

  draw() {
    ctx.font = "24px serif";
    ctx.fillText(this.emoji, this.x - 10, this.y + 10);

    // PURPLE HEALTH BAR
    ctx.fillStyle = "#b14cff";
    ctx.fillRect(
      this.x - 12,
      this.y - 18,
      (this.hp / this.maxHp) * 24,
      4
    );
  }
}

// ================= TOWER =================
class Tower {
  constructor(x, team, emoji, hp) {
    this.x = x;
    this.y = 200;
    this.team = team;
    this.emoji = emoji;
    this.hp = hp;
    this.maxHp = hp;
    this.range = 220;
    this.cooldown = 0;
  }

  update(targets) {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }

    const target = targets.find(t => Math.abs(t.x - this.x) < this.range);
    if (target) {
      arrows.push(new Arrow(this.x, this.y + 10, target));
      this.cooldown = 50;
    }
  }

  draw() {
    ctx.font = "40px serif";
    ctx.fillText(this.emoji, this.x - 20, this.y + 40);

    // PURPLE HEALTH BAR
    ctx.fillStyle = "#b14cff";
    ctx.fillRect(
      this.x - 20,
      this.y - 10,
      (this.hp / this.maxHp) * 40,
      6
    );
  }
}

// ================= PROJECTILE =================
class Arrow {
  constructor(x, y, target) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.hit = false;
  }

  update() {
    this.x += (this.target.x - this.x) * 0.15;
    this.y += (this.target.y - this.y) * 0.15;

    if (Math.abs(this.x - this.target.x) < 6) {
      this.target.hp -= 20;
      this.hit = true;
    }
  }

  draw() {
    ctx.font = "16px serif";
    ctx.fillText("🏹", this.x, this.y);
  }
}

// ================= TOWERS =================
const towers = [
  new Tower(40, "player", "🏰", 500),
  new Tower(120, "player", "👑", 800),
  new Tower(860, "enemy", "🏰", 500),
  new Tower(780, "enemy", "👑", 800)
];

// ================= CARD CLICK =================
document.querySelectorAll("#cards button").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedCard = {
      type: btn.dataset.type,
      cost: Number(btn.dataset.cost)
    };

    document
      .querySelectorAll("#cards button")
      .forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

// ================= PLACE TROOP =================
canvas.addEventListener("click", e => {
  if (!selectedCard || elixir < selectedCard.cost) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Player side only
  if (x > canvas.width / 2) return;

  elixir -= selectedCard.cost;

  let config = {
    knight: { emoji: "🗡️", hp: 180, speed: 1, dmg: 15 },
    archer: { emoji: "🏹", hp: 120, speed: 1.1, dmg: 12 },
    giant: { emoji: "🗿", hp: 350, speed: 0.5, dmg: 25 },
    pekka: { emoji: "🤖", hp: 250, speed: 0.8, dmg: 35 }
  }[selectedCard.type];

  troops.push(
    new Troop(
      x,
      y,
      "player",
      config.emoji,
      config.hp,
      config.speed,
      config.dmg,
      30
    )
  );

  selectedCard = null;
  document
    .querySelectorAll("#cards button")
    .forEach(b => b.classList.remove("selected"));
});

// ================= ENEMY AI =================
setInterval(() => {
  troops.push(
    new Troop(820, 260, "enemy", "👾", 160, -1, 14, 30)
  );
}, 3000);

// ================= GAME LOOP =================
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  towers.forEach(t => {
    t.draw();
    t.update(
      t.team === "player"
        ? troops.filter(e => e.team === "enemy")
        : troops.filter(e => e.team === "player")
    );
  });

  troops.forEach(t => {
    t.update(
      t.team === "player"
        ? troops.filter(e => e.team === "enemy")
        : troops.filter(e => e.team === "player")
    );
    t.draw();
  });

  arrows.forEach(a => {
    a.update();
    a.draw();
  });

  arrows = arrows.filter(a => !a.hit);
  troops = troops.filter(t => t.hp > 0);

  document.getElementById("elixir").innerText = "Elixir: " + elixir;

  requestAnimationFrame(gameLoop);
}

setInterval(() => {
  if (elixir < 10) elixir++;
}, 1000);

gameLoop();
