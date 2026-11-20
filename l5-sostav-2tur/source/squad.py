import json,sys,subprocess
P=json.load(open(sys.argv[1]))
v=P['v']
ff=open('fonts.css').read()
for w in (300,400):
    ff+=f"@font-face{{font-family:Mont;font-weight:{w};src:url(montserrat-cyrillic-{w}-normal.woff2)}}@font-face{{font-family:Mont;font-weight:{w};src:url(montserrat-latin-{w}-normal.woff2);unicode-range:U+0000-00FF}}"
ff+="@font-face{font-family:Osw;font-weight:600;src:url(oswald-latin-600-normal.woff2);unicode-range:U+0000-00FF}"
rows=''
for i,(num,name) in enumerate(P['players']):
    y=v['rowY']+i*v['rowGap']
    rows+=f'<div class="pill b" style="top:{y}px">{num}</div><div class="nm" style="top:{y+v["nmOff"]}px">{name}</div>'
st=''
for i,(tag,name) in enumerate(P['staff']):
    y=v['stY']+i*v['rowGap']
    st+=f'<div class="pill g" style="top:{y}px;font-size:{v["tagS"]}px">{tag}</div><div class="nm" style="top:{y+v["nmOff"]}px">{name}</div>'
html=f'''<!doctype html><html><head><meta charset="utf-8"><style>{ff}
*{{margin:0;padding:0;box-sizing:border-box}}html,body{{width:1080px;height:1350px;overflow:hidden}}
body{{background:url(template.png) 0 0/1080px 1350px no-repeat;position:relative;font-family:Mont}}
.h{{position:absolute;left:{v['hX']}px;font:{v['hW']} {v['hS']}px/{v['hLH']}px Mont;letter-spacing:{v['hLS']}em;color:#37373a;white-space:nowrap}}
.pill{{position:absolute;left:269px;width:79px;height:27px;border-radius:14px;text-align:center;font:{v['numW']} {v['numS']}px/27px Mont;color:#d4dadd;letter-spacing:.02em}}
.b{{background:#003d5b}}.g{{background:#49494b}}
.nm{{position:absolute;left:{v['nmX']}px;font:{v['nmW']} {v['nmS']}px/1 Mont;letter-spacing:{v['nmLS']}em;color:#37373a;white-space:nowrap}}
.m{{position:absolute;left:{v['mX']}px;top:{v['mY']}px;font:700 {v['mS']}px/1 Mont;letter-spacing:{v['mLS']}em;color:#37373a}}
.fp{{position:absolute;top:1137px;width:124px;height:41px;border-radius:21px;text-align:center;font:300 {v['fpS']}px/41px Mont;color:#e6eaec}}
.vs{{position:absolute;top:{v['vsY']}px;left:{v['vsX']}px;font:600 {v['vsS']}px/1 Osw;color:#49494b;white-space:nowrap}}
.vs span{{margin-left:{v['vsGap']}px;font-size:{v['opS']}px}}
</style></head><body>
<div class="h" style="top:{v['hY']}px">СОСТАВ КОМАНДЫ</div>
{rows}
<div class="h" style="top:{v['h2Y']}px">РУКОВОДЯЩИЙ<br>И ТРЕНЕРСКИЙ СОСТАВ</div>
{st}
<div class="m">МАТЧ</div>
<div class="fp g" style="left:269px">{P['date']}</div><div class="fp b" style="left:407px">{P['time']}</div>
<div class="vs">VS<span>{P['opp']}</span></div>
</body></html>'''
open('_sq.html','w').write(html)
subprocess.run(['node','shot.js','_sq.html',P['out']],check=True)
