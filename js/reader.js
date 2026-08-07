/* =====================================================================
   Reader — loads a chapter and runs the mood engine.
   As you scroll, the wallpaper crossfades between mood beats, a tinted
   scrim and the accent colour lerp between them, fireflies drift, and a
   sleepy neko naps in a corner. Beats are hand-placed against each
   chapter's emotional arc.
   ===================================================================== */
(function () {
  'use strict';
  var W = 'assets/wallpapers/';

  // ---- per-chapter mood score --------------------------------------------
  // beat.at  : scroll progress 0..1 where this beat is centred
  // beat.wall: wallpaper file (crossfades when it changes)
  // beat.accent : [r,g,b] accent colour (lerps continuously)
  // beat.top/bot: scrim gradient stops [r,g,b,a] (lerp continuously)
  var CH = {
    1: {
      title:'I · the cat', kicker:'Chapter I \u00b7 the cat',
      tagline:'Some nights the quiet finally gives.',
      art:'cat', end:['catRest'], species:['cat'],
      firefly:'moon', density:0.85,
      divider:['#c7cff0','#c7cff0','#c7cff0'],
      beats:[
        // 2 a.m., Luna climbs in, the kicking stops — dark, still
        { at:0.00, wall:'w-coast-night.jpg', accent:[142,163,230], top:[10,12,22,0.52], bot:[8,9,16,0.80] },
        // staring at the ceiling / the window / family — introspective cosmos
        { at:0.30, wall:'w-cosmos.jpg',      accent:[147,166,234], top:[12,14,28,0.50], bot:[8,10,20,0.76] },
        // the sigh, the grinding cry — the deepest, darkest beat
        { at:0.54, wall:'w-cosmos.jpg',      accent:[134,152,216], top:[8,9,18,0.66],  bot:[5,6,14,0.88] },
        // it softens; the kiss at 2:50 — starlight, a touch of warmth
        { at:0.74, wall:'w-stars.jpg',       accent:[169,182,239], top:[14,16,30,0.50], bot:[10,12,26,0.72] },
        // grey, thin morning; "Stay." — lilac dawn lifting
        { at:0.92, wall:'w-dawn.jpg',        accent:[187,193,240], top:[42,36,54,0.40], bot:[62,52,68,0.54] }
      ]
    },
    2: {
      title:'II · the fox', kicker:'Chapter II \u00b7 the fox',
      tagline:'Home, a bowl of rice, and someone at the window.',
      art:'fox', end:['foxRest'], species:['fox'],
      firefly:'ember', density:0.9,
      divider:['#e0a15c','#e0a15c','#e0a15c'],
      beats:[
        // being a person all day; the walk home in autumn dusk
        { at:0.00, wall:'w-balcony.jpg', accent:[224,161,92], top:[30,26,30,0.44], bot:[24,20,26,0.64] },
        // rice, the desk lamp, the navy evening window
        { at:0.42, wall:'w-dusk.jpg',    accent:[226,160,106], top:[30,26,44,0.46], bot:[26,22,40,0.62] },
        // "It's nice." "Yeah." — this was enough
        { at:0.80, wall:'w-dawn.jpg',    accent:[234,185,126], top:[46,38,44,0.40], bot:[58,46,50,0.52] }
      ]
    },
    3: {
      title:'III · both', kicker:'Chapter III \u00b7 both',
      tagline:'Dinner turns, quietly, into something else.',
      art:'both', end:['catRest','foxRest'], species:['cat','fox'],
      firefly:'hearth', density:1.05,
      divider:['#e9e1d2','#e0a15c','#e9e1d2'],
      beats:[
        // weekend-eve, the fridge, two cold cans — evening settling
        { at:0.00, wall:'w-dusk.jpg',    accent:[228,147,166], top:[28,24,36,0.50], bot:[24,20,32,0.66] },
        // the small table, the talk of family and happiness
        { at:0.34, wall:'w-balcony.jpg', accent:[231,159,154], top:[30,24,28,0.46], bot:[26,20,26,0.64] },
        // "the other night" — the earned quiet, reflections in the glass
        { at:0.64, wall:'w-stars.jpg',   accent:[236,174,148], top:[20,18,30,0.52], bot:[16,16,28,0.70] },
        // "You can stay again. If you're cold." — warm, kept
        { at:0.90, wall:'w-dawn.jpg',    accent:[240,181,138], top:[44,34,40,0.42], bot:[58,44,48,0.52] }
      ]
    }
  };

  function qs(k){ return new URLSearchParams(location.search).get(k); }
  function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function lerpArr(a,b,t){ var o=[]; for(var i=0;i<a.length;i++) o.push(lerp(a[i],b[i],t)); return o; }
  function rgb(a){ return 'rgb('+(a[0]|0)+','+(a[1]|0)+','+(a[2]|0)+')'; }
  function rgba(a){ return 'rgba('+(a[0]|0)+','+(a[1]|0)+','+(a[2]|0)+','+a[3].toFixed(3)+')'; }

  var ch = clamp(parseInt(qs('ch')||'1',10)||1, 1, 3);
  var cfg = CH[ch];

  document.addEventListener('DOMContentLoaded', build);

  function build(){
    document.title = 'Fox \u0026 Cat \u2014 ' + cfg.title;

    // ---- scaffold ------------------------------------------------------
    var A = el('div','wall'), B = el('div','wall');
    var scrim = el('div'); scrim.id='scrim';
    var canvas = document.createElement('canvas'); canvas.id='firefly-canvas';
    document.body.append(A,B,scrim,canvas);

    var prog = el('div'); prog.id='progress'; document.body.appendChild(prog);

    var bar = el('div','topbar');
    bar.innerHTML =
      '<a class="home" href="index.html"><span class="glyph">'+ART.cat+'</span>Fox &amp; Cat</a>'+
      '<span class="spacer"></span><span class="cc">'+esc(cfg.kicker)+'</span>';
    // shrink the home glyph svg
    bar.querySelector('.glyph svg') && bar.querySelector('.glyph svg').setAttribute('style','width:100%;height:100%');

    var stage = el('div','stage');
    var reader = el('div','reader');

    // hero
    var hero = el('div','hero');
    hero.innerHTML =
      '<div class="art float">'+ART[cfg.art]+'</div>'+
      '<div class="numeral">'+roman(ch)+'</div>'+
      '<div class="kicker">'+esc(cfg.kicker)+'</div>'+
      '<div class="tagline">'+esc(cfg.tagline)+'</div>';

    // body
    var page = el('div','page');
    var md = el('div','md');
    md.style.setProperty('--divider', ART.dividerURI(cfg.divider));
    md.innerHTML = marked.parse(window.STORIES[ch] || '*(story missing)*');
    var firstP = md.querySelector('p'); if(firstP) firstP.classList.add('lede');
    page.appendChild(md);

    // end + nav
    var end = el('div','chapter-end');
    var curls = cfg.end.map(function(k){ return '<span style="display:inline-block;width:120px;height:96px;vertical-align:middle">'+ART[k]+'</span>'; }).join('');
    end.innerHTML = '<div class="curl">'+curls+'</div><div class="fin">end of chapter '+roman(ch)+'</div>';

    var nav = el('div','chapnav');
    nav.innerHTML = navHTML(ch);

    reader.append(hero, page, end, nav);
    stage.appendChild(reader);
    document.body.append(bar, stage);

    // ---- fireflies + nekos --------------------------------------------
    window.Fireflies && window.Fireflies.init({ canvas:canvas, palette:cfg.firefly, density:cfg.density });
    spawnCompanions();

    // ---- mood engine ---------------------------------------------------
    var beats = cfg.beats;
    var front = A, back = B, curWall = null;
    function showWall(file){
      if (file === curWall) return;
      curWall = file;
      back.style.backgroundImage = 'url('+W+file+')';
      back.style.zIndex = 1; front.style.zIndex = 0;
      back.style.opacity = 1;
      var oldFront = front;
      setTimeout(function(){ oldFront.style.opacity = 0; }, 40);
      var t = front; front = back; back = t; // swap
    }
    // prime first wall instantly
    front.style.transition='none'; front.style.backgroundImage='url('+W+beats[0].wall+')';
    front.style.opacity=1; curWall=beats[0].wall;
    requestAnimationFrame(function(){ front.style.transition=''; });

    function apply(p){
      // find segment
      var i=0; while(i<beats.length-1 && p>=beats[i+1].at) i++;
      var a=beats[i], b=beats[Math.min(i+1,beats.length-1)];
      var span=(b.at-a.at)||1, t=clamp((p-a.at)/span,0,1);
      // wallpaper: whichever beat we're closest to owns the screen
      showWall((t<0.5? a : b).wall);
      // scrim + accent lerp
      var top=lerpArr(a.top,b.top,t), bot=lerpArr(a.bot,b.bot,t), ac=lerpArr(a.accent,b.accent,t);
      scrim.style.background='linear-gradient(180deg,'+rgba(top)+','+rgba(bot)+')';
      document.documentElement.style.setProperty('--accent', rgb(ac));
      document.documentElement.style.setProperty('--accent-soft','rgba('+(ac[0]|0)+','+(ac[1]|0)+','+(ac[2]|0)+',0.16)');
      // gentle parallax drift on the bg layers
      var dy = (-p*22).toFixed(1)+'px';
      A.style.transform='scale(1.04) translateY('+dy+')';
      B.style.transform='scale(1.04) translateY('+dy+')';
      prog.style.width=(p*100).toFixed(2)+'%';
    }

    var ticking=false;
    function onScroll(){
      if(ticking) return; ticking=true;
      requestAnimationFrame(function(){
        var max=document.documentElement.scrollHeight-window.innerHeight;
        apply(max>0? clamp(window.scrollY/max,0,1) : 0);
        ticking=false;
      });
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll, {passive:true});
    apply(0);
  }

  function spawnCompanions(){
    if (!window.spawnNekos) return;
    var map = { cat:'assets/sprites/cat.png', fox:'assets/sprites/fox.png' };
    var list = cfg.species.map(function(s,idx){
      return { sprite:map[s], name:(s==='cat'?'Aoi':'Luna'),
               x: window.innerWidth*(cfg.species.length===2 ? (idx? 0.62:0.38) : 0.5),
               speed:2.0 };
    });
    // let the first firefly-friendly frame paint before the cats wake up
    setTimeout(function(){ window.spawnNekos(list); }, 900);
  }

  // ---- helpers -----------------------------------------------------------
  function el(tag,cls){ var e=document.createElement(tag); if(cls)e.className=cls; return e; }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function roman(n){ return ['','I','II','III'][n]||String(n); }
  function navHTML(n){
    var out='';
    if (n>1) out+=link(n-1,'\u2190 Chapter '+roman(n-1),'ghost');
    out+='<a href="index.html"><span class="mini">'+miniPaw()+'</span> all chapters</a>';
    if (n<3) out+=link(n+1,'Chapter '+roman(n+1)+' \u2192','');
    return out;
  }
  function link(n,label,cls){ return '<a class="'+cls+'" href="read.html?ch='+n+'">'+esc(label)+'</a>'; }
  function miniPaw(){
    return '<svg viewBox="0 0 40 40" fill="currentColor"><ellipse cx="20" cy="26" rx="8" ry="6.6"/><ellipse cx="10" cy="18" rx="3" ry="4"/><ellipse cx="16" cy="12" rx="3" ry="4.2"/><ellipse cx="24" cy="12" rx="3" ry="4.2"/><ellipse cx="30" cy="18" rx="3" ry="4"/></svg>';
  }
})();
