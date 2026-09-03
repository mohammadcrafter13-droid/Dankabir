const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fa = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

const home = $("#homeScreen"), settings = $("#settingsScreen"), game = $("#gameScreen");
const canvas = $("#gameCanvas"), ctx = canvas.getContext("2d");

let config = {
  level:"medium", speed:5, sound:true, soundVol:80, music:true, musicVol:55, theme:"green"
};
let snake, food, dir, nextDir, score, highScore = Number(localStorage.getItem("snakeHighScore") || 0);
let timer = null, paused = false, cell = 30, cols = 30, rows = 21;

function show(screen){
  [home,settings,game].forEach(x=>x.classList.remove("active"));
  screen.classList.add("active");
}
$("#startBtn").onclick = startGame;
$("#settingsBtn").onclick = ()=>show(settings);
$("#gameSettingsBtn").onclick = ()=>{ stopLoop(); show(settings); };
$("#closeSettings").onclick = ()=>show(home);
$("#homeBtn").onclick = ()=>{ $("#gameOver").classList.add("hidden"); show(home); };

$$(".segmented button").forEach(b=>b.onclick=()=>{
  $$(".segmented button").forEach(x=>x.classList.remove("selected"));
  b.classList.add("selected"); config.level=b.dataset.level;
});
$("#speedRange").oninput=e=>config.speed=+e.target.value;
$("#soundToggle").onchange=e=>config.sound=e.target.checked;
$("#soundRange").oninput=e=>config.soundVol=+e.target.value;
$("#musicToggle").onchange=e=>config.music=e.target.checked;
$("#musicRange").oninput=e=>config.musicVol=+e.target.value;
$$(".theme").forEach(b=>b.onclick=()=>{
  $$(".theme").forEach(x=>x.classList.remove("selected")); b.classList.add("selected");
  config.theme=b.dataset.theme; document.body.className="theme-"+config.theme;
});
$("#resetSettings").onclick=()=>{
  config={level:"medium",speed:5,sound:true,soundVol:80,music:true,musicVol:55,theme:"green"};
  $("#speedRange").value=5; $("#soundToggle").checked=true; $("#soundRange").value=80;
  $("#musicToggle").checked=true; $("#musicRange").value=55;
  $$(".segmented button").forEach(x=>x.classList.toggle("selected",x.dataset.level==="medium"));
  $$(".theme").forEach(x=>x.classList.toggle("selected",x.dataset.theme==="green"));
  document.body.className="";
};

function setupCanvas(){
  const rect=canvas.getBoundingClientRect();
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=rect.width*dpr; canvas.height=rect.height*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  cell=Math.floor(Math.min(rect.width/30,rect.height/21));
  cols=Math.floor(rect.width/cell); rows=Math.floor(rect.height/cell);
}
function randomFood(){
  let p;
  do { p={x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows)} }
  while(snake.some(s=>s.x===p.x&&s.y===p.y));
  return p;
}
function startGame(){
  show(game); $("#gameOver").classList.add("hidden");
  setupCanvas();
  snake=[{x:Math.floor(cols/2),y:Math.floor(rows/2)}];
  for(let i=1;i<6;i++) snake.push({x:snake[0].x-i,y:snake[0].y});
  food=randomFood(); dir={x:1,y:0}; nextDir={x:1,y:0}; score=0; paused=false;
  $("#pauseBtn").textContent="Ⅱ  توقف بازی";
  updateScores(); startLoop(); draw();
}
function getDelay(){
  const base={easy:180,medium:125,hard:80}[config.level];
  return Math.max(45,base-(config.speed-5)*8);
}
function startLoop(){ clearInterval(timer); timer=setInterval(tick,getDelay()); }
function stopLoop(){clearInterval(timer);timer=null}
function tick(){
  if(paused)return;
  dir=nextDir;
  const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  if(head.x<0||head.x>=cols||head.y<0||head.y>=rows||snake.some(s=>s.x===head.x&&s.y===head.y)){
    gameOver(); return;
  }
  snake.unshift(head);
  if(head.x===food.x&&head.y===food.y){score++; food=randomFood(); beep(620); updateScores();}
  else snake.pop();
  draw();
}
function gameOver(){
  stopLoop();
  highScore=Math.max(highScore,score); localStorage.setItem("snakeHighScore",highScore);
  $("#finalScore").textContent=fa(score); $("#highScore").textContent=fa(highScore);
  $("#gameOver").classList.remove("hidden"); beep(180);
}
function updateScores(){
  $("#score").textContent=fa(score); $("#sideScore").textContent=fa(score); $("#highScore").textContent=fa(highScore);
}
function setDirection(name){
  const map={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
  const d=map[name]; if(d.x===-dir.x&&d.y===-dir.y)return; nextDir=d;
}
$$("[data-dir]").forEach(b=>b.onclick=()=>setDirection(b.dataset.dir));
document.addEventListener("keydown",e=>{
  const keys={ArrowUp:"up",w:"up",W:"up",ArrowDown:"down",s:"down",S:"down",ArrowLeft:"left",a:"left",A:"left",ArrowRight:"right",d:"right",D:"right"};
  if(keys[e.key]){e.preventDefault();setDirection(keys[e.key])}
  if(e.key===" "&&game.classList.contains("active")) togglePause();
});
$("#pauseBtn").onclick=togglePause;
function togglePause(){
  if(!game.classList.contains("active"))return;
  paused=!paused; $("#pauseBtn").textContent=paused?"▶  ادامه بازی":"Ⅱ  توقف بازی";
}
$("#restartBtn").onclick=startGame;

function draw(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle="#080a09";ctx.fillRect(0,0,w,h);
  ctx.strokeStyle="#151916";ctx.lineWidth=2;
  for(let x=0;x<=cols;x++){ctx.beginPath();ctx.moveTo(x*cell,0);ctx.lineTo(x*cell,rows*cell);ctx.stroke()}
  for(let y=0;y<=rows;y++){ctx.beginPath();ctx.moveTo(0,y*cell);ctx.lineTo(cols*cell,y*cell);ctx.stroke()}
  drawApple(food.x*cell+cell/2,food.y*cell+cell/2,cell*.33);
  snake.forEach((s,i)=>drawSegment(s.x*cell,s.y*cell,cell,i===0));
}
function drawSegment(x,y,size,head){
  const pad=2,r=Math.max(5,size*.22),w=size-pad*2;
  const grad=ctx.createLinearGradient(x,y,x,y+size);grad.addColorStop(0,"#91eb24");grad.addColorStop(1,"#45a90b");
  ctx.fillStyle=grad;roundRect(x+pad,y+pad,w,w,r);ctx.fill();
  ctx.shadowBlur=0;
  if(head){
    ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x+size*.38,y+size*.38,size*.13,0,Math.PI*2);ctx.arc(x+size*.67,y+size*.38,size*.13,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#14210d";ctx.beginPath();ctx.arc(x+size*.40,y+size*.39,size*.055,0,Math.PI*2);ctx.arc(x+size*.69,y+size*.39,size*.055,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#e63a2f";ctx.beginPath();ctx.moveTo(x+size*.98,y+size*.55);ctx.lineTo(x+size*1.15,y+size*.48);ctx.lineTo(x+size*.99,y+size*.62);ctx.fill();
  }
}
function drawApple(cx,cy,r){
  ctx.save();ctx.shadowColor="#000";ctx.shadowBlur=12;
  ctx.fillStyle="#e52c28";ctx.beginPath();ctx.arc(cx-r*.35,cy,r*.72,0,Math.PI*2);ctx.arc(cx+r*.35,cy,r*.72,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#62bd28";ctx.beginPath();ctx.ellipse(cx+r*.2,cy-r*.9,r*.55,r*.2,-.35,0,Math.PI*2);ctx.fill();ctx.restore();
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function beep(freq){
  if(!config.sound)return;
  try{const ac=new (window.AudioContext||window.webkitAudioContext)(),o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;g.gain.value=.025;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.07)}catch{}
}
window.addEventListener("resize",()=>{if(game.classList.contains("active")){setupCanvas();draw()}});
show(home);
