// === Footer year ===
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// === Kontakt (mailto fallback) ===
(function initContact() {
  var form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = (form.name && form.name.value || '').trim();
    var email = (form.email && form.email.value || '').trim();
    var msg = (form.message && form.message.value || '').trim();
    var status = document.getElementById('formStatus');

    if (!name || !email || !msg) {
      if (status) { status.textContent = 'Uzupełnij wszystkie pola.'; status.style.color = '#b91c1c'; }
      return;
    }

    var subject = encodeURIComponent('Zgłoszenie konsultacji – Valivio');
    var body = encodeURIComponent(
      'Imię i nazwisko: ' + name + '\nE-mail: ' + email + '\n\nWiadomość:\n' + msg
    );
    window.location.href = 'mailto:contact@valivio.example?subject=' + subject + '&body=' + body;

    setTimeout(function () {
      form.reset();
      if (status) {
        status.textContent = 'Dziękuję! Jeśli e-mail się nie otworzył, napisz bezpośrednio na contact@valivio.example.';
        status.style.color = '#111';
      }
    }, 600);
  });
})();

// === Helpers ===
function $(sel) { return document.querySelector(sel); }

// === Renderery kart (HTML) ===
function cardDlaKogo(obj) {
  return '' +
    '<article class="card">' +
      '<h3 class="h3">' + obj.title + '</h3>' +
      '<p class="meta">' + obj.text + '</p>' +
    '</article>';
}
function cardProces(obj) {
  return '' +
    '<article class="card">' +
      '<h3 class="h3">' + obj.title + '</h3>' +
      '<p class="meta">' + obj.text + '</p>' +
    '</article>';
}
function cardOferta(obj) {
  var items = (obj.bullets || []).map(function(li){ return '<li>'+ li +'</li>'; }).join('');
  return '' +
    '<article class="card">' +
      '<p class="meta">' + obj.kicker + '</p>' +
      '<h3 class="h3">' + obj.title + '</h3>' +
      '<p class="meta">' + obj.desc + '</p>' +
      '<ul class="mt-12">' + items + '</ul>' +
      '<p class="price mt-16">' + obj.price + '</p>' +
      '<a class="btn" href="#kontakt">Umów sesję</a>' +
    '</article>';
}

// === Karuzela „Dla kogo” — poziomy autoscroll: 3 widoczne, przesuw o 1 W LEWO ===
function initDlaKogoCarousel(items) {
  var mount = document.querySelector('#dlaKogoCards');
  if (!mount || !Array.isArray(items) || !items.length) return;

  // usuń klasy siatki, bo karuzela ma własny layout
  mount.classList.remove('row', 'cols-3');

  var prefersReduced = false;
  try { prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var GAP = 24; // musi odpowiadać --dk-gap w CSS
  var VISIBLE = getVisible();   // ile kart naraz (3/2/1)
  var current = 0;              // indeks realnej karty (0..n-1)
  var viewport, track, timer = null;

  function getVisible() {
    var w = window.innerWidth || 1200;
    if (w <= 680) return 1;
    if (w <= 960) return 2;
    return 3;
  }

  function stepWidth() {
    var first = track && track.querySelector('.dk-card');
    if (!first) return 0;
    var w = first.getBoundingClientRect().width;
    return w + GAP; // szerokość karty + odstęp
  }

  function equalizeHeights() {
    // 1) każdej .card zdejmij height, zmierz max
    var cards = track.querySelectorAll('.dk-card .card');
    var maxH = 0;
    for (var i=0; i<cards.length; i++){
      cards[i].style.height = 'auto';
      var h = cards[i].offsetHeight;
      if (h > maxH) maxH = h;
    }
    // 2) ustaw stałą wysokość viewportu i „rozciągnij” każdą .card do 100%
    if (maxH > 0) {
      viewport.style.height = maxH + 'px';
      for (var j=0; j<cards.length; j++){
        cards[j].style.height = '100%';
      }
    }
  }

  function build() {
    VISIBLE = getVisible();
    mount.innerHTML =
      '<div class="dk-viewport">' +
        '<div class="dk-track" style="--dk-visible:'+ VISIBLE +'"></div>' +
      '</div>';
    viewport = mount.querySelector('.dk-viewport');
    track = mount.querySelector('.dk-track');

    var before = items.slice(-VISIBLE);   // klony po lewej
    var after  = items.slice(0, VISIBLE); // klony po prawej
    var full = before.concat(items, after);

    track.innerHTML = full.map(cardDlaKogo).map(function(html){
      return '<div class="dk-card">' + html + '</div>';
    }).join('');

    current = 0;
    jumpTo(current);      // ustaw start (bez animacji)
    equalizeHeights();    // wyrównaj wysokości
    startAuto();
  }

  function jumpTo(realIndex) {
    var offsetCards = realIndex + VISIBLE;
    var dist = -offsetCards * stepWidth();
    track.style.transition = 'none';
    track.style.transform = 'translateX('+ dist +'px)';
    // force reflow
    void track.offsetHeight;
    track.style.transition = 'transform .5s ease';
  }

  // RUCH W LEWO (kolejny box)
  function moveLeftByOne() {
    current += 1;
    var offsetCards = current + VISIBLE;
    var dist = -offsetCards * stepWidth();
    track.style.transform = 'translateX('+ dist +'px)';

    // po dojściu do prawego klona — „cichy” skok na realny początek
    if (current >= items.length) {
      track.addEventListener('transitionend', function handle() {
        track.removeEventListener('transitionend', handle);
        current = 0;
        jumpTo(current);
      }, { once: true });
    }
  }

  function startAuto() {
    stopAuto();
    if (items.length <= VISIBLE || prefersReduced) return;
    timer = setInterval(moveLeftByOne, 4000);
  }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

  // pauza interakcyjna
  mount.addEventListener('mouseenter', stopAuto);
  mount.addEventListener('mouseleave', startAuto);
  mount.addEventListener('touchstart', function(){ stopAuto(); setTimeout(startAuto, 6000); }, { passive:true });

  // rebuild/pozycjonowanie + ponowne wyrównanie przy zmianie rozmiaru
  var rAF = null;
  window.addEventListener('resize', function(){
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(function(){
      var v = getVisible();
      if (v !== VISIBLE) build(); else { jumpTo(current); equalizeHeights(); }
    });
  });

  build();
}

// === Load JSON & render ===
function loadData() {
  fetch('/assets/data.json', { cache: 'no-cache' })
    .then(function(res){ if (!res.ok) throw new Error('HTTP '+res.status); return res.json(); })
    .then(function(data){
      // Dla kogo – karuzela
      initDlaKogoCarousel(data && data.dlaKogo || []);

      // Jak pracuję
      var procesMount = $('#procesCards');
      if (procesMount && Array.isArray(data.proces)) {
        procesMount.innerHTML = data.proces.map(cardProces).join('');
      }

      // Oferta
      var ofertaMount = $('#ofertaCards');
      if (ofertaMount && Array.isArray(data.oferta)) {
        ofertaMount.innerHTML = data.oferta.map(cardOferta).join('');
      }
    })
    .catch(function(err){
      console.error('Nie udało się wczytać /assets/data.json:', err);
    });
}

document.addEventListener('DOMContentLoaded', loadData);
