const fs=require('node:fs'),path=require('node:path');
const dir=__dirname;const lib=JSON.parse(fs.readFileSync(path.join(dir,'assets/library.json'),'utf8'));
for(const a of lib.assets)a.svg=fs.readFileSync(path.join(dir,'assets',a.file),'utf8');
const escape=s=>s.replace(/<\/script/gi,'<\\/script');
const html=fs.readFileSync(path.join(dir,'src/ui.html'),'utf8').replace('/*__CORE__*/',()=>fs.readFileSync(path.join(dir,'src/core.js'),'utf8')).replace('/*__LIB__*/',()=>escape(JSON.stringify(lib))).replace('/*__APP__*/',()=>fs.readFileSync(path.join(dir,'src/app.js'),'utf8'));
fs.writeFileSync(path.join(dir,'ui.html'),html);fs.writeFileSync(path.join(dir,'demo.html'),html);fs.writeFileSync(path.join(dir,'index.html'),html);fs.copyFileSync(path.join(dir,'src/code.js'),path.join(dir,'code.js'));
console.log('Built self-contained demo.html, ui.html and code.js');
