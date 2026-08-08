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
      title:'I \u00b7 the cat', kicker:'Chapter I \u00b7 the cat',
      tagline:'Some nights the quiet finally gives.',
      art:'cat', end:['catRest'], species:['cat'],
      firefly:'moon', density:0.8,
      weather:'rain', audio:'assets/audio/rain.mp3', vol:0.55,
      divider:['#c7cff0','#c7cff0','#c7cff0'],
      beats:[
        // 2 a.m., Luna climbs in — a dark, rainy, starlit night
        { at:0.00, wall:'w-rain-coast.jpg',   wx:0.55, accent:[150,168,222], top:[10,12,22,0.40], bot:[8,9,16,0.64] },
        // staring at the ceiling / the window / family — introspective cosmos
        { at:0.30, wall:'w-cosmos.jpg',       wx:0.62, accent:[150,166,232], top:[12,14,28,0.42], bot:[8,10,20,0.64] },
        // the grinding cry — the deepest, darkest beat; rain at its heaviest
        { at:0.54, wall:'w-night-forest.jpg', wx:0.98, accent:[140,158,220], top:[8,10,20,0.50], bot:[6,8,16,0.74] },
        // the kiss at 2:50 — the sky opens into colour, rain easing
        { at:0.74, wall:'w-starry.jpg',       wx:0.42, accent:[172,186,236], top:[14,15,26,0.56], bot:[10,12,22,0.70] },
        // grey, thin morning; "Stay." — a soft lilac dawn, last few drops
        { at:0.92, wall:'w-dawn.jpg',         wx:0.14, accent:[196,192,236], top:[30,28,44,0.38], bot:[52,46,60,0.48] }
      ]
    },
    2: {
      title:'II \u00b7 the fox', kicker:'Chapter II \u00b7 the fox',
      tagline:'Home, a bowl of rice, and someone at the window.',
      art:'fox', end:['foxRest'], species:['fox'],
      firefly:'ember', density:0.85,
      weather:'snow', audio:'assets/audio/whistle.mp3', vol:0.5,
      divider:['#e0a15c','#e0a15c','#e0a15c'],
      beats:[
        // being a person all day; the walk home — an overcast afternoon
        { at:0.00, wall:'w-day-balcony.jpg', wx:0.4,  accent:[214,168,112], top:[40,40,44,0.40], bot:[34,32,36,0.54] },
        // rice, the desk lamp, the navy evening — dusk over the trees
        { at:0.42, wall:'w-dusk-forest.jpg', wx:0.55, accent:[226,160,106], top:[26,24,44,0.42], bot:[22,20,38,0.56] },
        // "It's nice." "Yeah." — the soft, warm last light; this was enough
        { at:0.80, wall:'w-dawn.jpg',        wx:0.45, accent:[236,182,132], top:[36,32,44,0.38], bot:[54,46,54,0.48] }
      ]
    },
    3: {
      title:'III \u00b7 both', kicker:'Chapter III \u00b7 both',
      tagline:'Dinner turns, quietly, into something else.',
      art:'both', end:['catRest','foxRest'], species:['cat','fox'],
      firefly:'hearth', density:1.0,
      weather:'snow', audio:'assets/audio/mountain.mp3', vol:0.55,
      divider:['#e9e1d2','#e0a15c','#e9e1d2'],
      beats:[
        // weekend-eve, two cold cans — a quiet night settling in
        { at:0.00, wall:'w-night-forest.jpg', wx:0.5,  accent:[226,150,166], top:[16,16,30,0.46], bot:[12,12,24,0.64] },
        // the small table, the talk of family — a warm, glowing hush
        { at:0.34, wall:'w-firefly-ruin.jpg', wx:0.62, accent:[228,168,150], top:[14,18,18,0.46], bot:[10,14,14,0.62] },
        // "the other night" — the earned quiet, the whole sky above
        { at:0.64, wall:'w-cosmos.jpg',       wx:0.55, accent:[214,176,182], top:[16,16,30,0.50], bot:[12,14,26,0.66] },
        // "You can stay again. If you're cold." — warm, kept, under the stars
        { at:0.90, wall:'w-starry.jpg',       wx:0.42, accent:[240,182,150], top:[14,16,26,0.54], bot:[12,14,22,0.66] }
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
    var wxCanvas = document.createElement('canvas'); wxCanvas.id='weather-canvas';
    var canvas = document.createElement('canvas'); canvas.id='firefly-canvas';
    document.body.append(A,B,scrim,wxCanvas,canvas);

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

    // ---- weather + ambient sound --------------------------------------
    if (window.Weather){ Weather.init(wxCanvas); Weather.use(cfg.weather||'none'); }
    if (window.Ambient && cfg.audio){ Ambient.load(cfg.audio, cfg.vol||0.5); }

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
      // scrim + accent lerp (scrim eased back a touch — the scenes carry the mood now)
      var SCRIM_MUL=0.66;
      var top=lerpArr(a.top,b.top,t), bot=lerpArr(a.bot,b.bot,t), ac=lerpArr(a.accent,b.accent,t);
      var topS=[top[0],top[1],top[2],top[3]*SCRIM_MUL], botS=[bot[0],bot[1],bot[2],bot[3]*SCRIM_MUL];
      scrim.style.background='linear-gradient(180deg,'+rgba(topS)+','+rgba(botS)+')';
      // weather intensity + a gentle nudge to the ambient volume
      var wx=lerp(a.wx!=null?a.wx:0.5, b.wx!=null?b.wx:0.5, t);
      window.Weather && Weather.setIntensity(wx);
      window.Ambient && Ambient.setWeather(wx);
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
