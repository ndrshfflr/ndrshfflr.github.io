/* Sporexplore v4 — app logic. Data: window.SPOREX (sporexplore/data.js, generated). */
(function(){
'use strict';
const X = window.SPOREX;
const SPECIES = X.species;
const {VOCAB, LABELS, PRINT_COLOR, FAMILY_SPORE, SPORE_OVERRIDE} = X;
const BYID = Object.fromEntries(SPECIES.map(s=>[s.id,s]));
const $ = (s,el=document)=>el.querySelector(s);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nice = s => String(s).replace(/-/g,' ').replace(/^\w/,c=>c.toUpperCase());
const fmt = v => v==null ? '' : (Math.round(v*10)/10).toString();
const store = {get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
               set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};

/* ---------- vocab additions for v4 ---------- */
VOCAB.ft = ['boletoid','agaricoid','gasteroid','resupinate'];
LABELS.ft = {boletoid:'Bolete (tubes and pores)',agaricoid:'Gilled',gasteroid:'Puffball-like or underground',resupinate:'Crust (resupinate, on wood)'};
Object.assign(VOCAB,{
  orn:["smooth","finely-striate","verrucose","short-spiny","spiny","long-spiny","reticulate-incomplete","reticulate-complete","reticulate-coarse"],
  apex:["rounded","truncate","tapered"], wall:["thin","slightly-thickened","thick"],
  melzer:["inamyloid","dextrinoid","amyloid"], cyano:["acyanophilic","cyanophilic"],
  gutt:["absent","rare","often"], sym:["equilateral","inequilateral"]});
Object.assign(LABELS,{
  orn:{"smooth":"Smooth","finely-striate":"Finely striate (in Melzer's)","verrucose":"Warted","short-spiny":"Short spines","spiny":"Spiny","long-spiny":"Long spines (about 2 µm)","reticulate-incomplete":"Net, incomplete","reticulate-complete":"Net, complete","reticulate-coarse":"Coarse net"},
  apex:{"rounded":"Rounded","truncate":"Truncate (cut off)","tapered":"Tapered"},
  wall:{"thin":"Thin","slightly-thickened":"Slightly thickened","thick":"Thick"},
  melzer:{"inamyloid":"Inamyloid (no reaction)","dextrinoid":"Dextrinoid (red-brown)","amyloid":"Amyloid (blue-grey)"},
  cyano:{"acyanophilic":"Acyanophilic","cyanophilic":"Cyanophilic"},
  gutt:{"absent":"No oil drops","rare":"Oil drops rare","often":"Oil drops often present"},
  sym:{"equilateral":"Symmetric in side view","inequilateral":"Asymmetric in side view"}});
LABELS.ed = Object.assign({choice:'Choice edible',edible:'Edible',inedible:'Not edible',caution:'Caution',
  'toxic-raw':'Toxic raw',toxic:'Toxic',deadly:'Deadly poisonous',unknown:'Edibility unknown'}, LABELS.ed||{});
LABELS.blue = {none:'No bluing',weak:'Weak or slow',moderate:'Moderate',strong:'Strong, instant'};
const FIELD_LABEL = {diagnose:'Danish diagnosis',beskrivelse:'Danish description',BeskrivelseUK:'English description',
  bogtekst_gyldendal_en:'English field-guide text',bogtekst_gyldendal:'Danish field-guide text'};
const TERR = [['DK','Denmark'],['NO','Norway'],['SE','Sweden'],['FI','Finland'],['IS','Iceland'],['FO','Faroe Islands'],['GL','Greenland']];

/* ---------- micro characters: species value where documented, family baseline otherwise ---------- */
const MICRO_KEYS=["orn","apex","wall","melzer","cyano","gutt","sym"];
SPECIES.forEach(s=>{
  const base=FAMILY_SPORE[s.fam]||{}, ov=SPORE_OVERRIDE[s.n]||{};
  s.micro={}; s.microSrc={};
  MICRO_KEYS.forEach(k=>{
    if(ov[k]!==undefined){s.micro[k]=ov[k];s.microSrc[k]='species';}
    else if(base[k]!==undefined){s.micro[k]=base[k];s.microSrc[k]='family';}
  });
  const o=(s.sp.orn||'').toLowerCase();
  if(o && o!=='smooth' && !ov.orn){
    if(o.includes('reticulate')){s.micro.orn=o.includes('coarse')?'reticulate-coarse':o.includes('incomplete')?'reticulate-incomplete':'reticulate-complete';s.microSrc.orn='species';}
    else if(o.includes('striate')){s.micro.orn='finely-striate';s.microSrc.orn='species';}
    else if(o.includes('spiny')){s.micro.orn=o.includes('short')?'short-spiny':o.includes('long')?'long-spiny':'spiny';s.microSrc.orn='species';}
    else if(o.includes('verruc')||o.includes('wart')){s.micro.orn='verrucose';s.microSrc.orn='species';}
  }
  if(s.sp.shape==='truncate' && !ov.apex){s.micro.apex='truncate';s.microSrc.apex='species';}
  if(ov.q) s.microQuote=ov.q;
  s.m = s.m || {}; ['pore','cap','host'].forEach(k=>{ if(!Array.isArray(s.m[k])) s.m[k]=s.m[k]?[s.m[k]]:[]; });
});

/* ---------- citations ---------- */
function citeShort(id, page){
  const s=X.sources[id]; if(!s) return esc(id);
  let t;
  if(s.short) t=s.short;
  else{
    const a=s.authors||[], fam=x=>x.literal||x.family;
    t = a.length===1?fam(a[0]) : a.length===2?`${fam(a[0])} &amp; ${fam(a[1])}` : `${fam(a[0])} et al.`;
    t += ', '+s.year;
  }
  return `(${t}${page?`, p. ${esc(page)}`:''})`;
}

/* ---------- spore icon (from v3, unchanged geometry) ---------- */
let ICON_SEQ=0;
const ORN_ROUGH=new Set(["short-spiny","spiny","long-spiny"]), ORN_NET=new Set(["reticulate-incomplete","reticulate-complete","reticulate-coarse"]);
function sporeIcon(sp,dispW,dispH){
  const VBW=100,VBH=60,pad=8,uid='si'+(++ICON_SEQ),cx=VBW/2,cy=VBH/2,bw=VBW-pad*2,bh=VBH-pad*2;
  const shape=sp.sp.shape||'ellipsoid';
  const isSpindle=shape==='fusiform'||shape==='truncate', isTrunc=shape==='truncate'||shape==='truncate-ellipsoid';
  const isRound=shape==='globose'||shape==='subglobose';
  let q=sp.sp.q?(sp.sp.q[0]+sp.sp.q[1])/2:((sp.sp.lo/sp.sp.whi)+(sp.sp.hi/sp.sp.wlo))/2;
  q=isRound?(shape==='globose'?1:1.12):Math.max(1.15,Math.min(3.2,q));
  let ry=bh/2,rx=ry*q; if(rx>bw/2){rx=bw/2;ry=rx/q;} if(ry<bh/2*.32) ry=bh/2*.32;
  const fill=PRINT_COLOR[sp.sp.print]||'#8a8a8a';
  const wallW=sp.micro.wall==='thick'?2.2:sp.micro.wall==='slightly-thickened'?1.5:1, orn=sp.micro.orn;
  let d=null,defs='',over='';
  if(ORN_ROUGH.has(orn)){
    const r=Math.min(rx,ry), L=orn==='long-spiny'?r*.55:orn==='spiny'?r*.38:r*.24; let p='';
    for(let i=0;i<12;i++){const a1=i/12*2*Math.PI,a2=(i+.5)/12*2*Math.PI,a3=(i+1)/12*2*Math.PI;
      p+=(i?'':`M ${(cx+r*Math.cos(a1)).toFixed(1)} ${(cy+r*Math.sin(a1)).toFixed(1)} `)+
         `L ${(cx+(r+L)*Math.cos(a2)).toFixed(1)} ${(cy+(r+L)*Math.sin(a2)).toFixed(1)} L ${(cx+r*Math.cos(a3)).toFixed(1)} ${(cy+r*Math.sin(a3)).toFixed(1)} `;}
    d=p+'Z';
  } else if(isSpindle){
    const k=1.32;
    d=`M ${(cx-rx).toFixed(1)} ${cy} C ${(cx-rx*.25).toFixed(1)} ${(cy-ry*k).toFixed(1)} ${(cx+rx*.25).toFixed(1)} ${(cy-ry*k).toFixed(1)} ${(cx+rx).toFixed(1)} ${cy} C ${(cx+rx*.25).toFixed(1)} ${(cy+ry*k).toFixed(1)} ${(cx-rx*.25).toFixed(1)} ${(cy+ry*k).toFixed(1)} ${(cx-rx).toFixed(1)} ${cy} Z`;
  }
  const body=d?`<path d="${d}" fill="${fill}" style="stroke:var(--rule2)" stroke-width="${wallW}"/>`
             :`<ellipse cx="${cx}" cy="${cy}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}" style="stroke:var(--rule2)" stroke-width="${wallW}"/>`;
  if(orn==='finely-striate'||ORN_NET.has(orn)||orn==='verrucose'){
    const clip=d?`<path d="${d}"/>`:`<ellipse cx="${cx}" cy="${cy}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"/>`; let mk='';
    if(orn==='finely-striate'){for(let i=-1;i<=1;i++){const o=i*ry*.55;mk+=`<line x1="${(cx-rx*1.1).toFixed(1)}" y1="${(cy-ry*.4+o).toFixed(1)}" x2="${(cx+rx*1.1).toFixed(1)}" y2="${(cy+ry*.4+o).toFixed(1)}" stroke="rgba(255,255,255,.45)" stroke-width=".9"/>`;}}
    else if(ORN_NET.has(orn)){const n=orn==='reticulate-coarse'?3:orn==='reticulate-complete'?5:4,sw=orn==='reticulate-coarse'?1.1:.7,xe=orn==='reticulate-incomplete'?cx+rx*.15:cx+rx*1.1;
      for(let i=0;i<=n;i++){const y=cy-ry*1.1+i/n*ry*2.2;mk+=`<line x1="${(cx-rx*1.1).toFixed(1)}" y1="${y.toFixed(1)}" x2="${xe.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,.4)" stroke-width="${sw}"/>`;}
      for(let i=0;i<=n;i++){const x=cx-rx*1.1+i/n*rx*2.2*(orn==='reticulate-incomplete'?.6:1);mk+=`<line x1="${x.toFixed(1)}" y1="${(cy-ry*1.1).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(cy+ry*1.1).toFixed(1)}" stroke="rgba(255,255,255,.4)" stroke-width="${sw}"/>`;}}
    else{[[-.45,-.3],[.1,-.45],[.4,0],[-.15,.35],[.35,.4],[-.4,.15]].forEach(([px,py])=>{mk+=`<circle cx="${(cx+px*rx).toFixed(1)}" cy="${(cy+py*ry).toFixed(1)}" r=".9" fill="rgba(255,255,255,.45)"/>`;});}
    defs=`<clipPath id="${uid}-c">${clip}</clipPath>`; over=`<g clip-path="url(#${uid}-c)">${mk}</g>`;
  }
  let tr='';
  if(isTrunc){const cut=cx+rx*.62;tr=`<rect x="${cut.toFixed(1)}" y="${(cy-ry-3).toFixed(1)}" width="${(rx+pad).toFixed(1)}" height="${(ry*2+6).toFixed(1)}" style="fill:var(--sheet2)"/><line x1="${cut.toFixed(1)}" y1="${(cy-ry*.88).toFixed(1)}" x2="${cut.toFixed(1)}" y2="${(cy+ry*.88).toFixed(1)}" style="stroke:var(--rule2)" stroke-width="${wallW}"/>`;}
  return `<svg width="${dispW}" height="${dispH}" viewBox="0 0 ${VBW} ${VBH}" role="img" aria-label="${esc(nice(shape)+' spore, '+(LABELS.orn[orn]||orn).toLowerCase()+', '+(sp.sp.print||'')+' print')}">`+
    `<rect x=".5" y=".5" width="${VBW-1}" height="${VBH-1}" rx="8" style="fill:var(--sheet2);stroke:var(--rule)"/><defs>${defs}</defs>${body}${over}${tr}</svg>`;
}

/* ---------- scoring (v3 algorithm, unchanged) ---------- */
function dimScore(a,b,x,y,tol){
  if(a==null&&b==null) return null;
  let lo=a!=null?a:b, hi=b!=null?b:a; if(lo>hi)[lo,hi]=[hi,lo];
  const uw=hi-lo, ov=Math.max(0,Math.min(hi,y)-Math.max(lo,x));
  let frac=uw>0?Math.min(1,ov/uw):(lo>=x&&lo<=y?1:0);
  if(frac===0){const gap=Math.max(0,lo-y,x-hi);frac=Math.max(0,1-gap/tol)*.6;}
  const um=(lo+hi)/2, sm=(x+y)/2, half=(y-x)/2;
  return .75*frac+.25*Math.max(0,1-Math.abs(um-sm)/(half+tol));
}
function setScore(sel,vals){ if(!sel||!sel.length) return null; const v=new Set(vals||[]); return sel.some(s=>v.has(s))?1:0; }
const W={len:3,wid:3,q:1.5,shape:1,print:1.5,ft:2,blue:1.2,taste:1,pore:1.2,stipe:1.5,cap:.8,host:1.5,orn:1.6,apex:1.4,wall:.8,melzer:1};
function score(sp,Q){
  const tol=Q.tol??1.5, parts=[]; let num=0,den=0;
  const add=(k,v,label)=>{ if(v==null) return; num+=v*W[k]; den+=W[k]; parts.push({k,label,ok:v>=.85,part:v}); };
  add('len',dimScore(Q.lmin,Q.lmax,sp.sp.lo,sp.sp.hi,tol),`length ${fmt(sp.sp.lo)}–${fmt(sp.sp.hi)} µm`);
  add('wid',dimScore(Q.wmin,Q.wmax,sp.sp.wlo,sp.sp.whi,tol),`width ${fmt(sp.sp.wlo)}–${fmt(sp.sp.whi)} µm`);
  const uL=(Q.lmin!=null&&Q.lmax!=null)?(Q.lmin+Q.lmax)/2:(Q.lmin??Q.lmax), uW=(Q.wmin!=null&&Q.wmax!=null)?(Q.wmin+Q.wmax)/2:(Q.wmin??Q.wmax);
  if(uL!=null&&uW!=null&&uW>0){
    const uq=uL/uW, qr=sp.sp.q||((sp.sp.shape==='globose'||sp.sp.shape==='subglobose')?[1,1.15]:[sp.sp.lo/sp.sp.whi, sp.sp.hi/sp.sp.wlo]);
    const v=(uq>=qr[0]-.15&&uq<=qr[1]+.15)?1:Math.max(0,1-Math.min(Math.abs(uq-qr[0]),Math.abs(uq-qr[1]))/.8);
    add('q',v,`Q ${qr[0].toFixed(1)}–${qr[1].toFixed(1)}`);
  }
  const eq=(u,a)=>(u==null||u==='')?null:(u===a?1:0);
  add('shape',eq(Q.shape,sp.sp.shape),`shape ${sp.sp.shape}`);
  add('print',eq(Q.print,sp.sp.print),`print ${sp.sp.print}`);
  ['orn','apex','wall','melzer'].forEach(k=>{const v=eq(Q[k],sp.micro[k]); if(v===null) return;
    add(k,v,`${(LABELS[k][sp.micro[k]]||sp.micro[k]||'').toLowerCase()}${sp.microSrc[k]==='family'?' (family-typical)':''}`);});
  add('ft',eq(Q.ft,sp.ft),(LABELS.ft[sp.ft]||sp.ft||'').toLowerCase());
  add('blue',eq(Q.blue,sp.m.blue),(LABELS.blue[sp.m.blue]||'').toLowerCase());
  add('taste',eq(Q.taste,sp.m.taste),`taste ${sp.m.taste}`);
  add('pore',setScore(Q.pore,sp.m.pore),`pores ${sp.m.pore.join('/')}`);
  add('stipe',setScore(Q.stipe,[sp.m.stipe]),`stipe ${nice(sp.m.stipe||'')}`.toLowerCase());
  add('cap',setScore(Q.cap,sp.m.cap),`cap ${sp.m.cap.join('/')}`);
  add('host',setScore(Q.host,sp.m.host),`host ${sp.m.host.join('/')}`);
  return {pct:den?num/den:null,parts};
}
window.__sporex = {score,dimScore,SPECIES}; // test hook

/* ---------- query state (lives in the URL so a search can be bookmarked) ---------- */
const QKEYS_NUM=['lmin','lmax','wmin','wmax','tol'], QKEYS_STR=['shape','print','orn','apex','wall','melzer','ft','blue','taste','terr'], QKEYS_SET=['pore','stipe','cap','host'];
let Q = blankQ();
function blankQ(){ const q={tol:1.5,min:28,sort:'match'}; QKEYS_SET.forEach(k=>q[k]=[]); return q; }
function qFromParams(p){
  const q=blankQ();
  QKEYS_NUM.forEach(k=>{const v=parseFloat(p.get(k)); if(!isNaN(v)) q[k]=v;});
  QKEYS_STR.forEach(k=>{const v=p.get(k); if(v) q[k]=v;});
  QKEYS_SET.forEach(k=>{const v=p.get(k); if(v) q[k]=v.split(',');});
  if(p.get('min')) q.min=+p.get('min'); if(p.get('sort')) q.sort=p.get('sort');
  return q;
}
function qToParams(){
  const p=new URLSearchParams();
  QKEYS_NUM.forEach(k=>{ if(Q[k]!=null && !(k==='tol'&&Q[k]===1.5)) p.set(k,Q[k]); });
  QKEYS_STR.forEach(k=>{ if(Q[k]) p.set(k,Q[k]); });
  QKEYS_SET.forEach(k=>{ if(Q[k].length) p.set(k,Q[k].join(',')); });
  if(Q.min!==28) p.set('min',Q.min); if(Q.sort!=='match') p.set('sort',Q.sort);
  return p.toString();
}
let pins = store.get('sporex-pins',[]).filter(id=>BYID[id]);
function setPins(p){ pins=p; store.set('sporex-pins',p); $('#pinCount').textContent=p.length; }

/* ---------- router ---------- */
function route(){
  const h=location.hash.replace(/^#\/?/,'')||'identify';
  const [path,qs]=h.split('?'); const parts=path.split('/');
  document.querySelectorAll('nav.tabs a').forEach(a=>a.toggleAttribute('aria-current',false));
  const tab = parts[0]==='species'?null:parts[0];
  const tl=document.querySelector(`nav.tabs a[data-tab="${tab}"]`); if(tl) tl.setAttribute('aria-current','page');
  const main=$('#main');
  if(parts[0]==='species' && BYID[parts[1]]) viewSpecies(main,BYID[parts[1]]);
  else if(parts[0]==='browse') viewBrowse(main);
  else if(parts[0]==='compare') viewCompare(main);
  else if(parts[0]==='sources') viewSources(main);
  else { Q=qFromParams(new URLSearchParams(qs||'')); viewIdentify(main); }
  if(parts[0]!=='identify' && parts[0]!=='') window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);

/* ================================================================ IDENTIFY */
const SHAPES=[...new Set(SPECIES.map(s=>s.sp.shape).filter(Boolean))].sort();
function opts(vals,labels,cur){ return `<option value="">Any</option>`+vals.map(v=>`<option value="${esc(v)}"${cur===v?' selected':''}>${esc((labels&&labels[v])||nice(v))}</option>`).join(''); }
function chips(key,vals,labels){ return `<div class="chips" data-set="${key}">`+vals.map(v=>`<button type="button" class="chip" data-v="${esc(v)}" aria-pressed="${Q[key].includes(v)}">${key==='print'?'':''}${esc((labels&&labels[v])||nice(v))}</button>`).join('')+`</div>`; }
function printChips(){ return `<div class="chips" data-one="print">`+VOCAB.print.filter(p=>SPECIES.some(s=>s.sp.print===p)).map(v=>
  `<button type="button" class="chip" data-v="${esc(v)}" aria-pressed="${Q.print===v}"><span class="sw" style="background:${PRINT_COLOR[v]||'#888'}"></span>${esc(nice(v))}</button>`).join('')+`</div>`; }

function viewIdentify(main){
  const used=k=>[...new Set(SPECIES.flatMap(s=>[].concat(s.m[k]||[])))].filter(v=>v&&v!=='n/a');
  const order=(k)=>VOCAB[k]?VOCAB[k].filter(v=>used(k).includes(v)).concat(used(k).filter(v=>!VOCAB[k].includes(v))):used(k).sort();
  main.innerHTML = `
  <p class="caution"><span><strong>Not an edibility guide.</strong> Sporexplore ranks candidates from what you measure and see; it does not identify your collection. Several Boletales are poisonous, and <i class="sci">Paxillus involutus</i> can be deadly. Confirm with a key, a reference collection or a mycologist.</span></p>
  <div class="id-grid">
    <form class="form" id="qform" onsubmit="return false" aria-label="Characters">
      <details class="step" open data-step="1"><summary><span class="no">1</span><span class="t">Measure spores</span><span class="chev" aria-hidden="true">›</span><span class="sum"></span></summary>
        <div class="body">
          <div class="fld"><label class="lab" for="lmin">Length (µm)</label>
            <div class="row"><input type="number" id="lmin" step="0.1" min="0" placeholder="from" inputmode="decimal"><span class="dash">–</span><input type="number" id="lmax" step="0.1" min="0" placeholder="to" inputmode="decimal" aria-label="Length to"></div></div>
          <div class="fld"><label class="lab" for="wmin">Width (µm)</label>
            <div class="row"><input type="number" id="wmin" step="0.1" min="0" placeholder="from" inputmode="decimal"><span class="dash">–</span><input type="number" id="wmax" step="0.1" min="0" placeholder="to" inputmode="decimal" aria-label="Width to"></div></div>
          <p class="qline" id="qline">Enter length and width to see Q (length ÷ width).</p>
          <div class="fld"><label class="lab" for="tol">How strict</label>
            <select id="tol"><option value="0.5">Strict (±0.5 µm)</option><option value="1.5">Normal (±1.5 µm)</option><option value="3">Loose (±3 µm)</option></select></div>
          <details class="helper"><summary>Calculate from single spores</summary>
            <p>Type or paste one spore per line as length × width, for example <span class="num">14.5 x 5.2</span>. Measure at least 20 spores from a spore print.</p>
            <label class="vh" for="spores">Single spore measurements</label>
            <textarea id="spores" placeholder="14.5 x 5.2&#10;15 x 5.5&#10;13.8 x 5"></textarea>
            <dl class="stats" id="sporeStats"></dl>
            <button type="button" class="btn small" id="useStats" disabled>Use these values</button>
          </details>
        </div></details>
      <details class="step" data-step="2"><summary><span class="no">2</span><span class="t">Spore form</span><span class="chev" aria-hidden="true">›</span><span class="sum"></span></summary>
        <div class="body">
          <div class="fld"><label class="lab" for="shape">Shape</label><select id="shape">${opts(SHAPES,null,Q.shape)}</select></div>
          <div class="fld"><label class="lab" for="orn">Surface</label><select id="orn">${opts(VOCAB.orn,LABELS.orn,Q.orn)}</select></div>
          <div class="fld"><label class="lab" for="apex">Tip</label><select id="apex">${opts(VOCAB.apex,LABELS.apex,Q.apex)}</select></div>
          <div class="fld"><label class="lab" for="wall">Wall</label><select id="wall">${opts(VOCAB.wall,LABELS.wall,Q.wall)}</select></div>
          <div class="fld"><label class="lab" for="melzer">Reaction in Melzer's reagent</label><select id="melzer">${opts(VOCAB.melzer,LABELS.melzer,Q.melzer)}</select></div>
        </div></details>
      <details class="step" data-step="3"><summary><span class="no">3</span><span class="t">Spore print</span><span class="chev" aria-hidden="true">›</span><span class="sum"></span></summary>
        <div class="body"><div class="fld"><span class="lab">Colour of the deposit, seen on white paper</span>${printChips()}</div></div></details>
      <details class="step" data-step="4"><summary><span class="no">4</span><span class="t">Fruitbody</span><span class="chev" aria-hidden="true">›</span><span class="sum"></span></summary>
        <div class="body">
          <div class="fld"><label class="lab" for="ft">Type</label><select id="ft">${opts(VOCAB.ft,LABELS.ft,Q.ft)}</select></div>
          <div class="fld"><label class="lab" for="blue">Flesh when cut</label><select id="blue">${opts(VOCAB.blue,LABELS.blue,Q.blue)}</select></div>
          <div class="fld"><label class="lab" for="taste">Taste <small>(spit out)</small></label><select id="taste">${opts(VOCAB.taste.filter(t=>t!=='n/a'),null,Q.taste)}</select></div>
          <div class="fld"><span class="lab">Pore colour</span>${chips('pore',order('pore'))}</div>
          <div class="fld"><span class="lab">Stem surface</span>${chips('stipe',order('stipe').filter(v=>!['absent','stalked'].includes(v)))}</div>
          <div class="fld"><span class="lab">Cap colour</span>${chips('cap',order('cap'))}</div>
          <div class="fld"><span class="lab">Host tree or habitat</span>${chips('host',order('host'))}</div>
        </div></details>
      <button type="button" class="btn ghost" id="resetBtn" style="width:100%">Clear all characters</button>
    </form>
    <section aria-labelledby="rh">
      <div class="rbar">
        <h2 id="rh">Candidates</h2><span class="count num" id="rcount"></span><span class="spacer"></span>
        <label>Country <select id="terr"><option value="">All Nordic</option>${TERR.map(([c,n])=>`<option value="${c}"${Q.terr===c?' selected':''}>${n}</option>`).join('')}</select></label>
        <label for="minMatch">Hide below <input type="range" id="minMatch" min="0" max="95" step="1" value="${Q.min}"><span class="num" id="minVal">${Q.min}%</span></label>
        <label>Sort <select id="sort"><option value="match">Best match</option><option value="name">Name</option><option value="family">Family</option></select></label>
      </div>
      <div id="hint"></div>
      <div class="plot" id="plot"></div>
      <ol class="res" id="results"></ol>
    </section>
  </div>`;
  // restore field values
  ['lmin','lmax','wmin','wmax'].forEach(k=>{ if(Q[k]!=null) $('#'+k).value=Q[k]; });
  $('#tol').value=String(Q.tol); $('#sort').value=Q.sort;
  const form=$('#qform');
  form.addEventListener('input',e=>{ if(e.target.id==='spores') return sporeHelper(); readForm(); });
  form.addEventListener('change',e=>{ if(e.target.tagName==='SELECT') readForm(); });
  form.addEventListener('click',e=>{
    const c=e.target.closest('.chip'); if(!c) return;
    const set=c.parentNode.dataset.set, one=c.parentNode.dataset.one, v=c.dataset.v;
    if(set){ Q[set]=Q[set].includes(v)?Q[set].filter(x=>x!==v):Q[set].concat(v); c.setAttribute('aria-pressed',Q[set].includes(v)); }
    if(one){ Q[one]=Q[one]===v?null:v; c.parentNode.querySelectorAll('.chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===Q[one])); }
    refresh();
  });
  $('#resetBtn').onclick=()=>{ Q=blankQ(); history.replaceState(null,'','#/identify'); viewIdentify(main); };
  $('#terr').onchange=e=>{Q.terr=e.target.value||null;refresh();};
  $('#sort').onchange=e=>{Q.sort=e.target.value;refresh();};
  $('#minMatch').oninput=e=>{Q.min=+e.target.value;$('#minVal').textContent=Q.min+'%';refresh();};
  $('#useStats').onclick=()=>{ const st=sporeHelper(); if(!st) return;
    ['lmin','lmax','wmin','wmax'].forEach(k=>{ $('#'+k).value=fmt(st.use[k]); }); readForm(); };
  // open steps that carry values
  form.querySelectorAll('.step').forEach(d=>{ if(stepSummary(+d.dataset.step)) d.open=true; });
  refresh();
}
function readForm(){
  const g=id=>{const v=parseFloat(($('#'+id).value||'').replace(',','.'));return isNaN(v)?null:v;};
  ['lmin','lmax','wmin','wmax'].forEach(k=>Q[k]=g(k));
  Q.tol=parseFloat($('#tol').value);
  ['shape','orn','apex','wall','melzer','ft','blue','taste'].forEach(k=>Q[k]=$('#'+k).value||null);
  refresh();
}
function stepSummary(n){
  const r=[];
  if(n===1){ if(Q.lmin!=null||Q.lmax!=null) r.push(`L ${fmt(Q.lmin)}${Q.lmax!=null?'–'+fmt(Q.lmax):''}`); if(Q.wmin!=null||Q.wmax!=null) r.push(`W ${fmt(Q.wmin)}${Q.wmax!=null?'–'+fmt(Q.wmax):''} µm`); }
  if(n===2) ['shape','orn','apex','wall','melzer'].forEach(k=>{ if(Q[k]) r.push(((LABELS[k]&&LABELS[k][Q[k]])||nice(Q[k])).toLowerCase()); });
  if(n===3 && Q.print) r.push(nice(Q.print));
  if(n===4){ ['ft','blue','taste'].forEach(k=>{ if(Q[k]) r.push(((LABELS[k]&&LABELS[k][Q[k]])||Q[k]).toLowerCase()); }); QKEYS_SET.forEach(k=>{ if(Q[k].length) r.push(Q[k].join('/')); }); }
  return r.join(', ');
}
function parseSpores(text){
  const out=[]; const re=/(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)/gi; let m;
  while((m=re.exec(text))){ const L=+m[1].replace(',','.'), Wd=+m[2].replace(',','.'); if(L>0&&Wd>0&&L<80&&Wd<80) out.push([Math.max(L,Wd),Math.min(L,Wd)]); }
  return out;
}
function pct(arr,p){ const a=[...arr].sort((x,y)=>x-y); const i=(a.length-1)*p, lo=Math.floor(i), hi=Math.ceil(i); return a[lo]+(a[hi]-a[lo])*(i-lo); }
function sporeHelper(){
  const sp=parseSpores($('#spores').value), box=$('#sporeStats'), btn=$('#useStats');
  if(sp.length<2){ box.innerHTML=sp.length?'<dt>Spores</dt><dd>1, add more</dd>':''; btn.disabled=true; return null; }
  const L=sp.map(s=>s[0]), Wd=sp.map(s=>s[1]), Qs=sp.map(s=>s[0]/s[1]), mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const big=sp.length>=10, lo=a=>big?pct(a,.1):Math.min(...a), hi=a=>big?pct(a,.9):Math.max(...a);
  const note=(a)=>`${big?`(${fmt(Math.min(...a))}–) `:''}${fmt(lo(a))}–${fmt(hi(a))}${big?` (–${fmt(Math.max(...a))})`:''}`;
  box.innerHTML=`<dt>Spores</dt><dd>n = ${sp.length}</dd><dt>Length</dt><dd>${note(L)} µm, mean ${fmt(mean(L))}</dd>
    <dt>Width</dt><dd>${note(Wd)} µm, mean ${fmt(mean(Wd))}</dd><dt>Q</dt><dd>${Math.min(...Qs).toFixed(2)}–${Math.max(...Qs).toFixed(2)}, Qm ${mean(Qs).toFixed(2)}</dd>
    ${big?'':'<dt></dt><dd>With 10 or more spores the range uses the 10th–90th percentile, with extremes in brackets.</dd>'}`;
  btn.disabled=false;
  return {use:{lmin:lo(L),lmax:hi(L),wmin:lo(Wd),wmax:hi(Wd)}};
}

function scoredList(){
  let list=SPECIES.slice();
  if(Q.terr) list=list.filter(s=>s.gbif&&s.gbif.counts&&s.gbif.counts[Q.terr]>0);
  const sc=list.map(s=>({s,...score(s,Q)}));
  const any=sc.some(r=>r.pct!==null);
  const byName=(a,b)=>a.s.n.localeCompare(b.s.n);
  if(Q.sort==='name'||!any) sc.sort(byName);
  else if(Q.sort==='family') sc.sort((a,b)=>a.s.fam.localeCompare(b.s.fam)||byName(a,b));
  else sc.sort((a,b)=>(b.pct??-1)-(a.pct??-1)||byName(a,b));
  return {list,sc,any,shown:any?sc.filter(r=>r.pct>=Q.min/100):sc};
}
function refresh(){
  history.replaceState(null,'','#/identify'+(qToParams()?'?'+qToParams():''));
  const uL=(Q.lmin!=null&&Q.lmax!=null)?(Q.lmin+Q.lmax)/2:(Q.lmin??Q.lmax), uW=(Q.wmin!=null&&Q.wmax!=null)?(Q.wmin+Q.wmax)/2:(Q.wmin??Q.wmax);
  $('#qline').innerHTML=(uL!=null&&uW!=null&&uW>0)?`Q ≈ <b>${(uL/uW).toFixed(2)}</b> from the midpoints ${fmt(uL)} × ${fmt(uW)} µm`:'Enter length and width to see Q (length ÷ width).';
  document.querySelectorAll('.step').forEach(d=>{ const s=stepSummary(+d.dataset.step); $('.sum',d).textContent=s; d.classList.toggle('has',!!s); });
  const {list,shown,any,sc}=scoredList();
  $('#rcount').textContent=any?`${shown.length} of ${list.length} at or above ${Q.min}%`:`${list.length} species, alphabetical. Enter a character to rank them.`;
  $('#hint').innerHTML=any?discriminator(shown):'';
  const hb=$('#hint button'); if(hb) hb.onclick=()=>{ const d=document.querySelector(`.step[data-step="${hb.dataset.step}"]`); if(d){d.open=true;d.scrollIntoView({block:'nearest'});const f=$('#'+hb.dataset.ctl)||$('.chip',d); if(f) f.focus();} };
  $('#plot').innerHTML=plotSVG(any?shown.slice(0,40):[],uL!=null||uW!=null);
  $('#plot').querySelectorAll('[data-id]').forEach(el=>{ el.addEventListener('click',()=>location.hash='#/species/'+el.dataset.id); el.addEventListener('keydown',e=>{ if(e.key==='Enter') location.hash='#/species/'+el.dataset.id; }); });
  const box=$('#results');
  if(!shown.length){ box.innerHTML=`<li class="empty">No species reach ${Q.min}%. Lower “Hide below”, choose “Loose” in step 1, or clear a character you are unsure of.</li>`; return; }
  const maxL=Math.max(30,...shown.slice(0,60).map(r=>r.s.sp.ext&&r.s.sp.ext.lmax||r.s.sp.hi), Q.lmax||0)+1;
  const maxW=Math.max(16,...shown.slice(0,60).map(r=>r.s.sp.ext&&r.s.sp.ext.wmax||r.s.sp.whi), Q.wmax||0)+1;
  box.innerHTML=shown.slice(0,120).map((r,i)=>card(r,i,any,maxL,maxW)).join('')+(shown.length>120?`<li class="empty">${shown.length-120} more below the top 120. Add a character to narrow the list.</li>`:'');
  box.querySelectorAll('.pin').forEach(b=>b.onclick=()=>{ const id=b.dataset.id; setPins(pins.includes(id)?pins.filter(x=>x!==id):pins.concat(id).slice(-4)); box.querySelectorAll(`.pin[data-id="${id}"]`).forEach(x=>x.setAttribute('aria-pressed',pins.includes(id))); });
}
function rangeBar(lo,hi,mn,mx,ulo,uhi,max){
  const P=v=>(Math.max(0,Math.min(max,v))/max*100).toFixed(2)+'%';
  let h=`<span class="bar" aria-hidden="true"><span class="tr"></span>`;
  if(mn!=null||mx!=null) h+=`<span class="ex" style="left:${P(mn??lo)};width:calc(${P(mx??hi)} - ${P(mn??lo)})"></span>`;
  h+=`<span class="core" style="left:${P(lo)};width:calc(${P(hi)} - ${P(lo)})"></span>`;
  if(ulo!=null||uhi!=null){ const a=ulo??uhi, b=uhi??ulo; h+=`<span class="u" style="left:calc(${P(Math.min(a,b))} - 2px);width:calc(${P(Math.max(a,b))} - ${P(Math.min(a,b))} + 4px)"></span>`; }
  return h+'</span>';
}
function card(r,i,any,maxL,maxW){
  const s=r.s, p=r.pct==null?null:Math.round(r.pct*100), col=p==null?'var(--ink3)':p>=80?'var(--good)':p>=55?'var(--mid)':'var(--low)';
  const e=s.sp.ext||{};
  const flags=(s.flags||[]).map(f=>`<span class="flag" title="${esc(f.t)}">${esc(flagShort(f))}</span>`).join('');
  const tags=r.parts.filter(x=>x.k!=='len'&&x.k!=='wid').map(x=>`<span class="tag ${x.ok?'ok':x.part<.5?'no':''}">${esc(x.label)}</span>`).join('');
  return `<li class="card">
    <span class="rk num">${any&&Q.sort==='match'?i+1:''}</span>
    <span>${sporeIcon(s,52,32)}</span>
    <span class="nm"><a href="#/species/${s.id}"><span class="sci">${esc(s.n)}</span></a><span class="au">${esc(s.a||'')}</span>
      <div class="sub">${s.dk?esc(s.dk)+', ':''}${esc(s.fam)} <span class="ed ${esc(s.ed||'')}">${esc(LABELS.ed[s.ed]||'')}</span></div></span>
    <span class="pct">${p!=null?`<b style="color:${col}">${p}%</b><span>match</span>`:''}</span>
    <div class="more">
      <div class="bars num"><span>L</span>${rangeBar(s.sp.lo,s.sp.hi,e.lmin,e.lmax,Q.lmin,Q.lmax,maxL)}<span>${spRange(e.lmin,s.sp.lo,s.sp.hi,e.lmax)}</span>
        <span>W</span>${rangeBar(s.sp.wlo,s.sp.whi,e.wmin,e.wmax,Q.wmin,Q.wmax,maxW)}<span>${spRange(e.wmin,s.sp.wlo,s.sp.whi,e.wmax)} µm</span></div>
      <div class="tags">${flags}${tags}</div>
      <button type="button" class="pin" data-id="${s.id}" aria-pressed="${pins.includes(s.id)}">Compare</button>
    </div></li>`;
}
function spRange(mn,lo,hi,mx){ return `${mn!=null?`(${fmt(mn)}–) `:''}${fmt(lo)}–${fmt(hi)}${mx!=null?` (–${fmt(mx)})`:''}`; }
function flagShort(f){ return {'disagree-L':'Sources disagree','disagree-Q':'Sources disagree','legacy':'Unverified value','nomen-gbif':'Name in flux','nomen-sa':'Name differs','nomen-sf':'Name changed','new':'New in v4'}[f.k]||'Note'; }

const CHARS=[
  {k:'ft',label:'fruitbody type',step:4,ctl:'ft',get:s=>[s.ft]},{k:'print',label:'spore print colour',step:3,get:s=>[s.sp.print]},
  {k:'blue',label:'what the flesh does when cut',step:4,ctl:'blue',get:s=>[s.m.blue]},{k:'taste',label:'taste',step:4,ctl:'taste',get:s=>[s.m.taste]},
  {k:'shape',label:'spore shape',step:2,ctl:'shape',get:s=>[s.sp.shape]},{k:'orn',label:'spore surface',step:2,ctl:'orn',get:s=>[s.micro.orn]},
  {k:'apex',label:'spore tip',step:2,ctl:'apex',get:s=>[s.micro.apex]},{k:'melzer',label:"Melzer's reaction",step:2,ctl:'melzer',get:s=>[s.micro.melzer]},
  {k:'pore',label:'pore colour',step:4,set:1,get:s=>s.m.pore},{k:'stipe',label:'stem surface',step:4,set:1,get:s=>[s.m.stipe]},
  {k:'host',label:'host tree or habitat',step:4,set:1,get:s=>s.m.host},{k:'cap',label:'cap colour',step:4,set:1,get:s=>s.m.cap}];
function discriminator(shown){
  if(!shown.length) return '';
  const top=shown.filter(r=>r.pct>=shown[0].pct-.04); if(top.length<3) return '';
  const pool=top.slice(0,12).map(r=>r.s); let best=null;
  for(const c of CHARS){
    if(c.set?Q[c.k].length:Q[c.k]) continue;
    const n={}; pool.forEach(s=>c.get(s).forEach(v=>{ if(v&&v!=='n/a') n[v]=(n[v]||0)+1; }));
    const g=Object.values(n); if(g.length<2) continue; const w=Math.max(...g);
    if(!best||w<best.w) best={c,w,n:g.length};
  }
  if(!best) return '';
  return `<div class="hint">${top.length>=30?'30+':top.length} species are within 4 points of the leader. Spore size alone rarely separates them; the quickest split is <button type="button" data-step="${best.c.step}" data-ctl="${best.c.ctl||''}">${best.c.label}</button>, which divides them into ${best.n} groups.</div>`;
}

function plotSVG(rows,hasYou){
  const narrow=window.innerWidth<640, Wd=narrow?420:760, H=narrow?330:290, ml=38, mr=narrow?10:120, mt=12, mb=36;
  const sp=rows.map(r=>r.s);
  const uv=[Q.lmin,Q.lmax].filter(v=>v!=null), wv=[Q.wmin,Q.wmax].filter(v=>v!=null);
  const lows=sp.map(s=>s.sp.lo).concat(uv), highs=sp.map(s=>s.sp.hi).concat(uv);
  let x0=lows.length?Math.max(0,Math.floor(Math.min(...lows)-2)):0, x1=highs.length?Math.ceil(Math.max(...highs)+2):24;
  if(x1-x0<8){x1=x0+8;}
  const y1=Math.ceil(Math.max(6,...sp.map(s=>s.sp.whi),...wv)+1), y0=0;
  const x=v=>ml+(v-x0)/(x1-x0)*(Wd-ml-mr), y=v=>H-mb-(v-y0)/(y1-y0)*(H-mt-mb);
  const step=(r)=>r>40?10:r>20?5:r>10?2:1;
  let g='';
  for(let v=Math.ceil(x0/step(x1-x0))*step(x1-x0);v<=x1;v+=step(x1-x0)) g+=`<line class="grid" x1="${x(v)}" x2="${x(v)}" y1="${mt}" y2="${H-mb}"/><text class="tick" x="${x(v)}" y="${H-mb+15}" text-anchor="middle">${v}</text>`;
  for(let v=0;v<=y1;v+=step(y1)) g+=`<line class="grid" x1="${ml}" x2="${Wd-mr}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${ml-6}" y="${y(v)+4}" text-anchor="end">${v}</text>`;
  g+=`<line class="ax" x1="${ml}" x2="${Wd-mr}" y1="${H-mb}" y2="${H-mb}"/><line class="ax" x1="${ml}" x2="${ml}" y1="${mt}" y2="${H-mb}"/>`;
  g+=`<text class="tick" x="${(ml+Wd-mr)/2}" y="${H-4}" text-anchor="middle">spore length (µm)</text><text class="tick" transform="translate(11 ${(mt+H-mb)/2}) rotate(-90)" text-anchor="middle">width (µm)</text>`;
  const boxes=sp.slice().reverse().map((s,ri)=>{
    const i=sp.length-1-ri, c=PRINT_COLOR[s.sp.print]||'#888', op=i<5?.42:.14;
    return `<rect class="sbox" tabindex="0" role="link" data-id="${s.id}" x="${x(s.sp.lo).toFixed(1)}" y="${y(s.sp.whi).toFixed(1)}" width="${Math.max(2,x(s.sp.hi)-x(s.sp.lo)).toFixed(1)}" height="${Math.max(2,y(s.sp.wlo)-y(s.sp.whi)).toFixed(1)}" fill="${c}" fill-opacity="${op}" stroke="${c}" stroke-opacity="${i<5?1:.5}"><title>${esc(s.n)}: ${fmt(s.sp.lo)}–${fmt(s.sp.hi)} × ${fmt(s.sp.wlo)}–${fmt(s.sp.whi)} µm</title></rect>`;
  }).join('');
  // labels for the top five, in a column to the right of the plot, joined by leader lines (no overlaps)
  let labels='';
  if(!narrow&&sp.length){
    const top=sp.slice(0,5).map((s,i)=>({s,i,ty:y((s.sp.wlo+s.sp.whi)/2)})).sort((a,b)=>a.ty-b.ty);
    let last=-1e9; top.forEach(t=>{ t.ly=Math.max(t.ty,last+15); last=t.ly; });
    const over=last-(H-mb); if(over>0) top.forEach(t=>t.ly-=over);
    labels=top.map(t=>{ const lx=Wd-mr+8; return `<line x1="${x(t.s.sp.hi).toFixed(1)}" y1="${t.ty.toFixed(1)}" x2="${lx-2}" y2="${t.ly.toFixed(1)}" style="stroke:var(--ink3);stroke-width:.6"/><text class="slab" x="${lx}" y="${(t.ly+4).toFixed(1)}">${t.i+1}. ${esc(t.s.n.replace(/^(\w)\w+/,'$1.'))}</text>`; }).join('');
  }
  let you='';
  if(hasYou){
    const l1=Q.lmin??Q.lmax, l2=Q.lmax??Q.lmin, w1=Q.wmin??Q.wmax, w2=Q.wmax??Q.wmin;
    const bx=(a,b)=>[x(Math.min(a,b))-2, Math.max(4,x(Math.max(a,b))-x(Math.min(a,b))+4)], by=(a,b)=>[y(Math.max(a,b))-2, Math.max(4,y(Math.min(a,b))-y(Math.max(a,b))+4)];
    if(l1!=null&&w1!=null){ const [X0,XW]=bx(l1,l2),[Y0,YH]=by(w1,w2); you=`<rect class="you" x="${X0}" y="${Y0}" width="${XW}" height="${YH}" rx="3"/><circle class="youdot" cx="${x((l1+l2)/2)}" cy="${y((w1+w2)/2)}" r="3.5"/>`; }
    else if(l1!=null){ const [X0,XW]=bx(l1,l2); you=`<rect class="you" x="${X0}" y="${mt}" width="${XW}" height="${H-mb-mt}"/>`; }
    else if(w1!=null){ const [Y0,YH]=by(w1,w2); you=`<rect class="you" x="${ml}" y="${Y0}" width="${Wd-ml-mr}" height="${YH}"/>`; }
  }
  const msg = rows.length?`Each box is a species' typical spore range, tinted by its spore print; the five best matches are numbered. The dashed box is your measurement. Select a box to open the species.`
                         :`Enter a measurement to see where your spores fall among the candidates.`;
  return `<div class="plot-h"><h3>Where your spores fall</h3><p>${msg}</p></div>
    <svg viewBox="0 0 ${Wd} ${H}" role="group" aria-label="Spore length against width for the top candidates">${g}${boxes}${labels}${you}</svg>`;
}
/* ================================================================ SPECIES PAGE */
function viewSpecies(main,s){
  const e=s.sp.ext||{}, srcs=[...new Set(s.meas.map(m=>m.src))];
  const qtxt=s.sp.q?`, Q = ${s.sp.q[0]}–${s.sp.q[1]}`:'';
  const measRows=s.meas.map(m=>`<tr><td>${citeShort(m.src,m.page)}<div class="verb">${esc(FIELD_LABEL[m.field]||m.where||'')}</div></td>
      <td class="n">${spRange(m.L[0],m.L[1],m.L[2],m.L[3])} × ${spRange(m.W[0],m.W[1],m.W[2],m.W[3])} µm${m.Q?`<br>Q ${m.Q[0]}–${m.Q[1]}`:''}${m.Qav?`<br>Qav ${m.Qav[0]}–${m.Qav[1]}`:''}${m.Qm?`<br>Qm ${m.Qm}`:''}${m.n?`<br>n = ${m.n}`:''}</td>
      <td><div class="verb">“${esc(m.verbatim)}”</div>${m.ornIncluded===false?'<div class="verb">Measured without ornament.</div>':''}${m.note?`<div class="verb">${esc(m.note)}</div>`:''}</td></tr>`).join('');
  const terr=TERR.map(([c,n])=>{ const v=s.gbif&&s.gbif.counts?s.gbif.counts[c]:null; return `<div class="terr ${v?'':'zero'}" title="${n}"><span>${n}</span><b>${v==null?'–':v.toLocaleString('en')}</b></div>`; }).join('');
  const links=[
    s.saId&&`<a href="https://svampe.databasen.org/taxon/${s.saId}" target="_blank" rel="noopener">Danmarks Svampeatlas</a>`,
    s.ifId&&`<a href="https://www.speciesfungorum.org/Names/SynSpecies.asp?RecordID=${s.ifId}" target="_blank" rel="noopener">Species Fungorum</a>`,
    s.ifId&&`<a href="https://www.indexfungorum.org/names/NamesRecord.asp?RecordID=${s.ifId}" target="_blank" rel="noopener">Index Fungorum</a>`,
    s.gbif&&s.gbif.key&&`<a href="https://www.gbif.org/species/${s.gbif.key}" target="_blank" rel="noopener">GBIF</a>`].filter(Boolean).join(' · ');
  main.innerHTML=`<a class="back" href="javascript:history.back()">Back</a>
  <div class="sp-head">${sporeIcon(s,90,54)}<div><h1>${esc(s.n)} <span class="au">${esc(s.a||'')}</span></h1></div></div>
  <div class="sp-sub">${s.dk?esc(s.dk)+' · ':''}${esc(s.fam)} · ${esc(LABELS.ft[s.ft]||'')} <span class="ed ${esc(s.ed||'')}">${esc(LABELS.ed[s.ed]||'')}</span>
    <button type="button" class="pin" id="pinOne" aria-pressed="${pins.includes(s.id)}">Compare</button></div>
  ${(s.flags||[]).length?`<div class="panel">${s.flags.map(f=>`<p style="margin:4px 0"><span class="flag">${esc(flagShort(f))}</span> ${esc(f.t)}</p>`).join('')}</div>`:''}
  <div class="cols"><div>
    <section class="panel"><h2>Spores</h2>
      <p class="notation num">${spRange(e.lmin,s.sp.lo,s.sp.hi,e.lmax)} × ${spRange(e.wmin,s.sp.wlo,s.sp.whi,e.wmax)} µm${qtxt}</p>
      <p class="verb" style="font-style:normal">${s.legacyOnly?'This value comes from Sporexplore v3 and its source could not yet be verified.':`Consensus of ${srcs.length} source${srcs.length>1?'s':''}: the range covers every source's typical range; extremes in brackets.`}</p>
      ${s.meas.length?`<table class="t"><thead><tr><th>Source</th><th>Measurement</th><th>As published</th></tr></thead><tbody>${measRows}</tbody></table>`:''}
      ${s.legacy&&!s.legacyOnly?`<p class="verb" style="font-style:normal">Sporexplore v3 showed ${fmt(s.legacy.lo)}–${fmt(s.legacy.hi)} × ${fmt(s.legacy.wlo)}–${fmt(s.legacy.whi)} µm.</p>`:''}
      <h3>Spore characters</h3>
      <div class="micro">${MICRO_KEYS.filter(k=>s.micro[k]).map(k=>`<span class="${s.microSrc[k]==='family'?'fam':''}" title="${s.microSrc[k]==='family'?'Typical for '+esc(s.fam)+'; not documented for this species':'Documented for this species'}">${esc(LABELS[k][s.micro[k]]||s.micro[k])}</span>`).join('')}</div>
      <p class="verb" style="font-style:normal">Dashed: typical for the family, not documented for this species.</p>
      ${s.microQuote?`<p class="verb">“${esc(s.microQuote)}”</p>`:''}
    </section>
    <section class="panel"><h2>Fruitbody</h2><dl class="kv">
      <dt>Type</dt><dd>${esc(LABELS.ft[s.ft]||'')}</dd><dt>Spore print</dt><dd>${esc(nice(s.sp.print||''))}</dd>
      ${s.m.pore.length&&s.m.pore[0]!=='n/a'?`<dt>Pores</dt><dd>${esc(s.m.pore.map(nice).join(', '))}</dd>`:''}
      ${s.m.blue?`<dt>Flesh when cut</dt><dd>${esc(LABELS.blue[s.m.blue]||s.m.blue)}</dd>`:''}
      ${s.m.stipe&&s.m.stipe!=='absent'?`<dt>Stem</dt><dd>${esc(nice(s.m.stipe))}</dd>`:''}
      ${s.m.cap.length?`<dt>Cap</dt><dd>${esc(s.m.cap.map(nice).join(', '))}</dd>`:''}
      ${s.m.host.length?`<dt>Host or habitat</dt><dd>${esc(s.m.host.map(nice).join(', '))}</dd>`:''}
      ${s.m.taste&&s.m.taste!=='n/a'?`<dt>Taste</dt><dd>${esc(nice(s.m.taste))}</dd>`:''}
      </dl>${s.note?`<p class="verb" style="font-style:normal;margin-top:10px">${esc(s.note)}</p>`:''}</section>
  </div><div>
    <section class="panel"><h2>Names</h2><dl class="kv">
      <dt>Used here</dt><dd><i class="sci">${esc(s.n)}</i> ${esc(s.a||'')}</dd>
      ${s.sf?`<dt>Species Fungorum</dt><dd><i class="sci">${esc(s.sf.current)}</i>${s.sf.referee?` <span class="verb">(${esc(s.sf.referee)})</span>`:''}</dd>`:''}
      ${s.syn?`<dt>Synonym</dt><dd><i class="sci">${esc(s.syn)}</i></dd>`:''}
      ${s.dk?`<dt>Danish name</dt><dd>${esc(s.dk)}${s.dkOld?` <span class="verb">(v3 used “${esc(s.dkOld)}”)</span>`:''}</dd>`:''}
      </dl><p style="margin:10px 0 0">${links}</p></section>
    <section class="panel"><h2>Nordic records</h2><div class="terrs num">${terr}</div>
      <p class="verb" style="font-style:normal">GBIF occurrence records${s.gbif?`, retrieved ${esc(s.gbif.retrieved)}`:''}. Counts are records, not abundance.</p></section>
    <section class="panel"><h2>Photographs</h2><div class="photos" id="photos"><p class="verb">Loading openly licensed photographs from GBIF…</p></div></section>
    <section class="panel"><h2>References</h2><ol class="refs">${srcs.map(id=>refItem(id)).join('')||'<li>No sourced measurement yet.</li>'}</ol></section>
  </div></div>`;
  $('#pinOne').onclick=e=>{ setPins(pins.includes(s.id)?pins.filter(x=>x!==s.id):pins.concat(s.id).slice(-4)); e.target.setAttribute('aria-pressed',pins.includes(s.id)); };
  loadPhotos($('#photos'),s);
  document.title=`${s.n} — Sporexplore`;
}
function refItem(id){
  const s=X.sources[id]; if(!s) return '';
  const v=s.doiVerified?`DOI checked against Crossref${s.crossref&&s.crossref.retrieved?' on '+esc(s.crossref.retrieved):''}.`:
          s.type==='database-entry'?'Database record; no DOI.':s.noDoi?'No DOI exists for this work.':s.doi?'DOI not yet verified.':'';
  return `<li>${s.apa}<span class="ver">${v}</span></li>`;
}

const OPEN_LIC=/creativecommons\.org|publicdomain/i, NORDIC_Q=TERR.map(t=>'country='+t[0]).join('&'), photoCache={};
function loadPhotos(box,s){
  const key=s.gbif&&s.gbif.key; if(!key){ box.innerHTML='<p class="verb">No GBIF record linked.</p>'; return; }
  const paint=pics=>{ box.innerHTML=pics.length?pics.slice(0,6).map(p=>`<a href="https://www.gbif.org/occurrence/${p.key}" target="_blank" rel="noopener"><img loading="lazy" alt="${esc(s.n)}, photographed by ${esc(p.who)}" src="${esc(p.url.replace(/(inaturalist[^\s]*\/photos\/\d+\/)original(\.\w+)/i,'$1medium$2'))}" onerror="this.parentNode.remove()"><span>${esc(p.who)} · ${esc(p.lic)}${p.cc?' · '+p.cc:''}</span></a>`).join('')+
      `<p class="verb" style="grid-column:1/-1;font-style:normal">Recorder identifications, not verified here.</p>`:'<p class="verb">No openly licensed photograph found.</p>'; };
  if(photoCache[key]) return paint(photoCache[key]);
  const harvest=j=>{ const out=[],seen=new Set(); (j.results||[]).forEach(r=>(r.media||[]).forEach(m=>{ if(m.identifier&&OPEN_LIC.test(m.license||'')&&!seen.has(r.key)){ seen.add(r.key);
      const lic=/publicdomain\/zero/i.test(m.license)?'CC0':'CC '+((/licenses\/([a-z-]+)\//i.exec(m.license)||[])[1]||'').toUpperCase();
      out.push({url:m.identifier,lic,who:m.creator||m.rightsHolder||'Unknown',cc:r.countryCode||'',key:r.key}); }})); return out; };
  const base=`https://api.gbif.org/v1/occurrence/search?taxonKey=${key}&mediaType=StillImage&limit=24`;
  fetch(base+'&'+NORDIC_Q).then(r=>r.json()).then(j=>{ const a=harvest(j); return a.length>=3?a:fetch(base).then(r=>r.json()).then(j2=>a.concat(harvest(j2).filter(p=>!a.some(q=>q.key===p.key)))); })
    .then(p=>{ photoCache[key]=p; paint(p); }).catch(()=>{ box.innerHTML='<p class="verb">Could not reach GBIF for photographs.</p>'; });
}

/* ================================================================ BROWSE */
let B={q:'',fam:'',ft:'',terr:''};
function viewBrowse(main){
  const fams=[...new Set(SPECIES.map(s=>s.fam))].sort();
  main.innerHTML=`<div class="filters">
    <label class="vh" for="bq">Search</label><input type="search" id="bq" placeholder="Search scientific or Danish name" value="${esc(B.q)}">
    <label class="vh" for="bfam">Family</label><select id="bfam"><option value="">All families</option>${fams.map(f=>`<option${B.fam===f?' selected':''}>${f}</option>`).join('')}</select>
    <label class="vh" for="bft">Type</label><select id="bft"><option value="">All fruitbody types</option>${VOCAB.ft.map(f=>`<option value="${f}"${B.ft===f?' selected':''}>${LABELS.ft[f]}</option>`).join('')}</select>
    <label class="vh" for="bterr">Country</label><select id="bterr"><option value="">All Nordic</option>${TERR.map(([c,n])=>`<option value="${c}"${B.terr===c?' selected':''}>${n}</option>`).join('')}</select>
  </div><div id="blist"></div>`;
  const draw=()=>{
    const q=B.q.trim().toLowerCase();
    const list=SPECIES.filter(s=>(!q||s.n.toLowerCase().includes(q)||(s.dk||'').toLowerCase().includes(q)||(s.syn||'').toLowerCase().includes(q))&&(!B.fam||s.fam===B.fam)&&(!B.ft||s.ft===B.ft)&&(!B.terr||(s.gbif&&s.gbif.counts&&s.gbif.counts[B.terr]>0)));
    const by={}; list.forEach(s=>(by[s.fam]=by[s.fam]||[]).push(s));
    $('#blist').innerHTML=Object.keys(by).sort().map(f=>`<section class="fam"><h2>${esc(f)}<small>${by[f].length} species</small></h2><ul class="blist">${by[f].sort((a,b)=>a.n.localeCompare(b.n)).map(s=>
      `<li><a href="#/species/${s.id}">${sporeIcon(s,44,27)}<span><span class="sci">${esc(s.n)}</span><small>${s.dk?esc(s.dk)+' · ':''}<span class="num">${spRange(null,s.sp.lo,s.sp.hi,null)} × ${spRange(null,s.sp.wlo,s.sp.whi,null)} µm</span>${s.flags.some(f=>f.k==='legacy')?' · unverified':''}</small></span></a></li>`).join('')}</ul></section>`).join('')||'<p class="empty">No species match. Clear the search or a filter.</p>';
  };
  $('#bq').oninput=e=>{B.q=e.target.value;draw();};
  ['fam','ft','terr'].forEach(k=>$('#b'+k).onchange=e=>{B[k]=e.target.value;draw();});
  draw();
}

/* ================================================================ COMPARE */
function viewCompare(main){
  const ss=pins.map(id=>BYID[id]).filter(Boolean);
  if(!ss.length){ main.innerHTML=`<div class="empty">Nothing to compare yet. Select <b>Compare</b> on up to four species in Identify or on a species page.</div>`; return; }
  const maxL=Math.max(...ss.map(s=>s.sp.hi))+2, sc=600/Math.max(20,maxL), rowH=Math.max(...ss.map(s=>s.sp.whi))*sc+24;
  const draw=ss.map((s,i)=>{ const L=(s.sp.lo+s.sp.hi)/2*sc, Wd=(s.sp.wlo+s.sp.whi)/2*sc, y=i*rowH+rowH/2, c=PRINT_COLOR[s.sp.print]||'#888';
    const shape=(s.sp.shape==='fusiform'||s.sp.shape==='truncate')?`<path d="M ${140} ${y} C ${140+L*.375} ${y-Wd*.66} ${140+L*.625} ${y-Wd*.66} ${140+L} ${y} C ${140+L*.625} ${y+Wd*.66} ${140+L*.375} ${y+Wd*.66} 140 ${y} Z" fill="${c}" fill-opacity=".55" stroke="${c}"/>`
      :`<ellipse cx="${140+L/2}" cy="${y}" rx="${L/2}" ry="${Wd/2}" fill="${c}" fill-opacity=".55" stroke="${c}"/>`;
    return `<text x="0" y="${y+4}" style="fill:var(--ink);font:italic 14px var(--serif)">${esc(s.n)}</text>${shape}<text x="${148+L}" y="${y+4}" style="fill:var(--ink3);font-size:12px">${fmt((s.sp.lo+s.sp.hi)/2)} × ${fmt((s.sp.wlo+s.sp.whi)/2)} µm</text>`; }).join('');
  const bar10=`<line x1="140" x2="${140+10*sc}" y1="${ss.length*rowH+8}" y2="${ss.length*rowH+8}" style="stroke:var(--ink2);stroke-width:2"/><text x="${140+10*sc+6}" y="${ss.length*rowH+12}" style="fill:var(--ink3);font-size:12px">10 µm</text>`;
  const rows=[['Spores (µm)',s=>`${spRange(s.sp.ext.lmin,s.sp.lo,s.sp.hi,s.sp.ext.lmax)} × ${spRange(s.sp.ext.wmin,s.sp.wlo,s.sp.whi,s.sp.ext.wmax)}`],
    ['Q',s=>s.sp.q?`${s.sp.q[0]}–${s.sp.q[1]}`:'–'],['Spore shape',s=>nice(s.sp.shape||'')],['Spore surface',s=>LABELS.orn[s.micro.orn]||''],
    ['Spore print',s=>nice(s.sp.print||'')],['Fruitbody',s=>LABELS.ft[s.ft]||''],['Pores',s=>s.m.pore.map(nice).join(', ')],
    ['Flesh when cut',s=>LABELS.blue[s.m.blue]||''],['Stem',s=>nice(s.m.stipe||'')],['Cap',s=>s.m.cap.map(nice).join(', ')],
    ['Host or habitat',s=>s.m.host.map(nice).join(', ')],['Taste',s=>nice(s.m.taste||'')],['Edibility',s=>LABELS.ed[s.ed]||'']];
  main.innerHTML=`<div class="rbar"><h2>Compare</h2><span class="count">Spores drawn to the same scale, at their mid-range size.</span><span class="spacer"></span><button class="btn ghost small" id="clearPins">Clear comparison</button></div>
    <div class="cmp-scale"><svg viewBox="0 0 ${180+maxL*sc+120} ${ss.length*rowH+20}" style="width:100%;min-width:520px;height:auto">${draw}${bar10}</svg></div>
    <div class="panel cmp-table"><table class="t"><thead><tr><th></th>${ss.map(s=>`<th><a href="#/species/${s.id}"><i class="sci" style="font-size:16px">${esc(s.n)}</i></a></th>`).join('')}</tr></thead><tbody>
    ${rows.map(([l,f])=>{ const v=ss.map(f); const diff=new Set(v).size>1; return `<tr><th>${l}</th>${v.map(x=>`<td class="${diff?'diff':''}">${esc(x)}</td>`).join('')}</tr>`; }).join('')}</tbody></table>
    <p class="verb" style="font-style:normal">Highlighted rows differ between the species.</p></div>`;
  $('#clearPins').onclick=()=>{ setPins([]); viewCompare(main); };
}

/* ================================================================ SOURCES & METHOD */
function viewSources(main){
  const all=Object.entries(X.sources);
  const lit=all.filter(([,s])=>s.type!=='database-entry').sort((a,b)=>a[1].apa.replace(/<[^>]+>/g,'').localeCompare(b[1].apa.replace(/<[^>]+>/g,'')));
  const db=all.filter(([,s])=>s.type==='database-entry').sort((a,b)=>a[1].apa.replace(/<[^>]+>/g,'').localeCompare(b[1].apa.replace(/<[^>]+>/g,'')));
  const changed=SPECIES.filter(s=>s.legacy&&!s.legacyOnly), legacyOnly=SPECIES.filter(s=>s.legacyOnly), added=SPECIES.filter(s=>s.origin==='added');
  main.innerHTML=`<div class="prose">
  <h2 style="margin-top:0">How the spore values are sourced</h2>
  <p>Every spore measurement shown in Sporexplore is tied to a published source and quoted as published. Species descriptions in <a href="https://svampe.databasen.org" target="_blank" rel="noopener">Danmarks Svampeatlas</a> are the main source, and peer-reviewed studies are added where an open copy could be read and checked. Names are checked against <a href="https://www.speciesfungorum.org" target="_blank" rel="noopener">Species Fungorum</a> (Royal Botanic Gardens, Kew), Index Fungorum, GBIF and Svampeatlas.</p>
  <p>Raw records were downloaded unchanged on ${esc(X.built)} and are kept with the site's source code, so each value can be traced to the record it came from.</p>
  <h2>How the consensus range is built</h2>
  <ul><li>The typical range shown for a species spans the typical ranges of all its sources. Extreme values reported by any source appear in brackets: (min–) typical (–max).</li>
  <li>When sources differ by more than 15% in mean length or mean Q, the species is marked <span class="flag">Sources disagree</span>.</li>
  <li>When no checkable source has been found, the Sporexplore v3 value is kept and marked <span class="flag">Unverified value</span> (${legacyOnly.length} species).</li>
  <li>Spore characters marked with a dashed outline are typical for the family and not documented for the species.</li></ul>
  <h2>How candidates are ranked</h2>
  <p>Each character you enter is scored from 0 to 1 and weighted: length and width 3 each, fruitbody type 2, ornamentation 1.6, Q, spore print, stem and host 1.5 each, spore tip 1.4, bluing and pore colour 1.2 each, shape, taste and Melzer's reaction 1 each, cap colour and wall 0.8 each. A measurement scores highest when it lies inside the species' range and near its middle; one just outside the range gets partial credit within the tolerance you choose. Characters you leave empty are ignored.</p>
  <h2>What changed from version 3</h2>
  <p>${added.length} Nordic Boletales were added. ${changed.length} species have new spore values after sourcing. ${legacyOnly.length} still show an unverified value.</p>
  ${changed.length?`<table class="t"><thead><tr><th>Species</th><th>v3 (µm)</th><th>Now (µm)</th></tr></thead><tbody>${changed.map(s=>`<tr><td><a href="#/species/${s.id}"><i class="sci">${esc(s.n)}</i></a></td><td class="n">${fmt(s.legacy.lo)}–${fmt(s.legacy.hi)} × ${fmt(s.legacy.wlo)}–${fmt(s.legacy.whi)}</td><td class="n">${fmt(s.sp.lo)}–${fmt(s.sp.hi)} × ${fmt(s.sp.wlo)}–${fmt(s.sp.whi)}</td></tr>`).join('')}</tbody></table>`:''}
  <h2>Literature</h2><ol class="refs">${lit.map(([id])=>refItem(id)).join('')||'<li>None yet.</li>'}</ol>
  <h2>Database records</h2>
  <details><summary>${db.length} species descriptions and records</summary><ol class="refs" style="margin-top:10px">${db.map(([id])=>refItem(id)).join('')}</ol></details>
  </div>`;
}

/* ---------- theme + boot ---------- */
function setThemeLabel(){ $('#themeBtn').textContent=document.documentElement.dataset.theme==='light'?'Dark field':'Light sheet'; }
$('#themeBtn').onclick=()=>{ const t=document.documentElement.dataset.theme==='light'?'dark':'light'; document.documentElement.dataset.theme=t; try{localStorage.setItem('sporex-theme',t);}catch(e){} setThemeLabel(); };
setThemeLabel();
$('#pinCount').textContent=pins.length;
$('#foot').innerHTML=`Sporexplore ${esc(X.version)} · data built ${esc(X.built)} · ${SPECIES.length} species · <a href="#/sources">Sources &amp; method</a>`;
route();
})();
