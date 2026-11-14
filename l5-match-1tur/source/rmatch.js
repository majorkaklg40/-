const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});
await p.goto('file://'+path.resolve('match.html'));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
const o=await p.evaluate(()=>{const r=[];for(const e of document.querySelectorAll('.c > *')){const x=e.getBoundingClientRect();r.push(e.className||e.tagName,Math.round(x.top),Math.round(x.bottom),Math.round(x.right))}return r.join(' ')});console.log(o);
await p.screenshot({path:'L5_itog_1tur.png'});await b.close();})();
