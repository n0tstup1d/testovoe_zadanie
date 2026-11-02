(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Composer=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const aliases={book:['книг','учеб','учёб','знани','образован','чтен','читать','курс','обуч','book'],phone:['телефон','смартфон','онлайн','связ','приложен','цифров','phone'],puzzle:['пазл','команд','решени','вместе','сотруднич','сложн','совмест','puzzle'],coin:['монет','сбереж','накоп','инвест','ценност','безопас','coin'],headphones:['наушник','музык','аудио','звук','подкаст','слуш','headphones'],lamp:['ламп','иде','свет','рабоч','работ','вдохнов','lamp'],folder:['папк','документ','поряд','проект','организ','folder'],pen:['ручк','пис','запис','текст','договор','творч','pen'],wallet:['кошел','кошёл','бюджет','финанс','покуп','оплат','деньг','wallet'],flowers:['цвет','букет','ваз','подар','забот','уют','праздник','flowers']};
 const direct={book:['книг','book'],phone:['телефон','смартфон','phone'],puzzle:['пазл','puzzle'],coin:['монет','coin'],headphones:['наушник','headphones'],lamp:['ламп','lamp'],folder:['папк','folder'],pen:['ручк','pen'],wallet:['кошел','кошёл','wallet'],flowers:['цвет','букет','ваз','flowers']};
 const themes=[{keys:['обуч','учеб','учёб','образован','знани'],ids:['book','phone','pen'],label:'Обучение: книга, цифровой доступ и записи'},{keys:['финанс','бюджет','накоп','деньг','сбереж'],ids:['wallet','coin','phone'],label:'Финансы: кошелёк, сбережения и цифровые платежи'},{keys:['команд','сотруднич','вместе'],ids:['puzzle','phone','folder'],label:'Совместная работа: соединение деталей, связь и общий проект'},{keys:['творч','вдохнов','иде'],ids:['lamp','pen','book'],label:'Идеи: свет, запись и знания'},{keys:['музык','подкаст','аудио'],ids:['headphones','phone'],label:'Аудио: наушники и источник звука'},{keys:['подар','забот','праздник'],ids:['flowers','wallet'],label:'Подарок: цветы и покупка'}];
 function select(text,mode='metaphor'){
  const q=String(text).toLowerCase().replace(/ё/g,'е');const words=q.match(/[a-zа-я]+/g)||[];
  const explicitWords=q.replace(/цвет[а-я]*\s+в\s+ваз[а-я]*/g,'цветы').match(/[a-zа-я]+/g)||[];
  const explicit=explicitWords.map(w=>Object.keys(direct).find(id=>direct[id].some(s=>w.startsWith(s.replace(/ё/g,'е'))))).filter(Boolean);
  if(mode==='names'){
   const unknown=explicitWords.filter(w=>!['и','в','с','плюс'].includes(w)&&!Object.values(direct).some(stems=>stems.some(s=>w.startsWith(s.replace(/ё/g,'е')))));
   return {ids:explicit,reasons:explicit.map((id,i)=>(i+1)+'. '+id),unknown};
  }
  const keepRepeats=ids=>explicit.length!==new Set(explicit).size?[...explicit,...ids.filter(id=>!explicit.includes(id))].slice(0,Math.max(5,explicit.length)):ids;
  const found=[];const reasons=[];const dict=mode==='names'?direct:aliases;
  for(const [id,stems] of Object.entries(dict)){const stem=stems.find(s=>words.some(w=>w.startsWith(s.replace(/ё/g,'е'))));if(stem){found.push(id);reasons.push(id+': «'+stem+'…»');}}
  if(mode==='metaphor'){const theme=themes.find(t=>t.keys.some(k=>q.includes(k.replace(/ё/g,'е'))));if(theme){reasons.unshift(theme.label);return {ids:keepRepeats([...new Set([...theme.ids,...found])].slice(0,5)),reasons,unknown:[]};}}
  const unknown=mode==='names'?text.split(/[,;\n]+/).map(s=>s.trim()).filter(s=>s&&!Object.values(direct).some(stems=>stems.some(st=>s.toLowerCase().replace(/ё/g,'е').includes(st.replace(/ё/g,'е'))))):[];
  return {ids:keepRepeats(found.slice(0,5)),reasons,unknown};
 }
 function validatePalette(p){if(!p||!Array.isArray(p.backgroundTones)||!Array.isArray(p.objectAccents)||p.backgroundTones.length!==3||p.objectAccents.length!==3)throw Error('Нужны backgroundTones и objectAccents: по 3 HEX-цвета.');const hex=/^#[0-9a-f]{6}$/i;for(const c of [...p.backgroundTones,...p.objectAccents,p.ink||'#181817',p.paper||'#FFFFFF'])if(typeof c!=='string'||!hex.test(c))throw Error('Цвета должны иметь формат #RRGGBB.');return {id:'custom',name:'Своя палитра',backgroundTones:p.backgroundTones.map(c=>c.toUpperCase()),objectAccents:p.objectAccents.map(c=>c.toUpperCase()),ink:(p.ink||'#181817').toUpperCase(),paper:(p.paper||'#FFFFFF').toUpperCase()};}
 function recolor(svg,source,target){const map={};for(const key of ['backgroundTones','objectAccents'])source[key].forEach((c,i)=>map[c.toLowerCase()]=target[key][i]);map['#181817']=target.ink;map['black']=target.ink;map['white']=target.paper;map['#ffffff']=target.paper;return svg.replace(/\b(fill|stroke)=(['"])(#[0-9a-fA-F]{6}|white|black)\2/g,(all,key,quote,c)=>map[c.toLowerCase()]?key+'='+quote+map[c.toLowerCase()]+quote:all);}
 function resolve(lib,id,size,role){const a=lib.assets.find(a=>a.kind==='object'&&a.objectId===id&&a.size===size&&a.role===role);if(!a)throw Error('Нет варианта: '+[id,size,role].join('/'));return a;}
 function layout(lib,ids,options={}){
  const width=Number(options.width)||1200,height=Number(options.height)||630,size=options.size||'L';
  if(width<200||height<200||width>4000||height>4000)throw Error('Размер холста: от 200 до 4000.');if(!ids.length)throw Error('Выбери хотя бы один предмет.');if(ids.length>5)throw Error('Для автоматической композиции выбери до 5 предметов.');
  const variant=Number(options.variant)||0,style=options.style||'balanced';
  const entries=ids.map((id,i)=>{const instance=options.instances&&options.instances[i];const role=instance?instance.role:options.support&&i>0?'background':'main';return {asset:resolve(lib,id,size,role),id,role,instance};});
  // One scale for the complete set preserves relative dimensions. No per-object fit.
  const gap=80;let positions=[];let x=0,y=0,rowHeight=0;
  const portrait=height>width*1.15;const columns=width/height<1.3?Math.min(2,entries.length):Math.min(3,entries.length);
  entries.forEach((e,i)=>{if(i&&i%columns===0){y+=rowHeight*.78+gap;x=(variant%2)*90;rowHeight=0;}positions.push({x,y:y+((i+variant)%2)*70});x+=e.asset.width*.82+gap;rowHeight=Math.max(rowHeight,e.asset.height);});
  const minX=Math.min(...positions.map(p=>p.x)),minY=Math.min(...positions.map(p=>p.y));const maxX=Math.max(...positions.map((p,i)=>p.x+entries[i].asset.width)),maxY=Math.max(...positions.map((p,i)=>p.y+entries[i].asset.height));
  const area=style==='headline'?(portrait?{x:.08,y:.4,w:.84,h:.52}:{x:.44,y:.1,w:.5,h:.8}):style==='offset'?{x:.12,y:.1,w:.83,h:.82}:{x:.07,y:.08,w:.86,h:.84};
  const scale=Math.min(width*area.w/(maxX-minX),height*area.h/(maxY-minY));
  const left=width*area.x+(width*area.w-(maxX-minX)*scale)/2,top=height*area.y+(height*area.h-(maxY-minY)*scale)/2;
  const scene={width,height,size,scale,palette:options.palette||'lilac',style,items:entries.map((e,i)=>({uid:e.instance?e.instance.uid:'item-'+i,objectId:e.id,role:e.role,x:left+(positions[i].x-minX)*scale,y:top+(positions[i].y-minY)*scale,rotation:e.instance?e.instance.rotation:0})),background:true};
  if(!options.instances)scene.items.sort((a,b)=>(a.role==='main'?1:0)-(b.role==='main'?1:0));return scene;
 }
 function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
 function arrange(lib,previous,options={}){
  const locked=previous.items.filter(i=>i.locked);
  if(locked.length&&((options.width&&options.width!==previous.width)||(options.height&&options.height!==previous.height)||(options.size&&options.size!==previous.size)))throw Error('Сначала открепи предметы, чтобы изменить формат или детализацию.');
  const next=layout(lib,previous.items.map(i=>i.objectId),{...previous,...options,instances:previous.items});next.background=previous.background;
  next.items.forEach((i,n)=>i.locked=!!previous.items[n].locked);
  if(!locked.length)return next;
  next.scale=previous.scale;
  const bounds=i=>{const a=resolve(lib,i.objectId,next.size,i.role),w=a.width*next.scale,h=a.height*next.scale,t=i.rotation*Math.PI/180;const bw=Math.abs(Math.cos(t))*w+Math.abs(Math.sin(t))*h,bh=Math.abs(Math.sin(t))*w+Math.abs(Math.cos(t))*h;return {x:i.x+(w-bw)/2,y:i.y+(h-bh)/2,w:bw,h:bh};};
  const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  const obstacles=locked.map(bounds);
  next.items=next.items.map((i,n)=>i.locked?{...previous.items[n]}:i);
  for(const i of next.items.filter(i=>!i.locked)){
   const a=resolve(lib,i.objectId,next.size,i.role),w=a.width*next.scale,h=a.height*next.scale,preferred={x:i.x,y:i.y};let best=null;
   for(let row=0;row<9;row++)for(let col=0;col<9;col++){
    const candidate={...i,x:Math.max(0,next.width-w)*col/8,y:Math.max(0,next.height-h)*row/8};const b=bounds(candidate);
    const collision=obstacles.reduce((v,o)=>v+overlap(b,o),0)/(w*h);
    const outside=Math.max(0,-b.x)+Math.max(0,-b.y)+Math.max(0,b.x+b.w-next.width)+Math.max(0,b.y+b.h-next.height);
    const distance=Math.hypot(candidate.x-preferred.x,candidate.y-preferred.y)/Math.max(next.width,next.height);
    const score=collision*100+outside*10+distance;
    if(!best||score<best.score)best={candidate,score};
   }
   i.x=best.candidate.x;i.y=best.candidate.y;obstacles.push(bounds(i));
  }
  return next;
 }
 function namespace(svg,prefix){const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);for(const id of ids){const target=prefix+'-'+id;svg=svg.split('id="'+id+'"').join('id="'+target+'"').split('url(#'+id+')').join('url(#'+target+')').split('href="#'+id+'"').join('href="#'+target+'"');}return svg;}
 function body(svg){return svg.replace(/^\s*<\?xml[^>]*>\s*/,'').replace(/<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'');}
 function serialize(lib,scene,custom){
  const source=lib.palettes.find(p=>p.id==='lilac');const target=custom||lib.palettes.find(p=>p.id===scene.palette);if(!target)throw Error('Палитра не найдена.');
  const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" fill="none"><title>Композиция из исходной библиотеки</title>`];
  if(scene.background){const bg=lib.assets.find(a=>a.kind==='background'&&a.size===scene.size&&a.palette==='lilac');const s=Math.max(scene.width/bg.width,scene.height/bg.height);parts.push(`<g id="scene-background" transform="translate(${(scene.width-bg.width*s)/2} ${(scene.height-bg.height*s)/2}) scale(${s})">${body(namespace(recolor(bg.svg,source,target),'bg'))}</g>`);}
  for(const item of scene.items){const a=resolve(lib,item.objectId,scene.size,item.role);const w=a.width*scene.scale,h=a.height*scene.scale;parts.push(`<g id="${escape(item.uid)}" data-object="${escape(item.objectId)}" data-role="${escape(item.role)}" transform="translate(${item.x} ${item.y}) rotate(${item.rotation} ${w/2} ${h/2}) scale(${scene.scale})"><title>${escape(a.name)}</title>${body(namespace(recolor(a.svg,source,target),item.uid))}</g>`);}
  parts.push('</svg>');return parts.join('');
 }
 return {select,validatePalette,recolor,resolve,layout,arrange,serialize,aliases};
});
