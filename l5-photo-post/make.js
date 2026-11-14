// Посты с фото в стиле «Кинокадр». Правьте posts.json и запускайте: node make.js
// photo — горизонтальное фото (лучше 3:2), kicker — подпись сверху, title — белая часть, gold — золотая.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const dir=__dirname, W=1620, H=1080;
const FF=fs.readFileSync(path.join(dir,'assets/fonts.css'),'utf8').replace(/url\(/g,'url(assets/');
const posts=JSON.parse(fs.readFileSync(path.join(dir,'posts.json'),'utf8'));
const esc=s=>String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const page=p=>`<!doctype html><html><head><meta charset="utf-8"><style>${FF}
*{margin:0;padding:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden;position:relative;background:#0d3a52}
.ph{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${p.position||'50% 50%'}}
.sh{position:absolute;inset:0;background:linear-gradient(to top,rgba(9,38,56,.95) 0%,rgba(9,38,56,.7) 22%,rgba(9,38,56,0) 46%),linear-gradient(to bottom,rgba(9,38,56,.55),rgba(9,38,56,0) 22%)}
.fr{position:absolute;inset:30px;border:2px solid rgba(214,170,100,.95);border-radius:20px}
.cr{position:absolute;left:70px;top:62px;height:118px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.35))}
.tx{position:absolute;left:78px;bottom:78px;color:#fff}
.k{font:800 22px Mont;letter-spacing:.42em;text-transform:uppercase}
.k:after{content:"";display:block;width:56px;height:4px;background:#c99a52;margin-top:16px;border-radius:2px}
h1{margin-top:20px;font:700 118px/1 Osw;white-space:nowrap;color:#fff}h1 b{color:#c99a52}
.sl{position:absolute;right:76px;bottom:92px;font:700 15px Mont;letter-spacing:.42em;color:rgba(255,255,255,.75)}
</style></head><body>
<img class="ph" src="${esc(p.photo)}"><div class="sh"></div><div class="fr"></div><img class="cr" src="assets/crest_l5.png">
<div class="tx"><div class="k">${esc(p.kicker)}</div><h1>${esc(p.title)} <b>${esc(p.gold)}</b></h1></div>
<div class="sl">ИСТОРИЯ, КОТОРУЮ ПИШЕМ ВМЕСТЕ</div></body></html>`;
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:W,height:H}});
for(const p of posts){const f=path.join(dir,'_render.html');fs.writeFileSync(f,page(p));
 await pg.goto('file://'+f);await pg.evaluate(()=>document.fonts.ready);
 await pg.evaluate(()=>{const h=document.querySelector('h1'),max=1620-78-560;let s=118;while(h.scrollWidth>max&&s>70){s-=2;h.style.fontSize=s+'px'}});
 await pg.waitForTimeout(200);fs.mkdirSync(path.dirname(path.join(dir,p.out)),{recursive:true});
 await pg.screenshot({path:path.join(dir,p.out)});console.log(p.out);fs.unlinkSync(f);}
await b.close();})();
