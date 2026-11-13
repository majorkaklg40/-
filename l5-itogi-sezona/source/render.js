const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const tpl=fs.readFileSync('card.html','utf8');
const cards=[
 {out:'L5_itogi_sezona_1.png',img:'photo1.jpg',pos:'50% 50%',kick:'ИТОГИ ЛЕТНЕГО СЕЗОНА',h1:'1 <b>МЕСТО</b>',
  rows:[['НАГРАДЫ','Кубок, медали и диплом','Областные соревнования'],
        ['КОГДА','10 ноября','Церемония награждения'],
        ['ГДЕ','Областной молодёжный центр','Калуга']]},
 {out:'L5_itogi_sezona_2.png',img:'photo2.png',pos:'50% 50%',kick:'ИНДИВИДУАЛЬНЫЕ НОМИНАЦИИ',h1:'ЛУЧШИЕ <b>ИГРОКИ</b>',
  rows:[['НАПАДЕНИЕ','Иван Родин','Лучший бомбардир и нападающий'],
        ['ПОЛУЗАЩИТА','Вячеслав Думбрава','Лучший полузащитник']]},
];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
for(const c of cards){const html=tpl.replace('{{KICK}}',c.kick).replace('{{H1}}',c.h1).replace('{{IMG}}',c.img).replace('{{POS}}',c.pos)
 .replace('{{ROWS}}',c.rows.map(r=>`<div class="l">${r[0]}</div><div class="v">${r[1]}<small>${r[2]}</small></div>`).join(''));
 fs.writeFileSync('_tmp.html',html);await p.goto('file://'+path.resolve('_tmp.html'));await p.evaluate(async()=>{await document.fonts.ready;const h=document.querySelector('h1'),w=document.querySelector('.c').clientWidth;let f=100;while(h.scrollWidth>w&&f>60){f-=2;h.style.fontSize=f+'px'}});await p.waitForTimeout(300);
 await p.screenshot({path:c.out});console.log(c.out);}
await b.close();})();
