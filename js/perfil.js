/* Gaming Store - Perfil de usuario y dashboard.
 * Con backend: GET/PUT /api/users/me, GET /api/orders, GET /api/library, GET /api/points */
(async function () {
  'use strict';
  const root = document.getElementById('profilePage');
  if (!root) return;
  const $ = GS.util.$, $$ = GS.util.$$, esc = GS.util.esc, money = GS.util.money;

  let user = await GS.auth.requireAuth(root);
  if (!user) return;

  const AVATARS = ['🎮', '🕹️', '👾', '🚀', '🐉', '🦊', '⚔️', '🏆', '🎧', '🔥'];
  const SECTIONS = { dashboard: 'Dashboard', cuenta: 'Editar mi cuenta', opciones: 'Opciones y configuración', tema: 'Cambiar tema y fondo', puntos: 'Mis Gaming Points' };
  let section = SECTIONS[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard';

  function layout() {
    const lv = user.level;
    root.innerHTML =
      '<div class="profile-layout"><aside><div class="panel profile-card">' +
      '<div class="avatar avatar-lg">' + esc(user.avatar) + '</div><h2>' + esc(user.name) + '</h2>' +
      '<div class="muted">@' + esc(user.username) + '</div>' +
      '<div style="margin:10px 0">' + GS.points.levelBadge(lv.current) + '</div>' +
      '<div class="progress"><div class="bar" style="width:' + lv.progress + '%"></div></div>' +
      '<div class="small muted" style="margin-top:6px">' + (lv.next ? lv.remaining + ' pts para ' + lv.next.name : 'Nivel máximo') + '</div>' +
      '<div style="margin-top:12px"><span class="points-note">⭐ ' + user.points.balance + ' puntos</span></div>' +
      '<p class="small muted" style="margin:12px 0 0">Miembro desde ' + GS.util.date(user.createdAt) + '</p>' +
      '<nav class="side-menu" aria-label="Opciones del perfil">' +
      '<button data-sec="dashboard">📊 Dashboard</button>' +
      '<button data-sec="cuenta">✏️ Editar mi cuenta</button>' +
      '<button data-sec="opciones">⚙️ Opciones y configuración</button>' +
      '<button data-sec="tema">🎨 Cambiar tema y fondo</button>' +
      '<a href="' + GS.url('pages/pedidos.html') + '">📦 Historial de pedidos</a>' +
      '<button data-sec="puntos">⭐ Mis Gaming Points</button>' +
      '<a href="' + GS.url('pages/biblioteca.html') + '">📚 Mi biblioteca digital</a>' +
      '<button class="logout" id="logoutSide">🚪 Cerrar sesión</button></nav></div></aside>' +
      '<section id="profileMain"></section></div>';
    $('#logoutSide').addEventListener('click', () => GS.auth.logout());
    $$('[data-sec]', root).forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.sec; }));
    show();
  }

  async function show() {
    $$('[data-sec]', root).forEach(b => b.classList.toggle('active', b.dataset.sec === section));
    const box = $('#profileMain');
    if (section === 'dashboard') await dashboard(box);
    else if (section === 'cuenta') account(box);
    else if (section === 'opciones') options(box);
    else if (section === 'tema') theme(box);
    else if (section === 'puntos') await GS.points.renderMisPuntos(box);
  }

  async function dashboard(box) {
    const [orders, lib, redeemed] = await Promise.all([GS.api.getOrders(), GS.api.getLibrary(), GS.api.getRedeemed()]);
    const valid = orders.filter(o => o.status !== 'Cancelado');
    const recent = orders.slice(0, 4);
    const stat = (icon, n, label) => '<div class="stat-card"><div class="s-icon">' + icon + '</div><div class="s-num">' + n + '</div><div class="s-label">' + label + '</div></div>';
    box.innerHTML = '<h1>Hola, ' + esc(user.name.split(' ')[0]) + ' 👋</h1>' +
      '<div class="stat-grid">' + stat('🎮', lib.length, 'Juegos adquiridos') + stat('📦', valid.length, 'Pedidos realizados') + stat('⭐', user.points.balance, 'Puntos disponibles') + stat('🎁', redeemed.length, 'Recompensas canjeadas') + '</div>' +
      '<div class="panel"><div class="panel-title"><span>Compras recientes</span><a class="link-more" href="' + GS.url('pages/pedidos.html') + '">Ver todos →</a></div>' +
      (recent.length ? recent.map(o =>
        '<div class="order-card" style="margin-bottom:10px"><div class="order-head"><div><strong>' + esc(o.id) + '</strong> <span class="muted small">· ' + GS.util.date(o.createdAt) + '</span></div>' +
        '<span class="status-pill ' + (o.status === 'Cancelado' ? 'st-bad' : o.finished ? 'st-ok' : 'st-warn') + '">' + esc(o.statusLabel) + '</span></div>' +
        '<div class="order-items">' + o.items.map(i => '<span class="order-item">' + esc(i.name) + (i.qty > 1 ? ' ×' + i.qty : '') + '</span>').join('') + '</div>' +
        '<div class="small muted">Total pagado: <strong>' + money(o.total) + '</strong> · +' + o.earnedPoints + ' pts</div></div>').join('')
        : '<p class="muted">Aún no tienes compras. <a href="' + GS.url('pages/catalogo.html') + '">Explora el catálogo</a>.</p>') + '</div>';
  }

  function account(box) {
    let avatar = user.avatar;
    box.innerHTML = '<div class="panel"><h2>Editar mi cuenta</h2><div id="accErr" class="alert alert-error" hidden></div>' +
      '<form id="accForm" novalidate><div class="field-row"><div class="field"><label for="aName">Nombre</label><input id="aName" value="' + esc(user.name) + '" required></div>' +
      '<div class="field"><label for="aUser">Nombre de usuario</label><input id="aUser" value="' + esc(user.username) + '" required></div></div>' +
      '<div class="field"><label for="aEmail">Correo electrónico</label><input id="aEmail" type="email" value="' + esc(user.email) + '" required></div>' +
      '<div class="field"><label for="aPass">Nueva contraseña (opcional)</label><input id="aPass" type="password" autocomplete="new-password" placeholder="Déjalo vacío para no cambiarla"><span class="hint">Demostración: no se guarda de forma segura.</span></div>' +
      '<div class="field"><label>Avatar</label><div class="avatar-picker">' + AVATARS.map(a => '<button type="button" data-av="' + a + '" class="' + (a === avatar ? 'active' : '') + '">' + a + '</button>').join('') + '</div></div>' +
      '<button class="btn btn-orange" type="submit">Guardar cambios</button></form></div>';
    $$('[data-av]', box).forEach(b => b.addEventListener('click', () => {
      avatar = b.dataset.av; $$('[data-av]', box).forEach(x => x.classList.toggle('active', x === b));
    }));
    $('#accForm').addEventListener('submit', async e => {
      e.preventDefault();
      try {
        user = await GS.api.updateProfile({ name: $('#aName').value, username: $('#aUser').value, email: $('#aEmail').value, newPassword: $('#aPass').value, avatar });
        GS.ui.toast('Cambios guardados', 'success'); GS.renderHeader(); layout();
      } catch (err) { const b = $('#accErr'); b.textContent = err.message; b.hidden = false; }
    });
  }

  function options(box) {
    const lv = GS.calc.levels();
    box.innerHTML = '<div class="panel"><h2>Opciones y configuración</h2>' +
      '<h3>Niveles de fidelidad</h3><p class="muted small">Puntos acumulados necesarios para alcanzar cada nivel (se aplican en este navegador).</p><div id="optErr" class="alert alert-error" hidden></div>' +
      '<form id="lvForm"><div class="field-row three">' +
      lv.slice(1).map((l, i) => '<div class="field"><label for="lv' + i + '">' + l.icon + ' ' + l.name + '</label><input id="lv' + i + '" type="number" min="1" step="1" value="' + l.min + '"></div>').join('') +
      '</div><div class="hero-actions" style="margin:0"><button class="btn btn-orange" type="submit">Guardar niveles</button><button class="btn btn-ghost" type="button" id="lvReset">Restablecer</button></div></form></div>' +
      '<div class="panel"><h3>Reglas del programa</h3><ul class="muted"><li>1 punto por cada $' + GS.CONFIG.mxnPerPoint + ' MXN pagados.</li><li>1 punto equivale a $' + GS.CONFIG.pointValueMXN + ' MXN de descuento.</li><li>Los puntos se acreditan solo al confirmar una compra exitosa.</li></ul>' +
      '<p class="small muted">Estas reglas están en <code>js/data.js</code> (GS.CONFIG).</p></div>' +
      '<div class="panel"><h3>Datos de demostración</h3><p class="muted small">Restablece usuarios, pedidos, biblioteca, puntos y carrito a su estado inicial.</p><button class="btn btn-danger" id="resetDemo">Restablecer datos de demostración</button></div>';
    $('#lvForm').addEventListener('submit', async e => {
      e.preventDefault();
      try {
        await GS.api.saveLevels([0, +$('#lv0').value, +$('#lv1').value, +$('#lv2').value]);
        GS.ui.toast('Niveles actualizados', 'success'); user = await GS.api.me(); layout();
      } catch (err) { const b = $('#optErr'); b.textContent = err.message; b.hidden = false; }
    });
    $('#lvReset').addEventListener('click', async () => { await GS.api.resetLevels(); user = await GS.api.me(); GS.ui.toast('Niveles restablecidos', 'info'); layout(); });
    $('#resetDemo').addEventListener('click', async () => {
      if (!confirm('Se borrarán los datos de demostración de este navegador. ¿Continuar?')) return;
      await GS.api.resetDemo(); location.href = GS.url('index.html');
    });
  }

  function theme(box) {
    const cur = GS.theme.get();
    box.innerHTML = '<div class="panel"><h2>Cambiar tema y fondo</h2><h3>Tema de color</h3><div class="theme-grid">' +
      GS.THEMES.map(t => '<button class="theme-opt' + (t.id === cur.theme ? ' active' : '') + '" data-theme-id="' + t.id + '"><div class="swatches">' + t.colors.map(c => '<i style="background:' + c + '"></i>').join('') + '</div><strong>' + t.name + '</strong></button>').join('') + '</div>' +
      '<h3 style="margin-top:22px">Fondo</h3><div class="theme-grid">' +
      GS.BACKGROUNDS.map(b => '<button class="theme-opt' + (b.id === cur.bg ? ' active' : '') + '" data-bg-id="' + b.id + '"><strong>' + b.name + '</strong></button>').join('') + '</div></div>';
    box.onclick = e => {
      const t = e.target.closest('[data-theme-id]'), b = e.target.closest('[data-bg-id]');
      if (!t && !b) return;
      const n = GS.theme.get();
      if (t) n.theme = t.dataset.themeId;
      if (b) n.bg = b.dataset.bgId;
      GS.theme.set(n); theme(box);
      GS.ui.toast('Apariencia actualizada', 'success');
    };
  }

  window.addEventListener('hashchange', () => {
    const s = location.hash.slice(1);
    if (SECTIONS[s]) { section = s; show(); }
  });
  layout();
})();
