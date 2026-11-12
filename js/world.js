/* Mundo 3D: estaciones (Skills · MCP · RAG) y vuelo de cámara — three.js r149 */
(function(){
'use strict';
const T=THREE;
const COL={bg:0x030407,blue:0x1558C9,blueL:0x5B97FF,blueD:0x0A2C66,lime:0xD4FF24,white:0xEAF0FF};
const V=(x,y,z)=>new T.Vector3(x,y,z);
const ST={O:V(0,0,0),BR:V(0,0,-42),SK:V(-72,0,-70),MC:V(0,0,-135),RG:V(72,0,-70)};
let R,scene,cam,canvas,W=1,H=1,T0=0,ready=false,paused=false;
const upd=[],P={labels:0,assistant:0,skillLevel:0,skillExpand:0,orbit:0,mcpStep:0,combo:0,ragQ:-1,brain:0};
const pointer={x:0,y:0};
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const lerp=(a,b,k)=>a+(b-a)*k,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
/* ---------- utilidades ---------- */
const GLOW=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c)})();
function mat(c,ei,o){o=o||{};return new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:ei==null?.3:ei,roughness:.45,metalness:.25,transparent:o.op!=null,opacity:o.op==null?1:o.op})}
function glow(c,s,op){const sp=new T.Sprite(new T.SpriteMaterial({map:GLOW,color:c,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:op==null?.8:op}));sp.scale.set(s,s,1);return sp}
function label(txt,o){o=o||{};const w=o.w||512,h=o.h||128,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');let fs=o.fs||64;const f=()=>(o.weight||800)+' '+fs+'px '+(o.font||'Bricolage')+', sans-serif';x.font=f();while(x.measureText(txt).width>w-30&&fs>14){fs-=4;x.font=f()}
 x.textAlign='center';x.textBaseline='middle';x.fillStyle=o.color||'#EAF0FF';if(o.glow){x.shadowColor=o.glow;x.shadowBlur=20}x.fillText(txt,w/2,h/2);const t=new T.CanvasTexture(c);t.anisotropy=4;
 const s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthWrite:false,opacity:o.op==null?1:o.op}));const sz=o.size||1.2;s.scale.set(sz*w/h,sz,1);return s}
function plane(w,h,pw,ph,draw){const c=document.createElement('canvas');c.width=pw;c.height=ph;draw(c.getContext('2d'),pw,ph);const t=new T.CanvasTexture(c);t.anisotropy=4;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t,transparent:true,side:T.DoubleSide,depthWrite:false}))}
function edges(mesh,c,op){const e=new T.LineSegments(new T.EdgesGeometry(mesh.geometry),new T.LineBasicMaterial({color:c,transparent:true,opacity:op==null?.9:op}));mesh.add(e);return e}
function line(a,b,c,op){const l=new T.Line(new T.BufferGeometry().setFromPoints([a,b]),new T.LineBasicMaterial({color:c,transparent:true,opacity:op==null?.5:op}));return l}
function rr(x,a,b,w,h,r){x.beginPath();x.roundRect(a,b,w,h,r)}
function wire(geo,c,op){return new T.LineSegments(new T.WireframeGeometry(geo),new T.LineBasicMaterial({color:c,transparent:true,opacity:op==null?.6:op}))}
/* ---------- entorno ---------- */
function env(){
 scene.background=new T.Color(COL.bg);scene.fog=new T.Fog(COL.bg,55,340);
 scene.add(new T.AmbientLight(0x7f95d6,.75));const d=new T.DirectionalLight(0xffffff,.85);d.position.set(10,25,30);scene.add(d);
 const gr=new T.GridHelper(1000,160,COL.blue,COL.blueD);gr.position.y=-9;gr.material.transparent=true;gr.material.opacity=.45;scene.add(gr);
 const N=2200,pos=new Float32Array(N*3),col=new Float32Array(N*3),r=rng(7),cw=new T.Color(COL.white),cb=new T.Color(COL.blueL),cl=new T.Color(COL.lime);
 for(let i=0;i<N;i++){pos[i*3]=(r()-.5)*760;pos[i*3+1]=-8+r()*120;pos[i*3+2]=-440+r()*560;const k=r(),c=k<.08?cl:k<.5?cb:cw;col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('color',new T.BufferAttribute(col,3));
 scene.add(new T.Points(g,new T.PointsMaterial({size:2.2,map:GLOW,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.9})));
 Object.values(ST).forEach((p,i)=>{const s=glow(i%2?COL.blue:COL.blueL,70,.22);s.position.copy(p).add(V(0,2,-12));scene.add(s)});
}
/* ---------- warp (rayas de velocidad) ---------- */
let warp=null;
function buildWarp(){const N=300,pos=new Float32Array(N*6),pts=[],r=rng(3);for(let i=0;i<N;i++)pts.push(V((r()-.5)*90,(r()-.5)*60,(r()-.5)*120));
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));
 const m=new T.LineSegments(g,new T.LineBasicMaterial({color:COL.lime,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));m.frustumCulled=false;scene.add(m);warp={m:m,pts:pts,pos:pos,g:g,N:N}}
function updWarp(vel,amt){if(!warp)return;warp.m.material.opacity=clamp(amt,0,1)*.85;if(amt<.01)return;const c=cam.position,L=.045;
 for(let i=0;i<warp.N;i++){const p=warp.pts[i];['x','y','z'].forEach((k,j)=>{const half=[45,30,60][j];let d=p[k]-c[k];d=((d+half)%(half*2)+half*2)%(half*2)-half;p[k]=c[k]+d});
  warp.pos.set([p.x,p.y,p.z,p.x-vel.x*L,p.y-vel.y*L,p.z-vel.z*L],i*6)}warp.g.attributes.position.needsUpdate=true}
/* ---------- iconos de la portada / mapa / integración ---------- */
const icons={};
function buildIcons(){
 const g=new T.Group();scene.add(g);icons.g=g;
 // Skills: pila de tarjetas
 const s=new T.Group();s.position.set(-6.5,-.6,0);g.add(s);
 [0,1,2].forEach(i=>{const m=new T.Mesh(new T.BoxGeometry(3,.14,4),mat(i===2?COL.lime:COL.blue,i===2?.5:.35));m.position.y=i*.55-.5;m.rotation.y=i*.22;s.add(m);edges(m,i===2?COL.white:COL.lime,.8)});
 s.add(glow(COL.blueL,9,.35));icons.skill=s;
 // MCP: hub con enchufes
 const m=new T.Group();m.position.set(0,1.4,-4);g.add(m);
 m.add(new T.Mesh(new T.IcosahedronGeometry(1.5,1),mat(COL.blue,.5)));m.add(wire(new T.IcosahedronGeometry(1.8,1),COL.lime,.7));
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const p=new T.Mesh(new T.CylinderGeometry(.16,.16,1.2,8),mat(COL.lime,.7));p.position.set(Math.cos(a)*2.4,Math.sin(a)*2.4,0);p.rotation.z=a-Math.PI/2;m.add(p);const e=new T.Mesh(new T.SphereGeometry(.28,10,10),mat(COL.white,.6));e.position.set(Math.cos(a)*3.1,Math.sin(a)*3.1,0);m.add(e)}
 m.add(glow(COL.blueL,10,.35));icons.mcp=m;
 // RAG: nube de puntos + anillo
 const r=new T.Group();r.position.set(6.5,-.4,0);g.add(r);const rn=rng(11),pts=[];
 for(let i=0;i<80;i++){const v=V(rn()-.5,rn()-.5,rn()-.5).normalize().multiplyScalar(1+rn()*1.5);const sp=new T.Mesh(new T.SphereGeometry(.1,8,8),mat(i<3?COL.lime:COL.blueL,i<3?1:.6));sp.position.copy(v);r.add(sp);pts.push(sp)}
 const ring=new T.Mesh(new T.TorusGeometry(2.9,.03,8,64),mat(COL.lime,.8));ring.rotation.x=1.2;r.add(ring);r.add(glow(COL.blueL,9,.35));icons.rag=r;icons.ragRing=ring;
 // etiquetas
 const mk=(t,sub,x,y,z,c)=>{const gg=new T.Group();gg.position.set(x,y,z);const a=label(t,{size:1.25,color:c,glow:c});const b=label(sub,{size:.55,weight:600,font:'Inter',color:'#9fb4e8',fs:46});b.position.y=-.9;gg.add(a,b);g.add(gg);return gg};
 icons.lab=[mk('Skills','el cómo · tu manual',-6.5,3.4,0,'#D4FF24'),mk('MCP','las manos · conectores',0,5.6,-4,'#5B97FF'),mk('RAG','la memoria · tu biblioteca',6.5,3.4,0,'#D4FF24')];
 icons.lab.forEach(l=>l.children.forEach(c=>c.material.opacity=0));
 // asistente + usuario para el caso integrado
 const a=new T.Group();a.position.set(0,-1,2.2);g.add(a);a.add(new T.Mesh(new T.SphereGeometry(.9,24,24),mat(COL.lime,.8)));a.add(glow(COL.lime,6,.5));const al=label('Asistente',{size:.7,color:'#030407',weight:800});al.position.set(0,0,1);a.add(al);icons.asst=a;
 const u=new T.Group();u.position.set(0,-3.4,7);g.add(u);u.add(new T.Mesh(new T.SphereGeometry(.55,16,16),mat(COL.white,.5)));const ul=label('Cliente',{size:.6});ul.position.y=-1;u.add(ul);icons.user=u;
 icons.segs=[[u,a,'ask'],[a,s,'skill'],[a,r,'rag'],[a,m,'mcp']].map(([x,y,k],i)=>{const l=new T.Line(new T.BufferGeometry().setFromPoints([x.position,y.position]),new T.LineBasicMaterial({color:COL.lime,transparent:true,opacity:0}));g.add(l);const pk=new T.Mesh(new T.SphereGeometry(.22,10,10),new T.MeshBasicMaterial({color:COL.lime,transparent:true,opacity:0}));g.add(pk);return{l:l,pk:pk,a:x.position,b:y.position}});
 upd.push((dt,t)=>{
  s.rotation.y=Math.sin(t*.4)*.25;s.position.y=-.6+Math.sin(t*.9)*.2;m.rotation.y=t*.4;m.rotation.x=Math.sin(t*.3)*.3;m.position.y=1.4+Math.sin(t*.8+1)*.2;r.rotation.y=t*.25;icons.ragRing.rotation.z=t*.5;r.position.y=-.4+Math.sin(t*.7+2)*.2;
  icons.lab.forEach((l,i)=>{l.children.forEach(c=>c.material.opacity=lerp(c.material.opacity,P.labels,.1))});
  const as=lerp(a.scale.x,P.assistant,.08);a.scale.setScalar(Math.max(.001,as));u.scale.setScalar(Math.max(.001,lerp(u.scale.x,P.assistant,.08)));
  const cs=P.combo; // pasos: 1 pregunta, 2 skill, 3 rag, 4 mcp, 5 respuesta
  icons.segs.forEach((sg,i)=>{const lit=P.assistant>.5&&(cs===i+1||(cs===5&&i===0)||(cs===6));const op=lit?1:(P.assistant>.5?.18:0);sg.l.material.opacity=lerp(sg.l.material.opacity,op,.15);
   const k=(t*(lit?.9:.3)+i*.25)%1,rev=cs===5&&i===0;sg.pk.position.lerpVectors(rev?sg.b:sg.a,rev?sg.a:sg.b,k);sg.pk.material.opacity=lit?1:0;sg.pk.scale.setScalar(lit?1.3:1)});
  [[s,2],[r,3],[m,4]].forEach(([o,st])=>{const lit=cs===st||cs===6;const sc=lerp(o.scale.x,lit?1.25:1,.1);o.scale.setScalar(sc)})
 })}
/* ---------- LLM (el problema) ---------- */
const brain={};
function buildBrain(){const g=new T.Group();g.position.copy(ST.BR);scene.add(g);brain.g=g;
 g.add(new T.Mesh(new T.SphereGeometry(2.3,32,32),mat(COL.blue,.55)));g.add(wire(new T.IcosahedronGeometry(3.4,2),COL.blueL,.55));g.add(glow(COL.blueL,18,.4));
 const l=label('LLM',{size:1.4,color:'#EAF0FF',glow:'#1558C9'});l.position.set(0,0,2.6);g.add(l);const l2=label('sabe mucho… pero le faltan 3 cosas',{size:.55,weight:600,font:'Inter',fs:42,color:'#9fb4e8',w:900,h:90});l2.position.set(0,-4.6,0);g.add(l2);
 brain.rings=[['tus datos',COL.blueL],['acciones',COL.lime],['tu forma de trabajar',COL.white]].map((d,i)=>{const grp=new T.Group();grp.rotation.set(.5+i*.6,i*1.1,i*.4);g.add(grp);
  const ring=new T.Mesh(new T.TorusGeometry(6+i*1.3,.035,8,120,Math.PI*1.55),mat(d[1],.9));grp.add(ring);
  const q=new T.Group();q.position.set(6+i*1.3,0,0);grp.add(q);const bub=glow(d[1],3.4,.9);q.add(bub);const t=label('?',{size:1.5,color:'#030407',weight:800});t.position.z=.1;q.add(t);
  const lb=label(d[0],{size:.8,color:HEX(d[1]),glow:HEX(d[1]),w:700,h:120});lb.position.set(0,1.5,0);q.add(lb);return{grp:grp,q:q,sp:.35-i*.07,a:i*2.1,r:6+i*1.3}});
 upd.push((dt,t)=>{g.rotation.y=t*.12;brain.rings.forEach(o=>{o.a+=dt*o.sp;o.q.position.set(Math.cos(o.a)*o.r,Math.sin(o.a)*o.r,0)})})}
function HEX(c){return '#'+new T.Color(c).getHexString()}
/* ---------- SKILLS ---------- */
const skill={};
function buildSkill(){const g=new T.Group();g.position.copy(ST.SK);scene.add(g);skill.g=g;
 const fb=new T.Mesh(new T.BoxGeometry(7.4,.5,4.8),mat(COL.blue,.4));fb.position.y=-2.4;g.add(fb);edges(fb,COL.lime,.9);
 const tab=new T.Mesh(new T.BoxGeometry(2.6,.5,.9),mat(COL.blueL,.5));tab.position.set(-2.4,-2.4,-2.8);g.add(tab);edges(tab,COL.lime,.8);
 const fl=label('informe-ventas/',{size:.85,color:'#D4FF24',glow:'#D4FF24',font:'JBM',weight:700});fl.position.set(0,-3.6,2.8);g.add(fl);g.add(glow(COL.blueL,40,.25));
 const bg='rgba(6,14,34,.94)';
 const mk=(w,h,pw,ph,head,draw)=>{const m=plane(w,h,pw,ph,(x,W,H)=>{rr(x,6,6,W-12,H-12,34);x.fillStyle=bg;x.fill();x.lineWidth=5;x.strokeStyle='#D4FF24';x.stroke();x.font='700 34px JBM, monospace';x.fillStyle='#D4FF24';x.textBaseline='top';x.fillText(head,36,32);draw(x,W,H)});
  const e=edges(m,COL.lime,.9);m.userData.e=e;return m};
 const ml=(x,lines,y0,lh,fs)=>{x.font='500 '+fs+'px JBM, monospace';lines.forEach((l,i)=>{x.fillStyle=l.c||'#EAF0FF';x.fillText(l.t||l,36,y0+i*lh)})};
 const meta=mk(5.4,2.1,900,350,'NIVEL 1 · METADATOS  ·  ~100 tokens',(x)=>ml(x,[{t:'---',c:'#5B97FF'},{t:'name: informe-ventas',c:'#EAF0FF'},{t:'description: Crea el informe mensual',c:'#EAF0FF'},{t:'  de ventas con la guía de marca.',c:'#EAF0FF'},{t:'---',c:'#5B97FF'}],100,44,32));
 const instr=mk(5.4,3.6,900,600,'NIVEL 2 · INSTRUCCIONES  ·  al activarse',(x)=>ml(x,[{t:'# Informe mensual de ventas',c:'#D4FF24'},'','1. Pide el archivo de ventas.','2. Calcula totales por región.','3. Aplica la plantilla de marca.','4. Revisa las cifras y entrega.','','Ver: references/guia-marca.md'],100,52,31));
 const res=mk(5.4,2.4,900,400,'NIVEL 3 · RECURSOS  ·  solo si hacen falta',(x,W,H)=>{[['scripts/','calcular.py'],['references/','guia-marca.md'],['assets/','plantilla.pptx']].forEach((d,i)=>{rr(x,36+i*285,100,262,250,22);x.fillStyle='rgba(21,88,201,.35)';x.fill();x.strokeStyle='#5B97FF';x.lineWidth=3;x.stroke();x.fillStyle='#D4FF24';x.font='700 32px JBM, monospace';x.fillText(d[0],56+i*285,130);x.fillStyle='#EAF0FF';x.font='500 27px JBM, monospace';x.fillText(d[1],56+i*285,190)})});
 skill.cards=[meta,instr,res];skill.ys=[5.0,1.95,-.85];g.add(meta,instr,res);
 // tarjetas de ejemplos
 skill.orb=['📄 Documentos Word','📊 Hojas de cálculo','🎨 Guía de marca','🧪 Revisión de código','📑 Presentaciones','🔎 Análisis de datos'].map((t,i)=>{const m=plane(4,1.5,600,225,(x,W,H)=>{rr(x,5,5,W-10,H-10,36);x.fillStyle='rgba(21,88,201,.92)';x.fill();x.lineWidth=5;x.strokeStyle='#D4FF24';x.stroke();x.fillStyle='#fff';x.font='800 50px Bricolage, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(t,W/2,H/2+2)});g.add(m);return{m:m,a:i/6*Math.PI*2}});
 upd.push((dt,t)=>{
  const e=clamp(P.skillExpand,0,1);
  skill.cards.forEach((c,i)=>{const lit=i<P.skillLevel;c.position.y=lerp(c.position.y,lerp(.4,skill.ys[i],e),.1);c.position.z=lerp(c.position.z,lerp(i*.25,0,e),.1);c.material.opacity=lerp(c.material.opacity,lit||P.skillLevel===0?1:.18,.12);c.userData.e.material.opacity=lerp(c.userData.e.material.opacity,lit?1:.25,.12);c.visible=e>.02||i===0||true;c.scale.setScalar(lerp(c.scale.x,e>.02?1:.0001+.0,.15)+ (e>.02?0:.0))});
  const o=P.orbit;skill.orb.forEach(c=>{c.a+=dt*.22;const rad=11;c.m.position.set(Math.cos(c.a)*rad,1.2+Math.sin(c.a*2)*.8,Math.sin(c.a)*rad*.7);c.m.quaternion.copy(cam.quaternion);c.m.scale.setScalar(Math.max(.001,lerp(c.m.scale.x,o,.1)))});
  fb.rotation.y=Math.sin(t*.3)*.04})}
/* ---------- MCP ---------- */
const mcp={};
function buildMcp(){const g=new T.Group();g.position.copy(ST.MC);scene.add(g);mcp.g=g;g.add(glow(COL.blueL,50,.2));
 const node=(p,geo,c,ei)=>{const m=new T.Mesh(geo,mat(c,ei));m.position.copy(p);g.add(m);return m};
 const user=node(V(-27,0,0),new T.SphereGeometry(1,20,20),COL.white,.5);const ul=label('Tú',{size:1.5,color:'#EAF0FF'});ul.position.set(-27,2.4,0);g.add(ul);
 const host=node(V(-15,0,0),new T.SphereGeometry(2.6,32,32),COL.lime,.55);host.add(wire(new T.SphereGeometry(3.1,16,12),COL.lime,.4));const hl=label('Host · tu app con IA',{size:1.6,color:'#D4FF24',glow:'#D4FF24',w:900,h:140});hl.position.set(-15,5.2,0);g.add(hl);
 const cli=node(V(-4,0,0),new T.IcosahedronGeometry(1.9,1),COL.blue,.6);cli.add(wire(new T.IcosahedronGeometry(2.3,1),COL.lime,.6));const cl=label('Cliente MCP',{size:1.5,color:'#8DB6FF',glow:'#1558C9',w:700,h:140});cl.position.set(-4,4.2,0);g.add(cl);
 const names=[['📅','Calendario'],['🗄️','Base de datos'],['🐙','GitHub'],['💬','Slack'],['📁','Archivos'],['🌐','Navegador']];
 mcp.servers=names.map((n,i)=>{const a=(i-2.5)/5*1.9;const p=V(10+Math.cos(a)*3,Math.sin(a)*11,Math.sin(a)*3);const m=new T.Mesh(new T.BoxGeometry(6.6,2.5,1.4),mat(COL.blue,.45));m.position.copy(p);g.add(m);edges(m,COL.lime,.7);const l=label(n[0]+' '+n[1],{size:1.55,w:640,h:140,color:'#EAF0FF'});l.position.set(p.x,p.y,p.z+.9);g.add(l);return{m:m,p:p}});
 const sel=0,sp=mcp.servers[sel].p;const world=node(V(30,sp.y,sp.z),new T.CylinderGeometry(1.6,1.6,2.6,24),COL.lime,.5);world.add(wire(new T.CylinderGeometry(1.9,1.9,3,16,1),COL.lime,.4));const wl=label('📅 Tu calendario real',{size:1.4,color:'#D4FF24',glow:'#D4FF24',w:760});wl.position.set(30,sp.y+3,sp.z);g.add(wl);
 const segs=[];const seg=(a,b,key,idx)=>{const l=line(a,b,COL.blueL,.35);g.add(l);const pk=[0,1].map(()=>{const s=new T.Mesh(new T.SphereGeometry(.28,10,10),new T.MeshBasicMaterial({color:COL.blueL,transparent:true,opacity:.6}));g.add(s);return s});segs.push({l:l,pk:pk,a:a,b:b,key:key,idx:idx,lit:false});return segs[segs.length-1]};
 const sU=seg(user.position,host.position,'U'),sA=seg(host.position,cli.position,'A');mcp.servers.forEach((s,i)=>seg(cli.position,s.p,i===sel?'B':'x'));const sC=seg(mcp.servers[sel].p,world.position,'C');
 mcp.segs=segs;mcp.host=host;mcp.cli=cli;
 upd.push((dt,t)=>{const st=P.mcpStep;host.rotation.y=t*.3;cli.rotation.y=-t*.5;cli.rotation.x=t*.2;
  segs.forEach(s=>{const lit=(st===1&&s.key==='U')||(st===2&&s.key==='A')||(st===3&&s.key==='B')||(st===4&&s.key==='C')||st===5;const rev=st===5;
   s.l.material.opacity=lerp(s.l.material.opacity,lit?1:.28,.15);s.l.material.color.setHex(lit?COL.lime:COL.blueL);
   s.pk.forEach((p,j)=>{const k=(t*(lit?.8:.25)+j*.5)%1;p.position.lerpVectors(rev?s.b:s.a,rev?s.a:s.b,k);p.material.color.setHex(lit?COL.lime:COL.blueL);p.material.opacity=lit?1:.55;p.scale.setScalar(lit?1.5:1)})});
  host.material.emissiveIntensity=lerp(host.material.emissiveIntensity,st===1||st===2||st===5?1.1:.55,.1);
  mcp.servers.forEach((s,i)=>{s.m.material.emissiveIntensity=lerp(s.m.material.emissiveIntensity,(i===sel&&(st===3||st===4))?1:.45,.1)})})}
/* ---------- RAG ---------- */
const RAG={chunks:[],centers:[],q:[
 {t:'¿Puedo devolver un producto si ya pasaron 10 días?',at:[-6,3,0]},
 {t:'Olvidé mi contraseña, ¿qué hago?',at:[6,-1,2]},
 {t:'¿Cuánto cuesta el plan Pro?',at:[1,6,-5]},
 {t:'¿Tienen tienda física en Cali?',at:[-1.2,-5,-2]}]};
const TXT={
 A:['Puedes devolver cualquier producto dentro de los 15 días posteriores a la entrega.','El producto debe estar sin uso y con su empaque original.','Los reembolsos se acreditan en 5 a 7 días hábiles al mismo medio de pago.','Para iniciar una devolución, escribe a soporte con tu número de pedido.','Los productos en oferta final no admiten devolución.','El envío de la devolución es gratis si el producto llegó defectuoso.','Si superas los 15 días, puedes recibir un bono de compra.','Los cambios de talla se gestionan como devolución más compra nueva.'],
 B:['Para restablecer tu contraseña pulsa «Olvidé mi contraseña» en el inicio de sesión.','Recibirás un enlace de recuperación en tu correo; vence en 30 minutos.','Si no llega el correo, revisa la carpeta de spam.','Puedes activar la verificación en dos pasos en Configuración › Seguridad.','Para cambiar tu correo, confirma desde la dirección anterior.','Puedes eliminar tu cuenta desde Configuración › Privacidad.','Cada cuenta admite hasta 5 dispositivos activos.','Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.'],
 C:['El plan Pro cuesta 12 USD por usuario al mes, facturado anual.','El plan Equipo cuesta 25 USD por usuario al mes e incluye soporte prioritario.','Los precios no incluyen impuestos locales.','El plan Básico es gratis e incluye 3 proyectos.','Puedes cambiar de plan cuando quieras; el cobro se prorratea.','Los estudiantes tienen 50 % de descuento con correo institucional.','Aceptamos tarjeta y, en el plan Equipo, transferencia.','La prueba gratuita del plan Pro dura 14 días.'],
 N:['Nuestras oficinas están en Bogotá y Medellín.','El horario de atención es de lunes a viernes, de 8 a. m. a 6 p. m.','La empresa fue fundada en 2019 por un equipo de ingenieros.','Política de privacidad: no vendemos tus datos.','Vacantes abiertas en ingeniería y diseño.','Blog: guías de productividad para equipos.','Términos de uso actualizados en enero.','Programa de afiliados para creadores.','Estado del servicio: 99,9 % de disponibilidad.','Descarga el kit de prensa y marca.','Integraciones con Slack y Google Calendar.','Cumplimos la norma de accesibilidad WCAG 2.1 AA.']};
const CL={A:{c:[-6,3,0],n:'Devoluciones'},B:{c:[6,-1,2],n:'Cuenta'},C:{c:[1,6,-5],n:'Precios'},N:{c:[-1.2,-5,-2],n:'Otros temas'}};
const rag={};
function buildRag(){const g=new T.Group();g.position.copy(ST.RG);scene.add(g);rag.g=g;g.add(glow(COL.blueL,60,.2));const r=rng(21);
 const cloud=new T.Group();cloud.position.set(6,0,0);g.add(cloud);rag.cloud=cloud;
 Object.keys(TXT).forEach(k=>TXT[k].forEach((tx,i)=>{const c=CL[k].c,dr=V(r()-.5,r()-.5,r()-.5).normalize(),ds=k==='N'?(i<3?.5+i*.7:3.6+(i-3)*.45):.5+i*.7;
  const p=V(c[0],c[1],c[2]).addScaledVector(dr,ds);const m=new T.Mesh(new T.SphereGeometry(.34,14,14),mat(COL.blueL,.5));m.position.copy(p);cloud.add(m);RAG.chunks.push({k:k,i:i,t:tx,p:p,m:m})}));
 Object.keys(CL).forEach(k=>{const l=label(CL[k].n,{size:.95,color:k==='N'?'#9fb4e8':'#EAF0FF',glow:'#1558C9',w:600});l.position.set(CL[k].c[0],CL[k].c[1]+(k==='N'?-3.2:3.6),CL[k].c[2]);cloud.add(l)});
 // documentos
 const docs=new T.Group();docs.position.set(-17,0,0);g.add(docs);[0,1,2,3].forEach(i=>{const m=new T.Mesh(new T.BoxGeometry(3.2,4.2,.15),mat(COL.white,.25));m.position.set(i*.5-.7,i*.35-.5,-i*.5);m.rotation.z=(i-1.5)*.08;docs.add(m);edges(m,COL.blue,.9)});const dl=label('Tus documentos',{size:.95,color:'#EAF0FF',w:700});dl.position.set(0,-4,0);docs.add(dl);
 // chunks viajando
 rag.fly=[...Array(14)].map((_,i)=>{const m=new T.Mesh(new T.BoxGeometry(.9,.5,.12),mat(COL.lime,.9));g.add(m);return{m:m,k:i/14,to:RAG.chunks[(i*7)%RAG.chunks.length]}});
 // consulta
 const q=new T.Group();g.add(q);q.add(new T.Mesh(new T.SphereGeometry(.7,20,20),mat(COL.lime,1)));q.add(glow(COL.lime,7,.8));const ql=label('Pregunta',{size:.8,color:'#D4FF24',glow:'#D4FF24'});ql.position.y=1.5;q.add(ql);q.position.set(-8,0,6);q.scale.setScalar(.001);rag.q=q;rag.qt=V(-8,0,6);
 rag.beams=[0,1,2].map(()=>{const l=new T.Line(new T.BufferGeometry().setFromPoints([V(),V()]),new T.LineBasicMaterial({color:COL.lime,transparent:true,opacity:0}));g.add(l);return l});rag.top=[];
 upd.push((dt,t)=>{cloud.rotation.y=Math.sin(t*.15)*.15;
  rag.fly.forEach(f=>{f.k=(f.k+dt*.12)%1;const from=V(-17,0,0),to=f.to.p.clone().add(cloud.position);f.m.position.lerpVectors(from,to,ease(f.k));f.m.position.y+=Math.sin(f.k*Math.PI)*2;f.m.scale.setScalar(f.k>.92?.01:1)});
  const act=P.ragQ>=0;const tgt=act?RAG.q[P.ragQ].at:null;
  if(act){rag.qt.set(tgt[0]+cloud.position.x,tgt[1],tgt[2])}
  q.scale.setScalar(Math.max(.001,lerp(q.scale.x,act?1:0,.1)));q.position.lerp(act?rag.qt:V(-8,0,6),.07);
  RAG.chunks.forEach(c=>{const on=rag.top.includes(c);c.m.material.emissiveIntensity=lerp(c.m.material.emissiveIntensity,on?1.4:.5,.15);c.m.scale.setScalar(lerp(c.m.scale.x,on?2:1,.15));c.m.material.color.setHex(on?COL.lime:COL.blueL);c.m.material.emissive.setHex(on?COL.lime:COL.blueL)});
  rag.beams.forEach((b,i)=>{const c=rag.top[i];if(!c){b.material.opacity=lerp(b.material.opacity,0,.2);return}const a=b.geometry.attributes.position;const w=c.p.clone().add(cloud.position);a.setXYZ(0,q.position.x,q.position.y,q.position.z);a.setXYZ(1,w.x,w.y,w.z);a.needsUpdate=true;b.material.opacity=lerp(b.material.opacity,1,.15)})})}
function ragQuery(i){P.ragQ=i;rag.top=[];if(i<0)return[];const at=V(...RAG.q[i].at);const sorted=RAG.chunks.slice().sort((a,b)=>a.p.distanceTo(at)-b.p.distanceTo(at));setTimeout(()=>{if(P.ragQ===i)rag.top=sorted.slice(0,3)},900);return sorted.slice(0,3)}
/* ---------- cámara ---------- */
const flight={on:false,t0:0,dur:2,from:null,to:null,mid:null,bank:0,vel:V(),dist:0};
const view={p:V(0,1.5,16),t:V(0,0,0),roll:0,fov:55,ox:0,oy:0};
let lastPos=V(),streak=0;
function fly(pose,instant){const to={p:V(...pose.p),t:V(...pose.t),roll:pose.roll||0,fov:pose.fov||55,ox:pose.ox||0,oy:pose.oy||0};
 if(instant||!ready){Object.assign(view,to);flight.on=false;return}
 const from={p:view.p.clone(),t:view.t.clone(),roll:view.roll,fov:view.fov,ox:view.ox,oy:view.oy};
 const d=from.p.distanceTo(to.p);const dir=to.p.clone().sub(from.p).normalize(),side=new T.Vector3().crossVectors(dir,V(0,1,0)).normalize();
 flight.mid=from.p.clone().lerp(to.p,.5).add(V(0,Math.min(14,d*.16),0)).add(side.multiplyScalar(Math.min(16,d*.14)*(Math.random()<.5?-1:1)));
 flight.from=from;flight.to=to;flight.t0=performance.now()/1000;flight.dur=clamp(1.5+d*.014,1.5,3);flight.on=true;flight.dist=d;flight.bank=(Math.random()<.5?-1:1)*clamp(d*.004,.04,.2)}
function stepCam(dt,t){
 if(flight.on){const k=clamp((performance.now()/1000-flight.t0)/flight.dur,0,1),e=ease(k),f=flight.from,to=flight.to;
  const a=1-e;view.p.set(0,0,0).addScaledVector(f.p,a*a).addScaledVector(flight.mid,2*a*e).addScaledVector(to.p,e*e);
  view.t.lerpVectors(f.t,to.t,ease(clamp(k*1.12-.06,0,1)));view.roll=lerp(f.roll,to.roll,e)+Math.sin(Math.PI*k)*flight.bank;view.fov=lerp(f.fov,to.fov,e)+Math.sin(Math.PI*k)*(flight.dist>25?16:6);view.ox=lerp(f.ox,to.ox,e);view.oy=lerp(f.oy,to.oy,e);
  streak=Math.sin(Math.PI*k)*(flight.dist>25?1:.35);if(k>=1)flight.on=false}else streak=lerp(streak,0,.1);
 cam.position.copy(view.p);cam.position.x+=Math.sin(t*.3)*.25;cam.position.y+=Math.cos(t*.23)*.18;
 cam.lookAt(view.t);cam.rotateZ(view.roll);cam.translateX(pointer.x*.7);cam.translateY(-pointer.y*.45);
 if(Math.abs(cam.fov-view.fov)>.01){cam.fov=view.fov;cam.updateProjectionMatrix()}
 cam.setViewOffset(W,H,-view.ox*W,-view.oy*H,W,H);
 const vel=cam.position.clone().sub(lastPos).divideScalar(Math.max(dt,.001));lastPos.copy(cam.position);updWarp(vel,streak)}
/* ---------- ciclo ---------- */
function resize(){W=innerWidth;H=innerHeight;R.setSize(W,H);cam.aspect=W/H;cam.updateProjectionMatrix()}
function loop(ts){requestAnimationFrame(loop);if(paused||!ready)return;const t=ts/1000,dt=Math.min(.05,T0?t-T0:.016);T0=t;stepCam(dt,t);upd.forEach(f=>f(dt,t));R.render(scene,cam)}
async function init(cv){canvas=cv;
 try{await Promise.all(['800 40px Bricolage','600 30px Inter','700 30px JBM','500 30px JBM'].map(f=>document.fonts.load(f)))}catch(e){}
 R=new T.WebGLRenderer({canvas:cv,antialias:true});R.setPixelRatio(Math.min(devicePixelRatio||1,1.75));scene=new T.Scene();cam=new T.PerspectiveCamera(55,1,.1,700);scene.add(cam);
 env();buildWarp();buildIcons();buildBrain();buildSkill();buildMcp();buildRag();resize();addEventListener('resize',resize);
 addEventListener('pointermove',e=>{pointer.x=(e.clientX/innerWidth-.5)*2;pointer.y=(e.clientY/innerHeight-.5)*2});
 ready=true;requestAnimationFrame(loop)}
window.World={init:init,fly:fly,set(k,v){P[k]=v},get:k=>P[k],ST:ST,RAG:RAG,ragQuery:ragQuery,pause(v){paused=v;if(!v)T0=0},cam:()=>cam,isReady:()=>ready,flying:()=>flight.on};
})();
