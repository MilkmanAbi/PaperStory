/* =====================================================================
   Sleepy neko — a calm reworking of oneko.
   Sprite layout follows adryd325/oneko.js & lots-o-nekos (8x4 grid, 32px
   tiles). These companions do NOT chase the cursor or each other. One
   ambles slowly to a cozy nook, settles, and sleeps for a good while,
   then stretches and wanders somewhere new. When two are out they share
   a den: they walk over together, nap side by side, and wake together.
   Movement is time-based (px per second) so it stays smooth and gentle
   at any refresh rate — no zipping, no frantic little darts.
   ===================================================================== */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var SPR = {
    idle:[[-3,-3]], tired:[[-3,-2]], stretch:[[-7,-2],[-6,-3]],
    sleep:[[-2,0],[-2,-1]],
    N:[[-1,-2],[-1,-3]], NE:[[0,-2],[0,-3]], E:[[-3,0],[-3,-1]], SE:[[-5,-1],[-5,-2]],
    S:[[-6,-3],[-7,-2]], SW:[[-5,-3],[-6,-1]], W:[[-4,-2],[-4,-3]], NW:[[-1,0],[-1,-1]]
  };
  var DIRS = ['E','SE','S','SW','W','NW','N','NE'];

  var SPEED=34, SPEED_MIN=12, EASE_BAND=64, ARRIVE=3, MIN_TRIP=150, WALK_FPS=7;
  var SETTLE_S=[0.6,1.0], SLEEP_S=[9,18], STRETCH_S=[1.0,1.6], LINGER_S=[3.5,7.0];

  function rnd(a,b){ return a+Math.random()*(b-a); }
  function clamp(v,a,b){ return v<a?a:(v>b?b:v); }

  function Neko(opts){
    opts = opts || {};
    this.size = opts.size || 32;
    this.name = opts.name || 'neko';
    this.buddy = null; this.lead = false; this._targeted = false; this._sleepDur = 12;

    var el = document.createElement('div');
    el.className='oneko'; el.setAttribute('aria-hidden','true'); el.title=this.name;
    el.style.width = el.style.height = this.size+'px';
    el.style.backgroundImage = 'url('+opts.sprite+')';
    el.style.backgroundSize = (this.size*8)+'px '+(this.size*4)+'px';
    document.body.appendChild(el); this.el = el;

    this.x = opts.x != null ? opts.x : rnd(innerWidth*0.3, innerWidth*0.7);
    this.y = opts.y != null ? opts.y : innerHeight + 24;
    this.tx = this.x; this.ty = this.y;

    this.state='amble'; this.frame=0; this.animAcc=0; this.stateT=0; this.hold=0; this.dir='S';
    this.place();
    if (reduceMotion){ this.state='sleep'; this.setSprite('sleep'); }
  }

  Neko.prototype.place = function(){
    this.el.style.left = (this.x - this.size/2)+'px';
    this.el.style.top  = (this.y - this.size/2)+'px';
  };
  Neko.prototype.setSprite = function(set){
    var f = SPR[set] || SPR.idle, s = f[this.frame % f.length];
    this.el.style.backgroundPosition = (s[0]*this.size)+'px '+(s[1]*this.size)+'px';
  };

  Neko.prototype.pickNook = function(){
    var W=innerWidth, H=innerHeight, m=48, spot, tries=0;
    do {
      var side = Math.random();
      var x = side < 0.42 ? rnd(m, W*0.30)
            : side < 0.84 ? rnd(W*0.70, W-m)
            :               rnd(W*0.36, W*0.64);
      spot = { x:x, y:rnd(H*0.60, H-m) };
    } while (Math.hypot(spot.x-this.x, spot.y-this.y) < MIN_TRIP && ++tries < 8);
    return spot;
  };

  Neko.prototype.chooseTarget = function(){
    if (this.buddy){
      if (this.lead){
        var den = this.pickNook(), gap = 22;
        this.tx = clamp(den.x-gap,48,innerWidth-48); this.ty = den.y;
        this.buddy.tx = clamp(den.x+gap,48,innerWidth-48); this.buddy.ty = den.y+rnd(-4,4);
        this.buddy._targeted = true;
      } else if (!this._targeted){
        this.tx = clamp(this.buddy.x+44,48,innerWidth-48); this.ty = this.buddy.y;
      }
      this._targeted = false;
    } else {
      var s = this.pickNook(); this.tx = s.x; this.ty = s.y;
    }
  };

  Neko.prototype.enter = function(s){ this.state=s; this.stateT=0; };

  Neko.prototype.step = function(dt){
    if (reduceMotion){ this.setSprite('sleep'); return; }
    this.stateT += dt;
    switch (this.state){
      case 'amble': {
        var dx=this.tx-this.x, dy=this.ty-this.y, dist=Math.hypot(dx,dy);
        if (dist <= ARRIVE){
          this.x=this.tx; this.y=this.ty; this.place();
          this.enter('settle'); this.hold=rnd(SETTLE_S[0],SETTLE_S[1]); this.setSprite('tired'); return;
        }
        var sp = dist < EASE_BAND ? (SPEED_MIN+(SPEED-SPEED_MIN)*(dist/EASE_BAND)) : SPEED;
        var mv = Math.min(sp*dt, dist);
        this.x += dx/dist*mv; this.y += dy/dist*mv; this.place();
        this.dir = DIRS[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];
        this.animAcc += dt;
        if (this.animAcc >= 1/WALK_FPS){ this.animAcc=0; this.frame++; }
        this.setSprite(this.dir); return;
      }
      case 'settle': {
        this.setSprite('tired');
        if (this.stateT >= this.hold){
          if (this.buddy && this.lead){ this._sleepDur=rnd(SLEEP_S[0],SLEEP_S[1]); this.buddy._sleepDur=this._sleepDur; }
          else if (!this.buddy){ this._sleepDur=rnd(SLEEP_S[0],SLEEP_S[1]); }
          this.enter('sleep'); this.frame=0;
        }
        return;
      }
      case 'sleep': {
        this.animAcc += dt;
        if (this.animAcc >= 0.7){ this.animAcc=0; this.frame++; }
        this.setSprite('sleep');
        if (this.stateT >= (this._sleepDur||12)){ this.enter('stretch'); this.hold=rnd(STRETCH_S[0],STRETCH_S[1]); this.frame=0; }
        return;
      }
      case 'stretch': {
        this.animAcc += dt;
        if (this.animAcc >= 0.35){ this.animAcc=0; this.frame++; }
        this.setSprite('stretch');
        if (this.stateT >= this.hold){ this.enter('linger'); this.hold=rnd(LINGER_S[0],LINGER_S[1]); }
        return;
      }
      case 'linger': {
        this.setSprite('idle');
        if (this.stateT >= this.hold){
          if (this.buddy && !this.lead) return;                 // follower waits for the lead
          if (this.buddy){
            var bs = this.buddy.state;
            if (bs!=='linger' && bs!=='sleep' && bs!=='stretch') return; // wait until buddy's also winding down
          }
          this.chooseTarget(); this.enter('amble');
          if (this.buddy && this.lead) this.buddy.enter('amble');
        }
        return;
      }
    }
  };

  var nekos = (window.__nekos = window.__nekos || []);
  var last=0, running=false;
  function loop(ts){
    if (!last) last=ts;
    var dt = Math.min((ts-last)/1000, 0.05);
    last=ts;
    for (var i=0;i<nekos.length;i++) nekos[i].step(dt);
    if (nekos.length) requestAnimationFrame(loop); else running=false;
  }
  function ensureLoop(){ if (!running){ running=true; last=0; requestAnimationFrame(loop); } }

  window.addEventListener('resize', function(){
    var W=innerWidth,H=innerHeight,m=48;
    nekos.forEach(function(n){
      n.tx=clamp(n.tx,m,W-m); n.ty=clamp(n.ty,H*0.5,H-m);
      n.x =clamp(n.x, m,W-m); n.y =clamp(n.y, m,H-m); n.place();
    });
  }, {passive:true});

  window.Neko = Neko;
  window.spawnNekos = function(list){
    nekos.splice(0).forEach(function(n){ if(n.el&&n.el.parentNode) n.el.parentNode.removeChild(n.el); });
    var made = list.map(function(o){ var n=new Neko(o); nekos.push(n); return n; });
    if (made.length === 2){ made[0].buddy=made[1]; made[1].buddy=made[0]; made[0].lead=true; }
    made.forEach(function(n){ n.chooseTarget(); n.enter('amble'); });
    ensureLoop();
    return made;
  };
})();
