const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const tpl=fs.readFileSync('card.html','utf8');
const ev=['СОБЫТИЕ','Итоги футбольного сезона','Сезон 2026 года · церемония награждения'];
const cards=[
 {out:'L5_itogi_sezona_1.png',img:'photo1.jpg',pos:'50% 62%',kick:'КАЛУЖСКАЯ ОБЛАСТЬ',h1:'ИТОГИ <b>2026</b>',
  rows:[ev,['НАГРАДЫ','Кубок и диплом','Калужская область']]},
 {out:'L5_itogi_sezona_2.png',img:'photo2.png',pos:'50% 60%',kick:'ИТОГИ СЕЗОНА 2026',h1:'ЛИЧНЫЕ <b>НАГРАДЫ</b>',
  rows:[ev,['НАГРАДЫ','Индивидуальные призы','Калужская область']]},
];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
for(const c of cards){const html=tpl.replace('{{KICK}}',c.kick).replace('{{H1}}',c.h1).replace('{{IMG}}',c.img).replace('{{POS}}',c.pos)
 .replace('{{ROWS}}',c.rows.map(r=>`<div class="l">${r[0]}</div><div class="v">${r[1]}<small>${r[2]}</small></div>`).join(''));
 fs.writeFileSync('_tmp.html',html);await p.goto('file://'+path.resolve('_tmp.html'));await p.evaluate(async()=>{await document.fonts.ready;const h=document.querySelector('h1'),w=document.querySelector('.c').clientWidth;let f=112;while(h.scrollWidth>w&&f>60){f-=2;h.style.fontSize=f+'px'}});await p.waitForTimeout(300);
 await p.screenshot({path:c.out});console.log(c.out);}
await b.close();})();
