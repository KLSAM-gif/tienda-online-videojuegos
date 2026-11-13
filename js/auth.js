/* =====================================================================
 * Gaming Store - Autenticación
 * ===================================================================== */
(function () {
  'use strict';
  const $ = GS.util.$;

  GS.auth = {
    /* Muestra el panel "Usuario no autenticado" en `container` si no hay sesión. */
    async requireAuth(container) {
      const u = await GS.api.me();
      if (!u) { GS.ui.errorPanel(container, GS.ui.errorByCode('UNAUTHENTICATED')); return null; }
      return u;
    },
    async logout() {
      await GS.api.logout();
      GS.ui.toast('Sesión cerrada', 'info');
      setTimeout(() => { location.href = GS.url('index.html'); }, 300);
    }
  };

  function showError(msg) { const b = $('#formError'); if (b) { b.textContent = msg; b.hidden = !msg; } }
  const nextUrl = () => GS.url(GS.util.safeNext(GS.util.params().get('next')) || 'index.html');

  /* ----- login.html ----- */
  const lf = $('#loginForm');
  if (lf) {
    lf.addEventListener('submit', async e => {
      e.preventDefault(); showError('');
      const btn = $('button[type=submit]', lf); btn.disabled = true;
      try {
        const user = await GS.api.login($('#loginEmail').value, $('#loginPassword').value);
        location.href = user.role === 'admin' ? GS.url('pages/admin.html') : nextUrl();
      } catch (err) { showError(err.message); btn.disabled = false; }
    });
  }

  /* ----- register.html ----- */
  const rf = $('#registerForm');
  if (rf) {
    rf.addEventListener('submit', async e => {
      e.preventDefault(); showError('');
      if ($('#regPassword').value !== $('#regPassword2').value) return showError('Las contraseñas no coinciden.');
      const btn = $('button[type=submit]', rf); btn.disabled = true;
      try {
        await GS.api.register({
          name: $('#regName').value, username: $('#regUsername').value,
          email: $('#regEmail').value, password: $('#regPassword').value
        });
        location.href = nextUrl();
      } catch (err) { showError(err.message); btn.disabled = false; }
    });
  }
})();
