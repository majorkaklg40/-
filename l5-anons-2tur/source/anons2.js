const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const P=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
let s=fs.readFileSync('anons2.tpl','utf8').replace('__FF__',fs.readFileSync('fonts.css','utf8')+'\n@font-face{font-family:Mont;font-weight:600;src:url(montserrat-cyrillic-600-normal.woff2)}');
const rows=P.rows.map((r,i)=>{const y=P.rowY+i*P.rowGap;return `<div class="l" style="top:${y+P.lOff}px">${r[0]}</div><div class="v" style="top:${y}px">${r[1]}</div><div class="s" style="top:${y+P.sOff}px">${r[2]}</div>`}).join('');
for(const [k,v] of Object.entries(P.vars)) s=s.split('__'+k+'__').join(v);
s=s.replace('__ROWS__',rows);fs.writeFileSync('_a.html',s);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1349}});
await p.goto('file://'+path.resolve('_a.html'));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
await p.screenshot({path:P.out});await b.close();console.log(P.out)})();
