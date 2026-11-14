const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const FF=fs.readFileSync('fonts.css','utf8');
const base=`${FF}
:root{--blue:#14506f;--deep:#0d3a52;--gold:#c99a52;--ink:#2b3a44}
*{margin:0;padding:0;box-sizing:border-box}body{overflow:hidden;position:relative;background:#0d3a52}
.ph{position:absolute;object-fit:cover}
.kick{font:800 22px Mont;letter-spacing:.42em;text-transform:uppercase}
.kick:after{content:"";display:block;width:56px;height:4px;background:var(--gold);margin-top:16px;border-radius:2px}
h1{font:700 118px/1 Osw;white-space:nowrap}h1 b{color:var(--gold)}
.slog{font:700 15px Mont;letter-spacing:.42em}`;
const KICK='ИНДИВИДУАЛЬНЫЕ НОМИНАЦИИ',H1='ЛУЧШИЕ <b>ИГРОКИ</b>',IMG='photo2.png';
const S=[
// 1. Кинокадр: фото на весь кадр, золотая рамка внутри, текст на тёмном градиенте снизу
{name:'style1_kinokadr',w:1620,h:1080,html:`
<img class="ph" src="${IMG}" style="inset:0;width:100%;height:100%">
<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(9,38,56,.95) 0%,rgba(9,38,56,.7) 22%,rgba(9,38,56,0) 46%),linear-gradient(to bottom,rgba(9,38,56,.55),rgba(9,38,56,0) 22%)"></div>
<div style="position:absolute;inset:30px;border:2px solid rgba(214,170,100,.95);border-radius:20px"></div>
<img src="crest_l5.png" style="position:absolute;left:70px;top:62px;height:118px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.35))">
<div style="position:absolute;left:78px;bottom:78px;color:#fff"><div class="kick">${KICK}</div><h1 style="margin-top:20px;color:#fff">${H1}</h1></div>
<div class="slog" style="position:absolute;right:76px;bottom:92px;color:rgba(255,255,255,.75)">ИСТОРИЯ, КОТОРУЮ ПИШЕМ ВМЕСТЕ</div>`},
// 2. Фирменная полоса слева, светлая дымка сверху, заголовок в цветах шаблона
{name:'style2_polosa',w:1740,h:1080,html:`
<img class="ph" src="${IMG}" style="left:120px;top:0;width:1620px;height:1080px">
<div style="position:absolute;left:120px;right:0;top:0;height:290px;background:linear-gradient(to bottom,rgba(244,245,244,.98) 0%,rgba(244,245,244,.96) 70%,rgba(244,245,244,0) 100%)"></div>
<img src="strip.png" style="position:absolute;left:0;top:0;height:1080px">
<div style="position:absolute;left:236px;top:56px;color:var(--ink)"><div class="kick">${KICK}</div><h1 style="margin-top:18px;color:var(--blue)">${H1}</h1></div>
<div style="position:absolute;left:146px;right:0;bottom:0;height:10px;background:linear-gradient(90deg,var(--gold),#e2c48e,var(--gold))"></div>`},
// 3. Паспарту: фото в светлой фактурной рамке, внизу фирменная подпись
{name:'style3_pasparty',w:1520,h:1220,html:`
<img src="paper.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
<div style="position:absolute;left:40px;top:40px;width:1440px;height:960px;border-radius:14px;overflow:hidden;box-shadow:0 24px 50px rgba(13,58,82,.22)"><img class="ph" src="${IMG}" style="inset:0;width:100%;height:100%"></div>
<div style="position:absolute;left:24px;top:24px;width:1472px;height:992px;border:2px solid var(--gold);border-radius:22px"></div>
<img src="crest_l5.png" style="position:absolute;left:46px;top:1052px;height:132px">
<div style="position:absolute;left:170px;top:1060px;color:var(--ink)"><div class="kick" style="font-size:20px">${KICK}</div><h1 style="margin-top:12px;font-size:84px;color:var(--blue)">${H1}</h1></div>
<div class="slog" style="position:absolute;right:48px;top:1150px;color:var(--blue);opacity:.75">ИСТОРИЯ, КОТОРУЮ ПИШЕМ ВМЕСТЕ</div>`},
// 4. Спорт: фото на весь кадр, золотые уголки, синяя диагональная плашка
{name:'style4_diagonal',w:1620,h:1080,html:`
<img class="ph" src="${IMG}" style="inset:0;width:100%;height:100%">
<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(9,38,56,.55),rgba(9,38,56,0) 35%)"></div>
${[['left','top'],['right','top'],['right','bottom']].map(([x,y])=>`<div style="position:absolute;${x}:34px;${y}:34px;width:90px;height:90px;border-${x}:6px solid var(--gold);border-${y}:6px solid var(--gold);border-${y}-${x}-radius:14px"></div>`).join('')}
<div style="position:absolute;left:0;bottom:70px;width:1130px;height:236px;background:var(--gold);clip-path:polygon(0 0,100% 0,calc(100% - 90px) 100%,0 100%)"></div>
<div style="position:absolute;left:0;bottom:70px;width:1108px;height:236px;background:linear-gradient(100deg,#0d3a52,#14506f);clip-path:polygon(0 0,100% 0,calc(100% - 90px) 100%,0 100%)"></div>
<img src="crest_l5.png" style="position:absolute;left:60px;bottom:118px;height:140px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.3))">
<div style="position:absolute;left:190px;bottom:112px;color:#fff"><div class="kick" style="font-size:20px">${KICK}</div><h1 style="margin-top:14px;font-size:104px;color:#fff">${H1}</h1></div>`},
];
(async()=>{const b=await chromium.launch();
for(const s of S){const p=await b.newPage({viewport:{width:s.w,height:s.h}});
 fs.writeFileSync(s.name+'.html',`<!doctype html><html><head><meta charset="utf-8"><style>${base}html,body{width:${s.w}px;height:${s.h}px}</style></head><body>${s.html}</body></html>`);
 await p.goto('file://'+path.resolve(s.name+'.html'));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
 await p.screenshot({path:s.name+'.png'});await p.close();console.log(s.name);}
await b.close();})();
