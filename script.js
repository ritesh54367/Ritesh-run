// Javi Run - simple canvas runner
// Controls: Space / ArrowUp / Click / Touch

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const overlay = document.getElementById('overlay');
const panelTitle = document.getElementById('panel-title');
const panelScore = document.getElementById('panel-score');
const btnRestart = document.getElementById('btn-restart');

let W, H;
function resizeCanvas(){
  const ratio = canvas.width / canvas.clientWidth;
  W = canvas.width;
  H = canvas.height;
  // nothing else needed -- we draw based on canvas resolution
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Assets (use images in /assets)
const assets = {};
function loadAssets(cb){
  const list = {
    javi: 'assets/javi.png',
    obstacle: 'assets/obstacle.png',
    bg1: 'assets/bg-layer1.png',
    bg2: 'assets/bg-layer2.png'
  };
  const keys = Object.keys(list);
  let loaded = 0;
  keys.forEach(k=>{
    const img = new Image();
    img.src = list[k];
    img.onload = ()=>{ assets[k]=img; if(++loaded===keys.length) cb() }
    img.onerror = ()=>{ assets[k]=null; if(++loaded===keys.length) cb() }
  });
}

// Game state
let player, obstacles, bgLayers, score, speed, running, tick;

// Helpers
function rand(min,max){ return Math.random()*(max-min)+min }

// Init
function reset(){
  player = {
    x: 80, y: H - 80, w: 48, h: 48,
    vy: 0, jumpPower: -12, grounded: true
  };
  obstacles = [];
  bgLayers = [
    {img: assets.bg1, x:0, speed: 0.2, y:0},
    {img: assets.bg2, x:0, speed: 0.6, y:10}
  ];
  score = 0;
  speed = 4;
  running = true;
  tick = 0;
  overlay.classList.add('hidden');
  panelTitle.textContent = 'Game Over';
}

function spawnObstacle(){
  const h = 40 + Math.floor(rand(0, 30));
  const obs = {
    x: W + 60,
    y: H - 60 - (h - 40),
    w: 40,
    h: h,
    speed: speed
  };
  obstacles.push(obs);
}

// Physics and draw
function update(){
  if(!running) return;

  tick++;
  // Parallax backgrounds
  bgLayers.forEach(layer=>{
    layer.x -= layer.speed * (speed/4);
    if(layer.img && layer.x <= -W) layer.x = 0;
  });

  // Player physics
  player.vy += 0.6; // gravity
  player.y += player.vy;
  if(player.y + player.h >= H - 24){
    player.y = H - 24 - player.h;
    player.vy = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  // Obstacles
  for(let i=obstacles.length-1;i>=0;i--){
    obstacles[i].x -= speed + (tick/2000);
    if(obstacles[i].x + obstacles[i].w < -50) obstacles.splice(i,1);
  }

  // Collision
  for(const ob of obstacles){
    if(rectIntersect(player,ob)){
      gameOver();
    }
  }

  // Spawn logic
  if(tick % Math.max(60, 120 - Math.floor(score/10)) === 0){
    spawnObstacle();
  }

  // Score + ramp speed
  if(tick % 6 === 0) {
    score += 1;
    scoreEl.textContent = score;
    if(score % 100 === 0) speed += 0.6;
  }
}

function draw(){
  // clear
  ctx.clearRect(0,0,W,H);

  // sky gradient
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, '#dff6ff');
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // background images (parallax)
  bgLayers.forEach(layer=>{
    if(layer.img){
      // draw two copies for seamless scroll
      const sx = Math.floor(layer.x % W);
      ctx.drawImage(layer.img, sx, layer.y, W, H);
      ctx.drawImage(layer.img, sx + W, layer.y, W, H);
    } else {
      // fallback decorative hills
      ctx.fillStyle = 'rgba(14, 57, 107, 0.06)';
      ctx.beginPath();
      ctx.ellipse(W*0.2 - (layer.x%200), H-60-layer.y, 220, 60, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(W*0.7 - (layer.x%300), H-70-layer.y, 300, 70, 0, 0, Math.PI*2);
      ctx.fill();
    }
  });

  // ground
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, H-24, W, 24);
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(0,H-24);
  ctx.lineTo(W,H-24);
  ctx.stroke();

  // player (Javi)
  if(assets.javi){
    ctx.drawImage(assets.javi, player.x, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = '#0f172a';
    roundRect(ctx, player.x, player.y, player.w, player.h, 8, true, false);
  }

  // obstacles
  for(const ob of obstacles){
    if(assets.obstacle){
      ctx.drawImage(assets.obstacle, ob.x, ob.y - (ob.h - 40), ob.w, ob.h);
    } else {
      ctx.fillStyle = '#0b1220';
      roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 6, true, false);
    }
  }
}

// Utility
function rectIntersect(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function roundRect(ctx, x, y, w, h, r, fill, stroke){
  if (typeof stroke === 'undefined') { stroke = true; }
  if (typeof r === 'undefined') { r = 5; }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if(fill){ ctx.fill(); }
  if(stroke){ ctx.stroke(); }
}

function gameOver(){
  running = false;
  panelScore.textContent = 'Score: ' + score;
  overlay.classList.remove('hidden');
  panelTitle.textContent = 'Game Over';
}

// Input handling
function jump(){
  if(!running) return;
  if(player.grounded || player.vy > -2){
    player.vy = player.jumpPower;
    player.grounded = false;
  }
}
window.addEventListener('keydown',(e)=>{ if(e.code === 'Space' || e.code === 'ArrowUp'){ e.preventDefault(); jump(); }});
canvas.addEventListener('click', ()=> jump());
canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); jump(); }, {passive:false});
btnRestart.addEventListener('click', ()=>{ reset(); });

// Game loop
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

// Start
loadAssets(()=>{ reset(); loop(); });
