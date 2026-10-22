import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';

const port=18080+Math.floor(Math.random()*1000);
const url='ws://127.0.0.1:'+port;
const server=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url),env:{...process.env,PORT:String(port)},stdio:'pipe'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function connect(){
 for(let i=0;i<50;i++){
  try{return await new Promise((resolve,reject)=>{
   const ws=new WebSocket(url,{origin:'https://calloftom.vercel.app'});
   ws.once('open',()=>resolve(ws));ws.once('error',reject);
  })}catch{await sleep(100)}
 }
 throw Error('Multiplayer server did not start');
}
function inbox(ws){const queue=[];ws.on('message',raw=>queue.push(JSON.parse(raw)));return async(type,timeout=3000)=>{
 const end=Date.now()+timeout;
 while(Date.now()<end){
  const index=queue.findIndex(m=>m.type===type);
  if(index>=0)return queue.splice(index,1)[0];
  await sleep(20);
 }
 throw Error('Timed out waiting for '+type);
}}
test('lobby creation, joining, authorization and stage start',async()=>{
 const a=await connect(),b=await connect();
 try{
  const recvA=inbox(a),recvB=inbox(b);
  a.send(JSON.stringify({type:'create'}));const joined=await recvA('joined');
  assert.match(joined.code,/^[A-F0-9]{6}$/);
  b.send(JSON.stringify({type:'join',code:joined.code}));const joinedB=await recvB('joined');
  assert.equal(joinedB.code,joined.code);
  b.send(JSON.stringify({type:'start'}));const denied=await recvB('error');assert.match(denied.message,/Host/);
  a.send(JSON.stringify({type:'start'}));const level=await recvA('level');assert.equal(level.level,1);
  a.send(JSON.stringify({type:'move',x:999,z:999}));const snap=await recvA('snapshot');
  assert.ok(snap.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)));
 }finally{a.close();b.close()}
},{timeout:15000});
process.on('exit',()=>server.kill());
