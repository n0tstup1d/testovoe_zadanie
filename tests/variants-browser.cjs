const {chromium}=require(process.env.COMPOSER_PLAYWRIGHT||'playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(require('node:url').pathToFileURL(path.join(__dirname,'../demo.html')).href);
assert.equal(await page.locator('.variant-card').count(),3);const imageSources=await page.locator('.variant-card img').evaluateAll(es=>es.map(e=>e.src));assert.equal(new Set(imageSources).size,3);
await page.getByRole('button',{name:'Выбрать вариант: Со смещением',exact:true}).click();assert.equal(await page.locator('#style').inputValue(),'offset');
await page.locator('#names').click();await page.locator('#prompt').fill('телефон, телефон, книга');await page.locator('#generate').click();
await page.locator('#layers button').filter({hasText:'Телефон'}).first().click();await page.locator('#rotation').fill('15');await page.locator('#rotation').press('Tab');
const pinnedId=await page.locator('#canvas g.selected').getAttribute('id'),before=await page.locator('#'+pinnedId).getAttribute('transform');
await page.locator('#lock').click();assert.ok(await page.locator('#x').isDisabled());assert.equal(await page.locator('#lock').getAttribute('aria-pressed'),'true');
await page.locator('#vary').click();assert.equal(await page.locator('.variant-card').count(),3);await page.getByRole('button',{name:'Выбрать вариант: Под заголовок',exact:true}).click();assert.equal(await page.locator('#'+pinnedId).getAttribute('transform'),before);
await page.locator('#format').selectOption('800x1200');assert.equal(await page.locator('#format').inputValue(),'1200x630');assert.match(await page.locator('#status').innerText(),/открепи/);
await page.locator('#generate').click();assert.match(await page.locator('#status').innerText(),/Открепи/);assert.equal(await page.locator('#canvas g[data-object="phone"]').count(),2);
// Project round-trip preserves the lock flag and the exact pinned transform.
await page.evaluate(()=>{window.__blobs=[];const original=URL.createObjectURL.bind(URL);URL.createObjectURL=b=>{window.__blobs.push(b);return original(b);};});await page.locator('#saveProject').click();const json=await page.evaluate(()=>window.__blobs.at(-1).text());assert.equal(JSON.parse(json).scene.items.find(i=>i.uid===pinnedId).locked,true);
await page.locator('#lock').click();await page.locator('#format').selectOption('800x1200');assert.equal(await page.locator('#format').inputValue(),'800x1200');
await page.locator('#projectInput').setInputFiles({name:'locked.json',mimeType:'application/json',buffer:Buffer.from(json)});await page.waitForFunction(()=>document.getElementById('status').textContent.includes('восстановлен'));assert.equal(await page.locator('#'+pinnedId).getAttribute('transform'),before);
await page.locator('#layers button').filter({hasText:'закреплён'}).click();assert.equal(await page.locator('#lock').getAttribute('aria-pressed'),'true');
const box=await page.locator('#'+pinnedId).boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+35,box.y+box.height/2+15);await page.mouse.up();assert.equal(await page.locator('#'+pinnedId).getAttribute('transform'),before);
await page.locator('#vary').click();await page.screenshot({path:path.join(__dirname,'../examples/variants-and-lock.png'),fullPage:true});assert.deepEqual(errors,[]);
console.log('PASS variants/locks: distinct previews, selection, exact pinned transform, disabled editing, guarded format/new prompt, JSON round-trip and drag lock.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
