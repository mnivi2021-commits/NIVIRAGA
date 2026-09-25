const P=window.PRODUCTS,KEY='niviraga-order-2026';
const store={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
let qty={};try{qty=JSON.parse(store.get(KEY)||'{}')||{}}catch{}
const fmt=p=>'₹'+(p/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const paise=x=>Math.round(x*100);
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const groups=[{d:1,cls:'',title:'75% OFF Items',tag:'75% discount applied in summary'},{d:0,cls:'net',title:'Net Rate Items (No Discount)',tag:'Net rate'}];
let html='';
for(const g of groups){const items=P.filter(r=>r[5]===g.d);let cat=null,body='';
 for(const [sno,name,per,contents,price,,category] of items){
  if(category!==cat){cat=category;body+=`<tr class="cat" data-cat="${esc(cat)}"><td colspan="7">${esc(cat)}</td></tr>`}
  const q=qty[sno]||'';
  body+=`<tr data-sno="${sno}" data-cat="${esc(cat)}" data-s="${esc((sno+' '+name+' '+cat).toLowerCase())}"><td class="sno">${sno}</td><td>${esc(name)}</td><td class="meta hide-sm">${esc(per)}</td><td class="meta hide-sm">${esc(contents)}</td><td class="num">${fmt(paise(price))}</td><td class="q num" data-q="${q}"><input type="number" min="0" step="1" inputmode="numeric" value="${q}" aria-label="Qty ${esc(name)}"></td><td class="num tot">—</td></tr>`}
 html+=`<section class="group ${g.cls}"><div class="ghead"><h2>${g.title}</h2><span>${items.length} items</span></div><table><thead><tr><th>S.No</th><th>Product</th><th class="hide-sm">Per</th><th class="hide-sm">Contents</th><th class="num">Price</th><th class="num">Qty</th><th class="num">Total</th></tr></thead><tbody>${body}</tbody></table><div class="empty" hidden>No matching items</div></section>`}
document.getElementById('groups').innerHTML=html;
const byS=Object.fromEntries(P.map(r=>[r[0],r]));
function recalc(){let D=0,N=0,n=0,u=0;
 document.querySelectorAll('tr[data-sno]').forEach(tr=>{const s=+tr.dataset.sno,q=qty[s]||0,r=byS[s],t=paise(r[4])*q;
  tr.classList.toggle('sel',q>0);tr.querySelector('.tot').textContent=q?fmt(t):'—';tr.querySelector('.q').dataset.q=q||'';
  if(q){n++;u+=q;r[5]?D+=t:N+=t}});
 const L=Math.round(D*0.75),A=D-L;
 sD.textContent=fmt(D);sL.textContent='− '+fmt(L);sA.textContent=fmt(A);sN.textContent=fmt(N);sG.textContent=fmt(A+N);
 sC.textContent=n?`${n} products · ${u} qty`:'No items selected';
 document.querySelectorAll('tr.cat').forEach(c=>{const any=[...document.querySelectorAll(`tr[data-sno][data-cat="${CSS.escape(c.dataset.cat)}"]`)].some(t=>t.closest('table')===c.closest('table')&&t.classList.contains('sel'));c.classList.toggle('nosel',!any)});
 document.querySelectorAll('.group').forEach(g=>g.classList.toggle('nosel',!g.querySelector('tr.sel')));
 store.set(KEY,JSON.stringify(qty));filter()}
let selOnlyOn=false;
function filter(){const term=document.getElementById('q').value.trim().toLowerCase();
 document.querySelectorAll('.group').forEach(g=>{let vis=0;const cats={};
  g.querySelectorAll('tr[data-sno]').forEach(tr=>{const ok=(!term||tr.dataset.s.includes(term))&&(!selOnlyOn||tr.classList.contains('sel'));tr.hidden=!ok;if(ok){vis++;cats[tr.dataset.cat]=1}});
  g.querySelectorAll('tr.cat').forEach(c=>c.hidden=!cats[c.dataset.cat]);g.querySelector('.empty').hidden=vis>0;g.querySelector('table').hidden=vis===0})}
document.getElementById('groups').addEventListener('input',e=>{const tr=e.target.closest('tr[data-sno]');if(!tr)return;
 let v=Math.max(0,Math.floor(+e.target.value||0));if(v)qty[tr.dataset.sno]=v;else delete qty[tr.dataset.sno];recalc()});
document.getElementById('q').addEventListener('input',filter);
selOnly.onclick=()=>{selOnlyOn=!selOnlyOn;selOnly.classList.toggle('on',selOnlyOn);filter()};
clear.onclick=()=>{if(!confirm('Clear all quantities?'))return;for(const k in qty)delete qty[k];document.querySelectorAll('td.q input').forEach(i=>i.value='');recalc()};
['cName','cMob','cPlace'].forEach(id=>{const el=document.getElementById(id);el.value=store.get(KEY+'-'+id)||'';el.oninput=()=>store.set(KEY+'-'+id,el.value)});
recalc();
function billTable(rows){return `<table><thead><tr><th>S.No</th><th>Product</th><th class="num">Price</th><th class="num">Qty</th><th class="num">Total</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="sno">${r[0]}</td><td>${esc(r[1])}</td><td class="num">${fmt(paise(r[4]))}</td><td class="num">${qty[r[0]]}</td><td class="num tot">${fmt(paise(r[4])*qty[r[0]])}</td></tr>`).join('')}</tbody></table>`}
viewBill.onclick=()=>{const sel=P.filter(r=>qty[r[0]]);if(!sel.length){alert('Please enter quantity for at least one item.');return}
 const d=sel.filter(r=>r[5]),n=sel.filter(r=>!r[5]),v=id=>esc(document.getElementById(id).value||'—');
 billCard.innerHTML=`<div class="bh"><div><h2>NIVI &amp; RAGA</h2><div style="font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#fff">Crackers Shop</div><div class="sub">Virudhunagar, Tamil Nadu · Mobile 9566612707</div></div><div class="hr">Order Estimate<b style="color:var(--gold)">${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</b></div></div>
 <div class="bcust"><div><span>Customer</span>${v('cName')}</div><div><span>Mobile</span>${v('cMob')}</div><div><span>Place</span>${v('cPlace')}</div></div>
 ${d.length?`<div class="bsec"><h3>75% OFF Items</h3>${billTable(d)}</div>`:''}${n.length?`<div class="bsec"><h3>Net Rate Items (No Discount)</h3>${billTable(n)}</div>`:''}
 <div class="bsum">${[...document.querySelectorAll('aside .srow')].map(e=>e.outerHTML).join('')}<div class="scount">${sC.textContent}</div></div>`;
 bill.hidden=false;document.body.classList.add('billopen');bill.scrollTop=0};
closeBill.onclick=()=>{bill.hidden=true;document.body.classList.remove('billopen')};
dlBill.onclick=async()=>{if(!window.html2canvas){alert('Image tool not loaded. Use Print instead.');return}
 const c=await html2canvas(billCard,{scale:2,backgroundColor:'#fff'});const a=document.createElement('a');
 a.download='NIVIRAGA-Order-'+(document.getElementById('cName').value.trim().replace(/\s+/g,'-')||'Estimate')+'.png';a.href=c.toDataURL('image/png');a.click()};
waBill.onclick=()=>{const sel=P.filter(r=>qty[r[0]]),v=id=>document.getElementById(id).value.trim()||"-";
 const line=r=>`${r[0]}. ${r[1]} x ${qty[r[0]]} = ${fmt(paise(r[4])*qty[r[0]])}`;
 const d=sel.filter(r=>r[5]),n=sel.filter(r=>!r[5]);
 const t=["*NIVI & RAGA Crackers Shop – Order*",`Customer: ${v("cName")}`,`Mobile: ${v("cMob")}`,`Place: ${v("cPlace")}`,"",
  ...(d.length?["*75% OFF Items*",...d.map(line),""]:[]),...(n.length?["*Net Rate Items*",...n.map(line),""]:[]),
  `Discount Items Total: ${sD.textContent}`,`Less 75%: ${sL.textContent}`,`After Discount: ${sA.textContent}`,`Net Rate Total: ${sN.textContent}`,`*GRAND TOTAL: ${sG.textContent}*`,sC.textContent].join("\n");
 open("https://wa.me/919566612707?text="+encodeURIComponent(t),"_blank")};
(function(){const cv=fx,ctx=cv.getContext('2d');if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const cols=['#ffd400','#fff3a0','#ff9d00','#ffffff','#ffe066'];let parts=[],W,H;
 const size=()=>{const r=cv.getBoundingClientRect(),dp=devicePixelRatio||1;W=r.width;H=r.height;cv.width=W*dp;cv.height=H*dp;ctx.setTransform(dp,0,0,dp,0,0)};size();addEventListener('resize',size);
 const burst=()=>{const x=W*(.08+Math.random()*.84),y=H*(.2+Math.random()*.5),c=cols[Math.random()*cols.length|0],n=26+Math.random()*16;
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,s=1.2+Math.random()*2.2;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,c})}};
 setInterval(burst,700);burst();
 (function tick(){ctx.clearRect(0,0,W,H);parts=parts.filter(p=>p.l>0);for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vy+=.03;p.vx*=.985;p.l-=.014;ctx.globalAlpha=Math.max(p.l,0);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,2,0,7);ctx.fill()}ctx.globalAlpha=1;requestAnimationFrame(tick)})()})();
