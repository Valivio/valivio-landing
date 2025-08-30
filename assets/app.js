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

// === Render kart z JSON ===
const $ = (sel) => document.querySelector(sel);

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

// UWAGA: kolejność .meta w ofercie jest ważna (CSS używa :first-of-type i :nth-of-type(2))
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

async function loadData() {
  try {
    const res = await fetch('assets/data.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Dla kogo
    const dlaKogoMount = $('#dlaKogoCards');
    if (dlaKogoMount && Array.isArray(data.dlaKogo)) {
      dlaKogoMount.innerHTML = data.dlaKogo.map(cardDlaKogo).join('');
    }

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
    // Łagodne wyciszenie – strona i tak działa z pustymi kontenerami
    console.error('Nie udało się wczytać assets/data.json:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadData);
