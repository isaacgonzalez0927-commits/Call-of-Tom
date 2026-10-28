import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('function collide(');
const end=html.indexOf('function startMantle()',start);
assert.ok(start>=0&&end>start,'Collision functions exist');
const code=html.slice(start,end);
function world({obstacles=[],mantleSurfaces=[],online=false}={}){
 const ctx={obstacles,mantleSurfaces,campaignMode:online,realtimeServerUrl:online?'ws://test':'',islandRadius:77,Math,THREE:{MathUtils:{clamp:(v,a,b)=>Math.max(a,Math.min(b,v))}}};
 vm.createContext(ctx);vm.runInContext(code,ctx);return ctx;
}
test('castle walls block at ground level but not above their height',()=>{
 const w=world({obstacles:[{x:0,z:0,w:2,d:2,bottom:0,top:7}]});
 assert.equal(w.collide(0,0,.5,0),true);
 assert.equal(w.collide(0,0,.5,7.2),false);
});
test('walking through an open gate remains possible',()=>{
 const w=world({obstacles:[{x:-11,z:17,w:12,d:2.5,bottom:0,top:7},{x:11,z:17,w:12,d:2.5,bottom:0,top:7}]});
 assert.equal(w.collide(0,17,.52,0),false);
 assert.equal(w.collide(11,17,.52,0),true);
});
test('escaping a crate cannot pass through a separate wall',()=>{
 const crate={x:0,z:0,w:2,d:2,bottom:0,top:2};
 const wall={x:1.4,z:0,w:.5,d:4,bottom:0,top:7};
 const w=world({obstacles:[crate,wall],mantleSurfaces:[{x:0,z:0,w:2,d:2,top:2}]});
 const pos={x:.9,z:0};w.moveWithCollision(pos,.8,0,.2,1.9);
 assert.ok(pos.x<1.05,'wall should prevent passing through');
});
test('online players stay within their own square arena',()=>{
 const w=world({online:true});
 const pos={x:54.4,z:0};w.moveWithCollision(pos,3,0,.52,0);
 assert.ok(pos.x<=54.48);
 assert.equal(w.collide(55,0,.52,0),true);
});

test('three distinct menu entries keep story separate from online squads',()=>{
 assert.match(html,/id="start"[^>]*>[^<]*SOLO PRACTICE/);
 assert.match(html,/id="storyMenuButton"/);
 assert.match(html,/id="campaignMenuButton"/);
 assert.match(html,/id="storyPanel"/);
 assert.match(html,/id="campaignPanel"/);
 assert.match(html,/storyMenuButton'\)\.onclick/);
 assert.match(html,/campaignMenuButton'\)\.onclick=showCampaign/);
});

test('story progress is saved only after the chapter is completed',()=>{
 assert.match(html,/storyProgressKey='call-of-tom-story-progress-v1'/);
 assert.match(html,/localStorage\.setItem\(storyProgressKey,'chapter1'\)/);
 assert.match(html,/storyChapterComplete=true/);
 assert.match(html,/storyPanelRefresh\(\)/);
});
test('story mission retains three waves and a final boss',()=>{
 assert.match(html,/bossWave=storyMode \? wave===3/);
 assert.match(html,/wave===1\?7:wave===2\?11:13/);
 assert.match(html,/if\(storyMode&&wave>=3\)/);
});

test('Ricky follows only in story mode and blocks hits on a cooldown',()=>{
 assert.match(html,/ricky\.visible=storyMode&&active&&!dead/);
 assert.match(html,/rickyBlockReady=elapsed\+9/);
 assert.match(html,/amount=Math\.max\(0,amount\*\.35\)/);
 assert.match(html,/updateRicky\(dt\)/);
});
