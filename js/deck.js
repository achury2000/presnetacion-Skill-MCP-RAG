(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const slides=$$('.slide');let cur=-1,timers=[];
const SK=[-72,0,-70],MC=[0,0,-135],RG=[72,0,-70],a=(S,o)=>[S[0]+o[0],S[1]+o[1],S[2]+o[2]];
/* ---------- poses de cámara (una por diapositiva) ---------- */
const POSES=[
 {p:[0,1.6,25],t:[0,.2,-1],ox:.2,fov:55},
 {p:[5,3,-19],t:[0,0,-42],ox:.2,fov:55,roll:.03},
 {p:[0,15,22],t:[0,0,-1],oy:-.13,fov:55},
 {p:a(SK,[-4,3.5,19]),t:a(SK,[0,1.4,0]),ox:.2,fov:55},
 {p:a(SK,[9,3.5,15]),t:a(SK,[0,1.8,0]),ox:-.2,fov:55,roll:-.03},
 {p:a(SK,[1,2.4,12]),t:a(SK,[0,2.2,0]),ox:.2,fov:55},
 {p:a(SK,[0,4,21]),t:a(SK,[0,.8,0]),oy:-.3,fov:58},
 {p:a(MC,[0,5,40]),t:a(MC,[1,0,0]),ox:.2,fov:55},
 {p:a(MC,[0,7,46]),t:a(MC,[1,0,0]),ox:-.18,fov:55,roll:.02},
 {p:a(MC,[14,7,30]),t:a(MC,[12,0,0]),ox:.2,fov:55},
 {p:a(RG,[0,3,32]),t:a(RG,[2,0,0]),ox:.2,fov:55},
 {p:a(RG,[-5,5,32]),t:a(RG,[-3,0,0]),ox:-.2,fov:55,roll:-.02},
 {p:a(RG,[9,4,24]),t:a(RG,[6,0,0]),ox:-.2,fov:55},
 {p:a(RG,[6,14,27]),t:a(RG,[6,0,0]),oy:-.3,fov:58},
 {p:[0,3,30],t:[0,0,-1],fov:60,roll:.04},
 {p:[0,2.2,21],t:[0,-.3,0],ox:.22,fov:55},
 {p:[0,0,16],t:[0,0,-4],fov:70,roll:.06},
 {p:[0,1.5,27],t:[0,.3,-1],ox:.2,fov:55,roll:-.03}];
const SEC=[['Intro',0],['Skills',3],['MCP',7],['RAG',10],['Juntos',14]];
const W=(f)=>{try{if(window.World&&World.isReady())f(World)}catch(e){console.warn(e)}};
function clearT(){timers.forEach(clearInterval);timers.length=0}
/* ---------- barra de secciones ---------- */
$('#sections').innerHTML=SEC.map((s,i)=>'<button data-i="'+s[1]+'">'+s[0]+'</button>').join('');
$$('#sections button').forEach(b=>b.onclick=()=>go(+b.dataset.i));
/* ---------- navegación + transiciones DOM ---------- */
const DEF={labels:0,assistant:0,skillLevel:0,skillExpand:0,orbit:0,mcpStep:0,combo:0};
const ENTER={
 2:()=>W(w=>w.set('labels',1)),
 4:()=>{W(w=>w.set('skillExpand',1));skSet(1)},
 5:()=>{W(w=>w.set('skillExpand',1));skPart('name')},
 6:()=>W(w=>{w.set('orbit',1);w.set('skillLevel',3)}),
 3:()=>W(w=>{w.set('skillExpand',1);w.set('skillLevel',0)}),
 8:()=>{mcpSet(1)},
 10:()=>ragToggle('no'),
 12:()=>{},
 15:()=>{W(w=>w.set('assistant',1));comboSet(1)},
 16:()=>{quizReset()},
 17:()=>W(w=>{w.set('assistant',1);w.set('combo',6)})};
let started=false;
function go(n,instant){n=Math.max(0,Math.min(slides.length-1,n));if(n===cur)return;const from=cur>=0?slides[cur]:null,dir=n>=cur?1:-1,prevSec=cur>=0?slides[cur].dataset.sec:null;cur=n;const to=slides[n];
 clearT();W(w=>{Object.keys(DEF).forEach(k=>w.set(k,DEF[k]));w.set('ragQ',-1);w.ragQuery(-1)});
 if(ENTER[n])ENTER[n]();
 W(w=>w.fly(POSES[n],instant||!started));started=true;
 $('#prog i').style.width=((n+1)/slides.length*100)+'%';$('#count').textContent=String(n+1).padStart(2,'0')+' / '+slides.length;
 $('#notes p').textContent=to.dataset.notes||'';
 const sec=+to.dataset.sec;$$('#sections button').forEach((b,i)=>b.classList.toggle('on',i===sec));
 try{history.replaceState(null,'','#'+(n+1))}catch(e){}
 if(prevSec!==null&&prevSec!==to.dataset.sec&&!instant){const tr=$('#trname');tr.textContent='✦ Viajando a: '+SEC[sec][0];tr.animate([{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.75},{opacity:0}],{duration:2200})}
 swap(from,to,dir,instant)}
function swap(from,to,dir,instant){
 slides.forEach(s=>{if(s!==to&&s!==from)s.classList.remove('active','leaving')});
 if(from&&from!==to){from.classList.remove('active');from.classList.add('leaving')}
 to.classList.add('active');to.classList.remove('leaving');
 const rv=$$('.rv',to),red=matchMedia('(prefers-reduced-motion:reduce)').matches;
 if(!from||instant||red){slides.forEach(s=>s!==to&&s.classList.remove('leaving'));return}
 const u=Math.max(9,Math.min(innerWidth/100,innerHeight/56.2));
 const out=from.animate([{opacity:1,transform:'none',filter:'blur(0)'},{opacity:0,transform:'translateX('+(-dir*5*u)+'px) rotateY('+(dir*16)+'deg) scale(.96)',filter:'blur(8px)'}],{duration:480,easing:'cubic-bezier(.5,0,.8,.4)',fill:'forwards'});
 out.onfinish=()=>from.classList.remove('leaving');out.oncancel=out.onfinish;
 rv.forEach((el,i)=>el.animate([{opacity:0,transform:'translateX('+(dir*(8+i*2.2)*u)+'px) translateY('+(2*u)+'px) rotateY('+(-dir*12)+'deg)',filter:'blur(8px)'},{opacity:1,transform:'none',filter:'blur(0)'}],{duration:760,delay:260+i*75,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}))}
const next=()=>go(cur+1),prev=()=>go(cur-1);
$('#next').onclick=next;$('#prev').onclick=prev;
addEventListener('keydown',e=>{const k=e.key;
 if(k==='ArrowRight'||k==='PageDown'||k===' '){e.preventDefault();next()}else if(k==='ArrowLeft'||k==='PageUp'){e.preventDefault();prev()}
 else if(k==='Home')go(0);else if(k==='End')go(slides.length-1);
 else if(k==='n'||k==='N')$('#notes').hidden=!$('#notes').hidden;else if(k==='o'||k==='O')overview();else if(k==='f'||k==='F')fs();else if(k==='Escape')$('#overview').hidden=true});
$('#b-notes').onclick=()=>{$('#notes').hidden=!$('#notes').hidden};$('#b-ov').onclick=overview;$('#b-fs').onclick=fs;
function fs(){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()}
function overview(){const o=$('#overview');if(!o.hidden){o.hidden=true;return}o.innerHTML=slides.map((s,i)=>'<button class="ov'+(i===cur?' cur':'')+'" data-i="'+i+'"><b>'+String(i+1).padStart(2,'0')+'</b><span>'+s.dataset.title+'</span></button>').join('');$$('.ov',o).forEach(b=>b.onclick=()=>{o.hidden=true;go(+b.dataset.i)});o.hidden=false}
let tx=null;addEventListener('touchstart',e=>{tx=e.touches[0].clientX},{passive:true});addEventListener('touchend',e=>{if(tx==null)return;const d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>70)d<0?next():prev();tx=null});
addEventListener('hashchange',()=>{const h=parseInt(location.hash.slice(1));if(h>0)go(h-1)});
/* ---------- helper: pasos ---------- */
function stepper(list,onSet,play){let i=0;const set=k=>{i=k;$$('li',list).forEach((li,j)=>{li.classList.toggle('on',j===k-1);li.classList.toggle('done',j<k-1)});onSet(k)};
 $$('li',list).forEach((li,j)=>li.onclick=()=>{clearT();set(j+1)});return set}
/* ---------- Skills: niveles ---------- */
const SKT={1:['Nivel 1 · Metadatos','Al arrancar, la IA lee solo el <b>nombre</b> y la <b>descripción</b> de cada skill (~100 tokens). Por eso puedes tener muchas instaladas sin llenar su memoria.'],
 2:['Nivel 2 · Instrucciones','Si tu pedido encaja con la descripción, carga el <b>cuerpo de SKILL.md</b> (se recomienda que sea corto, menos de 5.000 tokens): los pasos a seguir.'],
 3:['Nivel 3 · Recursos','Solo si los pasos lo piden, abre <b>scripts, documentos de referencia o plantillas</b>. Si no hacen falta, nunca se leen.']};
function skSet(l){W(w=>w.set('skillLevel',l));$$('#sk-seg button').forEach(b=>b.classList.toggle('on',+b.dataset.l===l));$('#sk-text').innerHTML='<b>'+SKT[l][0]+'</b><br>'+SKT[l][1]}
$$('#sk-seg button').forEach(b=>b.onclick=()=>{clearT();skSet(+b.dataset.l)});
$('#sk-play').onclick=()=>{clearT();let l=0;const f=()=>{l=l%3+1;skSet(l)};f();timers.push(setInterval(f,2600))};
/* ---------- Skills: SKILL.md ---------- */
$('#sk-code').innerHTML=
 '<span class="c">---</span>\n<span data-p="name"><span class="k">name:</span> <span class="s">informe-ventas</span></span>\n'+
 '<span data-p="desc"><span class="k">description:</span> Crea el informe mensual de ventas\n  con la guía de marca. Úsala cuando pidan\n  un reporte de ventas.</span>\n<span class="c">---</span>\n'+
 '<span data-p="body"><span class="k"># Informe mensual de ventas</span>\n1. Pide el archivo de ventas del mes.\n2. Calcula totales y aplica la plantilla.</span>\n'+
 '<span data-p="refs">Detalles: <span class="s">references/guia-marca.md</span></span>';
const SKP={name:['<b>name</b> · obligatorio','Identificador único: solo minúsculas, números y guiones (máx. 64 caracteres) y debe coincidir con el nombre de la carpeta.',1],
 desc:['<b>description</b> · obligatorio','Lo más importante: dice <b>qué hace</b> la skill y <b>cuándo usarla</b> (máx. 1.024 caracteres). Es lo que la IA lee siempre para decidir. Mala: «Ayuda con PDFs». Buena: «Extrae texto y tablas de PDFs… Úsala cuando el usuario mencione PDFs o formularios».',1],
 body:['<b>Cuerpo</b> · Markdown libre','Pasos, ejemplos y casos especiales. No hay formato obligatorio. Se recomienda mantenerlo bajo 500 líneas.',2],
 refs:['<b>Archivos de apoyo</b> · opcionales','Carpetas <code>scripts/</code>, <code>references/</code> y <code>assets/</code>. La IA los abre solo cuando los pasos los mencionan.',3]};
function skPart(k){$$('#sk-parts button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));$$('#sk-code [data-p]').forEach(s=>s.classList.toggle('hl',s.dataset.p===k));const p=SKP[k];$('#sk-part-text').innerHTML=p[0]+'<br>'+p[1];W(w=>w.set('skillLevel',p[2]))}
$$('#sk-parts button').forEach(b=>b.onclick=()=>skPart(b.dataset.k));
/* ---------- MCP: pasos ---------- */
const MCPC={1:'<span class="c">// Tú → Host (lenguaje natural)</span>\n<span class="s">"¿Qué tengo mañana en el calendario?"</span>',
 2:'<span class="c">// El modelo decide usar una herramienta</span>\nllamar → <span class="k">listar_eventos</span>(fecha: <span class="s">"mañana"</span>)',
 3:'{<span class="k">"jsonrpc"</span>:<span class="s">"2.0"</span>,<span class="k">"id"</span>:1,<span class="k">"method"</span>:<span class="s">"tools/call"</span>,\n <span class="k">"params"</span>:{<span class="k">"name"</span>:<span class="s">"listar_eventos"</span>,\n  <span class="k">"arguments"</span>:{<span class="k">"fecha"</span>:<span class="s">"mañana"</span>}}}',
 4:'<span class="c">// El servidor consulta la API de tu calendario</span>\n<span class="s">→ 2 eventos encontrados</span>',
 5:'{<span class="k">"jsonrpc"</span>:<span class="s">"2.0"</span>,<span class="k">"id"</span>:1,<span class="k">"result"</span>:{<span class="k">"content"</span>:[\n  {<span class="k">"type"</span>:<span class="s">"text"</span>,<span class="k">"text"</span>:<span class="s">"10:00 Reunión · 15:30 Clase"</span>}]}}'};
const mcpSet=stepper($('#mcp-steps'),k=>{W(w=>w.set('mcpStep',k));$('#mcp-code').innerHTML=MCPC[k]});
$('#mcp-play').onclick=()=>{clearT();let k=0;const f=()=>{k=k%5+1;mcpSet(k)};f();timers.push(setInterval(f,2400))};
/* ---------- MCP: pestañas ---------- */
const MT={tools:['🛠️ <b>Tools</b> · acciones','Cosas que el modelo puede <b>pedir que se hagan</b>: crear un issue en GitHub, enviar un mensaje a Slack, ejecutar una consulta. Cada herramienta tiene nombre, descripción y parámetros.'],
 res:['📄 <b>Resources</b> · datos','Información de <b>solo lectura</b> que da contexto al modelo: archivos, filas de una base de datos, documentos. Se identifican con una dirección (URI).'],
 pr:['💬 <b>Prompts</b> · plantillas','Instrucciones reutilizables que el servidor ofrece (por ejemplo «revisar este código» o «resumir este informe») para que el usuario las elija.']};
function mcpTab(k){$$('#mcp-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));$('#mcp-tab-text').innerHTML=MT[k][0]+'<br>'+MT[k][1]}
$$('#mcp-tabs button').forEach(b=>b.onclick=()=>mcpTab(b.dataset.k));mcpTab('tools');
/* ---------- RAG: sin / con ---------- */
function ragToggle(k){$$('#rag-toggle button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));
 const q='<div class="bub q">¿Cuántos días tengo para devolver un producto?</div>';
 $('#rag-chat').innerHTML=q+(k==='no'?'<div class="bub a bad">Normalmente son 30 días desde la compra.<small>⚠ Suena seguro, pero lo inventó: no es tu política.</small></div>':'<div class="bub a good">Tienes 15 días desde la entrega, con el producto sin uso y en su empaque original.<small>📎 Fuente: Política de devoluciones, sección 1</small></div>')}
$$('#rag-toggle button').forEach(b=>b.onclick=()=>ragToggle(b.dataset.k));ragToggle('no');
/* ---------- RAG: pipeline ---------- */
$$('#rag-prep li,#rag-ask li').forEach(li=>li.onclick=()=>{$$('#rag-prep li,#rag-ask li').forEach(x=>x.classList.toggle('on',x===li));$('#rag-step-text').innerHTML='<b>'+li.querySelector('b').textContent+' · '+li.querySelector('span').textContent+'</b><br>'+li.dataset.d});
/* ---------- RAG: búsqueda ---------- */
const ANS=[
 'Sí. Tienes 15 días desde la entrega <b>[1]</b>, con el producto sin uso y en su empaque original <b>[2]</b>. El reembolso llega en 5 a 7 días hábiles <b>[3]</b>.',
 'Pulsa «Olvidé mi contraseña» en el inicio de sesión <b>[1]</b>. Te llegará un enlace por correo que vence en 30 minutos <b>[2]</b>; si no aparece, revisa spam <b>[3]</b>.',
 'El plan Pro cuesta 12 USD por usuario al mes, facturado anual <b>[1]</b>. El plan Equipo cuesta 25 USD <b>[2]</b>. Los precios no incluyen impuestos locales <b>[3]</b>.',
 'En los documentos solo aparecen oficinas en Bogotá y Medellín <b>[1]</b>. No hay información sobre una tienda en Cali, así que prefiero <b>no inventarla</b>.'];
function ragInit(){const q=$('#rag-q');
 const qs=(window.World&&World.RAG)?World.RAG.q:[{t:'¿Puedo devolver un producto si ya pasaron 10 días?'},{t:'Olvidé mi contraseña, ¿qué hago?'},{t:'¿Cuánto cuesta el plan Pro?'},{t:'¿Tienen tienda física en Cali?'}];
 q.innerHTML=qs.map((x,i)=>'<button data-i="'+i+'">'+x.t+'</button>').join('');
 $$('button',q).forEach(b=>b.onclick=()=>{const i=+b.dataset.i;$$('button',q).forEach(x=>x.classList.toggle('on',x===b));
  let top=[];W(w=>{top=w.ragQuery(i)});const res=$('#rag-res');
  res.innerHTML='<span class="dim">Buscando los fragmentos más cercanos…</span>';
  setTimeout(()=>{if(!b.classList.contains('on'))return;res.innerHTML='<b>Fragmentos recuperados (top 3)</b>'+top.map((c,j)=>'<div class="chunk"><b>['+(j+1)+']</b>'+c.t+'</div>').join('')+'<b>Respuesta con fuentes</b><br>'+ANS[i]},1100)})}
/* ---------- Caso integrado ---------- */
const comboSet=stepper($('#combo-steps'),k=>{W(w=>w.set('combo',k))});
$('#combo-play').onclick=()=>{clearT();let k=0;const f=()=>{k=k%5+1;comboSet(k)};f();timers.push(setInterval(f,2300))};
/* ---------- Reto ---------- */
const QZ=[
 ['Quiero que la IA responda usando el manual interno de mi empresa (cientos de PDFs).','rag','Es <b>RAG</b>: busca en tus documentos y responde con esos fragmentos.'],
 ['Quiero que la IA cree eventos en mi Google Calendar.','mcp','Es <b>MCP</b>: hace falta conectar una herramienta externa para actuar.'],
 ['Quiero que todos los informes salgan siempre con el mismo formato y tono de marca.','skill','Es una <b>Skill</b>: instrucciones y plantillas reutilizables.'],
 ['Necesito que la IA lea y actualice los tickets de mi sistema de soporte.','mcp','Es <b>MCP</b>: leer y modificar otro sistema se hace con un conector.'],
 ['Quiero consultar contratos de 200 páginas ya guardados y obtener citas exactas.','rag','Es <b>RAG</b>: recupera los fragmentos relevantes y permite citar la fuente.'],
 ['Quiero que, antes de aprobar código, siga siempre mis 6 pasos de revisión.','skill','Es una <b>Skill</b>: un procedimiento repetible que la IA carga cuando hace falta.']];
let qi=0,qs=0,qa=false;
function quizReset(){qi=0;qs=0;quizShow()}
function quizShow(){qa=false;if(qi>=QZ.length){$('#q-title').textContent='¡Reto terminado!';$('#q-text').textContent='Acertaste '+qs+' de '+QZ.length+(qs===QZ.length?' — ¡eres un arquitecto de asistentes! 🏆':qs>=4?' — ¡muy bien! 🚀':' — repasa las tres piezas y vuelve a intentarlo 💪');$('#q-opts').hidden=true;$('#q-fb').hidden=true;$('#q-next').hidden=false;$('#q-next').textContent='↻ Jugar otra vez';$('#q-score').textContent='Puntos: '+qs;return}
 $('#q-title').textContent='Caso '+(qi+1)+' de '+QZ.length;$('#q-text').textContent=QZ[qi][0];$('#q-opts').hidden=false;$$('#q-opts button').forEach(b=>b.className='');$('#q-fb').hidden=true;$('#q-next').hidden=true;$('#q-score').textContent='Puntos: '+qs}
$$('#q-opts button').forEach(b=>b.onclick=()=>{if(qa)return;qa=true;const ok=b.dataset.a===QZ[qi][1];if(ok)qs++;b.classList.add(ok?'right':'wrong');if(!ok)$$('#q-opts button').forEach(x=>{if(x.dataset.a===QZ[qi][1])x.classList.add('right')});
 const fb=$('#q-fb');fb.hidden=false;fb.innerHTML=(ok?'✅ ¡Correcto! ':'❌ Casi. ')+QZ[qi][2];$('#q-score').textContent='Puntos: '+qs;$('#q-next').hidden=false;$('#q-next').textContent=qi===QZ.length-1?'Ver resultado →':'Siguiente →'});
$('#q-next').onclick=()=>{if(qi>=QZ.length){quizReset();return}qi++;quizShow()};
quizShow();
/* ---------- minimapa ---------- */
const mini=$('#mini'),mx=mini.getContext('2d');
function drawMini(){requestAnimationFrame(drawMini);if(!window.World||!World.isReady())return;const w=mini.width,h=mini.height,S=World.ST,c=World.cam().position;
 const X=x=>w/2+(x/105)*(w/2-34),Z=z=>26+((z+150)/-1)*0*0+(1-(z+160)/200)*(h-60)+14;
 mx.clearRect(0,0,w,h);mx.font='700 20px JBM, monospace';mx.textAlign='center';
 const order=['O','BR','O','SK','MC','RG','O'];mx.strokeStyle='rgba(91,151,255,.5)';mx.lineWidth=2;mx.setLineDash([6,6]);mx.beginPath();order.forEach((k,i)=>{const p=S[k];i?mx.lineTo(X(p.x),Z(p.z)):mx.moveTo(X(p.x),Z(p.z))});mx.stroke();mx.setLineDash([]);
 const names={O:'INICIO',BR:'LLM',SK:'SKILLS',MC:'MCP',RG:'RAG'};Object.keys(names).forEach(k=>{const p=S[k];const on=slides[cur]&&((k==='SK'&&slides[cur].dataset.sec==='1')||(k==='MC'&&slides[cur].dataset.sec==='2')||(k==='RG'&&slides[cur].dataset.sec==='3'));mx.fillStyle=on?'#D4FF24':'#1558C9';mx.beginPath();mx.arc(X(p.x),Z(p.z),on?9:7,0,7);mx.fill();mx.fillStyle=on?'#D4FF24':'#9fb4e8';mx.fillText(names[k],X(p.x),Z(p.z)+(k==='BR'||k==='O'?-14:24))});
 mx.fillStyle='#fff';mx.shadowColor='#D4FF24';mx.shadowBlur=14;mx.beginPath();mx.arc(X(c.x),Z(c.z),6,0,7);mx.fill();mx.shadowBlur=0}
requestAnimationFrame(drawMini);
/* ---------- arranque ---------- */
ragInit();
const h0=parseInt(location.hash.slice(1)),start=h0>0?h0-1:0;
(async()=>{try{await World.init($('#world'))}catch(e){console.warn('3D no disponible',e)}
 ragInit();go(start,true);setTimeout(()=>$('#loader').classList.add('off'),400);setTimeout(()=>{$('#loader').style.display='none'},1300)})();
window.Deck={go,next,prev};
})();
