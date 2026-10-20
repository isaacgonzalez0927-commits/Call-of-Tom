// Vercel serverless squad API. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
const colors=['Silver','Gold','Diamond','Emerald','Ruby'];
const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
const fail=(res,status,message)=>res.status(status).json({error:message});
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode=()=>Array.from({length:6},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join('');
async function redis(command){
 const url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!url||!token)throw new Error('Multiplayer server not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.');
 const response=await fetch(url.replace(/\/$/,'')+'/'+command.map(encodeURIComponent).join('/'),{headers:{Authorization:'Bearer '+token}});
 const data=await response.json();if(!response.ok||data.error)throw Error(data.error||'Database unavailable');return data.result;
}
async function get(code){const raw=await redis(['GET','cot:squad:'+code]);return raw?JSON.parse(raw):null}
async function save(squad){squad.updated=Date.now();await redis(['SET','cot:squad:'+squad.code,JSON.stringify(squad),'EX',7200])}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
 if(req.method==='OPTIONS')return res.status(204).end();
 if(!['GET','POST'].includes(req.method))return fail(res,405,'Unsupported request');
 try{
  const data=req.method==='GET'?req.query:(typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body||{});
  const action=String(data.action||'state'),code=String(data.code||'').toUpperCase().trim(),id=String(data.id||'').slice(0,100);
  if(action==='create'){
   const newCode=randomCode(),player={id:String(data.id||'').slice(0,100),name:'Player 1',suit:'Silver',ready:false,last:Date.now(),x:0,z:0};
   if(!player.id)return fail(res,400,'Missing player ID');
   const squad={code:newCode,host:player.id,players:[player],stage:0,status:'lobby',completions:[],updated:Date.now()};
   await save(squad);return res.status(200).json({squad});
  }
  if(!/^[A-Z2-9]{6}$/.test(code))return fail(res,400,'Enter a six-character squad code');
  const squad=await get(code);if(!squad)return fail(res,404,'Squad not found or expired');
  if(action==='join'){
   if(squad.status!=='lobby')return fail(res,409,'Squad already started');
   if(!squad.players.some(p=>p.id===id)){
    if(squad.players.length>=5)return fail(res,409,'Squad full');
    const suit=colors.find(c=>!squad.players.some(p=>p.suit===c));squad.players.push({id,name:'Player '+(squad.players.length+1),suit,ready:false,last:Date.now(),x:0,z:0});
   }
  }else{
   const player=squad.players.find(p=>p.id===id);
   if(!player)return fail(res,403,'You are not in this squad');
   player.last=Date.now();
   if(action==='select'){
    if(squad.status!=='lobby')return fail(res,409,'Suits are locked after starting');
    if(!colors.includes(data.suit))return fail(res,400,'Unknown Tom');
    if(squad.players.some(p=>p.id!==id&&p.suit===data.suit))return fail(res,409,'That Tom is already taken');
    player.suit=data.suit;
   }else if(action==='start'){
    if(id!==squad.host)return fail(res,403,'Only the host can start');
    if(squad.players.length<2)return fail(res,409,'Need at least two players');
    squad.status='playing';squad.stage=1;squad.completions=[];
   }else if(action==='complete'){
    if(squad.status!=='playing')return fail(res,409,'Campaign is not active');
    if(Number(data.stage)!==squad.stage)return fail(res,409,'Level mismatch');
    if(!squad.completions.includes(id))squad.completions.push(id);
    if(squad.players.every(p=>squad.completions.includes(p.id))){
     if(squad.stage>=3)squad.status='won';else squad.stage++;
     squad.completions=[];
    }
   }else if(action==='position'){
    player.x=Math.max(-70,Math.min(70,Number(data.x)||0));player.z=Math.max(-70,Math.min(70,Number(data.z)||0));
   }else if(action==='leave'){
    squad.players=squad.players.filter(p=>p.id!==id);
    if(squad.host===id)squad.host=squad.players[0]?.id||null;
    if(!squad.players.length){await redis(['DEL','cot:squad:'+code]);return res.status(200).json({left:true})}
   }else if(action!=='state')return fail(res,400,'Unknown action');
  }
  await save(squad);return res.status(200).json({squad});
 }catch(err){return fail(res,503,String(err.message||err))}
}
