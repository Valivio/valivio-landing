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
function fetchJSON(url) {
  // ścieżki względne (działają i na Render, i na GitHub Pages)
  var sep = url.indexOf('?') === -1 ? '?' : '&';
  return fetch(url + sep + 'v=' + Date.now(), { cache: 'no-store' })
    .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url); return res.text(); })
    .then(function (txt) { try { return JSON.parse(txt); } catch (e) { console.error('[JSON parse error]', url); return null; } })
    .catch(function () { return null; });
}
function fetchHTML(url, mount, fallbackHTML) {
  fetch(url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now(), { cache: 'no-store' })
    .then(function(res){ if(!res.ok) throw new Error('HTTP ' + res.status); return res.text(); })
    .then(function(html){ mount.innerHTML = html; })
    .catch(function(){ if (fallbackHTML) mount.innerHTML = fallbackHTML; });
}

// === Renderery kart (HTML) ===
function cardDlaKogo(obj) {
  return '' +
    '<article class="card">' +
      '<h3 class="h3">' + (obj.title || '') + '</h3>' +
      '<p class="meta">' + (obj.text || '') + '</p>' +
    '</article>';
}
function cardProces(obj) {
  return '' +
    '<article class="card">' +
      '<h3 class="h3">' + (obj.title || '') + '</h3>' +
      '<p class="meta">' + (obj.text || '') + '</p>' +
    '</article>';
}
function cardOferta(obj) {
  var items = (obj.bullets || []).slice(0, 3).map(function(li){
    return '<li>' + li + '</li>';
  }).join('');
  return '' +
    '<article class="card">' +
      '<h3 class="h3 of-title">' + (obj.title || '') + '</h3>' +
      '<p class="meta of-desc">' + (obj.desc || '') + '</p>' +
      '<ul class="mt-12 of-list">' + items + '</ul>' +
      '<p class="price mt-16 of-price">' + (obj.price || '') + '</p>' +
      '<a class="btn" href="index.html#kontakt">Umów sesję</a>' +
    '</article>';
}
function itemFaq(obj) {
  var q = (obj && obj.q) ? obj.q : '';
  var a = (obj && obj.a) ? obj.a : '';
  var aHtml = String(a).replace(/\n/g, '<br>');
  return '<details><summary>' + q + '</summary><p>' + aHtml + '</p></details>';
}

// === Karuzela „Dla kogo” — autoscroll w lewo (3/2/1 widocznych) ===
function initDlaKogoCarousel(items) {
  var mount = document.querySelector('#dlaKogoCards');
  if (!mount || !Array.isArray(items) || !items.length) return;

  mount.classList.remove('row', 'cols-3');

  var prefersReduced = false;
  try { prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var GAP = 24;
  var VISIBLE = getVisible();
  var current = 0;
  var viewport, track, timer = null;

  function getVisible() {
    var w = window.innerWidth || 1200;
    if (w <= 680) return 1;
    if (w <= 960) return 2;
    return 3;
  }
  function getAutoDelay(){ return (VISIBLE === 1) ? 2000 : 4000; } // mobile 2s, reszta 4s
  function stepWidth() {
    var first = track && track.querySelector('.dk-card');
    if (!first) return 0;
    var w = first.getBoundingClientRect().width;
    return w + GAP;
  }
  function equalizeHeights() {
    var cards = track.querySelectorAll('.dk-card .card');
    var maxH = 0;
    for (var i=0; i<cards.length; i++){
      cards[i].style.height = 'auto';
      var h = cards[i].offsetHeight;
      if (h > maxH) maxH = h;
    }
    if (maxH > 0) {
      viewport.style.height = maxH + 'px';
      for (var j=0; j<cards.length; j++){
        cards[j].style.height = '100%';
      }
    }
  }
  function build() {
    VISIBLE = getVisible();
    mount.innerHTML = '<div class="dk-viewport"><div class="dk-track" style="--dk-visible:'+ VISIBLE +'"></div></div>';
    viewport = mount.querySelector('.dk-viewport');
    track = mount.querySelector('.dk-track');

    var before = items.slice(-VISIBLE);
    var after  = items.slice(0, VISIBLE);
    var full = before.concat(items, after);

    track.innerHTML = full.map(cardDlaKogo).map(function(html){
      return '<div class="dk-card">' + html + '</div>';
    }).join('');

    current = 0;
    jumpTo(current);
    equalizeHeights();
    startAuto();
  }
  function jumpTo(realIndex) {
    var offsetCards = realIndex + VISIBLE;
    var dist = -offsetCards * stepWidth();
    track.style.transition = 'none';
    track.style.transform = 'translateX('+ dist +'px)';
    void track.offsetHeight;
    track.style.transition = 'transform .5s ease';
  }
  function moveLeftByOne() {
    current += 1;
    var offsetCards = current + VISIBLE;
    var dist = -offsetCards * stepWidth();
    track.style.transform = 'translateX('+ dist +'px)';
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
    timer = setInterval(moveLeftByOne, getAutoDelay());
  }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

  mount.addEventListener('mouseenter', stopAuto);
  mount.addEventListener('mouseleave', startAuto);
  mount.addEventListener('touchstart', function(){ stopAuto(); setTimeout(startAuto, 6000); }, { passive:true });

  var rAF = null;
  window.addEventListener('resize', function(){
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(function(){
      var v = getVisible();
      if (v !== VISIBLE) build(); else { jumpTo(current); equalizeHeights(); stopAuto(); startAuto(); }
    });
  });

  build();
}

// === OFERTA: wyrównanie wysokości kart w siatce ===
function equalizeOfertaHeights() {
  var grid = document.querySelector('#ofertaCards');
  if (!grid) return;
  var cards = grid.querySelectorAll('.card');
  if (!cards.length) return;
  for (var i = 0; i < cards.length; i++) { cards[i].style.height = 'auto'; }
  var maxH = 0;
  for (var j = 0; j < cards.length; j++) {
    var h = cards[j].offsetHeight;
    if (h > maxH) maxH = h;
  }
  if (maxH > 0) {
    for (var k = 0; k < cards.length; k++) { cards[k].style.height = maxH + 'px'; }
  }
}

// === Fallback dla data.json (awaryjnie) ===
var FALLBACK_DATA = {
  "dlaKogo": [
    { "title": "„Zarabiam, a brak spokoju.”", "text": "Masz dochody, ale brak bufora, nieregularne wydatki i stres przy każdej zmianie rat lub pracy." },
    { "title": "„Chcę zmiany w pracy.”", "text": "Wypalenie, stagnacja, chęć zmiany kierunku bez ryzykowania wszystkiego naraz." },
    { "title": "„Po rozstaniu wszystko się posypało.”", "text": "Wsparcie emocjonalno-finansowe po życiowych zmianach (rozstanie, przeprowadzka, start JDG)." },
    { "title": "„Chaos w wydatkach.”", "text": "Trudno przewidzieć miesiąc do przodu — chcesz prosty system i spokój." },
    { "title": "„Negocjacje wynagrodzenia.”", "text": "Przygotowanie do rozmowy: argumenty, widełki, scenariusze i granice." },
    { "title": "„Startuję z JDG.”", "text": "Budżet startowy, poduszka, stawki i plan na pierwsze 90 dni." }
  ],
  "proces": [
    { "title": "1. Diagnoza", "text": "Sytuacja, zasoby, przeszkody. Krótko i na temat." },
    { "title": "2. Plan 30–60–90", "text": "Kroki, terminy, progi decyzyjne. Jedna kartka, zero chaosu." },
    { "title": "3. Wdrożenie", "text": "Nawyki, narzędzia, rozmowy (np. z pracodawcą/bankiem)." },
    { "title": "4. Monitorowanie", "text": "Krótki follow-up i korekty, by efekt został z Tobą." }
  ],
  "oferta": [
    {
      "title": "Konsultacja 60 minut",
      "desc": "Szybka diagnoza finansowo-zawodowa, priorytety i pierwsze kroki.",
      "bullets": ["Brief potrzeb i celów", "3 kluczowe decyzje do podjęcia", "Mini-plan na 2 tygodnie"],
      "price": "249 zł"
    },
    {
      "title": "Pakiet „Reset finansowy” – 3 sesje",
      "desc": "Porządkujemy budżet, decyzje i nawyki. Spokój i przewidywalność.",
      "bullets": ["Plan 30–60–90 dni", "Szablony i arkusze (budżet, bufor, długi)", "E-mail follow-up po każdej sesji"],
      "price": "699 zł"
    },
    {
      "title": "Pakiet „Kierunek praca” – 5 sesji",
      "desc": "Zmiana/negocjacje/dalsza ścieżka. Decyzje w zgodzie z wartościami i finansami.",
      "bullets": ["Strategia zmiany lub rozwoju", "Trening rozmów + plan finansowy", "Materiały i checklisty"],
      "price": "1 099 zł"
    }
  ]
};

// === Load JSON & render (odporne na błędy plików) ===
function loadData() {
  // 1) data.json (względna ścieżka)
  fetchJSON('assets/data.json').then(function(data){
    if (!data) data = FALLBACK_DATA;

    initDlaKogoCarousel(data && data.dlaKogo || []);

    var procesMount = $('#procesCards');
    if (procesMount && Array.isArray(data.proces)) {
      procesMount.innerHTML = data.proces.map(cardProces).join('');
    }

    var ofertaMount = $('#ofertaCards');
    if (ofertaMount && Array.isArray(data.oferta)) {
      ofertaMount.innerHTML = data.oferta.map(cardOferta).join('');
      equalizeOfertaHeights();
    }

    // 2) FAQ (względna ścieżka)
    var faqMount = document.querySelector('#faqList');
    if (faqMount) {
      fetchJSON('assets/faq.json').then(function(faq){
        var items = (faq && Array.isArray(faq.items)) ? faq.items : [];
        faqMount.innerHTML = items.map(itemFaq).join('');
      });
    }
  });
}

// === O MNIE: wczytanie HTML z pliku (względna ścieżka) ===
function loadAboutContent() {
  var mount = document.getElementById('aboutContent');
  if (!mount) return;
  fetchHTML(
    'assets/about-content.html',
    mount,
    '<div class="container"><div class="card"><p class="muted">Nie udało się wczytać treści. Odśwież stronę.</p></div></div>'
  );
}

// Start
document.addEventListener('DOMContentLoaded', function(){
  loadData();
  loadAboutContent();
});

// Równe wysokości kart Oferty przy resize
window.addEventListener('resize', (function(){
  var rAF = null;
  return function(){
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(equalizeOfertaHeights);
  };
})());
window.addEventListener('load', equalizeOfertaHeights);
