/* =============================================
   CASA DA LIMPEZA — main.js
   - Máscara telefone (45) 9 9999-9999
   - Validação campo a campo em tempo real
   - Multi-select checkboxes com thumbs visuais
   - Pré-seleção via botão dos cards
   - Textarea "outros produtos"
   - Envio Google Sheets via Apps Script
   - Lazy loading IntersectionObserver
   - Smooth scroll CTAs internos
   - Push dataLayer GTM em eventos chave
============================================= */

// ──────────────────────────────────────────────
// 1. CONFIGURAÇÃO — cole sua URL do Apps Script
// ──────────────────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx1EEiJLecyxr6ohey3LlSFR2F8JYckE3aN4rlhMpFr5Z6yh8kDDBuY4ZGM0KnfLGNH/exec';

// Mapeamento: valor do checkbox → src da imagem e label
const PRODUTO_MAP = {
  'Detergente 5L': {
    img: 'img/detergente.png',
    alt: 'Detergente 5L',
    label: 'Detergente 5L',
  },
  'Desinfetante 5L': {
    img: 'img/desinfetante.png',
    alt: 'Desinfetante 5L',
    label: 'Desinfetante 5L',
  },
  'Quero escolher outros produtos': {
    img: 'img/outros-produtos.png',
    alt: 'Outros Produtos',
    label: 'Outros Produtos',
  },
};

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
    const pos  = this.selectionStart;
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
  rua:      v => v.trim().length >= 3,
  numero:   v => v.trim().length >= 1,
  cidade:   v => v.trim().length >= 2,
};

const errorMessages = {
  nome:     'Informe seu nome completo (mínimo 3 caracteres).',
  empresa:  'Informe o nome da empresa.',
  email:    'Informe um e-mail válido (ex: email@empresa.com.br).',
  telefone: 'Informe o telefone no formato (45) 9 9999-9999.',
  rua:      'Informe o nome da rua ou avenida.',
  numero:   'Informe o número.',
  cidade:   'Informe a cidade.',
};

function validateField(name) {
  const el    = document.getElementById(name);
  const errEl = document.getElementById(`erro-${name}`);
  if (!el || !errEl) return true;

  const ok = validators[name](el.value);
  el.classList.toggle('invalid', !ok);
  el.classList.toggle('valid',   ok);
  errEl.textContent = ok ? '' : errorMessages[name];
  return ok;
}

function validateProdutos() {
  const checked = document.querySelectorAll('input[name="produtos"]:checked');
  const errEl   = document.getElementById('erro-produtos');
  const ok      = checked.length > 0;
  if (errEl) errEl.textContent = ok ? '' : 'Selecione pelo menos um produto.';
  return ok;
}

// Validação em tempo real (blur)
['nome','empresa','email','telefone','rua','numero','cidade'].forEach(name => {
  const el = document.getElementById(name);
  if (!el) return;
  el.addEventListener('blur',  () => validateField(name));
  el.addEventListener('input', () => {
    if (el.classList.contains('invalid')) validateField(name);
  });
});

// ──────────────────────────────────────────────
// 4. THUMBS DE PRODUTO — atualiza imagens selecionadas
// ──────────────────────────────────────────────
function updateThumbs() {
  const thumbsContainer = document.getElementById('produtos-thumbs');
  const wrapper         = document.getElementById('produtos-selecionados');
  if (!thumbsContainer || !wrapper) return;

  const checked = [...document.querySelectorAll('input[name="produtos"]:checked')];
  thumbsContainer.innerHTML = '';

  if (checked.length === 0) {
    wrapper.style.display = 'none';
    return;
  }

  wrapper.style.display = 'block';

  checked.forEach(cb => {
    const info = PRODUTO_MAP[cb.value];
    if (!info) return;

    const div  = document.createElement('div');
    div.className = 'produto-thumb';

    const img  = document.createElement('img');
    img.src    = info.img;
    img.alt    = info.alt;
    img.loading = 'lazy';

    const span = document.createElement('span');
    span.textContent = info.label;

    div.appendChild(img);
    div.appendChild(span);
    thumbsContainer.appendChild(div);
  });
}

// Escuta mudanças nos checkboxes
document.querySelectorAll('input[name="produtos"]').forEach(cb => {
  cb.addEventListener('change', () => {
    updateThumbs();
    validateProdutos();

    // Push GTM: produto selecionado
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
        event: 'produto_selecionado',
        produto: cb.value,
        acao: cb.checked ? 'marcado' : 'desmarcado',
      });
    }
  });
});

// ──────────────────────────────────────────────
// 5. PRÉ-SELEÇÃO pelo botão dos cards
// ──────────────────────────────────────────────
const FILL_MAP = {
  detergente:   'Detergente 5L',
  desinfetante: 'Desinfetante 5L',
};

document.querySelectorAll('[data-fill]').forEach(btn => {
  btn.addEventListener('click', function () {
    const valor = FILL_MAP[this.dataset.fill];
    if (!valor) return;

    const cb = document.querySelector(`input[name="produtos"][value="${valor}"]`);
    if (cb && !cb.checked) {
      cb.checked = true;
      updateThumbs();
    }

    // Push GTM: CTA card clicado
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
        event: 'cta_produto_clicado',
        produto: valor,
      });
    }
  });
});

// ──────────────────────────────────────────────
// 6. ENVIO — Google Sheets via Apps Script
// ──────────────────────────────────────────────
const form      = document.getElementById('lead-form');
const successEl = document.getElementById('form-success');
const btnSubmit = document.getElementById('btn-submit');

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Validar campos de texto
    const campos = ['nome','empresa','email','telefone','rua','numero','cidade'];
    const camposOk = campos.map(validateField).every(Boolean);
    const produtosOk = validateProdutos();

    if (!camposOk || !produtosOk) {
      const firstErr = form.querySelector('.invalid, #erro-produtos:not(:empty)');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Desabilitar botão
    btnSubmit.disabled = true;
    btnSubmit.querySelector('.btn-text').style.display  = 'none';
    btnSubmit.querySelector('.btn-loader').style.display = 'inline';

    // Montar lista de produtos selecionados
    const produtosSelecionados = [...document.querySelectorAll('input[name="produtos"]:checked')]
      .map(cb => cb.value)
      .join(' + ');

    const payload = {
      nome:           document.getElementById('nome').value.trim(),
      empresa:        document.getElementById('empresa').value.trim(),
      email:          document.getElementById('email').value.trim(),
      telefone:       document.getElementById('telefone').value.trim(),
      rua:            document.getElementById('rua').value.trim(),
      numero:         document.getElementById('numero').value.trim(),
      cidade:         document.getElementById('cidade').value.trim(),
      produtos:       produtosSelecionados,
      outrosProdutos: document.getElementById('outros-produtos').value.trim(),
      dataHora:       new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    };

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode:   'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      // Push GTM: conversão
      if (typeof window.dataLayer !== 'undefined') {
        window.dataLayer.push({
          event:    'lead_enviado',
          produtos: produtosSelecionados,
          cidade:   payload.cidade,
        });
      }

      // Redirecionar para página de sucesso
      window.location.href = 'obrigado.html';

    } catch (err) {
      console.error('Erro ao enviar:', err);
      btnSubmit.disabled = false;
      btnSubmit.querySelector('.btn-text').style.display  = 'inline';
      btnSubmit.querySelector('.btn-loader').style.display = 'none';
      alert('Erro ao enviar. Verifique sua conexão e tente novamente.');
    }
  });
}

// ──────────────────────────────────────────────
// 7. LAZY LOADING — IntersectionObserver
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
  lazyEls.forEach(el => el.classList.add('visible'));
}

// ──────────────────────────────────────────────
// 8. SMOOTH SCROLL para CTAs internos
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
