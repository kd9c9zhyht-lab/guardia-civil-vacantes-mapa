# Extrae los anexos II (existentes) y III (ocupados) del documento 186/657 (06/11/2017).
import pathlib; ROOT=pathlib.Path(__file__).resolve().parents[1]
import pymupdf as fitz,re,json,collections
d=fitz.open(str(ROOT/'datos/fuentes/pabellones_gc_186-657_2017-11-06.pdf'))
flags=fitz.TEXTFLAGS_DICT & ~fitz.TEXT_MEDIABOX_CLIP
EST={'BUENO','REGULAR','MALO','DEFICIENTE','NO UTILIZABLE / INHABITABLE'}
TIP={'Cargo','Unidad','Representacion','Representación'}
EMP={'Cabo a Guardia','Suboficial','Capitán a Alferez','Coronel a Comandante','Oficial General'}
HDR=re.compile(r'^(Provincia|Pabellón|Cantidad|Unidad Dependiente|Estado Conservación|Tipo de|pabellón|Tipo de empleo|destino pabellón|ANEXO.*|TOTAL PABELLONES.*|PABELLONES DE LA GUARDIA.*|\d+/\d+|07 NOV.*|Estado|Conservación|Tipo de empleo destino pabellón)$')
lost=[];sec=None;res={'II':[],'III':[]};bad=collections.Counter();badrows=[]
for pn in range(len(d)):
    dd=d[pn].get_text('dict',flags=flags)
    spans=[]
    for b in dd['blocks']:
        for l in b.get('lines',[]):
            for s in l['spans']:
                t=s['text'].strip()
                if t: spans.append((s['origin'][1],s['origin'][0],t))
    sec='II' if 3<=pn<631 else 'III' if 631<=pn<1134 else None
    if sec not in ('II','III'): continue
    spans=[s for s in spans if not HDR.match(s[2]) and 'Entrada:' not in s[2] and 'NOV. 2017' not in s[2]]
    spans.sort()
    rows=[]
    for y,x,t in spans:
        if rows and abs(rows[-1][0]-y)<2.5: rows[-1][1].append((x,t))
        else: rows.append([y,[(x,t)]])
    pend=None
    for y,cells in rows:
        cells.sort()
        c={'prov':None,'unit':[],'est':None,'tipo':None,'emp':None}
        for x,t in cells:
            if t in EST or (x>240 and x<390 and ('INHABITABLE' in t or 'UTILIZABLE' in t)): c['est']=(c['est']+' '+t) if c['est'] else t
            elif t in TIP and x>300: c['tipo']=t
            elif t in EMP and x>430: c['emp']=t
            elif x<110: c['prov']=t
            elif x<250: c['unit'].append(t)
            else: c['unit'].append('?'+t)
        if c['prov'] and c['emp']:
            if pend: pend.setdefault('tipo','Sin indicar');pend.setdefault('empleo','Sin indicar');res[sec].append(pend);lost.append(pend);pend=None
            res[sec].append(dict(provincia=c['prov'],unidad=' '.join(c['unit']),estado=c['est'],tipo=c['tipo'] or 'Sin indicar',empleo=c['emp'],page=pn+1)); pend=None
        elif c['prov'] and not c['emp']:
            if pend: pend.setdefault('tipo','Sin indicar');pend.setdefault('empleo','Sin indicar');res[sec].append(pend);lost.append(pend)
            pend=dict(provincia=c['prov'],unidad=' '.join(c['unit']),estado=c['est'],page=pn+1)
            if c['tipo']: pend['tipo']=c['tipo']
        elif pend and c['emp']:
            pend.update(tipo=c['tipo'] or pend.get('tipo') or 'Sin indicar',empleo=c['emp']);
            if c['est']: pend['estado']=((pend['estado'] or '')+' '+c['est']).strip()
            if c['unit']: pend['unidad']=(pend['unidad']+' '+' '.join(c['unit'])).strip()
            res[sec].append(pend);pend=None
        else:
            bad[sec]+=1; badrows.append((sec,pn+1,cells))
    if pend: pend.setdefault('tipo','Sin indicar');pend.setdefault('empleo','Sin indicar');res[sec].append(pend);lost.append(pend)
subt={'II':[],'III':[]}
for s_ in ('II','III'):
    subt[s_]=[int(r['provincia'].replace('.','')) for r in res[s_] if re.fullmatch(r'[\d.]+',r['provincia'])]
    subt[s_]+=[int(r['unidad'].replace('.','')) for r in res[s_] if re.fullmatch(r'[\d.]+',r['unidad'])]
    res[s_]=[r for r in res[s_] if not re.fullmatch(r'[\d.]+',r['provincia']) and not re.fullmatch(r'[\d.]+',r['unidad']) and not re.search(r'\d$',r['provincia'])]
print('subtotales',{k:(len(v),sum(v)) for k,v in subt.items()})
ESTR=re.compile(r'^(.*?)\s*(BUENO|REGULAR|MALO|DEFICIENTE|NO UTILIZABLE / INHABITABLE|NO UTILIZABLE /)$')
for s_ in ('II','III'):
    for r in res[s_]:
        u=r['unidad'].replace('?','').strip()
        m=ESTR.match(u)
        if m and not r['estado']: r['unidad'],r['estado']=m.group(1).strip(),m.group(2)
        elif m and m.group(2).startswith('NO UTIL'): r['unidad'],r['estado']=m.group(1).strip(),'NO UTILIZABLE / INHABITABLE'
        else: r['unidad']=u
        if r['estado'] and 'INHABITABLE' in r['estado']: r['estado']='NO UTILIZABLE / INHABITABLE'
        if r['tipo'].startswith('Represent'): r['tipo']='Representación'
print('lost',len(lost),lost[:8])
C=collections.Counter
for s in ('II','III'):
    r=res[s];print(s,len(r),'bad',bad[s])
    for k in ['estado','tipo','empleo']: print(' ',k,C(x[k] for x in r).most_common())
    print('  prov',len(C(x['provincia'] for x in r)), sorted(C(x['provincia'] for x in r).items())[:60])
print(badrows[:12])
print([x for x in res['II'] if '?' in x['unidad'] or not x['unidad']][:10])
import csv
with open(ROOT/'datos/inventario_2017_detalle_filas.csv','w',newline='',encoding='utf-8') as f:
    w=csv.writer(f);w.writerow(['anexo','provincia','unidad','estado','tipo','empleo','pagina_pdf'])
    for an in ('II','III'):
        for r in res[an]: w.writerow([an,r['provincia'],r['unidad'],r['estado'] or '',r['tipo'],r['empleo'],r['page']+1])
