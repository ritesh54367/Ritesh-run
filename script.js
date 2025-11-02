// Javi Run - with sound effects & collectibles
// Controls: Space / ArrowUp / Click / Touch

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const tokensEl = document.getElementById('tokens');
const overlay = document.getElementById('overlay');
const panelTitle = document.getElementById('panel-title');
const panelScore = document.getElementById('panel-score');
const btnRestart = document.getElementById('btn-restart');

let W = canvas.width;
let H = canvas.height;
function fitCanvas(){
  // keep canvas internal resolution fixed (good for pixel consistency)
  const ratio = Math.min(window.innerWidth - 40, 1000) / W;
  canvas.style.width = Math.floor(W * ratio) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// Assets (images + sounds)
const assets = {};
const sounds = {};
let bgmAudio = null;

function loadAssets(cb){
  const imageList = {
    javi: 'assets/javi.png',
    obstacle: 'assets/obstacle.png',
    bg1: 'assets/bg-layer1.png',
    bg2: 'assets/bg-layer2.png',
    token: 'assets/token.png'
  };

  const soundList = {
    jump: 'assets/jump.wav',
    collect: 'assets/collect.wav',
    hit: 'assets/hit.wav',
    bgm: 'assets/bgm.mp3'
  };

  const imageKeys = Object.keys(imageList);
  const soundKeys = Object.keys(soundList);
  let total = imageKeys.length + soundKeys.length;
  let loaded = 0;

  function checkDone(){
    if(++loaded === total){ cb(); }
  }

  if(imageKeys.length === 0 && soundKeys.length === 0) return cb();

  imageKeys.forEach(k=>{
    const img = new Image();
    img.src = imageList[k];
    img.onload = ()=> { assets[k]=img; checkDone(); }
    img.onerror = ()=> { assets[k]=null; checkDone(); }
  });

  soundKeys.forEach(k=>{
    const a = new Audio();
    a.src = soundList[k];
    a.preload = 'auto';
    a.addEventListener('canplaythrough', ()=>{
      sounds[k] = a;
      if(k === 'bgm'){ bgmAudio = a; bgmAudio.loop = true; }
      checkDone();
    }, {once:true});
    a.addEventListener('error', ()=>{ sounds[k]=null; checkDone(); });
  });

  // safety fallback in case some assets never fire event
  setTimeout(()=>{ if(loaded < total) cb(); }, 3000);
}

function playSound(name, vol = 0.9){
  try{
    const s = sounds[name];
    if(!s) return;
    const clone = s.cloneNode();
    clone.volume = Math.max(0, Math.min(1, vol));
    clone.play().catch(()=>{});
  }catch(e){}
}
function playBGM(){
  if(!bgmAudio) return;
  try{ bgmAudio.volume = 0.14; bgmAudio.play().catch(()=>{}); }catch(e){}
}
function stopBGM(){
  if(!bgmAudio) return;
  try{ bgmAudio.pause(); bgmAudio.currentTime = 0; }catch(e){}
}

// Game state
let player, obstacles, collectibles, bgLayers, score, tokensCount, speed, running, tick;

function rand(min,max){ return Math.random()*(max-min)+min }

function reset(){
  W = canvas.width; H = canvas.height;
  player = { x:80, y:H-100, w:56, h:56, vy:0, jumpPower:-12, grounded:true };
  obstacles = [];
  collectibles = [];
  bgLayers = [
    {img: assets.bg1, x:0, speed: 0.2, y:0},
    {img: assets.bg2, x:0, speed: 0.6, y:10}
  ];
  score = 0;
  tokensCount = 0;
  scoreEl.textContent = score;
  tokensEl.textContent = tokensCount;
  speed = 4;
  running = true;
  tick = 0;
  overlay.classList.add('hidden');
  panelTitle.textContent = 'Game Over';
  playBGM();
}

function spawnObstacle(){
  const h = 40 + Math.floor(rand(0, 40));
  const ob = { x: W + 80, y: H - 24 - h, w: 40, h: h, speed: speed };
  obstacles.push(ob);
}

function spawnCollectible(){
  const size = 28;
  const yPositions = [H - 140, H - 180, H - 100];
  const c = { x: W + 80, y: yPositions[Math.floor(rand(0,yPositions.length))], w:size, h:size, speed: speed };
  collectibles.push(c);
}

function update(){
  if(!running) return;
  tick++;

  bgLayers.forEach(layer=>{
    layer.x -= layer.speed * (speed/4);
    if(layer.img && layer.x <= -W) layer.x = 0;
  });

  player.vy += 0.6;
  player.y += player.vy;
  if(player.y + player.h >= H - 24){
    player.y = H - 24 - player.h;
    player.vy = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  for(let i=obstacles.length-1;i>=0;i--){
    obstacles[i].x -= speed + (tick/2000);
    if(obstacles[i].x + obstacles[i].w < -50) obstacles.splice(i,1);
  }

  for(let i=collectibles.length-1;i>=0;i--){
    collectibles[i].x -= speed + (tick/2000);
    if(collectibles[i].x + collectibles[i].w < -50) collectibles.splice(i,1);
  }

  for(const ob of obstacles){
    if(rectIntersect(player,ob)){
      playSound('hit', 0.9);
      stopBGM();
      gameOver();
    }
  }

  for(let i=collectibles.length-1;i>=0;i--){
    const c = collectibles[i];
    if(rectIntersect(player,c)){
      collectibles.splice(i,1);
      tokensCount += 1;
      tokensEl.textContent = tokensCount;
      score += 5;
      scoreEl.textContent = score;
      playSound('collect', 0.9);
      if(score % 50 === 0) speed += 0.2;
    }
  }

  if(tick % Math.max(60, 120 - Math.floor(score/10)) === 0){ spawnObstacle(); }
  if(tick % 220 === 0){ if(Math.random() < 0.7) spawnCollectible(); }

  if(tick % 6 === 0){ score += 1; scoreEl.textContent = score; if(score % 100 === 0) speed += 0.6; }
}

function draw(){
  ctx.clearRect(0,0,W,H);

  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, '#dff6ff');
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  bgLayers.forEach(layer=>{
    if(layer.img){
      const sx = Math.floor(layer.x % W);
      ctx.drawImage(layer.img, sx, layer.y, W, H);
      ctx.drawImage(layer.img, sx + W, layer.y, W, H);
    } else {
      ctx.fillStyle = 'rgba(14,57,107,0.04)';
      ctx.beginPath();
      ctx.ellipse(W*0.2 - (layer.x%200), H-60-layer.y, 220, 60, 0, 0, Math.PI*2);
      ctx.fill();
    }
  });

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, H-24, W, 24);
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(0,H-24);
  ctx.lineTo(W,H-24);
  ctx.stroke();

  if(assets.javi){
    ctx.drawImage(assets.javi, player.x, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = '#0f172a';
    roundRect(ctx, player.x, player.y, player.w, player.h, 10, true, false);
  }

  for(const ob of obstacles){
    if(assets.obstacle){
      ctx.drawImage(assets.obstacle, ob.x, ob.y, ob.w, ob.h);
    } else {
      ctx.fillStyle = '#0b1220';
      roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 6, true, false);
    }
  }

  for(const c of collectibles){
    if(assets.token){
      ctx.drawImage(assets.token, c.x, c.y, c.w, c.h);
    } else {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(c.x + c.w/2, c.y + c.h/2, c.w/2, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#f1c40f';
      ctx.stroke();
    }
  }
}

function rectIntersect(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function roundRect(ctx, x, y, w, h, r, fill, stroke){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if(fill) ctx.fill();
  if(stroke) ctx.stroke();
}

function gameOver(){
  running = false;
  panelScore.textContent = 'Score: ' + score + '  •  Tokens: ' + tokensCount;
  overlay.classList.remove('hidden');
  panelTitle.textContent = 'Game Over';
  playSound('hit', 0.95);
}

function jump(){
  if(!running) return;
  if(player.grounded || player.vy > -2){
    player.vy = player.jumpPower;
    player.grounded = false;
    playSound('jump', 0.7);
  }
}

window.addEventListener('keydown',(e)=>{ if(e.code === 'Space' || e.code === 'ArrowUp'){ e.preventDefault(); jump(); }});
canvas.addEventListener('click', ()=> jump());
canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); jump(); }, {passive:false});
btnRestart.addEventListener('click', ()=>{ reset(); });

function loop(){ update(); draw(); requestAnimationFrame(loop); }

loadAssets(()=>{
  reset();
  loop();
});
