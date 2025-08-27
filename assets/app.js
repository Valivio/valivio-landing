// Year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Contact form (mailto fallback)
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const msg = form.message.value.trim();
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
