# Agrega el detalle verificado del documento 186/657 (06/11/2017) por unidad y municipio del mapa.
# Entradas: datos/inventario_2017_detalle_filas.csv (parse-pabellones-2017.py),
#           datos/pabellones_inventario_2017.json (unidad -> municipio del mapa, revisado),
#           datos/inventario_2017_anexos_I_IV.json.  Salida: datos/pabellones_cyg_2017_verificado.json
import csv,json,re,unicodedata,pathlib,collections as C
ROOT=pathlib.Path(__file__).resolve().parents[1]
def n(s):
    s=unicodedata.normalize('NFD',s or '');s=''.join(c for c in s if unicodedata.category(c)!='Mn').upper()
    return re.sub(r'\s+',' ',s).strip()
PM={'PRINCIPADO DE ASTURIAS':'ASTURIAS','CIUDAD DE CEUTA':'CEUTA','CIUDAD DE MELILLA':'MELILLA','STA. CRUZ TENERIFE':'SC','STA.CRUZ TENERIFE':'SC','SANTA CRUZ DE TENERIFE':'SC',
    'ILLES BALEARS':'BALEARS','BALEARS ILLES':'BALEARS','BALEARS, ILLES':'BALEARS','ARABA/ALAVA':'ALAVA','CEUTA C. DE':'CEUTA','MELILLA C. DE':'MELILLA',
    'ALICANTE/ALACANT':'ALICANTE','CASTELLON/CASTELLO':'CASTELLON','CORUNA, A':'A CORUNA','MURCIA R. DE':'MURCIA','PALMAS, LAS':'LAS PALMAS','RIOJA, LA':'LA RIOJA','VALENCIA/VALENCIA':'VALENCIA'}
def pn(p): p=n(p); return PM.get(p,p)
UF={'SALINAS DE CASTRILLO':'SALINAS DE CASTRILLON','SAN PEDRO DEL PINATA':'SAN PEDRO DEL PINATAR'}
def un(u):
    u=n(u); u=re.sub(r'^MELILLA C\. DE ?- ?','MELILLA - ',u); return UF.get(u,u)
INH='NO UTILIZABLE / INHABITABLE'
OFI=('Capitán a Alferez','Coronel a Comandante','Oficial General')
def blank(): return dict(total=0,ocupados=0,cyg=0,cyg_inhabitables=0,cyg_ocupados=0,cyg_ocupados_inhabitables=0,cyg_estado=C.Counter(),cargo=0,cargo_cyg=0,suboficial=0,oficiales=0,otros=0,inhabitables=0)
agg=C.defaultdict(blank); prov=C.defaultdict(blank); nat=blank(); names={}
for r in csv.DictReader(open(ROOT/'datos/inventario_2017_detalle_filas.csv',encoding='utf-8')):
    k=(pn(r['provincia']),un(r['unidad'])); names.setdefault(k,re.sub(r'\s+',' ',r['unidad']).strip())
    cyg=r['tipo']=='Unidad' and r['empleo']=='Cabo a Guardia'; inh=r['estado']==INH
    for a in (agg[k],prov[k[0]],nat):
        if r['anexo']=='II':
            a['total']+=1; a['inhabitables']+=inh
            if cyg: a['cyg']+=1; a['cyg_inhabitables']+=inh; a['cyg_estado'][r['estado'] or 'SIN ESTADO']+=1
            elif r['tipo']=='Cargo':
                a['cargo']+=1; a['cargo_cyg']+=r['empleo']=='Cabo a Guardia'
            if r['empleo']=='Suboficial': a['suboficial']+=1
            elif r['empleo'] in OFI: a['oficiales']+=1
            if r['tipo'] in('Sin indicar','Representación') or r['empleo']=='Sin indicar': a['otros']+=1
        else:
            a['ocupados']+=1
            if cyg: a['cyg_ocupados']+=1; a['cyg_ocupados_inhabitables']+=inh
def fin(a):
    a=dict(a); a['cyg_estado']=dict(a['cyg_estado']); a['cyg_habitables']=a['cyg']-a['cyg_inhabitables']
    a['cyg_libres_habitables']=max(0,a['cyg_habitables']-(a['cyg_ocupados']-a['cyg_ocupados_inhabitables'])); return a
an=json.load(open(ROOT/'datos/inventario_2017_anexos_I_IV.json',encoding='utf-8'))
efec={pn(k):v for k,v in an['efectivos_provincia_30_04_2017'].items()}
GM={'ALGECIRAS':'CADIZ','OVIEDO':'ASTURIAS','GIJON':'ASTURIAS','LOGRONO':'LA RIOJA','SANTANDER':'CANTABRIA','TENERIFE':'SC','PALMA DE MALLORCA':'BALEARS','ALAVA/ARABA':'ALAVA','CEUTA C. DE':'CEUTA','MELILLA C. DE':'MELILLA'}
gasto=C.defaultdict(list)
for ca,v in an['gasto_212_comandancias'].items():
    for name,vals in v.items():
        if name=='TOTAL' or 'ZONA' in n(name) or ca in('SERVICIO ACUARTELAMIENTO','ENSEÑANZA') or name=='UPROSE': continue
        gasto[GM.get(n(name),pn(name))].append({'comandancia':name,'importes':vals})
provincias={}
for p,a in prov.items():
    f=fin(a); f['efectivos_30_04_2017']=efec.get(p); f['gasto_212_comandancia']=gasto.get(p,[]); provincias[p]=f
assert sum(p['total'] for p in provincias.values())==33843 and sum(p['ocupados'] for p in provincias.values())==26053
missing=[p for p in provincias if not provincias[p]['gasto_212_comandancia']]; assert not missing,missing
inv=json.load(open(ROOT/'datos/pabellones_inventario_2017.json',encoding='utf-8'))
mk={};
for u in inv['unidades']: mk[(pn(u['provincia']),un(u['unidad']))]=u['map_key']
assert set(mk)==set(agg),(set(agg)^set(mk))
vac={}; 
for m in inv['municipios']: vac[m['municipio']+'|'+m['provincia']]=m['vacantes_2026']
keymeta={}
for m in inv['municipios']:
    for u in m['unidades']: keymeta[u['map_key']]=(m['municipio'],m['provincia'],m['vacantes_2026'])
muni={}
for k,a in agg.items():
    key=mk[k]
    if not key: continue
    mun,pr,v=keymeta[key]
    m=muni.setdefault(key,{'municipio':mun,'provincia':pr,'vacantes_2026':v,'provincia_2017':k[0],'unidades':[]})
    if k[0]!=m['provincia_2017']: raise SystemExit('provincia mixta '+key)
    u=fin(a); u['unidad']=names[k]; m['unidades'].append(u)
for m in muni.values():
    m['unidades'].sort(key=lambda u:-u['cyg'])
    for f in ('total','cyg','cyg_habitables','cyg_ocupados','cyg_libres_habitables','cyg_inhabitables'): m[f]=sum(u[f] for u in m['unidades'])
out={'fuente':{'nombre':'Respuesta del Gobierno a la solicitud de informe 186/657 (Congreso de los Diputados), anexos I a IV','fecha':'06/11/2017','registro':'Entrada 54162, 06/11/2017','autor_solicitud':'Juan Antonio Delgado Ramos (GCUP-ECP-EM)',
      'url':'https://kd9c9zhyht-lab.github.io/guardia-civil-vacantes-mapa/datos/fuentes/pabellones_gc_186-657_2017-11-06.pdf','paginas':1137},
     'definiciones':{'cyg':'Pabellones de tipo Unidad asignados al empleo Cabo a Guardia (anexo II).','cyg_ocupados':'Pabellones de tipo Unidad de Cabo a Guardia ocupados (anexo III).','cyg_libres_habitables':'C. y G. existentes no inhabitables menos los ocupados no inhabitables. Desocupados a la fecha del inventario, no vacantes adjudicables hoy.','cargo':'Pabellones de tipo Cargo (asociados a un puesto de mando), de cualquier empleo.'},
     'nacional':fin(nat),'efectivos_empleo_31_12_2016':an['efectivos_empleo_31_12_2016'],'nota_efectivos':an['nota_efectivos'],'gasto_212_total':an['total_general_212'],
     'provincias':provincias,'municipios':sorted(muni.values(),key=lambda m:(m['provincia'],m['municipio']))}
json.dump(out,open(ROOT/'datos/pabellones_cyg_2017_verificado.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
mv=[m for m in muni.values() if m['vacantes_2026']>0]
print('nacional',{k:v for k,v in out['nacional'].items() if k!='cyg_estado'},out['nacional']['cyg_estado'])
print('municipios',len(muni),'con vacantes',len(mv),'con cyg habitables',sum(m['cyg_habitables']>0 for m in mv),'con libres',sum(m['cyg_libres_habitables']>0 for m in mv),
      'cyg en mapa vac',sum(m['cyg'] for m in mv),'libres',sum(m['cyg_libres_habitables'] for m in mv))
