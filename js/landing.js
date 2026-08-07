/* =====================================================================
   Landing — the cozy cover + three chapter doors.
   ===================================================================== */
(function () {
  'use strict';
  var W = 'assets/wallpapers/';

  var CARDS = [
    { n:1, who:'the cat \u00b7 Aoi', c:'#9aa8ea',
      teaser:'A shared bed, a long-held sigh, and the smallest yes.', art:'cat' },
    { n:2, who:'the fox \u00b7 Luna', c:'#e0a15c',
      teaser:'The commute home, and the particular quiet of two tired people.', art:'fox' },
    { n:3, who:'both', c:'#e493a6',
      teaser:'Cold rice, warm beer, and the door that stays open.', art:'both' }
  ];

  document.addEventListener('DOMContentLoaded', function () {
    // background: a calm, dreaming wallpaper + warm scrim + fireflies
    var wall = el('div','wall'); wall.style.backgroundImage='url('+W+'w-cosmos.jpg)'; wall.style.opacity=1;
    var scrim = el('div'); scrim.id='scrim';
    scrim.style.background='linear-gradient(180deg, rgba(14,16,26,0.52), rgba(10,10,20,0.74))';
    var canvas=document.createElement('canvas'); canvas.id='firefly-canvas';
    document.body.append(wall,scrim,canvas);

    var cover=el('div','cover');
    cover.innerHTML =
      '<div class="crest float slow">'+ART.both+'</div>'+
      '<h1>Fox <span class="amp">&amp;</span> Cat</h1>'+
      '<div class="sub">a cozy thing, in three parts</div>'+
      '<div class="byline">Aoi &amp; Luna</div>';

    var grid=el('div','chapters');
    CARDS.forEach(function(card){
      var a=el('a','ch-card');
      a.href='read.html?ch='+card.n;
      a.style.setProperty('--c', card.c);
      a.innerHTML =
        '<div class="art">'+ART[card.art]+'</div>'+
        '<div class="num">'+roman(card.n)+'</div>'+
        '<div class="who">'+esc(card.who)+'</div>'+
        '<p class="teaser">'+esc(card.teaser)+'</p>'+
        '<span class="go">read '+roman(card.n)+' &nbsp;\u2192</span>';
      grid.appendChild(a);
    });

    var foot=el('div','cover-foot');
    foot.innerHTML='tap anywhere for a little light \u00b7 <span class="km">the cats nap where it\u2019s warm</span>';

    document.body.append(cover, grid, foot);

    window.Fireflies && window.Fireflies.init({ canvas:canvas, palette:'hearth', density:1 });

    // a cat and a fox, napping together somewhere warm on the page
    setTimeout(function(){
      window.spawnNekos && window.spawnNekos([
        { sprite:'assets/sprites/cat.png', name:'Aoi', x:window.innerWidth*0.4, speed:2.0 },
        { sprite:'assets/sprites/fox.png', name:'Luna', x:window.innerWidth*0.6, speed:2.0 }
      ]);
    }, 900);

    // a quiet hello for anyone who opens the console  (=^..^=)
    try{ console.log('%cFox & Cat  (=^\u30fb\u1d25\u30fb^=)  ~ built cozy','color:#e0a15c;font-size:13px'); }catch(e){}
  });

  function el(t,c){ var e=document.createElement(t); if(c)e.className=c; return e; }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(x){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x];}); }
  function roman(n){ return ['','I','II','III'][n]||String(n); }
})();
