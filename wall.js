/* =============================================================
   wall.js — one rAF drives every visible tile simulation
   ============================================================= */
(function(){
  const C = {
    ink:'#0b1526', muted:'#4e5d72', sub:'#8493a6', line:'#d2dae5',
    tile:'#f7f9fc', accent:'#1652f0', warm:'#ff5a1f', cyan:'#00a6a6'
  };
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 1. cicada tymbal: latching buckling wave ---------------- */
  function cicada(){
    const N=16, K=2.32, R1=5, lam2=.05, ze=.18;
    let U,V,t,F,phase,t0,buck;
    const R2=()=>1.5+Math.sqrt(Math.max(0,1-4*(K-2)))/2;
    function reset(){U=new Float64Array(N);V=new Float64Array(N);t=0;F=0;phase='up';t0=0;buck=new Array(N).fill(false);}
    reset();
    const bar=()=>{const q=K-2-F,p=K-3;
      if(4*p*p*p+27*q*q>0)return .9;
      const m=2*Math.sqrt(-p/3),a=Math.max(-1,Math.min(1,(3*q)/(2*p)*Math.sqrt(-3/p)));
      return [0,1,2].map(k=>m*Math.cos(Math.acos(a)/3-2*Math.PI*k/3)+1).sort((x,y)=>x-y)[1];};
    return {
      step(dt){
        if(phase==='up'){F=.42*Math.min(1,t/2.5); if(t>=2.5){phase='nuc';t0=t;}}
        else if(phase==='nuc'){F=.42; if(t-t0>=1.2)phase='hold';}
        else if(phase==='hold'){F=.42; if(buck[N-1]){phase='rel';t0=t;}}
        else {F=0; if(t-t0>3.2) reset();}
        const b=bar();
        for(let j=0;j<N;j++){
          const l=j>0?U[j-1]:U[j], r=j<N-1?U[j+1]:U[j];
          const sp=j<2?.9:0;
          V[j]+=(-(ze+sp)*V[j]+3*U[j]*U[j]-U[j]*U[j]*U[j]-K*U[j]+R1*(l-2*U[j]+r)+F)*dt;
        }
        for(let j=0;j<N;j++){U[j]+=V[j]*dt; if(!isFinite(U[j])){reset();return;}}
        if(phase==='nuc'){const f=(t-t0)/1.2;U[0]=2.6*f;V[0]=2.6/1.2;}
        for(let j=0;j<N;j++) buck[j]=U[j]>b;
        t+=dt;
      },
      draw(g,w,h){
        g.fillStyle=C.tile;g.fillRect(0,0,w,h);
        const pad=w*.10, gap=(w-pad*2)/(N-1), base=h*.74, sc=h*.16;
        g.strokeStyle='rgba(11,21,38,.10)';g.lineWidth=1;
        g.beginPath();g.moveTo(pad,base);g.lineTo(w-pad,base);g.stroke();
        for(let j=0;j<N;j++){
          const x=pad+gap*j, v=Math.max(-.6,Math.min(2.4,U[j]));
          g.strokeStyle=buck[j]?C.warm:'rgba(22,82,240,.45)';
          g.lineWidth=Math.max(4,w*.017);g.lineCap='round';
          g.beginPath();g.moveTo(x,base);g.lineTo(x,base-v*sc);g.stroke();
        }
        g.fillStyle='rgba(255,90,31,.22)';g.fillRect(pad,h*.86,(w-pad*2)*(F/.42),3);
      }};
  }

  /* ---------------- 2. asymmetric double well ---------------- */
  function well(){
    const lam=.15,K=lam+2,b=.05;
    let u=.2,v=0,S=.2,t=0;
    const P=uu=>Math.pow(uu,4)/4-Math.pow(uu,3)+K*uu*uu/2;
    return {
      step(dt){
        const a=-(u*u*u)+3*u*u-2*u-lam*S+.55*Math.cos(1.0*t);
        v+=a*dt;u+=v*dt;S+=(-S+u+v/(1-b))*dt;t+=dt;
        if(!isFinite(u)||Math.abs(u)>8){u=.2;v=0;S=.2;}
      },
      draw(g,w,h){
        g.fillStyle=C.tile;g.fillRect(0,0,w,h);
        const X0=w*.16,SC=w*.24,BASE=h*.78,VS=h*.42;
        g.strokeStyle=C.accent;g.lineWidth=Math.max(2,w*.006);g.beginPath();
        for(let i=0;i<=140;i++){
          const uu=-.7+3.3*i/140, x=X0+uu*SC, y=BASE-P(uu)*VS;
          i?g.lineTo(x,y):g.moveTo(x,y);
        } g.stroke();
        const uc=Math.max(-.7,Math.min(2.6,u));
        g.fillStyle=uc>1.18?C.warm:C.accent;
        g.beginPath();g.arc(X0+uc*SC,BASE-P(uc)*VS,Math.max(5,w*.022),0,7);g.fill();
      }};
  }

  /* ---------------- 3. von Mises truss + phase trace ---------------- */
  function truss(){
    const K=2.15,b=.30;
    let U=.3,Ud=0,S=.3,t=0;const tr=[];
    return {
      step(dt){
        const a=-(U*U*U)+3*U*U-2*U-.15*S+.45*Math.cos(.8*t);
        Ud+=a*dt;U+=Ud*dt;S+=(-S+U+Ud/(1-b))*dt;t+=dt;
        if(!isFinite(U)||Math.abs(U)>9){U=.3;Ud=0;S=.3;tr.length=0;}
        tr.push([U,Ud]); if(tr.length>420)tr.shift();
      },
      draw(g,w,h){
        g.fillStyle=C.tile;g.fillRect(0,0,w,h);
        // truss, upper half
        const SL=h*.40,SXL=w*.24,SXR=w*.62,APX=w*.43,H=h*.15,R2=1.816;
        let off=H*(1-2*Math.max(-.9,Math.min(2.9,U))/R2);
        off=Math.max(-H*1.7,Math.min(H*1.7,off));
        g.strokeStyle='rgba(11,21,38,.18)';g.lineWidth=1;g.setLineDash([4,4]);
        g.beginPath();g.moveTo(SXL-w*.05,SL);g.lineTo(SXR+w*.05,SL);g.stroke();g.setLineDash([]);
        g.strokeStyle=C.ink;g.lineWidth=Math.max(3,w*.011);g.lineJoin='round';
        g.beginPath();g.moveTo(SXL,SL);g.lineTo(APX,SL-off);g.lineTo(SXR,SL);g.stroke();
        g.fillStyle=U>1.18?C.warm:C.accent;
        g.beginPath();g.arc(APX,SL-off,Math.max(5,w*.020),0,7);g.fill();
        // phase portrait, lower right
        const cx=w*.72,cy=h*.70,sx=w*.10,sy=h*.055;
        g.strokeStyle='rgba(11,21,38,.10)';g.lineWidth=1;
        g.beginPath();g.moveTo(cx-w*.16,cy);g.lineTo(cx+w*.22,cy);
        g.moveTo(cx,cy-h*.22);g.lineTo(cx,cy+h*.22);g.stroke();
        g.lineWidth=1.2;
        for(let i=1;i<tr.length;i++){
          g.strokeStyle=`rgba(255,90,31,${(i/tr.length)*.6})`;
          g.beginPath();
          g.moveTo(cx+tr[i-1][0]*sx,cy-tr[i-1][1]*sy);
          g.lineTo(cx+tr[i][0]*sx,cy-tr[i][1]*sy);g.stroke();
        }
      }};
  }

  /* ---------------- 4. insert lattice, island growth ---------------- */
  function lattice(){
    const R=19,Cc=11,V=[],IDX={};
    for(let r=0;r<R;r++)for(let c=0;c<Cc;c++)if((r+c)%2===0){IDX[r+'_'+c]=V.length;V.push([r,c]);}
    const ADJ=V.map(([r,c])=>{const o=[];
      [[-1,-1],[-1,1],[1,-1],[1,1],[0,-2],[0,2],[-2,0],[2,0]].forEach(([dr,dc])=>{
        const rr=r+dr,cc=c+dc;
        if(rr>=0&&rr<R&&cc>=0&&cc<Cc&&(rr+cc)%2===0)o.push(IDX[rr+'_'+cc]);});
      return o;});
    const TWO=ADJ.map((a,i)=>{const s=new Set([i]);a.forEach(j=>{s.add(j);ADJ[j].forEach(k=>s.add(k));});return [...s];});
    const N=V.length;
    let st,own,cl,blk,phase,hold,target;
    function reset(){st=new Uint8Array(N);own=new Int16Array(N).fill(-1);cl=[];blk=new Set();phase='seed';hold=0;target=58;}
    reset();
    function frontier(ci){
      const f=new Set();
      cl[ci].forEach(j=>ADJ[j].forEach(m=>{
        if(st[m])return;let ok=true;
        ADJ[m].forEach(x=>{if(st[x]&&own[x]!==ci)ok=false;});
        if(ok)f.add(m);}));
      return [...f];
    }
    let acc=0;
    return {
      step(dt){
        acc+=dt; if(acc<.055)return; acc=0;
        if(phase==='seed'){
          if(cl.length>=9){phase='grow';return;}
          const pool=[];for(let i=0;i<N;i++)if(!blk.has(i)&&!st[i])pool.push(i);
          if(!pool.length){phase='grow';return;}
          const p=pool[(Math.random()*pool.length)|0];
          st[p]=1;own[p]=cl.length;cl.push([p]);TWO[p].forEach(x=>blk.add(x));
        } else if(phase==='grow'){
          let tot=0;for(let i=0;i<N;i++)tot+=st[i];
          if(tot>=target){phase='hold';return;}
          const ci=(Math.random()*cl.length)|0;
          const f=frontier(ci); if(!f.length)return;
          const p=f[(Math.random()*f.length)|0];
          st[p]=1;own[p]=ci;cl[ci].push(p);
        } else { hold+=.055; if(hold>2.4) reset(); }
      },
      draw(g,w,h){
        g.fillStyle=C.tile;g.fillRect(0,0,w,h);
        const S=Math.min(w/(Cc*1.45),h/(R*1.15))*.62;
        const DX=S*2.05,DY=S*2.0;
        const X0=(w-DX*(Cc-1))/2, Y0=(h-DY*(R-1))/2;
        V.forEach(([r,c],i)=>{
          const x=X0+c*DX,y=Y0+r*DY;
          g.beginPath();g.moveTo(x,y-S);g.lineTo(x+S,y);g.lineTo(x,y+S);g.lineTo(x-S,y);g.closePath();
          if(st[i]){g.fillStyle=`hsl(${(own[i]*47)%360} 68% 56%)`;g.fill();}
          else {g.fillStyle='#fff';g.fill();g.strokeStyle='rgba(11,21,38,.14)';g.lineWidth=1;g.stroke();}
        });
      }};
  }

  /* ---------------- 5. reservoir chain ---------------- */
  function reservoir(){
    const N=20,De=1,lam=.2,be=.5,R1=2,Om=2.5,F0=.1;
    const mask=[];for(let i=0;i<N;i++)mask.push(Math.random()<.5?1:0);
    let X=new Float64Array(N),V=new Float64Array(N),S=new Float64Array(N),t=0;
    return {
      step(dt){
        const u=Math.sin(.37*t)+.6*Math.sin(.91*t+1.1);
        for(let j=0;j<N;j++){
          const l=j>0?X[j-1]:X[j],r=j<N-1?X[j+1]:X[j];
          V[j]+=De*De*(-(X[j]*X[j]*X[j])+3*X[j]*X[j]-2*X[j]-lam*S[j]+R1*(l-2*X[j]+r)
                +F0*Math.cos(Om*t)*(1+mask[j]*u))*dt;
        }
        for(let j=0;j<N;j++){X[j]+=V[j]*dt;S[j]+=(V[j]/(1-be)+X[j]-S[j])*dt;
          if(!isFinite(X[j])){X[j]=0;V[j]=0;S[j]=0;}}
        t+=dt;
      },
      draw(g,w,h){
        g.fillStyle=C.tile;g.fillRect(0,0,w,h);
        const pad=w*.09,gap=(w-pad*2)/(N-1),cy=h*.50,sc=h*.15;
        g.strokeStyle='rgba(11,21,38,.10)';g.lineWidth=1;
        g.beginPath();g.moveTo(pad,cy);g.lineTo(w-pad,cy);g.stroke();
        for(let j=0;j<N;j++){
          const x=pad+gap*j,y=cy-Math.max(-2.2,Math.min(2.6,X[j]))*sc;
          g.strokeStyle='rgba(11,21,38,.13)';g.lineWidth=1.4;
          g.beginPath();g.moveTo(x,cy);g.lineTo(x,y);g.stroke();
          g.fillStyle=mask[j]?C.warm:C.accent;
          g.beginPath();g.arc(x,y,Math.max(3.4,w*.014),0,7);g.fill();
        }
      }};
  }

  /* ---------------- 6. clutch stick-slip ---------------- */
  function clutch(){
    const MUS=.40,MUK=.22,VS=.25,vb=.35,ze=.03;
    let x=0,v=vb,t=0,stick=true;const wv=[];
    const mu=vr=>MUK+(MUS-MUK)*Math.exp(-Math.abs(vr)/VS);
    return {
      step(dt){
        const vr=vb-v;
        if(stick){v=vb;const need=x+2*ze*vb;if(Math.abs(need)>MUS)stick=false;else x+=v*dt;}
        if(!stick){
          const F=Math.abs(vr)>1e-9?Math.sign(vr)*mu(vr):0;
          v+=(-2*ze*v-x+F)*dt;x+=v*dt;
          if(Math.abs(vb-v)<2.5e-3&&Math.abs(x+2*ze*vb)<=MUS){stick=true;v=vb;}
        }
        t+=dt; if(!isFinite(x)||Math.abs(x)>30){x=0;v=vb;stick=true;wv.length=0;}
        wv.push(v); if(wv.length>320)wv.shift();
      },
      draw(g,w,h){
        g.fillStyle=C.tile;g.fillRect(0,0,w,h);
        const cy=h*.34,bw=w*.16,bh=h*.14;
        // belt
        g.fillStyle='rgba(11,21,38,.06)';g.fillRect(w*.08,cy+bh*.9,w*.84,h*.09);
        g.strokeStyle='rgba(11,21,38,.20)';g.lineWidth=1.6;
        for(let i=0;i<14;i++){
          const px=w*.08+(((i*w*.07)+t*vb*w*.10)%(w*.84));
          g.beginPath();g.moveTo(px,cy+bh*.95);g.lineTo(px+w*.022,cy+bh*.9+h*.085);g.stroke();
        }
        const bx=w*.48+x*w*.13;
        g.strokeStyle='rgba(11,21,38,.35)';g.lineWidth=1.6;
        g.beginPath();g.moveTo(w*.08,cy);
        for(let i=1;i<10;i++)g.lineTo(w*.08+((bx-bw/2)-w*.08)*i/10,cy+(i%2?h*.024:-h*.024));
        g.lineTo(bx-bw/2,cy);g.stroke();
        g.fillStyle=stick?C.warm:C.accent;
        g.fillRect(bx-bw/2,cy-bh/2,bw,bh);
        // waveform
        const wy=h*.76,span=w*.84;
        g.strokeStyle='rgba(11,21,38,.10)';g.lineWidth=1;
        g.beginPath();g.moveTo(w*.08,wy);g.lineTo(w*.92,wy);g.stroke();
        g.strokeStyle=C.warm;g.lineWidth=Math.max(1.6,w*.005);g.beginPath();
        for(let i=0;i<wv.length;i++){
          const px=w*.08+(i/320)*span, py=wy-wv[i]*h*.10;
          i?g.lineTo(px,py):g.moveTo(px,py);
        } g.stroke();
      }};
  }

  /* ---------------- 7. auditorium airflow ---------------- */
  function airflow(){
    const NX=52,NY=26,N=NX*NY,IX=(i,j)=>i+j*NX;
    const u=new Float32Array(N),v=new Float32Array(N),T=new Float32Array(N);
    const u0=new Float32Array(N),v0=new Float32Array(N),T0=new Float32Array(N);
    const pr=new Float32Array(N),dg=new Float32Array(N),sol=new Uint8Array(N);
    const fj=new Int32Array(NX),cj=new Int32Array(NX);
    for(let i=0;i<NX;i++){const f=i/(NX-1);
      fj[i]=Math.round(NY-2-Math.pow(f,1.12)*.44*NY);cj[i]=1;}
    for(let i=0;i<NX;i++)for(let j=0;j<NY;j++)
      sol[IX(i,j)]=(j>fj[i]||j<cj[i]||i===0||i===NX-1)?1:0;
    function smp(f,x,y){
      x=Math.max(.5,Math.min(NX-1.5,x));y=Math.max(.5,Math.min(NY-1.5,y));
      const i=x|0,j=y|0,s=x-i,tt=y-j;
      return (1-s)*((1-tt)*f[IX(i,j)]+tt*f[IX(i,j+1)])+s*((1-tt)*f[IX(i+1,j)]+tt*f[IX(i+1,j+1)]);
    }
    function adv(d,s,dt){for(let j=1;j<NY-1;j++)for(let i=1;i<NX-1;i++){
      const k=IX(i,j);if(sol[k]){d[k]=0;continue;}
      d[k]=smp(s,i-u[k]*dt*NX*.02,j-v[k]*dt*NY*.05);}}
    return {
      step(dt){
        for(let i=2;i<NX-2;i+=2){
          const k=IX(i,fj[i]-1);if(!sol[k]){T[k]+=1.9*dt;v[k]-=.7*dt;}
        }
        for(let i=Math.floor(NX*.2);i<NX*.95;i+=3){
          const k=IX(i,fj[i]-1);if(!sol[k]){T[k]+=(-3-T[k])*2.4*dt;v[k]-=.5*dt;}
        }
        for(let i=Math.floor(NX*.3);i<NX*.85;i++){const k=IX(i,cj[i]+1);if(!sol[k])v[k]-=1.3*dt;}
        for(let j=1;j<NY-1;j++)for(let i=1;i<NX-1;i++){
          const k=IX(i,j);if(sol[k])continue;
          v[k]-=.55*T[k]*dt;u[k]*=.993;v[k]*=.993;T[k]*=(1-.004*dt);
        }
        u0.set(u);v0.set(v);T0.set(T);
        adv(u,u0,dt);adv(v,v0,dt);
        for(let j=1;j<NY-1;j++)for(let i=1;i<NX-1;i++){
          const k=IX(i,j);
          dg[k]=sol[k]?0:-.5*((u[IX(i+1,j)]-u[IX(i-1,j)])+(v[IX(i,j+1)]-v[IX(i,j-1)]));pr[k]=0;}
        for(let s=0;s<10;s++)for(let j=1;j<NY-1;j++)for(let i=1;i<NX-1;i++){
          const k=IX(i,j);if(sol[k]){pr[k]=0;continue;}
          pr[k]=(dg[k]+pr[IX(i-1,j)]+pr[IX(i+1,j)]+pr[IX(i,j-1)]+pr[IX(i,j+1)])*.25;}
        for(let j=1;j<NY-1;j++)for(let i=1;i<NX-1;i++){
          const k=IX(i,j);if(sol[k]){u[k]=0;v[k]=0;continue;}
          u[k]-=.5*(pr[IX(i+1,j)]-pr[IX(i-1,j)]);v[k]-=.5*(pr[IX(i,j+1)]-pr[IX(i,j-1)]);}
        adv(T,T0,dt);
        for(let j=1;j<NY-1;j++)for(let i=1;i<NX-1;i++){
          const k=IX(i,j);if(sol[k])continue;
          T[k]=T[k]*.94+.015*(T[IX(i-1,j)]+T[IX(i+1,j)]+T[IX(i,j-1)]+T[IX(i,j+1)]);}
      },
      draw(g,w,h){
        g.fillStyle=C.tile;g.fillRect(0,0,w,h);
        const cw=w/NX+1, ch=h/NY+1;
        for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){
          const k=IX(i,j);if(sol[k])continue;
          const s=Math.max(-1,Math.min(1,T[k]/2.4));
          let r,gg,b;
          if(s<0){const a=-s;r=238-178*a;gg=242-132*a;b=248-28*a;}
          else{const a=s;r=238+17*a;gg=242-122*a;b=248-198*a;}
          g.fillStyle=`rgb(${r|0},${gg|0},${b|0})`;
          g.fillRect(i*w/NX,j*h/NY,cw,ch);
        }
        g.strokeStyle='rgba(11,21,38,.42)';g.lineWidth=Math.max(1.6,w*.005);g.lineJoin='round';
        g.beginPath();g.moveTo(0,cj[0]*h/NY);
        for(let i=0;i<NX;i++)g.lineTo(i*w/NX,cj[i]*h/NY);
        for(let i=NX-1;i>=0;i--)g.lineTo(i*w/NX,fj[i]*h/NY);
        g.stroke();
        g.fillStyle='rgba(255,90,31,.7)';
        for(let s=0;s<10;s++){
          const i=Math.floor(NX*.22+(s/9)*NX*.7);
          g.beginPath();g.arc(i*w/NX,(fj[i]-1.4)*h/NY,Math.max(2.4,w*.009),0,7);g.fill();
        }
      }};
  }

  /* ---------------- 8. targeting robot ---------------- */
  function robot(){
    const WP=[[.06,.74],[.18,.42],[.34,.24],[.50,.32],[.61,.58],[.74,.74],[.86,.54],[.96,.28]];
    function cat(p,n){const P=[p[0],...p,p[p.length-1],p[p.length-1]],o=[],per=Math.floor(n/(P.length-3));
      for(let i=0;i<P.length-3;i++){const[a,b,c,d]=[P[i],P[i+1],P[i+2],P[i+3]];
        for(let s=0;s<per;s++){const t=s/per,t2=t*t,t3=t2*t;
          o.push([.5*(2*b[0]+(-a[0]+c[0])*t+(2*a[0]-5*b[0]+4*c[0]-d[0])*t2+(-a[0]+3*b[0]-3*c[0]+d[0])*t3),
                  .5*(2*b[1]+(-a[1]+c[1])*t+(2*a[1]-5*b[1]+4*c[1]-d[1])*t2+(-a[1]+3*b[1]-3*c[1]+d[1])*t3)]);}}
      return o;}
    const CV=cat(WP,300);
    const SPEC=[[.13,1,.9],[.27,-1,1.5],[.42,1,2.2],[.56,-1,1.1],[.70,1,2.4],[.86,-1,1.7]];
    let u=0,shots=[],bs=[];
    const at=t=>{const i=Math.max(0,Math.min(CV.length-2,Math.floor(t*(CV.length-1))));
      const p=CV[i],q=CV[i+1];let dx=q[0]-p[0],dy=q[1]-p[1];const L=Math.hypot(dx,dy)||1e-9;
      return {p,t:[dx/L,dy/L]};};
    function layout(w,h){
      const MPP=w*.055;
      bs=SPEC.map(([t,sd,off])=>{const{p,tt=null}=at(t);const a=at(t);
        return {x:(a.p[0]*w)+(-a.t[1]*sd)*off*MPP, y:(a.p[1]*h)+(a.t[0]*sd)*off*MPP, st:'idle', off};});
    }
    let W0=0,H0=0;
    return {
      step(dt){
        u+=.055*dt*3; if(u>=1){u=0;bs.forEach(b=>b.st='idle');}
        if(!bs.length||!W0)return;
        const a=at(u),rx=a.p[0]*W0,ry=a.p[1]*H0,MPP=W0*.055;
        bs.forEach(b=>{
          if(b.st!=='idle')return;
          const dx=b.x-rx,dy=b.y-ry,d=Math.hypot(dx,dy)/MPP;
          const ang=Math.abs(Math.atan2(dx*a.t[1]-dy*a.t[0],dx*a.t[0]+dy*a.t[1]));
          if(d<=2.6&&ang<Math.PI/3){
            const g2=9.81,v0=5,disc=Math.pow(v0,4)-g2*g2*d*d+2*g2*.35*v0*v0;
            if(disc<0){b.st='far';return;}
            const th=Math.atan((v0*v0-Math.sqrt(disc))/(g2*d));
            const va=v0*(1+(Math.random()*.10-.05));
            const dd=Math.pow(va*Math.sin(th),2)+2*g2*.35;
            const tof=(va*Math.sin(th)+Math.sqrt(dd))/g2;
            shots.push({x0:rx,y0:ry,ux:dx/(d*MPP),uy:dy/(d*MPP),land:va*Math.cos(th)*tof,tof,t:0,b,d,MPP});
            b.st='fire';
          }});
        shots.forEach(s=>{s.t+=dt;
          if(s.t>=s.tof&&s.b.st==='fire') s.b.st=Math.abs(s.land-s.d)<.16?'hit':'miss';});
        shots=shots.filter(s=>s.t<s.tof+.4);
      },
      draw(g,w,h){
        if(w!==W0||h!==H0){W0=w;H0=h;layout(w,h);}
        g.fillStyle=C.tile;g.fillRect(0,0,w,h);
        g.strokeStyle='rgba(11,21,38,.10)';g.lineWidth=Math.max(7,w*.028);g.lineCap='round';g.lineJoin='round';
        g.beginPath();CV.forEach((p,i)=>i?g.lineTo(p[0]*w,p[1]*h):g.moveTo(p[0]*w,p[1]*h));g.stroke();
        g.strokeStyle='rgba(22,82,240,.55)';g.lineWidth=Math.max(1.4,w*.005);g.setLineDash([7,6]);
        g.beginPath();CV.forEach((p,i)=>i?g.lineTo(p[0]*w,p[1]*h):g.moveTo(p[0]*w,p[1]*h));g.stroke();
        g.setLineDash([]);
        bs.forEach(b=>{
          g.strokeStyle=b.st==='hit'?C.cyan:b.st==='miss'?'#e11d48':b.st==='far'?C.sub:C.warm;
          g.lineWidth=Math.max(1.8,w*.006);
          g.beginPath();g.ellipse(b.x,b.y,w*.017,w*.011,0,0,7);g.stroke();
        });
        const a=at(u),rx=a.p[0]*w,ry=a.p[1]*h;
        shots.forEach(s=>{const f=Math.min(1,s.t/s.tof),d=s.land*f*s.MPP;
          const x=s.x0+s.ux*d,y=s.y0+s.uy*d,hg=Math.sin(Math.PI*f)*s.land*s.MPP*.18;
          g.fillStyle=C.warm;g.beginPath();g.arc(x,y-hg,Math.max(2.6,w*.010),0,7);g.fill();});
        g.save();g.translate(rx,ry);g.rotate(Math.atan2(a.t[1],a.t[0]));
        g.fillStyle=C.accent;g.fillRect(-w*.021,-w*.015,w*.042,w*.030);g.restore();
      }};
  }

  /* ---------------- 9. vehicle + trailer yaw ---------------- */
  function trailer(){
    let t=0;const path=[];let hitch=0,hv=0;
    return {
      step(dt){
        t+=dt;
        const steer=.55*Math.sin(.7*t)+.25*Math.sin(1.9*t+1);
        hv+=(-2.2*hitch-1.1*hv+2.4*steer)*dt; hitch+=hv*dt;
        if(!isFinite(hitch)){hitch=0;hv=0;}
        path.push([t,steer,hitch]); if(path.length>360)path.shift();
      },
      draw(g,w,h){
        g.fillStyle=C.tile;g.fillRect(0,0,w,h);
        // plan view: tractor + trailer following a sinusoid
        const cy=h*.34, x=w*.5;
        const ang=.5*Math.sin(.7*t);
        g.save();g.translate(x,cy);g.rotate(ang*.35);
        g.fillStyle=C.accent;g.fillRect(-w*.03,-h*.045,w*.16,h*.09);
        g.strokeStyle=C.ink;g.lineWidth=1.6;g.strokeRect(-w*.03,-h*.045,w*.16,h*.09);
        g.rotate(hitch*.5);
        g.fillStyle='rgba(22,82,240,.35)';g.fillRect(-w*.30,-h*.038,w*.27,h*.076);
        g.strokeRect(-w*.30,-h*.038,w*.27,h*.076);
        g.restore();
        // traces
        const wy=h*.76,span=w*.84;
        g.strokeStyle='rgba(11,21,38,.10)';g.lineWidth=1;
        g.beginPath();g.moveTo(w*.08,wy);g.lineTo(w*.92,wy);g.stroke();
        const plot=(idx,col,lw)=>{g.strokeStyle=col;g.lineWidth=lw;g.beginPath();
          for(let i=0;i<path.length;i++){
            const px=w*.08+(i/360)*span,py=wy-path[i][idx]*h*.13;
            i?g.lineTo(px,py):g.moveTo(px,py);} g.stroke();};
        plot(1,'rgba(11,21,38,.30)',Math.max(1.4,w*.004));
        plot(2,C.warm,Math.max(1.8,w*.006));
      }};
  }

  /* ---------------- registry ---------------- */
  const TILES=[
    {t:'The tymbal of a cicada',      k:'Nature Communications 2025',       href:'project-cicada-tymbal.html',     mk:cicada},
    {t:'Exploiting bistability and viscoelasticity', k:'Reservoir computing',href:'project-nonlinear-dynamics.html',mk:well},
    {t:'The viscoelastic von Mises truss', k:'Chaos in a jerk system',       href:'project-vonmises-truss.html',    mk:truss},
    {t:'Programmable metamaterials',   k:'Inverse design',                   href:'project-metamaterials.html',     mk:lattice},
    {t:'Reservoir computing, soldered onto a board', k:'IDETC 2026',         href:'project-analog-hardware.html',   mk:reservoir},
    {t:'Robust control of clutch squawk', k:'Patent pending',                href:'project-clutch-control.html',    mk:clutch},
    {t:'HVAC for a three-screen multiplex', k:'Airflow and psychrometrics',  href:'project-hvac-multiplex.html',    mk:airflow},
    {t:'Object-targeting robot',       k:'Ballistics and detection',         href:'project-autonomous-robot.html',  mk:robot},
    {t:'Vehicle and trailer dynamics', k:'Yaw stability',                    href:'project-vehicle-trailer.html',   mk:trailer}
  ];

  const wall=document.querySelector('.wall');
  if(!wall) return;
  const live=[];
  TILES.forEach(spec=>{
    const a=document.createElement('a');
    a.className='tile'; a.href=spec.href;
    a.innerHTML='<canvas></canvas><div class="tile__veil"></div><div class="tile__ring"></div>'
      +'<span class="tile__live"></span><div class="tile__meta">'
      +`<div class="tile__t">${spec.t}</div><div class="tile__k">${spec.k}</div></div>`;
    wall.appendChild(a);
    const cv=a.querySelector('canvas');
    const g=cv.getContext('2d');
    const rec={el:a,cv,g,sim:spec.mk(),vis:false,hot:false,w:0,h:0};
    a.addEventListener('pointerenter',()=>rec.hot=true);
    a.addEventListener('pointerleave',()=>rec.hot=false);
    live.push(rec);
  });

  function size(r){
    const dpr=Math.min(devicePixelRatio||1,1.6);
    const b=r.el.getBoundingClientRect();
    const w=Math.max(1,Math.round(b.width)),h=Math.max(1,Math.round(b.height));
    if(w===r.w&&h===r.h)return;
    r.w=w;r.h=h;r.cv.width=w*dpr;r.cv.height=h*dpr;
    r.g.setTransform(dpr,0,0,dpr,0,0);
  }
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    const r=live.find(x=>x.el===e.target); if(r) r.vis=e.isIntersecting;
  }),{rootMargin:'120px'});
  live.forEach(r=>io.observe(r.el));
  addEventListener('resize',()=>live.forEach(r=>{r.w=0;size(r);}),{passive:true});

  let last=performance.now();
  (function loop(now){
    requestAnimationFrame(loop);
    const dtr=Math.min((now-last)/1000,.05); last=now;
    if(REDUCE){ live.forEach(r=>{ if(r.vis){size(r); r.sim.draw(r.g,r.w,r.h);} }); return; }
    live.forEach(r=>{
      if(!r.vis) return;
      size(r);
      const n=r.hot?3:1;
      for(let s=0;s<n;s++) r.sim.step(dtr*(r.hot?1.0:0.85));
      r.sim.draw(r.g,r.w,r.h);
    });
  })(performance.now());
})();
