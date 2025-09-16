// === Footer year ===
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// === Kontakt (mailto fallback) ===
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name?.value.trim();
    const email = form.email?.value.trim();
    const msg = form.message?.value.trim();
    const status = document.getElementById('formStatus');

    if (!name || !email || !msg) {
      if (status) {
        status.textContent = 'Uzupełnij wszystkie pola.';
        status.style.color = '#b91c1c';
      }
      return;
    }

    const subject = encodeURIComponent('Zgłoszenie konsultacji – Valivio');
    const body = encodeURIComponent(
      `Imię i nazwisko: ${name}\nE-mail: ${email}\n\nWiadomość:\n${msg}`
    );
    window.location.href = `mailto:contact@valivio.example?subject=${subject}&body=${body}`;

    setTimeout(() => {
      form.reset();
      if (status) {
        status.textContent = 'Dziękuję! Jeśli e-mail się nie otworzył, napisz bezpośrednio na contact@valivio.example.';
        status.style.color = '#111';
      }
    }, 600);
  });
}

// === Helpers ===
const $ = (sel) => document.querySelector(sel);

// === Karty: renderery ===
function cardDlaKogo({ title, text }) {
  return `
    <article class="card">
      <h3 class="h3">${title}</h3>
      <p class="meta">${text}</p>
    </article>`;
}
function cardProces({ title, text }) {
  return `
    <article class="card">
      <h3 class="h3">${title}</h3>
      <p class="meta">${text}</p>
    </article>`;
}
function cardOferta({ kicker, title, desc, bullets = [], price }) {
  const items = bullets.map(li => `<li>${li}</li>`).join('');
  return `
    <article class="card">
      <p class="meta">${kicker}</p>
      <h3 class="h3">${title}</h3>
      <p class="meta">${desc}</p>
      <ul class="mt-12">${items}</ul>
      <p class="price mt-16">${price}</p>
      <a class="btn" href="#kontakt">Umów sesję</a>
    </article>`;
}

// === Karuzela "Dla kogo": 6 kart, widoczne 3, przesuw o 1 w poziomie ===
function initDlaKogoCarousel(items) {
  const mount = document.querySelector('#dlaKogoCards');
  if (!mount || !Array.isArray(items) || items.length === 0) return;

  // zdejmij stare klasy siatki, żeby nie walczyły z karuzelą
  mount.classList.remove('row', 'cols-3');

  // helpery
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const GAP = 24; // musi się zgadzać z --dk-gap w CSS (px)

  let VISIBLE = getVisible();
  let timer = null;
  let current = 0;     // index w obrębie "prawdziwych" elementów
  let track, viewport;

  function getVisible() {
    const w = window.innerWidth;
    if (w <= 680) return 1;
    if (w <= 960) return 2;
    return 3; // desktop
  }

  function build() {
    VISIBLE = getVisible();

    // zbuduj strukturę: viewport -> track -> karty (klony + oryginały + klony)
    mount.innerHTML = `
      <div class="dk-viewport">
        <div class="dk-track" style="--dk-visible:${VISIBLE}">
        </div>
      </div>
    `;
    viewport = mount.querySelector('.dk-viewport');
    track = mount.querySelector('.dk-track');

    const before = items.slice(-VISIBLE);      // klony na początek
    const after  = items.slice(0, VISIBLE);    // klony na koniec
    const full = [...before, ...items, ...after];

    track.innerHTML = full.map(cardDlaKogo).map(html => `<div class="dk-card">${html}</div>`).join('');

    // startujemy od pierwszego realnego elementu (po klonach z lewej)
    current = 0;
    jumpTo(current); // bez animacji
    startAuto();
  }

  function stepWidth() {
    const first = track.querySelector('.dk-card');
    if (!first) return 0;
    const w = first.getBoundingClientRect().width;
    return w + GAP; // szerokość karty + odstęp
  }

  function jumpTo(realIndex) {
    // realIndex w [0..items.length-1]
    const offsetCards = realIndex + VISIBLE;   // + klony przed
    const dist = -offsetCards * stepWidth();
    track.style.transition = 'none';
    track.style.transform = `translateX(${dist}px)`;
    // force reflow
    void track.offsetHeight;
    track.style.transition = 'transform .5s ease';
  }

  function moveRightByOne() {
    // "od lewej do prawej": przesuwamy widok w PRAWO, czyli pokazujemy poprzednią kartę
    current = (current - 1 + items.length) % items.length;
    const offsetCards = current + VISIBLE;
    const dist = -offsetCards * stepWidth();
    track.style.transform = `translateX(${dist}px)`;

    // gdy dojedziemy do lewego klona, zresetuj niepostrzeżenie
    if (current === items.length - 1) {
      // po zakończonej animacji przeskocz w to samo miejsce w realnej kolejce
      track.addEventListener('transitionend', handleLoopFix, { once: true });
    }
  }

  function handleLoopFix() {
    // jesteśmy wizualnie na klonie z lewej (ostatni realny item)
    // przeskocz bez animacji na realny ostatni
    jumpTo(items.length - 1);
  }

  function startAuto() {
    stopAuto();
    if (items.length <= VISIBLE || prefersReduced) return;
    timer = setInterval(moveRightByOne, 4000);
  }
  function stopAuto(){ if (timer) { clearInterval(timer); timer = null; } }

  // interakcje: pauza na hover / tap
  mount.addEventListener('mouseenter', stopAuto);
  mount.addEventListener('mouseleave', startAuto);
  mount.addEventListener('touchstart', () => { stopAuto(); setTimeout(startAuto, 6000); }, { passive:true });

  // rebuild przy zmianie rozmiaru (debounce)
  let rAF = null;
  window.addEventListener('resize', () => {
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(() => {
      const oldV = VISIBLE;
      const newV = getVisible();
      if (newV !== oldV) build(); // przebuduj gdy zmienia się liczba widocznych kart
      else { jumpTo(current); }   // inaczej tylko ustaw pozycję
    });
  });

  build();
}

  // Pauza na hover
  mount.addEventListener('mouseenter', () => { clearInterval(timer); });
  mount.addEventListener('mouseleave', () => {
    clearInterval(timer);
    timer = setInterval(() => {
      idx = (idx + 1) % items.length;
      renderAt(idx);
      mount.classList.add('dk-fade');
      setTimeout(() => mount.classList.remove('dk-fade'), 320);
    }, 4000);
  });

  // Krótka pauza po tapnięciu (mobile)
  mount.addEventListener('touchstart', () => {
    clearInterval(timer);
    setTimeout(() => {
      timer = setInterval(() => {
        idx = (idx + 1) % items.length;
        renderAt(idx);
        mount.classList.add('dk-fade');
        setTimeout(() => mount.classList.remove('dk-fade'), 320);
      }, 4000);
    }, 6000);
  }, { passive: true });
}

// === Load JSON & render ===
async function loadData() {
  try {
    const res = await fetch('assets/data.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Dla kogo – karuzela
    initDlaKogoCarousel(data.dlaKogo || []);

    // Jak pracuję
    const procesMount = $('#procesCards');
    if (procesMount && Array.isArray(data.proces)) {
      procesMount.innerHTML = data.proces.map(cardProces).join('');
    }

    // Oferta
    const ofertaMount = $('#ofertaCards');
    if (ofertaMount && Array.isArray(data.oferta)) {
      ofertaMount.innerHTML = data.oferta.map(cardOferta).join('');
    }
  } catch (err) {
    console.error('Nie udało się wczytać assets/data.json:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadData);
