/* =============================================
   CASA DA LIMPEZA — cookies.js
   Popup de consentimento de cookies
   - Aparece em todas as páginas
   - Salva preferência por 1 ano
   - Integrado com GTM (ativa/bloqueia tags)
============================================= */

const COOKIE_KEY     = 'cdl_cookies';
const COOKIE_EXPIRES = 365; // dias

// ── Lê o consentimento salvo ──
function getCookieConsent() {
  const match = document.cookie.match(new RegExp('(^| )' + COOKIE_KEY + '=([^;]+)'));
  return match ? match[2] : null;
}

// ── Salva o consentimento ──
function setCookieConsent(value) {
  const d = new Date();
  d.setTime(d.getTime() + COOKIE_EXPIRES * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_KEY}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

// ── Informa o GTM sobre o consentimento ──
function pushConsentToGTM(accepted) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: accepted ? 'cookie_aceito' : 'cookie_recusado',
    consentimento_cookies: accepted ? 'aceito' : 'recusado',
  });

  // Atualiza o gtag consent mode (GA4 + Google Ads)
  if (typeof gtag === 'function') {
    gtag('consent', 'update', {
      analytics_storage:     accepted ? 'granted' : 'denied',
      ad_storage:            accepted ? 'granted' : 'denied',
      ad_user_data:          accepted ? 'granted' : 'denied',
      ad_personalization:    accepted ? 'granted' : 'denied',
    });
  }
}

// ── Cria o popup ──
function createPopup() {
  const popup = document.createElement('div');
  popup.className = 'cookie-popup';
  popup.id = 'cookie-popup';
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Consentimento de cookies');

  popup.innerHTML = `
    <div class="cookie-popup__icon">🍪</div>
    <div class="cookie-popup__text">
      <p>
        Utilizamos cookies para melhorar sua experiência, analisar o tráfego e mensurar resultados de anúncios.
        Ao clicar em <strong>"Aceitar"</strong>, você concorda com nossa
        <a href="cookies.html">Política de Cookies</a> e
        <a href="privacidade.html">Política de Privacidade</a>.
      </p>
    </div>
    <div class="cookie-popup__actions">
      <button class="cookie-btn-accept" id="cookie-accept">Aceitar</button>
      <button class="cookie-btn-decline" id="cookie-decline">Recusar</button>
    </div>
  `;

  document.body.appendChild(popup);

  // Aceitar
  document.getElementById('cookie-accept').addEventListener('click', () => {
    setCookieConsent('aceito');
    pushConsentToGTM(true);
    closePopup();
  });

  // Recusar
  document.getElementById('cookie-decline').addEventListener('click', () => {
    setCookieConsent('recusado');
    pushConsentToGTM(false);
    closePopup();
  });
}

// ── Fecha o popup com animação ──
function closePopup() {
  const popup = document.getElementById('cookie-popup');
  if (!popup) return;
  popup.classList.add('hide');
  setTimeout(() => popup.remove(), 350);
}

// ── Inicializa o consent mode (antes do GTM carregar) ──
function initConsentMode() {
  window.dataLayer = window.dataLayer || [];
  if (typeof gtag !== 'function') {
    window.gtag = function(){ window.dataLayer.push(arguments); };
  }

  // Define padrão negado até o usuário escolher
  gtag('consent', 'default', {
    analytics_storage:  'denied',
    ad_storage:         'denied',
    ad_user_data:       'denied',
    ad_personalization: 'denied',
    wait_for_update:    500,
  });
}

// ── Executa ──
(function () {
  initConsentMode();

  const consent = getCookieConsent();

  if (consent === 'aceito') {
    // Já aceitou: ativa tracking diretamente
    pushConsentToGTM(true);
    return;
  }

  if (consent === 'recusado') {
    // Já recusou: mantém bloqueado
    pushConsentToGTM(false);
    return;
  }

  // Ainda não escolheu: mostra o popup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPopup);
  } else {
    createPopup();
  }
})();
