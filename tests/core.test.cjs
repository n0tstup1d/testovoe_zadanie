const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),lib=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/library.json'),'utf8'));
for(const a of lib.assets)a.svg=fs.readFileSync(path.join(__dirname,'../assets',a.file),'utf8');
test('Three alternative layouts differ; locked items keep exact geometry and identity',()=>{
 const s=C.layout(lib,['phone','phone','book'],{support:true});
 const variants=['balanced','offset','headline'].map((style,variant)=>C.arrange(lib,s,{style,variant}));
 assert.equal(new Set(variants.map(v=>C.serialize(lib,v))).size,3);
 s.items[0].locked=true;s.items[0].x=25;s.items[0].y=35;s.items[0].rotation=15;
 const pinned={...s.items[0]},frozen=JSON.stringify(s);
 for(const style of ['balanced','offset','headline']){const v=C.arrange(lib,s,{style,variant:1});assert.deepEqual(v.items.find(i=>i.uid===pinned.uid),pinned);assert.equal(v.scale,s.scale);assert.equal(v.items.length,3);}
 assert.equal(JSON.stringify(s),frozen);
 assert.throws(()=>C.arrange(lib,s,{width:800,height:1200}),/открепи/);
 assert.throws(()=>C.arrange(lib,s,{size:'S'}),/открепи/);
});
test('Repeated mentions preserve counts and order for every object, in both input modes',()=>{
 for(const o of lib.objects)for(const mode of ['names','metaphor']){
  const r=C.select(o.name+', '+o.name,mode);assert.equal(r.ids.filter(id=>id===o.id).length,2,o.id+' '+mode);
 }
 assert.deepEqual(C.select('телефон телефон и книга','names').ids,['phone','phone','book']);
 assert.deepEqual(C.select('цветы в вазе, цветы в вазе','names').ids,['flowers','flowers']);
 assert.deepEqual(C.select('телефон, кошка','names').unknown,['кошка']);
 assert.throws(()=>C.layout(lib,C.select('телефон, телефон, телефон, телефон, телефон, телефон','names').ids),/до 5/);
});
test('Relayout keeps each repeated instance identity, role, rotation and layer order',()=>{
 let s=C.layout(lib,['phone','phone','book'],{support:true});s.items[0].rotation=25;
 const expected=s.items.map(({uid,objectId,role,rotation})=>({uid,objectId,role,rotation}));
 for(const size of ['S','L'])for(const [width,height] of [[1200,630],[1000,1000],[800,1200]]){
  s=C.layout(lib,s.items.map(i=>i.objectId),{size,width,height,instances:s.items,variant:1});
  assert.deepEqual(s.items.map(({uid,objectId,role,rotation})=>({uid,objectId,role,rotation})),expected);
  const svg=C.serialize(lib,s);assert.equal((svg.match(/data-object="phone"/g)||[]).length,2);
 }
});
test('Names select requested objects; unknown names and metaphors are not silently invented',()=>{assert.deepEqual(new Set(C.select('книга, лампа, телефон','names').ids),new Set(['book','lamp','phone']));assert.deepEqual(C.select('кошка','names').unknown,['кошка']);assert.equal(C.select('преломление времени').ids.length,0);assert.ok(C.select('обучение онлайн').ids.includes('book'));assert.ok(C.select('личный бюджет').ids.includes('wallet'));assert.ok(C.select('командная работа').ids.includes('puzzle'));});
test('All 40 variants are available and each rendered composition preserves geometry',()=>{for(const size of ['S','L'])for(const role of ['main','background'])for(const obj of lib.objects){const asset=C.resolve(lib,obj.id,size,role);const scene=C.layout(lib,[obj.id],{size});scene.items[0].role=role;const svg=C.serialize(lib,scene);for(const m of asset.svg.matchAll(/\bd="([^"]+)"/g))assert.ok(svg.includes('d="'+m[1]+'"'),obj.id+' path changed');assert.doesNotMatch(svg,/<image|<script|foreignObject/);}});
test('All layouts use a single scale, fit canvas, and reserve headline area',()=>{for(const size of ['S','L'])for(const [width,height] of [[1200,630],[1000,1000],[800,1200]])for(const style of ['balanced','offset','headline'])for(let count=1;count<=5;count++){const scene=C.layout(lib,lib.objects.slice(0,count).map(o=>o.id),{size,width,height,style,support:true});for(const i of scene.items){const a=C.resolve(lib,i.objectId,size,i.role);assert.ok(i.x>=0&&i.y>=0);assert.ok(i.x+a.width*scene.scale<=width+.001);assert.ok(i.y+a.height*scene.scale<=height+.001);if(style==='headline')assert.ok(height>width?i.y>=height*.4:i.x>=width*.44);}}});
test('Palette validation rejects invalid input, preserves paths, and forbids accent bleed into background',()=>{assert.throws(()=>C.validatePalette({backgroundTones:['red']}));const p=C.validatePalette({backgroundTones:['#111111','#222222','#333333'],objectAccents:['#444444','#555555','#666666']});const s=C.layout(lib,['book','phone'],{palette:'custom',support:true});const svg=C.serialize(lib,s,p);const background=svg.split('<g id="item-')[0];for(const c of p.objectAccents)assert.ok(!background.includes(c));assert.ok(svg.includes('#111111'));for(const old of lib.palettes[0].backgroundTones)assert.ok(!svg.includes('fill="'+old+'"'));});
test('Repeated objects get unique IDs and exports are deterministic',()=>{const s=C.layout(lib,['phone','phone'],{});const svg=C.serialize(lib,s);const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);assert.equal(svg,C.serialize(lib,s));});
test('Build outputs are self-contained and complete',()=>{const html=fs.readFileSync(path.join(__dirname,'../demo.html'),'utf8');assert.ok(!html.includes('/*__'));assert.ok(!/<script[^>]+src=/.test(html));const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../manifest.json'),'utf8'));for(const name of [m.main,m.ui])assert.ok(fs.existsSync(path.join(__dirname,'..',name)));});
