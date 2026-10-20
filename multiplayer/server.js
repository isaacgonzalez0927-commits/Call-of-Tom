// Call of Tom authoritative multiplayer server. Node 20+, npm install, npm start.
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { randomBytes } from 'node:crypto';
const PORT=Number(process.env.PORT)||8080;
const origins=(process.env.ALLOWED_ORIGINS||'https://calloftom.vercel.app,http://localhost:3000').split(',').map(x=>x.trim());
const squads=new Map(),clients=new Map(),COLORS=['Silver','Gold','Diamond','Emerald','Ruby'];
const levels=[null,{name:'BEACHHEAD ASSAULT',count:14,hp:2,speed:2.3},{name:'CASTLE SIEGE',count:23,hp:3,speed:3},{name:'TITAN SHOWDOWN',count:30,hp:4,speed:3.6}];
const send=(ws,obj)=>{if(ws?.readyState===1)ws.send(JSON.stringify(obj))};
const code=()=>randomBytes(5).toString('hex').slice(0,6).toUpperCase();
const safe=(v,lo,hi)=>Math.min(hi,Math.max(lo,Number(v)||0));
const publicSquad=s=>({code:s.code,host:s.host,status:s.status,stage:s.stage,players:[...s.players.values()].map(p=>({id:p.id,name:p.name,suit:p.suit,hp:p.hp,x:p.x,z:p.z})),completions:[],enemies:[...s.enemies.values()].map(e=>({id:e.id,x:e.x,z:e.z,hp:e.hp,max:e.max,type:e.type})),boss:s.boss});
function broadcast(s,obj){for(const p of s.players.values())send(p.ws,obj)}
function state(s){broadcast(s,{type:'state',squad:publicSquad(s)})}
function spawnLevel(s,level){
 s.stage=level;s.status='playing';s.enemies.clear();s.boss=null;s.bossDefeated=false;s.spawnLeft=levels[level].count;s.spawnTime=0;s.nextId=0;s.started=Date.now();s.last=Date.now();
 for(const p of s.players.values()){p.hp=100;p.x=0;p.z=0;p.lastShot=0}
 state(s);broadcast(s,{type:'level',level,name:levels[level].name})
}
function endSquad(s){squads.delete(s.code);for(const p of s.players.values())clients.delete(p.ws)}
const server=http.createServer((req,res)=>{
 res.setHeader('Access-Control-Allow-Origin',origins[0]);res.setHeader('Content-Type','application/json');
 if(req.url==='/health'){res.writeHead(200);return res.end(JSON.stringify({ok:true,squads:squads.size}))}
 res.writeHead(404);res.end(JSON.stringify({error:'Not found'}))
});
const wss=new WebSocketServer({server,maxPayload:4096,verifyClient:({origin},done)=>done(!origin||origins.includes(origin),403,'Origin not allowed')});
wss.on('connection',ws=>{
 ws.on('message',raw=>{
  let m;try{m=JSON.parse(raw)}catch{return send(ws,{type:'error',message:'Invalid JSON'})}
  if(typeof m!=='object'||!m)return;
  const attached=clients.get(ws);
  if(m.type==='create'){
   if(attached)return;let id=code()+code(),room=code();while(squads.has(room))room=code();
   const s={code:room,host:id,status:'lobby',stage:0,players:new Map(),enemies:new Map(),boss:null,spawnLeft:0,spawnTime:0,nextId:0,last:Date.now()};
   const p={id,name:'Player 1',suit:'Silver',ws,x:0,z:0,hp:100,lastShot:0};
   s.players.set(id,p);squads.set(room,s);clients.set(ws,{s,p});send(ws,{type:'joined',id,code:room});state(s);return;
  }
  if(m.type==='join'){
   if(attached)return;const s=squads.get(String(m.code||'').toUpperCase());
   if(!s||s.status!=='lobby'||s.players.size>=5)return send(ws,{type:'error',message:'Squad unavailable or full'});
   const suit=COLORS.find(c=>![...s.players.values()].some(p=>p.suit===c));
   const id=code()+code(),p={id,name:'Player '+(s.players.size+1),suit,ws,x:0,z:0,hp:100,lastShot:0};
   s.players.set(id,p);clients.set(ws,{s,p});send(ws,{type:'joined',id,code:s.code});state(s);return;
  }
  if(!attached)return send(ws,{type:'error',message:'Create or join a squad first'});
  const {s,p}=attached;s.last=Date.now();
  if(m.type==='select'){
   if(s.status!=='lobby'||!COLORS.includes(m.suit)||[...s.players.values()].some(q=>q!==p&&q.suit===m.suit))return send(ws,{type:'error',message:'Suit unavailable'});
   p.suit=m.suit;state(s);
  }else if(m.type==='start'){
   if(p.id!==s.host||s.players.size<2||s.status!=='lobby')return send(ws,{type:'error',message:'Host needs 2–5 players'});
   spawnLevel(s,1);
  }else if(m.type==='move'){
   if(s.status!=='playing'||p.hp<=0)return;
   const x=safe(m.x,-69,69),z=safe(m.z,-69,69);
   // Server-side speed clamp; clients cannot teleport around the map.
   const dt=Math.min(.25,Math.max(.016,(Date.now()-(p.lastMove||Date.now()))/1000));p.lastMove=Date.now();
   const dist=Math.hypot(x-p.x,z-p.z),max=19*dt;
   const k=dist>max?max/dist:1;p.x+=(x-p.x)*k;p.z+=(z-p.z)*k;
  }else if(m.type==='shoot'){
   if(s.status!=='playing'||p.hp<=0||Date.now()-p.lastShot<125)return;
   p.lastShot=Date.now();const dx=safe(m.dx,-1,1),dz=safe(m.dz,-1,1),mag=Math.hypot(dx,dz);if(mag<.5)return;
   const ux=dx/mag,uz=dz/mag;
   let best=null,dist=1e9;
   for(const e of s.enemies.values()){
    const ex=e.x-p.x,ez=e.z-p.z,t=ex*ux+ez*uz,perp=Math.abs(ex*uz-ez*ux);
    if(t>0&&t<35&&perp<1.25&&t<dist){best=e;dist=t}
   }
   if(best){best.hp--;broadcast(s,{type:'hit',enemy:best.id,x:best.x,z:best.z,hp:best.hp});if(best.hp<=0){s.enemies.delete(best.id);broadcast(s,{type:'kill',enemy:best.id})}}
   else if(s.boss){const e=s.boss,ex=e.x-p.x,ez=e.z-p.z,t=ex*ux+ez*uz;if(t>0&&t<42&&Math.abs(ex*uz-ez*ux)<4){e.hp--;broadcast(s,{type:'bossHit',hp:e.hp});if(e.hp<=0){s.boss=null;s.bossDefeated=true;broadcast(s,{type:'bossDead'})}}}
  }
 });
 ws.on('close',()=>{const info=clients.get(ws);if(!info)return;const {s,p}=info;clients.delete(ws);s.players.delete(p.id);if(s.host===p.id)s.host=s.players.keys().next().value;if(!s.players.size)endSquad(s);else{if(s.status==='playing')s.status='failed';state(s)}});
});
let prev=Date.now();
setInterval(()=>{
 const now=Date.now(),dt=Math.min(.1,(now-prev)/1000);prev=now;
 for(const s of squads.values()){
  if(now-s.last>7200000){endSquad(s);continue}
  if(s.status!=='playing')continue;
  const l=levels[s.stage],alive=[...s.players.values()].filter(p=>p.hp>0);
  if(!alive.length){s.status='failed';state(s);continue}
  s.spawnTime-=dt;
  if(s.spawnLeft>0&&s.spawnTime<=0){
   s.spawnTime=.65;s.spawnLeft--;const angle=Math.random()*Math.PI*2,r=23+Math.random()*13;
   const e={id:++s.nextId,x:Math.cos(angle)*r,z:Math.sin(angle)*r,hp:l.hp,max:l.hp,speed:l.speed,type:Math.random()<.15?'brute':Math.random()<.3?'scout':'normal',attackAt:now+1300};
   if(e.type==='brute'){e.hp+=3;e.max=e.hp;e.speed*=.6}if(e.type==='scout')e.speed*=1.5;
   s.enemies.set(e.id,e);broadcast(s,{type:'spawn',enemy:e});
  }
  if(s.stage===3&&s.spawnLeft===0&&!s.boss&&s.enemies.size===0&&!s.bossDefeated){
   s.boss={x:0,z:-33,hp:120,max:120,attackAt:now+1800};broadcast(s,{type:'bossSpawn',boss:s.boss});
  }
  for(const e of s.enemies.values()){
   const target=alive.reduce((best,p)=>Math.hypot(p.x-e.x,p.z-e.z)<Math.hypot(best.x-e.x,best.z-e.z)?p:best,alive[0]);
   const dx=target.x-e.x,dz=target.z-e.z,d=Math.hypot(dx,dz);
   if(d>1.7){e.x+=dx/d*e.speed*dt;e.z+=dz/d*e.speed*dt}
   else if(now>e.attackAt){e.attackAt=now+1200;target.hp=Math.max(0,target.hp-(e.type==='brute'?18:8));broadcast(s,{type:'damage',player:target.id,hp:target.hp})}
  }
  if(s.boss){
   const b=s.boss;if(now>b.attackAt){b.attackAt=now+3000;const target=alive[Math.floor(Math.random()*alive.length)];target.hp=Math.max(0,target.hp-20);broadcast(s,{type:'titanAttack',target:target.id,hp:target.hp})}
  }
  if(s.spawnLeft===0&&s.enemies.size===0&&!s.boss&&(s.stage!==3||s.bossDefeated)){
   if(s.stage===3){s.status='won';broadcast(s,{type:'victory'});state(s)}
   else spawnLevel(s,s.stage+1);
  }
  broadcast(s,{type:'snapshot',players:[...s.players.values()].map(p=>({id:p.id,x:p.x,z:p.z,hp:p.hp})),enemies:[...s.enemies.values()].map(e=>({id:e.id,x:e.x,z:e.z,hp:e.hp,type:e.type})),boss:s.boss,stage:s.stage,spawnLeft:s.spawnLeft});
 }
},100);
server.listen(PORT,()=>console.log('Call of Tom multiplayer server listening on '+PORT));
