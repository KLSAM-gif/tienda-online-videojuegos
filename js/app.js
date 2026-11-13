/* =====================================================================
 * Gaming Store - Núcleo de interfaz: utilidades, temas, componentes
 * ===================================================================== */
(function () {
  'use strict';
  const BASE = (document.body && document.body.dataset.base) || '';

  GS.BASE = BASE;
  GS.url = p => BASE + p;
  GS.currentPath = () => {
    const f = location.pathname.split('/').pop() || 'index.html';
    return (BASE ? 'pages/' : '') + f + location.search;
  };

  /* ---------- Utilidades ---------- */
  GS.util = {
    $: (s, r) => (r || document).querySelector(s),
    $$: (s, r) => Array.from((r || document).querySelectorAll(s)),
    esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    money(n) {
      const v = Math.round((Number(n) || 0) * 100) / 100;
      return '$' + v.toLocaleString('es-MX', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
    },
    date(iso, withTime) {
      const d = new Date(iso);
      const o = { day: 'numeric', month: 'short', year: 'numeric' };
      if (withTime) { o.hour = '2-digit'; o.minute = '2-digit'; }
      return d.toLocaleDateString('es-MX', o);
    },
    params: () => new URLSearchParams(location.search),
    sleep: ms => new Promise(r => setTimeout(r, ms)),
    norm: s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(),
    safeNext(n) { return n && !/^([a-z]+:)?\/\//i.test(n) && n.indexOf('..') < 0 ? n : null; }
  };
  const $ = GS.util.$, $$ = GS.util.$$, esc = GS.util.esc, money = GS.util.money;

  /* ---------- Temas y fondos ---------- */
  GS.THEMES = [
    { id: 'clasico', name: 'Azul clásico', colors: ['#071A33', '#1261A0', '#FF8C32'] },
    { id: 'noche', name: 'Noche profunda', colors: ['#030b17', '#0e4f85', '#FF8C32'] },
    { id: 'neon', name: 'Neón', colors: ['#0a0f2c', '#2a3fd6', '#ff9a3c'] },
    { id: 'ocaso', name: 'Ocaso', colors: ['#1a1020', '#7a3a8c', '#FF8C32'] }
  ];
  GS.BACKGROUNDS = [
    { id: 'liso', name: 'Liso' },
    { id: 'cuadricula', name: 'Cuadrícula' },
    { id: 'resplandor', name: 'Resplandor' }
  ];
  GS.theme = {
    get() { return GS.storage.get('gs_theme', { theme: 'clasico', bg: 'resplandor' }); },
    apply(t) { document.documentElement.dataset.theme = t.theme; document.documentElement.dataset.bg = t.bg; },
    set(t) { GS.storage.set('gs_theme', t); GS.theme.apply(t); }
  };
  GS.theme.apply(GS.theme.get());

  /* ---------- Arte generado (Portadas SVG / Soporte de Imágenes Reales) ---------- */
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function wrapTitle(name, max) {
    const words = name.split(/\s+/), lines = []; let cur = '';
    words.forEach(w => {
      if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    return lines.slice(0, 4);
  }

  function art(p, o) {
    if (!p) return '';

    // Si existe una imagen asignada manualmente, devuelve su ruta directa
    if (p.image || p.imagen) {
      return p.image || p.imagen;
    }

    // Generador SVG por defecto en caso de no tener imagen
    o = o || {};
    const variant = o.variant || 0, w = o.w || 480, h = o.h || 640, title = o.title !== false;
    const c = p.colors || ['#1261A0', '#27A9E0'];
    const r = rng(hash(p.id) + variant * 7919);
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>' +
      '<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".82"/></linearGradient></defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#g)"/>';
    for (let i = 0; i < 7; i++) {
      const x = r() * w, y = r() * h, rad = 40 + r() * Math.min(w, h) * .45;
      if (r() > .5) s += '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + rad.toFixed(0) + '" fill="#fff" opacity="' + (.05 + r() * .14).toFixed(2) + '"/>';
      else s += '<polygon points="' + x.toFixed(0) + ',' + (y - rad).toFixed(0) + ' ' + (x + rad).toFixed(0) + ',' + (y + rad * .6).toFixed(0) + ' ' + (x - rad).toFixed(0) + ',' + (y + rad * .6).toFixed(0) + '" fill="#000" opacity="' + (.08 + r() * .15).toFixed(2) + '" transform="rotate(' + (r() * 360).toFixed(0) + ' ' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"/>';
    }
    if (p.icon) s += '<text x="' + w / 2 + '" y="' + (h * (title ? .42 : .5)) + '" font-size="' + Math.min(w, h) * .36 + '" text-anchor="middle" dominant-baseline="middle">' + p.icon + '</text>';
    s += '<rect width="' + w + '" height="' + h + '" fill="url(#f)"/>';
    if (title) {
      const fs = Math.round(w * .085), lines = wrapTitle(p.name, 15);
      s += '<text x="' + w * .07 + '" y="' + h * .07 + '" font-family="Segoe UI,Arial,sans-serif" font-size="' + w * .03 + '" font-weight="700" letter-spacing="3" fill="#fff" opacity=".75">GAMING STORE</text>';
      lines.forEach((ln, i) => {
        const y = h - h * .07 - (lines.length - 1 - i) * fs * 1.12;
        s += '<text x="' + w * .07 + '" y="' + y.toFixed(0) + '" font-family="Segoe UI,Arial,sans-serif" font-size="' + fs + '" font-weight="800" fill="#fff">' + xml(ln) + '</text>';
      });
    }
    s += '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  /* ---------- Componentes de UI ---------- */
  const ui = GS.ui = {
    art,
    cover: p => art(p),
    stars(rating) {
      if (!rating) return '<span class="muted small">Sin calificación</span>';
      return '<span class="stars" title="' + rating + ' de 5"><span style="width:' + (rating / 5 * 100) + '%">★★★★★</span>★★★★★</span> <span class="small muted">' + rating.toFixed(1) + '</span>';
    },
    priceBlock(p, qty) {
      const u = GS.calc.unitPrice(p);
      return p.discount
        ? '<span class="old">' + money(p.price) + '</span><span class="now">' + money(u) + '</span>'
        : '<span class="now">' + money(p.price) + '</span>';
    },
    platformChips(p) {
      if (p.type === 'fisico') return '<span class="chip chip-phys">Producto físico</span>';
      return p.platforms.map(x => '<span class="chip chip-' + x.toLowerCase() + '">' + x + '</span>').join('');
    },
    gameCard(p, ctx) {
      ctx = ctx || {};
      const out = p.type === 'fisico' && p.stock <= 0;
      let btn;
      if (!p.available) btn = '<button class="btn btn-disabled" disabled>Próximamente</button>';
      else if (out) btn = '<button class="btn btn-disabled" disabled>Sin existencias</button>';
      else btn = '<button class="btn btn-orange" data-add="' + esc(p.id) + '"' + (ctx.platform ? ' data-platform="' + esc(ctx.platform) + '"' : '') + '>Agregar</button>';
      const detail = GS.url('pages/detalles.html?id=' + encodeURIComponent(p.id));
      return '<article class="game-card">' +
        '<a class="gc-cover" href="' + detail + '" aria-label="Ver detalles de ' + esc(p.name) + '">' +
        '<img src="' + art(p) + '" alt="Portada de ' + esc(p.name) + '" loading="lazy">' +
        (p.discount && p.available ? '<span class="tag-discount">-' + p.discount + '%</span>' : '') +
        (!p.available ? '<span class="tag-soon">Próximamente</span>' : '') +
        (out ? '<span class="tag-soon">Agotado</span>' : '') +
        '</a><div class="gc-body"><h3 class="gc-title"><a href="' + detail + '">' + esc(p.name) + '</a></h3>' +
        '<div class="gc-meta">' + ui.platformChips(p) + '<span class="genre">' + esc(p.genre) + '</span></div>' +
        '<div class="gc-rating">' + ui.stars(p.rating) + '</div>' +
        '<div class="price-row">' + ui.priceBlock(p) + '</div>' +
        '<div class="gc-actions"><a class="btn btn-ghost" href="' + detail + '">Ver detalles</a>' + btn + '</div></div></article>';
    },

    toast(msg, type) {
      let box = $('#toasts');
      if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
      const t = document.createElement('div');
      t.className = 'toast toast-' + (type || 'info');
      t.textContent = msg;
      box.appendChild(t);
      setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
    },

    modal(cfg) {
      const ov = document.createElement('div');
      ov.className = 'modal-overlay';
      ov.innerHTML = '<div class="modal' + (cfg.wide ? ' modal-wide' : '') + '" role="dialog" aria-modal="true">' +
        '<button class="modal-x" aria-label="Cerrar">✕</button>' +
        (cfg.title ? '<h2 class="modal-title">' + esc(cfg.title) + '</h2>' : '') +
        '<div class="modal-body"></div><div class="modal-actions"></div></div>';
      const body = $('.modal-body', ov);
      if (typeof cfg.body === 'string') body.innerHTML = cfg.body; else if (cfg.body) body.appendChild(cfg.body);
      const close = () => { document.removeEventListener('keydown', onKey); ov.remove(); document.body.classList.remove('no-scroll'); if (cfg.onClose) cfg.onClose(); };
      const onKey = e => { if (e.key === 'Escape') close(); };
      (cfg.actions || []).forEach(a => {
        const b = document.createElement('button');
        b.className = 'btn btn-' + (a.kind || 'ghost'); b.textContent = a.label;
        b.addEventListener('click', () => a.onClick ? a.onClick(close, b) : close());
        $('.modal-actions', ov).appendChild(b);
      });
      if (!(cfg.actions || []).length) $('.modal-actions', ov).remove();
      $('.modal-x', ov).addEventListener('click', close);
      ov.addEventListener('click', e => { if (e.target === ov) close(); });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(ov); document.body.classList.add('no-scroll');
      return { el: ov, body, close };
    },

    choosePlatform(p) {
      return new Promise(resolve => {
        let done = false;
        const html = '<p class="muted">¿Para qué plataforma quieres <strong>' + esc(p.name) + '</strong>?</p><div class="plat-choose">' +
          p.platforms.map(x => '<button class="btn btn-primary" data-plat="' + x + '">' + x + '</button>').join('') + '</div>';
        const m = ui.modal({ title: 'Elige tu plataforma', body: html, onClose: () => { if (!done) resolve(null); } });
        $$('[data-plat]', m.el).forEach(b => b.addEventListener('click', () => { done = true; resolve(b.dataset.plat); m.close(); }));
      });
    },

    errorPanel(el, cfg) {
      el.innerHTML = '<div class="state-panel"><div class="state-icon">' + (cfg.icon || '⚠️') + '</div><h2>' + esc(cfg.title) + '</h2>' +
        '<p class="muted">' + esc(cfg.message || '') + '</p><div class="state-actions"></div></div>';
      const box = $('.state-actions', el);
      (cfg.actions || []).forEach(a => {
        const n = document.createElement(a.href ? 'a' : 'button');
        n.className = 'btn btn-' + (a.kind || 'primary'); n.textContent = a.label;
        if (a.href) n.href = a.href; else n.addEventListener('click', a.onClick);
        box.appendChild(n);
      });
    },

    errorByCode(code, x) {
      x = x || {};
      const login = GS.url('login.html?next=' + encodeURIComponent(x.next || GS.currentPath()));
      const cart = { label: 'Regresar al carrito', href: GS.url('pages/carrito.html'), kind: 'primary' };
      const shop = { label: 'Explorar videojuegos', href: GS.url('pages/catalogo.html'), kind: 'orange' };
      const map = {
        UNAUTHENTICATED: { icon: '🔒', title: 'Inicia sesión para continuar', message: 'Esta sección requiere una cuenta de Gaming Store. Puedes usar el usuario de demostración desde la pantalla de inicio de sesión.', actions: [{ label: 'Iniciar sesión', href: login, kind: 'orange' }, { label: 'Crear cuenta', href: GS.url('register.html'), kind: 'ghost' }] },
        EMPTY_CART: { icon: '🛒', title: 'Tu carrito está vacío', message: 'Agrega videojuegos o accesorios para continuar con tu compra.', actions: [shop] },
        OUT_OF_STOCK: { icon: '📦', title: 'Producto sin existencias', message: (x.name ? x.name + ' ' : 'Un producto ') + 'ya no tiene existencias suficientes. Ajusta tu carrito para continuar.', actions: [cart, shop] },
        UNAVAILABLE: { icon: '🚫', title: 'Producto no disponible', message: (x.name ? x.name + ' ' : 'El producto ') + 'no está disponible por ahora. Retíralo del carrito o elige otro.', actions: [cart, shop] },
        ALREADY_OWNED: { icon: '📚', title: 'Ya tienes este juego', message: (x.name ? x.name + ' ' : 'Este juego ') + 'ya está en tu biblioteca digital. Retíralo del carrito para continuar.', actions: [cart, { label: 'Mi biblioteca', href: GS.url('pages/biblioteca.html'), kind: 'ghost' }] },
        PAYMENT_DECLINED: { icon: '💳', title: 'Pago rechazado', message: 'No pudimos autorizar el pago con el método seleccionado. No se te cobró nada. Intenta de nuevo o usa otro método de pago.', actions: [] },
        INSUFFICIENT_POINTS: { icon: '⭐', title: 'Puntos insuficientes', message: x.missing ? 'Te faltan ' + x.missing + ' Gaming Points para esta operación.' : 'No tienes suficientes Gaming Points.', actions: [] },
        PROCESSING_ERROR: { icon: '⚙️', title: 'Error al procesar la compra', message: 'Ocurrió un problema al procesar tu compra. No se realizó ningún cargo ni se acreditaron puntos. Intenta nuevamente.', actions: [] },
        NOT_FOUND: { icon: '🔎', title: 'No encontramos lo que buscas', message: 'El producto o la página solicitada no existe.', actions: [shop] }
      };
      return map[code] || { icon: '⚠️', title: 'Algo salió mal', message: x.message || 'Ocurrió un error inesperado.', actions: [{ label: 'Volver al inicio', href: GS.url('index.html'), kind: 'primary' }] };
    }
  };

  /* ---------- Encabezado y pie ---------- */
  GS.updateCartBadge = function () {
    const n = GS.cart ? GS.cart.count() : 0;
    $$('.cart-count').forEach(e => { e.textContent = n; e.hidden = n === 0; });
  };

  function activeKey() {
    const pg = document.body.dataset.page;
    if (pg === 'catalogo') {
      const p = GS.util.params();
      if (p.get('ofertas') === '1') return 'ofertas';
      if (p.get('tipo') === 'accesorios') return 'accesorios';
      return 'juegos';
    }
    return pg;
  }

  GS.renderHeader = function () {
    const host = $('#site-header');
    if (!host) return;
    const user = GS.session.user();
    const act = activeKey();
    const nav = [
      ['inicio', 'Inicio', 'index.html'],
      ['juegos', 'Videojuegos', 'pages/catalogo.html'],
      ['ofertas', 'Ofertas', 'pages/catalogo.html?tipo=todos&ofertas=1'],
      ['accesorios', 'Accesorios', 'pages/catalogo.html?tipo=accesorios'],
      ['recompensas', 'Canjear puntos', 'pages/recompensas.html'],
      ['biblioteca', 'Mi biblioteca', 'pages/biblioteca.html'],
      ['perfil', 'Mi perfil', 'pages/perfil.html'],
      ['carrito', 'Carrito', 'pages/carrito.html']
    ];
    const q = GS.util.params().get('q') || '';
    const acct = user
      ? '<div class="user-menu"><button class="user-btn" id="userBtn" aria-haspopup="true" aria-expanded="false">' +
        '<span class="avatar avatar-sm">' + esc(user.avatar) + '</span><span class="user-info"><strong>' + esc(user.username) + '</strong>' +
        '<small>⭐ ' + user.points.balance + ' pts</small></span></button>' +
        '<div class="dropdown" id="userDrop" hidden>' +
        '<a href="' + GS.url('pages/perfil.html') + '">Mi perfil</a>' +
        '<a href="' + GS.url('pages/perfil.html#puntos') + '">Mis Gaming Points</a>' +
        '<a href="' + GS.url('pages/pedidos.html') + '">Mis pedidos</a>' +
        '<a href="' + GS.url('pages/biblioteca.html') + '">Mi biblioteca</a>' +
        (user.role === 'admin' ? '<a href="' + GS.url('pages/admin.html') + '">Panel de administración</a>' : '') +
        '<button id="logoutBtn">Cerrar sesión</button></div></div>'
      : '<a class="btn btn-ghost btn-sm" href="' + GS.url('login.html') + '">Iniciar sesión</a>' +
        '<a class="btn btn-orange btn-sm hide-sm" href="' + GS.url('register.html') + '">Registrarse</a>';

    host.innerHTML =
      '<header class="site-header"><div class="container header-inner">' +
      '<a class="logo" href="' + GS.url('index.html') + '" aria-label="Gaming Store - Inicio"><span class="logo-mark">◈</span><span>Gaming<b>Store</b></span></a>' +
      '<form class="search" id="globalSearch" role="search"><input type="search" id="globalQ" placeholder="Buscar videojuegos..." value="' + esc(q) + '" aria-label="Buscar videojuegos"><button type="submit" aria-label="Buscar">🔍</button></form>' +
      '<div class="header-actions">' +
      '<a class="icon-btn" href="' + GS.url('pages/carrito.html') + '" aria-label="Carrito">🛒<span class="cart-count count-badge" hidden>0</span></a>' +
      acct +
      '<button class="burger" id="burger" aria-label="Menú">☰</button></div></div>' +
      '<nav class="main-nav" id="mainNav"><div class="container">' +
      nav.map(n => '<a href="' + GS.url(n[2]) + '" class="' + (n[0] === act ? 'active' : '') + '">' + n[1] +
        (n[0] === 'carrito' ? ' <span class="cart-count count-badge" hidden>0</span>' : '') + '</a>').join('') +
      '</div></nav></header>';

    $('#globalSearch').addEventListener('submit', e => {
      e.preventDefault();
      const v = $('#globalQ').value.trim();
      location.href = GS.url('pages/catalogo.html?tipo=todos' + (v ? '&q=' + encodeURIComponent(v) : ''));
    });
    $('#burger').addEventListener('click', () => $('#mainNav').classList.toggle('open'));
    const ub = $('#userBtn');
    if (ub) {
      const dd = $('#userDrop');
      ub.addEventListener('click', e => { e.stopPropagation(); dd.hidden = !dd.hidden; ub.setAttribute('aria-expanded', String(!dd.hidden)); });
      document.addEventListener('click', () => { dd.hidden = true; });
      $('#logoutBtn').addEventListener('click', () => GS.auth.logout());
    }
    GS.updateCartBadge();
  };

  GS.renderFooter = function () {
    const host = $('#site-footer');
    if (!host) return;
    host.innerHTML = '<footer class="site-footer"><div class="container footer-inner">' +
      '<div><div class="logo"><span class="logo-mark">◈</span><span>Gaming<b>Store</b></span></div>' +
      '<p class="muted small">Videojuegos para PC, Xbox y PlayStation, accesorios y el programa Gaming Points.</p></div>' +
      '<div class="small muted"><strong>Prototipo de demostración.</strong> Catálogo, pagos, claves y pedidos son simulados y se guardan en tu navegador (LocalStorage). ' +
      'Los videojuegos mencionados son marcas de sus respectivos dueños y se usan solo como ejemplo.</div></div></footer>';
  };

  window.addEventListener('storage', () => GS.updateCartBadge());
  GS.renderHeader();
  GS.renderFooter();
})();