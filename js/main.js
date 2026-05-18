/* =============================================
   CASA DA LIMPEZA — main.js
   - Máscara telefone: (45) 9 9999-9999
   - Máscara e validação e-mail
   - Validação completa do formulário
   - Integração Google Sheets via Apps Script
   - Lazy loading por IntersectionObserver
   - Auto-fill produto pelo botão dos cards
============================================= */

// ──────────────────────────────────────────────
// 1. CONFIGURAÇÃO — cole sua URL do Apps Script aqui
// ──────────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_Uu85jmmrTbPdcwYlJ6Szqjg1nKOc5CA2LIuJotR78LSImvvMOTyLD4c5rsVBICQ/exec';

// ──────────────────────────────────────────────
// 2. MÁSCARA DE TELEFONE  (45) 9 9999-9999
// ──────────────────────────────────────────────
function maskPhone(value) {
  let v = value.replace(/\D/g, '').slice(0, 11);
  if (v.length === 0) return '';
  if (v.length <= 2)  return `(${v}`;
  if (v.length <= 3)  return `(${v.slice(0,2)}) ${v.slice(2)}`;
  if (v.length <= 7)  return `(${v.slice(0,2)}) ${v.slice(2,3)} ${v.slice(3)}`;
  return `(${v.slice(0,2)}) ${v.slice(2,3)} ${v.slice(3,7)}-${v.slice(7,11)}`;
}

const phoneInput = document.getElementById('telefone');
if (phoneInput) {
  phoneInput.addEventListener('input', function () {
    const pos = this.selectionStart;
    const prev = this.value.length;
    this.value = maskPhone(this.value);
    const delta = this.value.length - prev;
    try { this.setSelectionRange(pos + delta, pos + delta); } catch (_) {}
  });
}

// ──────────────────────────────────────────────
// 3. VALIDAÇÕES
// ──────────────────────────────────────────────
const validators = {
  nome:     v => v.trim().length >= 3,
  empresa:  v => v.trim().length >= 2,
  email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  telefone: v => /^\(\d{2}\) \d \d{4}-\d{4}$/.test(v.trim()),
  endereco: v => v.trim().length >= 8,
  produto:  v => v !== '',
};

const errors = {
  nome:     'Informe seu nome completo (mínimo 3 caracteres).',
  empresa:  'Informe o nome da empresa.',
  email:    'Informe um e-mail válido (ex: email@empresa.com.br).',
  telefone: 'Informe o telefone no formato (45) 9 9999-9999.',
  endereco: 'Informe o endereço completo.',
  produto:  'Selecione o produto de interesse.',
};

function validateField(name) {
  const el    = document.getElementById(name);
  const errEl = document.getElementById(`erro-${name}`);
  if (!el || !errEl) return true;

  const ok = validators[name](el.value);
  el.classList.toggle('invalid', !ok);
  el.classList.toggle('valid', ok);
  errEl.textContent = ok ? '' : errors[name];
  return ok;
}

// Validação em tempo real (blur)
['nome','empresa','email','telefone','endereco','produto'].forEach(name => {
  const el = document.getElementById(name);
  if (el) {
    el.addEventListener('blur', () => validateField(name));
    el.addEventListener('input', () => {
      if (el.classList.contains('invalid')) validateField(name);
    });
  }
});

// ──────────────────────────────────────────────
// 4. AUTO-FILL PRODUTO pelo botão dos cards
// ──────────────────────────────────────────────
document.querySelectorAll('[data-fill]').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const sel = document.getElementById('produto');
    if (!sel) return;
    const map = {
      detergente:  'Detergente 5L',
      desinfetante:'Desinfetante 5L',
    };
    const target = map[this.dataset.fill];
    if (target) {
      for (const opt of sel.options) {
        if (opt.value === target) { opt.selected = true; break; }
      }
      validateField('produto');
    }
  });
});

// ──────────────────────────────────────────────
// 5. ENVIO — Google Sheets via Apps Script
// ──────────────────────────────────────────────
const form      = document.getElementById('lead-form');
const successEl = document.getElementById('form-success');
const btnSubmit = document.getElementById('btn-submit');

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Valida todos os campos
    const fields = ['nome','empresa','email','telefone','endereco','produto'];
    const allOk  = fields.map(validateField).every(Boolean);
    if (!allOk) {
      // Scroll até o primeiro erro
      const firstErr = form.querySelector('.invalid');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Desabilita botão
    btnSubmit.disabled = true;
    btnSubmit.querySelector('.btn-text').style.display = 'none';
    btnSubmit.querySelector('.btn-loader').style.display = 'inline';

    const payload = {
      nome:      document.getElementById('nome').value.trim(),
      empresa:   document.getElementById('empresa').value.trim(),
      email:     document.getElementById('email').value.trim(),
      telefone:  document.getElementById('telefone').value.trim(),
      endereco:  document.getElementById('endereco').value.trim(),
      produto:   document.getElementById('produto').value,
      dataHora:  new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    };

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // no-cors retorna opaque — assumimos sucesso se não houve exceção
      form.style.display = 'none';
      successEl.style.display = 'block';
    } catch (err) {
      console.error('Erro ao enviar:', err);
      btnSubmit.disabled = false;
      btnSubmit.querySelector('.btn-text').style.display = 'inline';
      btnSubmit.querySelector('.btn-loader').style.display = 'none';
      alert('Erro ao enviar. Verifique sua conexão e tente novamente.');
    }
  });
}

// ──────────────────────────────────────────────
// 6. LAZY LOADING — IntersectionObserver
// ──────────────────────────────────────────────
const lazyEls = document.querySelectorAll('.lazy-section, .lazy-item');
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  lazyEls.forEach(el => obs.observe(el));
} else {
  // Fallback para navegadores antigos
  lazyEls.forEach(el => el.classList.add('visible'));
}

// ──────────────────────────────────────────────
// 7. SMOOTH SCROLL para CTAs internos
// ──────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
