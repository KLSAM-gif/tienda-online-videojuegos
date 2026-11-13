/* Gaming Store - Mi Biblioteca Digital.
 * Las claves son FICTICIAS (generadas en api.js) y la descarga es SIMULADA.
 * Con backend: GET /api/library, POST /api/library/{id}/download */
(async function () {
  'use strict';
  const root = document.getElementById('libraryPage');
  if (!root) return;
  const $ = GS.util.$, $$ = GS.util.$$, esc = GS.util.esc;

  const user = await GS.auth.requireAuth(root);
  if (!user) return;

  const games = await GS.api.getGames();
  const gm = {}; games.forEach(g => { gm[g.id] = g; });
  let lib = await GS.api.getLibrary();
  let tab = GS.DATA.platforms.find(pl => lib.some(l => l.platform === pl)) || 'PC';

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (_) { /* noop */ }
      ta.remove(); return ok;
    }
  }

  function render() {
    const items = lib.filter(l => l.platform === tab).sort((a, b) => new Date(b.acquiredAt) - new Date(a.acquiredAt));
    root.innerHTML =
      '<div class="page-title"><h1>Mi Biblioteca Digital</h1><p>Tus videojuegos digitales, claves de licencia y descargas.</p></div>' +
      '<div class="alert alert-info">Las claves mostradas son <strong>ficticias</strong> y la descarga es una <strong>simulación</strong> de demostración.</div>' +
      '<div class="toolbar"><div class="seg" id="libTabs">' +
      GS.DATA.platforms.map(pl => '<button data-tab="' + pl + '" class="' + (pl === tab ? 'active' : '') + '">' + pl + ' (' + lib.filter(l => l.platform === pl).length + ')</button>').join('') +
      '</div><span class="muted">' + lib.length + ' juego(s) en total</span></div>' +
      (items.length
        ? '<div class="lib-grid">' + items.map(l => {
          const g = gm[l.productId] || { id: l.productId, name: l.name, colors: ['#1261A0', '#27A9E0'] };
          return '<article class="lib-card" data-lib="' + esc(l.id) + '"><img src="' + GS.ui.art(g) + '" alt="Portada de ' + esc(l.name) + '">' +
            '<div><h3 style="margin-bottom:4px">' + esc(l.name) + '</h3>' +
            '<div class="gc-meta"><span class="chip chip-' + l.platform.toLowerCase() + '">' + esc(l.platform) + '</span>' + (l.downloaded ? '<span class="chip">Descargado</span>' : '') + '</div>' +
            '<div class="small muted" style="margin-top:6px">Adquirido el ' + GS.util.date(l.acquiredAt) + ' · Pedido <a href="' + GS.url('pages/pedidos.html?id=' + encodeURIComponent(l.orderId)) + '">' + esc(l.orderId) + '</a></div>' +
            '<div class="key-box"><code>' + esc(l.key) + '</code><button class="btn btn-ghost btn-sm" data-copy="' + esc(l.key) + '">Copiar clave</button></div>' +
            '<div class="lib-actions"><button class="btn btn-orange btn-sm" data-dl="' + esc(l.id) + '">Descargar juego</button></div>' +
            '<div class="dl-bar" hidden><i></i></div></div></article>';
        }).join('') + '</div>'
        : '<div class="state-panel"><div class="state-icon">📚</div><h2>Aún no tienes juegos de ' + tab + '</h2><p class="muted">Cuando compres un videojuego digital aparecerá aquí automáticamente.</p><div class="state-actions"><a class="btn btn-orange" href="' + GS.url('pages/catalogo.html?plataforma=' + encodeURIComponent(tab)) + '">Explorar juegos de ' + tab + '</a></div></div>');
  }

  root.addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.tab) { tab = t.dataset.tab; render(); }
    else if (t.dataset.copy) {
      const ok = await copyText(t.dataset.copy);
      GS.ui.toast(ok ? 'Clave copiada al portapapeles' : 'No se pudo copiar. Selecciónala manualmente.', ok ? 'success' : 'error');
    } else if (t.dataset.dl) {
      const card = t.closest('.lib-card'), bar = $('.dl-bar', card), fill = $('i', bar);
      t.disabled = true; bar.hidden = false;
      let pct = 0;
      const timer = setInterval(async () => {
        pct = Math.min(100, pct + 5 + Math.random() * 7);
        fill.style.width = pct + '%';
        if (pct >= 100) {
          clearInterval(timer);
          await GS.api.markDownloaded(t.dataset.dl);
          const l = lib.find(x => x.id === t.dataset.dl); if (l) l.downloaded = true;
          GS.ui.toast('Descarga simulada completada: ' + (l ? l.name : ''), 'success');
          setTimeout(render, 600);
        }
      }, 150);
    }
  });

  render();
})();
