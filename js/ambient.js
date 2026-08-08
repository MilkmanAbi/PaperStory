/* =====================================================================
   Ambient — one looping track per chapter, started politely.
   Browsers block sound until the reader interacts, so we arm on the first
   tap / scroll / key and fade in. A small corner button toggles it, and
   the chosen state is remembered for the session. Volume can be nudged by
   the weather so heavier rain sounds a touch louder.
   ===================================================================== */
(function () {
  'use strict';

  var audio = null, baseVol = 0.5, curTarget = 0, fadeRAF = 0;
  var armed = false, wantOn = true, ready = false, btn = null, src = null;

  // session memory (fine on a real site; guarded for private/file:// modes)
  try { if (sessionStorage.getItem('fc-sound') === 'off') wantOn = false; } catch (e) {}

  function make(){
    audio = new Audio();
    audio.loop = true; audio.preload = 'auto'; audio.volume = 0;
    audio.setAttribute('aria-hidden','true');
  }

  function fadeTo(v){
    curTarget = v;
    if (fadeRAF) return;
    var step = function(){
      if (!audio){ fadeRAF = 0; return; }
      var d = curTarget - audio.volume;
      if (Math.abs(d) < 0.01){ audio.volume = curTarget; fadeRAF = 0; return; }
      audio.volume = Math.max(0, Math.min(1, audio.volume + d * 0.06));
      fadeRAF = requestAnimationFrame(step);
    };
    fadeRAF = requestAnimationFrame(step);
  }

  function tryPlay(){
    if (!audio || !src) return;
    if (!wantOn){ setBtn(); return; }
    var p = audio.play();
    if (p && p.catch) p.catch(function(){ /* wait for a gesture */ });
    fadeTo(baseVol);
    setBtn();
  }

  function arm(){
    if (armed) return; armed = true;
    ['pointerdown','keydown','scroll','touchstart'].forEach(function(ev){
      window.addEventListener(ev, once, { once:true, passive:true });
    });
  }
  function once(){ ready = true; tryPlay(); }

  function setBtn(){
    if (!btn) return;
    var on = wantOn && audio && !audio.paused && audio.volume > 0.02;
    btn.setAttribute('data-on', on ? '1':'0');
    btn.title = on ? 'sound on' : 'sound off';
    btn.innerHTML = on
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7" opacity="0.9"/><path d="M19 6a8 8 0 0 1 0 12" opacity="0.55"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M22 9l-6 6M16 9l6 6" opacity="0.8"/></svg>';
  }

  function toggle(){
    wantOn = !wantOn;
    try { sessionStorage.setItem('fc-sound', wantOn ? 'on':'off'); } catch(e){}
    if (wantOn){ if(!ready) ready = true; tryPlay(); }
    else { fadeTo(0); setBtn(); }
  }

  function mountButton(){
    if (btn) return;
    btn = document.createElement('button');
    btn.className = 'sound-toggle'; btn.type = 'button';
    btn.setAttribute('aria-label','toggle ambient sound');
    btn.addEventListener('click', toggle);
    document.body.appendChild(btn);
    setBtn();
  }

  window.Ambient = {
    // src: path to an mp3; vol: base volume 0..1
    load: function(source, vol){
      if (typeof vol === 'number') baseVol = vol;
      if (!audio) make();
      if (source && source !== src){ src = source; audio.src = src; }
      mountButton();
      arm();
      if (ready) tryPlay(); else setBtn();
    },
    // gentle multiplier from the weather (0..1) — nudges around the base
    setWeather: function(mul){
      if (!audio || !wantOn) return;
      var v = baseVol * (0.82 + 0.18 * Math.max(0, Math.min(1, mul)));
      if (!fadeRAF) audio.volume = v; else curTarget = v;
    },
    stop: function(){ if (audio) fadeTo(0); }
  };
})();
