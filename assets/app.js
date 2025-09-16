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

// === Karuzela "Dla kogo": 6 kart, 3 widoczne, przesuw o 1 ===
function initDlaKogoCarousel(items) {
  const mount = $('#dlaKogoCards');
  if (!mount || !Array.isArray(items) || items.length === 0) return;

  const VISIBLE = 3;
  let idx = 0;
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  function renderAt(start) {
    const n = items.length;
    const count = Math.min(VISIBLE, n);
    const chunks = [];
    for (let i = 0; i < count; i++) {
      chunks.push(cardDlaKogo(items[(start + i) % n]));
    }
    mount.innerHTML = chunks.join('');
  }

  // Jeśli kart jest <=3, po prostu renderuj wszystkie i wyjdź.
  renderAt(0);
  if (items.length <= VISIBLE || prefersReduced) return;

  // Auto-przewijanie o 1 co 4 sekundy, pauza na hover/tap
  let timer = setInterval(() => {
    idx = (idx + 1) % items.length;
    renderAt(idx);
    // krótka klasa do subtelnej animacji (jeśli chcesz efekt)
    mount.classList.add('dk-fade');
    setTimeout(() => mount.classList.remove('dk-fade'), 320);
  }, 4000);

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
