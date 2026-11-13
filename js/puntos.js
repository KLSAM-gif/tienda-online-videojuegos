/* =====================================================================
 * Gaming Store - Gaming Points: "Mis Gaming Points" y "Canjear puntos".
 * Reglas (en api.js): 1 punto por cada $10 pagados, 1 punto = $1 de descuento,
 * puntos solo tras compra exitosa, sin puntos por cancelaciones/reembolsos,
 * lo pagado con puntos no genera puntos y no se pueden usar más de los disponibles.
 * Con backend: GET /api/points, GET /api/rewards, POST /api/rewards/{id}/redeem
 * ===================================================================== */
(function () {
  'use strict';
  const $ = GS.util.$, $$ = GS.util.$$, esc = GS.util.esc, money = GS.util.money;
  const KIND = { compra: 'Compra', canje: 'Canje', descuento: 'Descuento aplicado', reversa: 'Reversa por cancelación', reembolso: 'Reembolso de puntos' };

  const levelBadge = l => '<span class="level-badge" style="color:' + l.color + '">' + l.icon + ' ' + l.name + '</span>';
  const rewardArt = r => GS.ui.art({ id: r.id, name: r.name, colors: r.colors, icon: r.icon }, { w: 480, h: 360, title: false });
  GS.points = { levelBadge, rewardArt };

  /* ---------- Mis Gaming Points ---------- */
  GS.points.renderMisPuntos = async function (container) {
    const [pts, rewards] = await Promise.all([GS.api.getPoints(), GS.api.getRewards()]);
    const lv = pts.level, levels = GS.calc.levels();
    const upcoming = rewards.filter(r => r.cost > pts.balance).sort((a, b) => a.cost - b.cost).slice(0, 3);
    const levelMsg = lv.next
      ? 'Te faltan <strong>' + lv.remaining + ' puntos</strong> para el nivel ' + lv.next.name + ' ' + lv.next.icon
      : '¡Alcanzaste el nivel máximo!';

    container.innerHTML =
      '<div class="points-hero">' +
      '<div class="panel"><div class="muted small">Saldo actual</div><div class="big-number">' + pts.balance + ' <span style="font-size:1.1rem">pts</span></div>' +
      '<p class="small muted" style="margin:6px 0 14px">Equivalen a ' + money(pts.balance * GS.CONFIG.pointValueMXN) + ' de descuento.</p>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' + levelBadge(lv.current) + '<span class="small muted">' + pts.earned + ' puntos acumulados en total</span></div>' +
      '<div class="progress" role="progressbar" aria-valuenow="' + lv.progress + '" aria-valuemin="0" aria-valuemax="100"><div class="bar" style="width:' + lv.progress + '%"></div></div>' +
      '<p class="small muted" style="margin:8px 0 0">' + levelMsg + '</p></div>' +
      '<div class="panel"><div class="panel-title">Resumen</div>' +
      '<div class="sum-row"><span>Puntos obtenidos por compras</span><span class="pos">+' + pts.earned + '</span></div>' +
      '<div class="sum-row"><span>Puntos utilizados</span><span class="neg">−' + pts.used + '</span></div>' +
      '<div class="sum-row total"><span>Saldo disponible</span><span>' + pts.balance + '</span></div></div></div>' +

      '<div class="panel"><div class="panel-title">Próximas recompensas</div>' +
      (upcoming.length ? '<div class="grid-3">' + upcoming.map(r =>
        '<div class="stat-card"><div class="s-icon">' + r.icon + '</div><strong>' + esc(r.name) + '</strong>' +
        '<div class="progress" style="margin:10px 0 6px"><div class="bar" style="width:' + Math.min(100, Math.round(pts.balance / r.cost * 100)) + '%"></div></div>' +
        '<div class="small muted">' + pts.balance + ' / ' + r.cost + ' pts · faltan <strong>' + (r.cost - pts.balance) + '</strong></div></div>').join('') + '</div>'
        : '<p class="muted">¡Ya tienes puntos para canjear todas las recompensas disponibles!</p>') +
      '<a class="btn btn-orange btn-sm" style="margin-top:14px" href="' + GS.url('pages/recompensas.html') + '">Ir a canjear puntos</a></div>' +

      '<div class="panel"><div class="panel-title">Niveles de fidelidad</div><div class="table-wrap"><table class="table level-table"><thead><tr><th>Nivel</th><th>Puntos acumulados requeridos</th><th></th></tr></thead><tbody>' +
      levels.map(l => '<tr><td style="color:' + l.color + '">' + l.icon + ' ' + l.name + '</td><td>' + l.min + '+</td><td>' + (l.id === lv.current.id ? '<span class="status-pill st-ok">Tu nivel</span>' : '') + '</td></tr>').join('') +
      '</tbody></table></div><p class="small muted" style="margin:10px 0 0">El nivel se calcula con los puntos obtenidos por compras. Los umbrales se pueden configurar en Opciones y configuración.</p></div>' +

      '<div class="panel"><div class="panel-title">Historial de movimientos</div>' +
      (pts.movements.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Movimiento</th><th>Puntos</th><th>Saldo</th></tr></thead><tbody>' +
        pts.movements.map(m => '<tr><td>' + GS.util.date(m.date) + '</td><td>' + esc(m.concept) + '<div class="small muted">' + (KIND[m.kind] || m.kind) + '</div></td><td class="' + (m.points >= 0 ? 'pos' : 'neg') + '">' + (m.points >= 0 ? '+' : '') + m.points + '</td><td>' + m.balance + '</td></tr>').join('') +
        '</tbody></table></div>' : '<p class="muted">Aún no tienes movimientos. ¡Realiza tu primera compra para empezar a acumular puntos!</p>') + '</div>';
  };

  /* ---------- Canjear puntos ---------- */
  const root = $('#rewardsPage');
  if (!root) return;

  async function renderRewards() {
    const [user, rewards] = await Promise.all([GS.api.me(), GS.api.getRewards()]);
    const bal = user ? user.points.balance : 0;
    let redeemed = [];
    if (user) redeemed = await GS.api.getRedeemed();

    root.innerHTML =
      '<div class="page-title"><h1>Canjear puntos</h1><p>Cambia tus Gaming Points por recompensas exclusivas.</p></div>' +
      (user
        ? '<div class="panel" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;margin-bottom:24px"><div><div class="muted small">Tu saldo</div><div class="big-number" style="font-size:2.4rem">' + bal + ' pts</div></div><div>' + levelBadge(user.level.current) + '</div><a class="btn btn-ghost" href="' + GS.url('pages/perfil.html#puntos') + '">Ver mis Gaming Points</a></div>'
        : '<div class="alert alert-info">Inicia sesión para ver tu saldo y canjear recompensas. <a href="' + GS.url('login.html?next=' + encodeURIComponent('pages/recompensas.html')) + '">Iniciar sesión</a></div>') +
      '<div class="grid-cards" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">' +
      rewards.map(r => {
        const missing = r.cost - bal;
        const can = user && missing <= 0;
        return '<article class="reward-card"><img src="' + rewardArt(r) + '" alt="" loading="lazy"><div class="reward-body"><h3 style="margin:0">' + esc(r.name) + '</h3><p>' + esc(r.desc) + '</p>' +
          '<div class="reward-cost">⭐ ' + r.cost + ' puntos</div>' +
          (user && missing > 0 ? '<div class="reward-missing">Te faltan ' + missing + ' puntos para canjear esta recompensa.</div>' : '') +
          '<button class="btn ' + (can || !user ? 'btn-orange' : 'btn-disabled') + '" data-redeem="' + esc(r.id) + '"' + (user && !can ? ' disabled' : '') + '>Canjear</button></div></article>';
      }).join('') + '</div>' +
      (user ? '<div class="panel" style="margin-top:30px"><div class="panel-title">Mis canjes</div>' + (redeemed.length
        ? '<div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Recompensa</th><th>Puntos</th><th>Código / detalle</th></tr></thead><tbody>' +
          redeemed.map(x => '<tr><td>' + GS.util.date(x.date) + '</td><td>' + esc(x.name) + '</td><td class="neg">−' + x.cost + '</td><td>' +
            (x.code ? '<code>' + esc(x.code) + '</code>' : x.type === 'wallpaper' ? '<button class="btn btn-ghost btn-sm" data-wall="1">Descargar (simulado)</button>' : esc(x.note || '—')) + '</td></tr>').join('') +
          '</tbody></table></div>' : '<p class="muted">Todavía no has canjeado recompensas.</p>') + '</div>' : '');
  }

  function loginPrompt() {
    GS.ui.modal({
      title: 'Inicia sesión para canjear', body: '<p class="muted">Necesitas una cuenta de Gaming Store para usar tus Gaming Points.</p>',
      actions: [{ label: 'Cancelar', kind: 'ghost' }, { label: 'Iniciar sesión', kind: 'orange', onClick: () => { location.href = GS.url('login.html?next=' + encodeURIComponent('pages/recompensas.html')); } }]
    });
  }

  root.addEventListener('click', async e => {
    if (e.target.closest('[data-wall]')) { GS.ui.toast('Descarga simulada: en la versión final se entregará el pack de fondos.', 'info'); return; }
    const b = e.target.closest('[data-redeem]');
    if (!b || b.disabled) return;
    const user = await GS.api.me();
    if (!user) return loginPrompt();
    const r = (await GS.api.getRewards()).find(x => x.id === b.dataset.redeem);
    GS.ui.modal({
      title: 'Confirmar canje',
      body: '<p>¿Canjear <strong>' + esc(r.name) + '</strong> por <strong>' + r.cost + ' puntos</strong>?</p><p class="muted small">Saldo actual: ' + user.points.balance + ' pts · Saldo después del canje: ' + (user.points.balance - r.cost) + ' pts</p>',
      actions: [{ label: 'Cancelar', kind: 'ghost' }, {
        label: 'Canjear', kind: 'orange', onClick: async (close, btn) => {
          btn.disabled = true;
          try {
            const res = await GS.api.redeemReward(r.id);
            close();
            const x = res.redeemed;
            GS.ui.modal({
              title: '¡Canje exitoso! 🎉',
              body: '<p>Canjeaste <strong>' + esc(x.name) + '</strong>.</p>' +
                (x.code ? '<div class="key-box"><code>' + esc(x.code) + '</code></div><p class="small muted">Se guardó en tu cuenta como saldo de ' + money(x.value) + '. Podrás aplicarlo en el paso 4 del checkout.</p>' : '') +
                (x.note ? '<p class="small muted">' + esc(x.note) + '</p>' : '') +
                '<p>Nuevo saldo: <strong>' + res.balance + ' puntos</strong></p>',
              actions: [{ label: 'Listo', kind: 'orange' }]
            });
            GS.renderHeader(); renderRewards();
          } catch (err) {
            close();
            if (err.code === 'INSUFFICIENT_POINTS') GS.ui.toast('Te faltan ' + err.extra.missing + ' puntos para este canje.', 'error');
            else GS.ui.toast(err.message, 'error');
            renderRewards();
          }
        }
      }]
    });
  });

  renderRewards();
})();
