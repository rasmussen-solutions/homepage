(function(){
  if(!window.THREE||!THREE.OrbitControls){
    document.querySelectorAll('#rs-sens .stage canvas').forEach(c=>{const d=document.createElement('div');d.className='err';d.textContent='3D-modellen kunne ikke indlæses i denne browser.';c.replaceWith(d);});
    return;
  }
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PR=Math.min(window.devicePixelRatio||1,2);
  const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.55,metalness:.05},o||{}));
  const mat={
    shell:M(0xeef1f3),grey:M(0xc9ced2),dark:M(0x2b3238,{roughness:.7}),orange:M(0xe8641c,{roughness:.45}),
    red:M(0xc8332b,{roughness:.5}),metal:M(0xbcc2c7,{metalness:.8,roughness:.3}),cable:M(0x1d2226,{roughness:.85}),
    brown:M(0x6b4226,{roughness:.8}),greyc:M(0x8d9399,{roughness:.8}),rubber:M(0x23282c,{roughness:.95}),
    yellow:M(0xf0b929,{roughness:.6}),steel:M(0x7d868c,{metalness:.5,roughness:.5}),
    led:new THREE.MeshStandardMaterial({color:0x39d07a,emissive:0x39d07a,emissiveIntensity:1}),
    ledO:new THREE.MeshStandardMaterial({color:0xff7a2e,emissive:0xff7a2e,emissiveIntensity:1})
  };
  function rbox(w,h,d,r,m){
    const b=Math.min(.22,d*.2), W=w-2*b, H=h-2*b, R=Math.max(.02,Math.min(r,W/2-.01,H/2-.01));
    const s=new THREE.Shape(), x=-W/2, y=-H/2;
    s.moveTo(x+R,y);s.lineTo(x+W-R,y);s.quadraticCurveTo(x+W,y,x+W,y+R);s.lineTo(x+W,y+H-R);
    s.quadraticCurveTo(x+W,y+H,x+W-R,y+H);s.lineTo(x+R,y+H);s.quadraticCurveTo(x,y+H,x,y+H-R);
    s.lineTo(x,y+R);s.quadraticCurveTo(x,y,x+R,y);
    const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.01,d-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:8});
    g.center();return new THREE.Mesh(g,m);
  }
  function box(w,h,d,m){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);}
  function cyl(r,h,m,seg){return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg||32),m);}
  function tube(pts,r,m){return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),64,r,12,false),m);}
  function screen(lines,w,h){
    const cw=512, ch=Math.round(512*h/w), c=document.createElement('canvas');c.width=cw;c.height=ch;
    const x=c.getContext('2d');x.fillStyle='#132027';x.fillRect(0,0,cw,ch);
    const longest=Math.max(...lines.map(l=>l.length));const fs=Math.floor(Math.min(ch/(lines.length+1.1),cw*.86/(longest*.62)));x.fillStyle='#9fe0b4';x.font='500 '+fs+'px "IBM Plex Mono", Menlo, monospace';x.textBaseline='middle';
    lines.forEach((l,i)=>x.fillText(l,cw*.07,ch*(i+1)/(lines.length+1)));
    const t=new THREE.CanvasTexture(c);t.anisotropy=4;
    return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));
  }
  function shadow(r,y){
    const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
    const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(0,0,0,.28)');g.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle=g;x.fillRect(0,0,128,128);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*1.3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
    m.rotation.x=-Math.PI/2;m.position.y=y;return m;
  }

  /* 01 Tavle-clip */
  function buildTavle(){
    const g=new THREE.Group();
    const rail=box(22,3.5,.4,mat.metal);rail.position.set(2,0,-3);g.add(rail);
    const mod=new THREE.Group();mod.position.x=-5;g.add(mod);
    const body=rbox(7.2,9,5.4,.5,mat.shell);mod.add(body);
    const bump=rbox(6.8,4.8,1.6,.5,mat.shell);bump.position.z=3.1;mod.add(bump);
    const band=box(7.25,.55,5.45,mat.orange);band.position.y=3.3;mod.add(band);
    const scr=screen(['12.4 kW','PF 0.91','L1 L2 L3 ✓'],5.6,3.4);scr.position.z=3.92;mod.add(scr);
    for(let i=0;i<4;i++){[-3.9,3.9].forEach(y=>{const t=rbox(1.1,.75,.3,.15,mat.dark);t.position.set(-2.4+i*1.6,y,2.62);mod.add(t);});}
    const ant=cyl(.3,3,mat.dark);ant.position.set(2.6,6,0);mod.add(ant);
    const led=new THREE.Mesh(new THREE.SphereGeometry(.22,16,16),mat.led);led.position.set(2.7,-1.9,3.9);mod.add(led);
    const cm=[mat.brown,mat.cable,mat.greyc];
    [3,7,11].forEach((x,i)=>{
      const c=cyl(.6,16,cm[i]);c.position.set(x,0,.5);g.add(c);
      const ct=new THREE.Mesh(new THREE.TorusGeometry(1.25,.5,18,40),mat.dark);ct.rotation.x=Math.PI/2;ct.scale.set(1,1.2,1.5);ct.position.set(x,-1.5,.5);g.add(ct);
      const clip=rbox(1.2,.9,.9,.2,mat.orange);clip.position.set(x,-1.5,2.2);g.add(clip);
      g.add(tube([[x,-1.6,2.6],[x-1,-5,3.2],[-5+(i-1)*1.6,-6.5,3.2],[-5+(i-1)*1.6-.8,-4.6,2.8]],.13,mat.cable));
    });
    g.add(shadow(13,-8.2));
    return {group:g,cam:[8,5,26],target:[1,-.5,0]};
  }

  /* 02 Stikprop */
  function buildStik(){
    const g=new THREE.Group();
    const body=rbox(8,6.4,5.2,1.3,mat.shell);g.add(body);
    const scr=screen(['2.1 kW','Kompr. 07','3t 12m'],5.6,3);scr.position.set(0,.4,2.62);g.add(scr);
    const band=box(8.02,.5,5.22,mat.orange);band.position.y=-2.4;g.add(band);
    const led=new THREE.Mesh(new THREE.SphereGeometry(.22,16,16),mat.led);led.position.set(2.9,-1.5,2.62);g.add(led);
    const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,3.4,40,1,true),Object.assign(mat.red.clone(),{side:THREE.DoubleSide}));
    sleeve.rotation.z=Math.PI/2;sleeve.position.x=-5.6;g.add(sleeve);
    [-4.6,-5.6,-6.6].forEach(x=>{const r=new THREE.Mesh(new THREE.TorusGeometry(2.42,.14,10,40),mat.red);r.rotation.y=Math.PI/2;r.position.x=x;g.add(r);});
    const disk=cyl(2.35,.2,mat.dark);disk.rotation.z=Math.PI/2;disk.position.x=-5.2;g.add(disk);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.3,p=cyl(.24,1.6,mat.metal,16);p.rotation.z=Math.PI/2;p.position.set(-6.1,Math.sin(a)*1.4,Math.cos(a)*1.4);g.add(p);}
    const sock=rbox(5.6,5.6,2.4,1.1,mat.red);sock.rotation.y=Math.PI/2;sock.position.x=5.1;g.add(sock);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.1,.16,12,48),mat.orange);ring.rotation.y=Math.PI/2;ring.position.x=6.35;g.add(ring);
    const hole=cyl(1.8,.2,mat.dark);hole.rotation.z=Math.PI/2;hole.position.x=6.3;g.add(hole);
    const piv=new THREE.Group();piv.position.set(6.4,2.8,0);piv.rotation.z=.75;g.add(piv);
    const lid=rbox(5.6,5.6,.5,1.1,mat.red);lid.rotation.y=Math.PI/2;lid.position.set(.3,-2.8,0);piv.add(lid);
    const cbl=tube([[6.2,0,0],[8.5,-.4,0],[10,-3,.8],[9.4,-7.5,2]],.5,mat.cable);g.add(cbl);
    const tag=rbox(1.8,1,1.4,.3,mat.orange);tag.position.set(10.15,-3.4,.9);tag.rotation.z=-1.1;g.add(tag);
    g.position.x=-1.5;
    const s=shadow(11,-8.4);s.position.x=1.5;g.add(s);
    return {group:g,cam:[9,6,22],target:[0,-1,0]};
  }

  /* 03 Varmetab-måler */
  function buildVarme(){
    const g=new THREE.Group();
    const gw=new THREE.Group();gw.position.set(-8,0,0);g.add(gw);
    gw.add(rbox(5,7.4,2.4,.6,mat.shell));
    const band=box(5.02,.6,2.42,mat.orange);band.position.y=3.1;gw.add(band);
    const scr=screen(['ude  -3°C','inde 12°C','dør 41 min'],3.9,2.8);scr.position.set(0,.7,1.22);gw.add(scr);
    const ant=cyl(.28,4,mat.dark);ant.position.set(1.7,5.6,0);gw.add(ant);
    const led=new THREE.Mesh(new THREE.SphereGeometry(.2,16,16),mat.ledO);led.position.set(1.6,-2.4,1.22);gw.add(led);
    const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new THREE.Vector3(-5.5+t*19,2-Math.sin(t*Math.PI)*3.2,0));}
    const curve=new THREE.CatmullRomCurve3(pts);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,80,.12,10,false),mat.cable));
    [.2,.45,.7,.95].forEach(t=>{
      const p=curve.getPoint(t);
      const pk=new THREE.Group();pk.position.set(p.x,p.y-1.2,p.z);g.add(pk);
      pk.add(rbox(1.5,2.2,1.1,.6,mat.shell));
      const r=box(1.52,.35,1.12,mat.orange);r.position.y=.5;pk.add(r);
      const h=cyl(.08,1,mat.cable);h.position.y=1.4;pk.add(h);
    });
    const frame=box(9,.7,1.6,mat.steel);frame.position.set(4,-5.6,0);g.add(frame);
    const c1=rbox(2.4,.9,.9,.25,mat.shell);c1.position.set(2.2,-4.8,0);g.add(c1);
    const c2=rbox(2.4,.9,.9,.25,mat.shell);c2.position.set(5,-4.8,0);g.add(c2);
    const dl=new THREE.Mesh(new THREE.SphereGeometry(.16,12,12),mat.ledO);dl.position.set(3.1,-4.8,.46);g.add(dl);
    g.position.x=-2.2;
    g.add(shadow(15,-7));
    return {group:g,cam:[3,4,32],target:[0,-1.5,0],tick:t=>{const k=.4+.6*Math.abs(Math.sin(t*2));mat.ledO.emissiveIntensity=k;}};
  }

  /* 04 Maskin-puls */
  function buildPuls(){
    const g=new THREE.Group();
    const plate=box(15,1.2,11,mat.yellow);plate.position.y=-1.3;g.add(plate);
    const edge=box(15.05,.3,11.05,mat.dark);edge.position.y=-1.85;g.add(edge);
    [[-6.5,-4.5],[6.5,-4.5],[-6.5,4.5],[6.5,4.5]].forEach(([x,z])=>{const b=cyl(.35,.3,mat.metal,6);b.position.set(x,-.6,z);g.add(b);});
    const base=rbox(5.6,4.2,.6,1,mat.rubber);base.rotation.x=-Math.PI/2;base.position.y=-.45;g.add(base);
    const tag=rbox(5,3.6,1.6,.9,mat.orange);tag.rotation.x=-Math.PI/2;tag.position.y=.55;g.add(tag);
    const logo=cyl(.85,.08,mat.shell);logo.position.set(-.9,1.38,0);g.add(logo);
    const ln=box(1.6,.08,.3,mat.shell);ln.position.set(1,1.38,0);g.add(ln);
    const led=new THREE.Mesh(new THREE.SphereGeometry(.2,16,16),mat.led);led.position.set(1.7,1.38,1);g.add(led);
    const rings=[];
    for(let i=0;i<3;i++){
      const m=new THREE.MeshBasicMaterial({color:0xe8641c,transparent:true,opacity:.5});
      const r=new THREE.Mesh(new THREE.TorusGeometry(3.6,.07,8,64),m);r.rotation.x=Math.PI/2;r.position.y=-.65;g.add(r);rings.push(r);
    }
    const tick=t=>{rings.forEach((r,i)=>{const p=((t*.5)+i/3)%1;const s=1+p*.9;r.scale.set(s,s*.75,s);r.material.opacity=.55*(1-p);});mat.led.emissiveIntensity=.5+.5*Math.abs(Math.sin(t*3));};
    if(reduce){rings.forEach((r,i)=>{const s=1+i*.3;r.scale.set(s,s*.75,s);r.material.opacity=.4-i*.1;});}
    g.add(shadow(12,-2.05));
    return {group:g,cam:[8,9,14],target:[0,-.3,0],tick:reduce?null:tick};
  }

  const extra={
    wood:M(0xc89b62,{roughness:.8}),concrete:M(0xbfc3c4,{roughness:.9}),blue:M(0x2f6fb5,{roughness:.5}),galv:M(0xb4bcc2,{metalness:.25,roughness:.45})
  };
  function ringsTex(){
    const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
    x.fillStyle='#d9b07a';x.fillRect(0,0,256,256);x.strokeStyle='rgba(120,78,36,.55)';x.lineWidth=3;
    for(let r=14;r<200;r+=16){x.beginPath();x.arc(60,230,r,0,Math.PI*2);x.stroke();}
    return new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(c),roughness:.8});
  }

  /* Generator-log */
  function buildGen(){
    const g=new THREE.Group();
    const frame=box(12.4,.6,6.4,mat.dark);frame.position.y=-3.3;g.add(frame);
    g.add(rbox(12,6,6,.8,mat.grey));
    for(let i=0;i<6;i++){const v=box(.25,3.6,.1,mat.dark);v.position.set(-5+i*.8,0,3.02);g.add(v);}
    const panel=rbox(4.2,3.4,.6,.3,mat.dark);panel.position.set(3.2,.4,3.2);g.add(panel);
    const scr=screen(['4.1 L/h','last 38%','tomgang 2t'],3.6,2.6);scr.position.set(3.2,.4,3.52);g.add(scr);
    const cap=cyl(1,.7,mat.orange);cap.position.set(-3,3.3,0);g.add(cap);
    const ant=cyl(.12,1.6,mat.dark,12);ant.position.set(-2.5,4.4,0);g.add(ant);
    const ex=cyl(.35,2.2,mat.metal,16);ex.position.set(4.6,4,-1.6);g.add(ex);
    [[-4,3.3],[-4,-3.3],[4,3.3],[4,-3.3]].forEach(([x,z])=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,.7,24),mat.rubber);w.rotation.x=Math.PI/2;w.position.set(x,-3.7,z);g.add(w);});
    const bar=box(4,.4,.4,mat.dark);bar.position.set(-8,-3.3,0);g.add(bar);
    const led=new THREE.Mesh(new THREE.SphereGeometry(.18,12,12),mat.led);led.position.set(-3,3.75,.7);g.add(led);
    g.add(shadow(12,-4.9));
    return {group:g,cam:[11,7,24],target:[0,-.5,0]};
  }

  /* Fugt-søm */
  function buildFugt(){
    const g=new THREE.Group();
    const end=ringsTex();
    const beam=new THREE.Mesh(new THREE.BoxGeometry(16,4,4),[end,end,extra.wood,extra.wood,extra.wood,extra.wood]);g.add(beam);
    const head=rbox(2.4,2.4,1,.6,mat.orange);head.rotation.x=-Math.PI/2;head.position.set(-3,2.5,0);g.add(head);
    const led=new THREE.Mesh(new THREE.SphereGeometry(.18,12,12),mat.led);led.position.set(-2.4,3.02,.6);g.add(led);
    const ex=new THREE.Group();ex.position.set(4,6,0);g.add(ex);
    const h2=rbox(2.4,2.4,1,.6,mat.orange);h2.rotation.x=-Math.PI/2;ex.add(h2);
    [-.6,.6].forEach(z=>{const p=cyl(.14,3,mat.metal,12);p.position.set(0,-2,z);ex.add(p);});
    const l2=new THREE.Mesh(new THREE.SphereGeometry(.18,12,12),mat.led);l2.position.set(.6,.52,.6);ex.add(l2);
    const guide=tube([[4,3.4,0],[4,2.2,0]],.04,mat.dark);g.add(guide);
    g.add(shadow(11,-2.1));
    return {group:g,cam:[9,7,19],target:[0,1.5,0]};
  }

  /* Byggetørring-tæller */
  function buildTor(){
    const g=new THREE.Group();
    const dh=new THREE.Group();dh.position.x=-3;g.add(dh);
    dh.add(rbox(6,8,4.4,.8,extra.blue));
    const grill=rbox(4.6,4.6,.3,.4,mat.dark);grill.position.set(0,.6,2.2);dh.add(grill);
    const fan=new THREE.Group();fan.position.set(0,.6,2.45);dh.add(fan);
    const hub=cyl(.4,.2,mat.metal,16);hub.rotation.x=Math.PI/2;fan.add(hub);
    for(let i=0;i<5;i++){const b=box(.5,1.8,.06,mat.metal);b.position.y=1;const p=new THREE.Group();p.rotation.z=i/5*Math.PI*2;b.rotation.y=.4;p.add(b);fan.add(p);}
    const handle=tube([[-1.6,4,0],[-1.6,5,0],[1.6,5,0],[1.6,4,0]],.18,mat.dark);dh.add(handle);
    const tag=rbox(1.6,.9,.3,.2,mat.orange);tag.position.set(-1.8,-3,2.25);dh.add(tag);
    [-2,2].forEach(x=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.5,20),mat.rubber);w.rotation.x=Math.PI/2;w.position.set(x,-4.4,1.6);dh.add(w);});
    const st=new THREE.Group();st.position.set(5.5,-1,0);g.add(st);
    const pole=cyl(.12,6,mat.dark,12);pole.position.y=-1;st.add(pole);
    const foot=cyl(1.2,.2,mat.dark);foot.position.y=-4;st.add(foot);
    const sens=rbox(2.6,3.2,1,.4,mat.shell);sens.position.y=2.6;st.add(sens);
    const band=box(2.62,.35,1.02,mat.orange);band.position.y=3.9;st.add(band);
    const scr=screen(['RF 61%','14°C'],2,1.4);scr.position.set(0,2.4,.52);st.add(scr);
    g.add(shadow(12,-5));
    return {group:g,cam:[8,5,24],target:[1,-.5,0],tick:reduce?null:(t=>{fan.rotation.z=t*6;})};
  }

  /* Stillads-anker */
  function buildStil(){
    const g=new THREE.Group();
    const wall=box(1.6,14,12,extra.concrete);wall.position.x=-6;g.add(wall);
    [-4,4].forEach(z=>{const s=cyl(.3,14,extra.galv,16);s.position.set(3,0,z);g.add(s);});
    [-4,0,4].forEach(y=>{const l=cyl(.3,8.6,extra.galv,16);l.rotation.x=Math.PI/2;l.position.set(3,y,0);g.add(l);});
    const br=tube([[3,-4,-4],[3,4,4]],.25,extra.galv);g.add(br);
    const tie=cyl(.25,8,extra.galv,16);tie.rotation.z=Math.PI/2;tie.position.set(-1.2,2,-4);g.add(tie);
    const eye=new THREE.Mesh(new THREE.TorusGeometry(.5,.14,10,20),extra.galv);eye.rotation.y=Math.PI/2;eye.position.set(-5.1,2,-4);g.add(eye);
    const cell=rbox(1.8,1.3,1.3,.3,mat.orange);cell.position.set(-1.6,2,-4);g.add(cell);
    [[3,2,-4],[3,-4,-4],[3,0,-4],[3,4,-4],[3,-4,4],[3,0,4],[3,4,4]].forEach(p=>{const c=box(.8,.8,.8,mat.dark);c.position.set(...p);g.add(c);});
    const node=rbox(2.6,3.2,1,.4,mat.shell);node.position.set(3,-1.6,5.2);g.add(node);
    const scr=screen(['anker 3','2.4 kN','tilt 0.2°'],2,2.2);scr.position.set(3,-1.6,5.72);g.add(scr);
    g.add(tube([[-1.6,2.6,-3.4],[0,3.4,0],[3,-0.1,5]],.06,mat.cable));
    g.add(shadow(12,-7.2));
    return {group:g,cam:[16,5,20],target:[-.5,0,0]};
  }

  /* Strø-sensorer */
  function buildStro(){
    const g=new THREE.Group();
    const slab=box(18,.6,12,extra.concrete);slab.position.y=-.3;g.add(slab);
    [[0,-6,18,.4],[0,6,18,.4]].forEach(([x,z,w,d])=>{const m=box(w,1.6,d,mat.grey);m.position.set(x,.8,z);g.add(m);});
    [[-9,0],[9,0]].forEach(([x,z])=>{const m=box(.4,1.6,12,mat.grey);m.position.set(x,.8,z);g.add(m);});
    const iw=[[-2,-3,.4,6],[4,2,10,.4],[-5.5,1,7,.4]];
    iw.forEach(([x,z,w,d])=>{const m=box(w,1.6,d,mat.grey);m.position.set(x,.8,z);g.add(m);});
    const pts=[[-6,-3],[1,-3.6],[6.5,-2.5],[-6,3.5],[1,4],[6,4.2]];
    const pucks=pts.map(([x,z])=>{
      const p=new THREE.Group();p.position.set(x,.05,z);g.add(p);
      const b=cyl(.7,.3,mat.shell,24);b.position.y=.15;p.add(b);
      const t=cyl(.5,.06,mat.orange,24);t.position.y=.33;p.add(t);
      const l=new THREE.Mesh(new THREE.SphereGeometry(.12,10,10),mat.ledO);l.position.y=.4;p.add(l);
      return p;
    });
    const links=[[0,1],[1,2],[0,3],[1,4],[2,5],[3,4],[4,5],[1,5]];
    const lm=new THREE.LineDashedMaterial({color:0xe8641c,dashSize:.4,gapSize:.3});
    links.forEach(([a,b])=>{const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(pts[a][0],.5,pts[a][1]),new THREE.Vector3(pts[b][0],.5,pts[b][1])]);const ln=new THREE.Line(geo,lm);ln.computeLineDistances();g.add(ln);});
    const big=new THREE.Group();big.position.set(1,4.5,-3.6);g.add(big);
    const bb=cyl(1.4,.6,mat.shell,32);big.add(bb);const bt=cyl(1,.08,mat.orange,32);bt.position.y=.34;big.add(bt);
    g.add(tube([[1,3.9,-3.6],[1,.6,-3.6]],.03,mat.dark));
    g.add(shadow(14,-.62));
    return {group:g,cam:[11,15,17],target:[0,0,0],tick:reduce?null:(t=>{mat.ledO.emissiveIntensity=.4+.6*Math.abs(Math.sin(t*2));})};
  }

  /* CO2-kvittering */
  function buildCo2(){
    const g=new THREE.Group();
    const c=document.createElement('canvas');c.width=360;c.height=720;const x=c.getContext('2d');
    x.fillStyle='#ffffff';x.fillRect(0,0,360,700);
    x.beginPath();x.moveTo(0,700);for(let i=0;i<=12;i++){x.lineTo(i*30,i%2?720:700);}x.lineTo(360,700);x.fill();
    x.fillStyle='#272727';x.font='600 30px Menlo, Consolas, monospace';x.fillText('CO₂-KVITTERING',30,70);
    x.font='22px Menlo, Consolas, monospace';x.fillStyle='#5a6270';x.fillText('Sag 2026-114 (eksempel)',30,108);
    x.strokeStyle='#bbb';x.setLineDash([6,6]);x.beginPath();x.moveTo(30,135);x.lineTo(330,135);x.stroke();
    const rows=[['El','4 120 kWh'],['Diesel','610 L'],['Varme','9 300 kWh'],['Kørsel','3 900 km']];
    x.fillStyle='#272727';x.font='24px Menlo, Consolas, monospace';
    rows.forEach((r,i)=>{x.fillText(r[0],30,190+i*52);x.textAlign='right';x.fillText(r[1],330,190+i*52);x.textAlign='left';});
    x.setLineDash([]);x.strokeStyle='#272727';x.beginPath();x.moveTo(30,410);x.lineTo(330,410);x.stroke();
    x.font='700 34px Menlo, Consolas, monospace';x.fillStyle='#e8641c';x.fillText('CO₂e',30,470);x.textAlign='right';x.fillText('6,8 t',330,470);x.textAlign='left';
    x.font='20px Menlo, Consolas, monospace';x.fillStyle='#5a6270';x.fillText('målt, ikke beregnet',30,540);
    const geo=new THREE.PlaneGeometry(5,10,1,40);const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){const y=pos.getY(i);pos.setZ(i,y>2?-.12*Math.pow(y-2,2):0);}
    geo.computeVertexNormals();
    const tex=new THREE.CanvasTexture(c);
    const paper=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,roughness:.9,alphaTest:.5,transparent:true}));
    paper.position.set(-3,4.4,0);g.add(paper);
    const dev=rbox(7,2.2,4,.6,mat.dark);dev.position.set(-3,-1.4,0);g.add(dev);
    const slot=box(5.4,.2,.3,M(0x0d1013));slot.position.set(-3,-.28,0);g.add(slot);
    const band=box(7.02,.3,4.02,mat.orange);band.position.set(-3,-2.2,0);g.add(band);
    const phases=[[2.2,0x0c5adb],[3.6,0xe8641c],[1.6,0x8d9399],[.9,0x2f6fb5]];
    phases.forEach(([h,col],i)=>{const b=rbox(1.6,h,1.6,.2,M(col));b.position.set(3+i*2,-2.5+h/2,0);g.add(b);});
    g.add(shadow(12,-2.6));
    return {group:g,cam:[7,4,26],target:[1,2,0]};
  }

  const viewers=[];
  function view(id,build){
    const canvas=document.getElementById(id);
    let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(e){const d=document.createElement('div');d.className='err';d.textContent='3D kræver WebGL, som ikke er slået til i denne browser.';canvas.replaceWith(d);return;}
    renderer.setPixelRatio(PR);renderer.setClearColor(0x000000,0);
    const scene=new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff,0x8a8f94,.85));
    const d1=new THREE.DirectionalLight(0xffffff,.85);d1.position.set(6,10,8);scene.add(d1);
    const d2=new THREE.DirectionalLight(0xffe2cc,.35);d2.position.set(-8,3,-5);scene.add(d2);
    const b=build();scene.add(b.group);
    const cam=new THREE.PerspectiveCamera(32,1,.1,300);cam.position.set(...b.cam);
    const ctl=new THREE.OrbitControls(cam,canvas);ctl.target.set(...b.target);ctl.enableDamping=true;ctl.enablePan=false;
    ctl.minDistance=10;ctl.maxDistance=50;ctl.autoRotate=!reduce;ctl.autoRotateSpeed=1.1;ctl.update();
    ctl.addEventListener('start',()=>{ctl.autoRotate=false;});
    const v={renderer,scene,cam,ctl,tick:b.tick,canvas,visible:true};
    let moved=false;ctl.addEventListener('start',()=>{moved=true;});
    const base=new THREE.Vector3(...b.cam).sub(new THREE.Vector3(...b.target));
    // Smalle eller kvadratiske felter: træk kameraet tilbage, så hele modellen er med.
    const size=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);cam.aspect=w/h;
      if(!moved){cam.position.copy(ctl.target).add(base.clone().multiplyScalar(Math.max(1,1.4/cam.aspect)));}
      cam.updateProjectionMatrix();};
    size();new ResizeObserver(size).observe(canvas);
    if('IntersectionObserver' in window){new IntersectionObserver(es=>{v.visible=es[0].isIntersecting;}).observe(canvas);}
    renderer.render(scene,cam);
    viewers.push(v);
  }
  [['m1',buildTavle],['m2',buildStik],['m3',buildVarme],['m4',buildPuls],['m5',buildGen],['m6',buildFugt],['m7',buildTor],['m8',buildStil],['m9',buildStro],['m10',buildCo2]]
    .forEach(([id,b])=>{if(document.getElementById(id))view(id,b);});
  const t0=performance.now();
  (function loop(){
    const t=(performance.now()-t0)/1000;
    viewers.forEach(v=>{if(!v.visible)return;v.tick&&v.tick(t);v.ctl.update();v.renderer.render(v.scene,v.cam);});
    requestAnimationFrame(loop);
  })();
})();
