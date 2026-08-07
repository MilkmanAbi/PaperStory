/* =====================================================================
   Fireflies — ambient warm-light swarm.
   Adapted from Sage-Playground (app.js firefly canvas + delight.js release).
   Gentle upward drift, curious about the pointer, click to release a few.
   Palette & density are configurable so each chapter can set its mood.
   ===================================================================== */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PALETTES = {
    // warm-white dominant, a few cool sparks — the neutral "cozy night"
    cozy: [
      [255,236,188],[255,226,160],[255,244,214],[255,236,188],[255,226,160],
      [196,169,228],[156,196,232],[168,216,188],[230,169,204]
    ],
    // chapter I (cat / Aoi / night) — cool moonlit lilac & blue, sparse warm
    moon: [
      [206,214,246],[176,196,238],[224,232,255],[196,169,228],[176,196,238],
      [156,186,232],[255,244,214]
    ],
    // chapter II (fox / Luna / evening) — warm amber & honey
    ember: [
      [255,214,150],[248,196,120],[255,232,190],[240,178,96],[255,214,150],
      [255,240,206],[236,170,120]
    ],
    // chapter III (both / warm intimate) — rose-gold, honey, a little lilac
    hearth: [
      [255,220,178],[244,180,150],[255,236,206],[232,150,168],[255,214,150],
      [214,178,224],[255,240,214]
    ]
  };

  function make(opts) {
    opts = opts || {};
    var canvas = opts.canvas;
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, flies = [], raf = null;
    var pointer = { x:0, y:0, active:false };
    var palette = PALETTES[opts.palette] || PALETTES.cozy;
    var densFactor = opts.density != null ? opts.density : 1;
    var curious = opts.curious !== false; // fireflies drift toward the cursor

    function count() {
      var base = window.innerWidth < 480 ? 20 : (window.innerWidth < 768 ? 32 : 50);
      return Math.round(base * densFactor);
    }

    function Fly(init){ this.reset(init); }
    Fly.prototype.reset = function (init) {
      this.x = Math.random()*W;
      this.y = init ? H*(1-Math.pow(Math.random(),1.7)) : H+20+Math.random()*40;
      this.vy = -(0.16+Math.random()*0.42);
      this.vx = (Math.random()-0.5)*0.14;
      this.phase = Math.random()*Math.PI*2;
      this.driftF = 0.008+Math.random()*0.018;
      this.driftA = 0.5+Math.random()*1.4;
      this.size = 1.0+Math.random()*2.1;
      this.glow = this.size*(7+Math.random()*9);
      this.baseOp = 0.38+Math.random()*0.5;
      this.opacity = 0;
      this.blinkP = Math.random()*Math.PI*2;
      this.blinkS = 0.02+Math.random()*0.05;
      this.life = 0; this.curious = 0; this.flash = 0;
      var c = palette[(Math.random()*palette.length)|0];
      this.r=c[0]; this.g=c[1]; this.b=c[2];
    };
    Fly.prototype.update = function () {
      this.life++;
      var fadeIn = Math.min(1, this.life/55);
      var yr = this.y/H;
      var heightFade = Math.pow(Math.max(0,Math.min(1,yr*1.12)),0.9);
      var blink = 0.6+0.4*Math.sin(this.blinkP+this.life*this.blinkS);
      this.opacity = this.baseOp*fadeIn*heightFade*blink;
      if (curious && pointer.active) {
        var pdx=pointer.x-this.x, pdy=pointer.y-this.y, pd=Math.sqrt(pdx*pdx+pdy*pdy), R=150;
        if (pd<R){ var k=1-pd/R; this.x+=(pdx/(pd||1))*k*0.5; this.y+=(pdy/(pd||1))*k*0.5; if(k>this.curious)this.curious=k; }
      }
      if (this.curious>0.001){ this.opacity=Math.min(1,this.opacity*(1+this.curious*1.1)); this.curious*=0.93; }
      if (this.flash>0.001){ this.opacity=Math.min(1,this.opacity+this.flash*0.7); this.flash*=0.95; }
      this.x += this.vx + Math.sin(this.phase+this.life*this.driftF)*this.driftA*0.1;
      this.y += this.vy;
      if (this.y<-30) this.reset(false);
    };
    Fly.prototype.draw = function () {
      if (this.opacity<0.01) return;
      var x=this.x,y=this.y,r=this.r,g=this.g,b=this.b,op=this.opacity;
      var og=ctx.createRadialGradient(x,y,0,x,y,this.glow);
      og.addColorStop(0,'rgba('+r+','+g+','+b+','+(op*0.6)+')');
      og.addColorStop(0.45,'rgba('+r+','+g+','+b+','+(op*0.16)+')');
      og.addColorStop(1,'rgba('+r+','+g+','+b+',0)');
      ctx.beginPath(); ctx.arc(x,y,this.glow,0,Math.PI*2); ctx.fillStyle=og; ctx.fill();
      var cg=ctx.createRadialGradient(x,y,0,x,y,this.size*2);
      cg.addColorStop(0,'rgba(255,250,240,'+Math.min(1,op*1.5)+')');
      cg.addColorStop(0.5,'rgba('+r+','+g+','+b+','+op+')');
      cg.addColorStop(1,'rgba('+r+','+g+','+b+',0)');
      ctx.beginPath(); ctx.arc(x,y,this.size*2,0,Math.PI*2); ctx.fillStyle=cg; ctx.fill();
    };

    function resize(){
      W=window.innerWidth; H=window.innerHeight;
      canvas.width=W*dpr; canvas.height=H*dpr;
      canvas.style.width=W+'px'; canvas.style.height=H+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      flies=[]; var n=count(); for(var i=0;i<n;i++) flies.push(new Fly(true));
    }
    function loop(){
      ctx.clearRect(0,0,W,H); ctx.globalCompositeOperation='lighter';
      for(var i=0;i<flies.length;i++){ flies[i].update(); flies[i].draw(); }
      ctx.globalCompositeOperation='source-over';
      raf=window.requestAnimationFrame(loop);
    }
    function drawStatic(){
      ctx.clearRect(0,0,W,H); ctx.globalCompositeOperation='lighter';
      for(var i=0;i<flies.length;i++){ flies[i].opacity=flies[i].baseOp*0.85; flies[i].draw(); }
      ctx.globalCompositeOperation='source-over';
    }

    if (curious){
      window.addEventListener('pointermove',function(e){ pointer.x=e.clientX; pointer.y=e.clientY; pointer.active=true; },{passive:true});
      window.addEventListener('pointerout',function(e){ if(!e.relatedTarget) pointer.active=false; });
      window.addEventListener('blur',function(){ pointer.active=false; });
    }

    function pickDim(n){ return flies.slice().sort(function(a,b){return a.opacity-b.opacity;}).slice(0,n); }
    function release(o){
      o=o||{}; var n=Math.min(o.count||6, flies.length);
      pickDim(n).forEach(function(f){
        if (o.x!=null){ f.x=o.x+(Math.random()-0.5)*26; f.y=o.y+(Math.random()-0.5)*18;
          f.vy=-(0.5+Math.random()*0.7); f.vx=(Math.random()-0.5)*0.6; f.size=1.5+Math.random()*1.6; f.flash=1.1;
        } else { f.x=Math.random()*W; f.y=H*0.62+Math.random()*H*0.38;
          f.vy=-(0.4+Math.random()*0.7); f.vx=(Math.random()-0.5)*0.5; f.size=1.5+Math.random()*1.6; f.flash=1.1; }
        f.glow=f.size*(9+Math.random()*8); f.life=60; f.baseOp=0.8+Math.random()*0.2; f.curious=0;
      });
      if (reduceMotion) drawStatic();
    }

    // click empty space to release a little cluster of light
    document.addEventListener('click', function (e) {
      if (reduceMotion) return;
      if (e.target.closest('a,button,input,textarea,label')) return;
      if (window.getSelection && String(window.getSelection())) return;
      release({ x:e.clientX, y:e.clientY, count:3 });
    });

    var rt=null;
    window.addEventListener('resize', function(){
      clearTimeout(rt); rt=setTimeout(function(){
        if(raf) window.cancelAnimationFrame(raf);
        resize(); if(reduceMotion) drawStatic(); else loop();
      },180);
    },{passive:true});

    resize();
    if (reduceMotion) drawStatic(); else loop();

    return {
      release: release,
      setPalette: function (name) { if (PALETTES[name]) { palette = PALETTES[name]; } },
      setDensity: function (d) { densFactor = d; resize(); }
    };
  }

  window.Fireflies = { init: make, palettes: PALETTES };
})();
