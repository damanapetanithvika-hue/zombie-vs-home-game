const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const healthEl = document.getElementById("homeHealth");
const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const messageEl = document.getElementById("message");

const home = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 42,
  health: 100,
};

const player = {
  x: canvas.width / 2,
  y: canvas.height - 110,
  radius: 14,
  speed: 3.4,
  angle: 0,
  cooldown: 0,
};

const bullets = [];
const zombies = [];
const keys = {};
const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

let score = 0;
let wave = 1;
let lastTime = 0;
let spawnTimer = 0;
let started = false;
let gameOver = false;

function setMessage(title, text, visible = true) {
  messageEl.innerHTML = `<h2>${title}</h2><p>${text}</p>`;
  messageEl.classList.toggle("visible", visible);
}

function startGame() {
  if (started) return;
  started = true;
  messageEl.classList.remove("visible");
}

function resetGame() {
  home.health = 100;
  player.x = canvas.width / 2;
  player.y = canvas.height - 110;
  player.cooldown = 0;
  score = 0;
  wave = 1;
  bullets.length = 0;
  zombies.length = 0;
  spawnTimer = 1200;
  started = false;
  gameOver = false;
  updateHud();
  setMessage("Defend the Home", "Move with WASD or Arrow Keys. Aim with the mouse. Click to shoot.<br>Press any movement key to start.", true);
}

function updateHud() {
  healthEl.textContent = Math.max(0, home.health);
  scoreEl.textContent = score;
  waveEl.textContent = wave;
}

function movePlayer() {
  if (!started || gameOver) return;

  const left = keys["a"] || keys["arrowleft"];
  const right = keys["d"] || keys["arrowright"];
  const up = keys["w"] || keys["arrowup"];
  const down = keys["s"] || keys["arrowdown"];

  if (left) player.x -= player.speed;
  if (right) player.x += player.speed;
  if (up) player.y -= player.speed;
  if (down) player.y += player.speed;

  player.x = Math.max(18, Math.min(canvas.width - 18, player.x));
  player.y = Math.max(18, Math.min(canvas.height - 18, player.y));

  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
}

function shoot() {
  if (!started || gameOver) return;
  if (player.cooldown > 0) return;

  player.cooldown = 180;

  bullets.push({
    x: player.x + Math.cos(player.angle) * 18,
    y: player.y + Math.sin(player.angle) * 18,
    dx: Math.cos(player.angle) * 7.5,
    dy: Math.sin(player.angle) * 7.5,
    radius: 4,
  });
}

function spawnZombie() {
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = Math.random() * canvas.width;
    y = -18;
  } else if (side === 1) {
    x = canvas.width + 18;
    y = Math.random() * canvas.height;
  } else if (side === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height + 18;
  } else {
    x = -18;
    y = Math.random() * canvas.height;
  }

  zombies.push({
    x,
    y,
    radius: 12 + Math.random() * 6,
    speed: 0.82 + wave * 0.18 + Math.random() * 0.35,
  });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;

    if (
      bullet.x < -20 ||
      bullet.x > canvas.width + 20 ||
      bullet.y < -20 ||
      bullet.y > canvas.height + 20
    ) {
      bullets.splice(i, 1);
      continue;
    }

    for (let j = zombies.length - 1; j >= 0; j--) {
      const zombie = zombies[j];
      const dx = bullet.x - zombie.x;
      const dy = bullet.y - zombie.y;
      const dist = Math.hypot(dx, dy);

      if (dist < bullet.radius + zombie.radius) {
        zombies.splice(j, 1);
        bullets.splice(i, 1);
        score += 10;
        break;
      }
    }
  }
}

function updateWave() {
  wave = Math.floor(score / 100) + 1;
}

function updateZombies() {
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    const dx = home.x - zombie.x;
    const dy = home.y - zombie.y;
    const dist = Math.hypot(dx, dy) || 1;

    zombie.x += (dx / dist) * zombie.speed;
    zombie.y += (dy / dist) * zombie.speed;

    if (dist < home.radius + zombie.radius) {
      zombies.splice(i, 1);
      home.health -= 10;
      if (home.health <= 0) {
        home.health = 0;
        gameOver = true;
        started = false;
        setMessage("Game Over", `The home fell. Final score: ${score}.<br>Press R to restart.`, true);
      }
    }
  }
}

function update(dt) {
  if (gameOver) {
    return;
  }

  if (started) {
    player.cooldown = Math.max(0, player.cooldown - dt);
    movePlayer();
    updateBullets();
    updateZombies();
    updateWave();

    spawnTimer -= dt;
    const spawnInterval = Math.max(350, 1150 - wave * 55);
    if (spawnTimer <= 0) {
      const count = 1 + Math.min(4, Math.floor(wave / 2));
      for (let i = 0; i < count; i++) {
        spawnZombie();
      }
      spawnTimer = spawnInterval;
    }
  }

  updateHud();
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#294d33";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground details
  for (let i = 0; i < 15; i++) {
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
    ctx.fillRect(i * 72, 0, 20, canvas.height);
  }
}

function drawHome() {
  ctx.fillStyle = "#a96d42";
  ctx.beginPath();
  ctx.arc(home.x, home.y, home.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#704521";
  ctx.fillRect(home.x - 20, home.y - 18, 40, 36);
  ctx.fillRect(home.x - 8, home.y - 4, 16, 26);

  // Health ring
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(home.x, home.y, home.radius + 10, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  ctx.fillStyle = "#69d2e7";
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#d9f7ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(20, 0);
  ctx.stroke();

  ctx.restore();
}

function drawBullets() {
  ctx.fillStyle = "#f4ec6a";
  for (const bullet of bullets) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawZombies() {
  ctx.fillStyle = "#79c06b";
  for (const zombie of zombies) {
    ctx.beginPath();
    ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  drawBackground();
  drawHome();
  drawBullets();
  drawZombies();
  drawPlayer();
}

function loop(timestamp) {
  const dt = timestamp - lastTime || 16;
  lastTime = timestamp;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (key === "r" && gameOver) {
    resetGame();
    return;
  }

  if (!started && !gameOver) {
    startGame();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
});

canvas.addEventListener("click", () => {
  shoot();
});

window.addEventListener("blur", () => {
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
});

resetGame();
requestAnimationFrame(loop);

