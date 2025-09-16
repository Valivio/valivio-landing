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

// === Karuzela „Dla kogo” — poziomy autoscroll: 3 widoczne, przesuw o 1 ===
function initDlaKogoCarousel(items) {
  var mount = document.querySelector('#dlaKogoCards');
  if (!mount || !Array.isArray(items) || !items.length) return;

  // usuń klasę gridu, bo karuzela ma własny layout
  mount.classList.remove('row', 'cols-3');

  var prefersReduced = false;
  try { prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var GAP = 24; // musi odpowiadać --dk-gap w CSS
  var VISIBLE = getVisible();   // ile kart naraz
  var current = 0;              // indeks w realnych elementach
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
    return w + GAP;
  }

  function build() {
    VISIBLE = getVisible();
    mount.innerHTML =
      '<div class="dk-viewport">' +
        '<div class="dk-track" style="--dk-visible:'+ VISIBLE +'"></div>' +
      '</div>';
    viewport = mount.querySelector('.dk-viewport');
    track = mount.querySelector('.dk-track');

    var before = items.slice(-VISIBLE);
    var after  = items.slice(0, VISIBLE);
    var full = before.concat(items, after);

    track.innerHTML = full.map(cardDlaKogo).map(function(html){
      return '<div class="dk-card">' + html + '</div>';
    }).join('');

    current = 0;
    jumpTo(current);   // ustaw start bez animacji
    startAuto();
  }

  function jumpTo(realIndex) {
    var offsetCards = realIndex + VISIBLE; // dolicz klony po lewej
    var dist = -offsetCards * stepWidth();
    track.style.transition = 'none';
    track.style.transform = 'translateX('+ dist +'px)';
    // force reflow
    void track.offsetHeight;
    track.style.transition = 'transform .5s ease';
  }

  function moveRightByOne() {
    // przesuwamy widok w PRAWO (czyli pokazujemy „poprzedni” element) – ruch „od lewej do prawej”
    current = (current - 1 + items.length) % items.length;
    var offsetCards = current + VISIBLE;
    var dist = -offsetCards * stepWidth();
    track.style.transform = 'translateX('+ dist +'px)';

    // gdy weszliśmy na lewy klon (wizualnie ostatni element), skoryguj po animacji
    if (current === items.length - 1) {
      track.addEventListener('transitionend', handleLoopFix, { once: true });
    }
  }

  function handleLoopFix() { jumpTo(items.length - 1); }

  function startAuto() {
    stopAuto();
    if (items.length <= VISIBLE || prefersReduced) return;
    timer = setInterval(moveRightByOne, 4000);
  }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

  // pauzy
  mount.addEventListener('mouseenter', stopAuto);
  mount.addEventListener('mouseleave', startAuto);
  mount.addEventListener('touchstart', function(){ stopAuto(); setTimeout(startAuto, 6000); }, { passive:true });

  // rebuild przy zmianie szerokości
  var rAF = null;
  window.addEventListener('resize', function(){
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(function(){
      var v = getVisible();
      if (v !== VISIBLE) build(); else jumpTo(current);
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
