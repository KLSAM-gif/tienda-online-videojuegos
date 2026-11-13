/* =====================================================================
 * Gaming Store - Carrito de compras
 * El carrito se guarda en LocalStorage (clave gs_cart). Con backend:
 *   GET/POST/PUT/DELETE /api/cart  (o mantenerlo en cliente y validar en POST /api/orders)
 * ===================================================================== */
(function () {
  'use strict';
  const KEY = 'gs_cart', PHYS = 'Físico';
  const $ = GS.util.$, esc = GS.util.esc, money = GS.util.money;

  const C = GS.cart = {
    PHYS,
    items() { return GS.storage.get(KEY, []); },
    save(a) { GS.storage.set(KEY, a); GS.updateCartBadge(); },
    count() { return C.items().reduce((s, i) => s + (i.qty || 1), 0); },

    /* Agrega un producto validando disponibilidad, inventario y duplicados. */
    async add(id, platform, qty) {
      qty = Math.max(1, parseInt(qty, 10) || 1);
      const p = await GS.api.getGame(id);
      if (!p || !p.available) { GS.ui.toast('Este producto no está disponible por ahora.', 'error'); return false; }
      const items = C.items();
      if (p.type === 'digital') {
        platform = platform || p.platforms[0];
        if (!p.platforms.includes(platform)) { GS.ui.toast('Plataforma no disponible para este juego.', 'error'); return false; }
        if (GS.session.user()) {
          const lib = await GS.api.getLibrary();
          if (lib.some(l => l.productId === id && l.platform === platform)) { GS.ui.toast('Ya tienes este juego en tu biblioteca (' + platform + ').', 'info'); return false; }
        }
        if (items.some(i => i.id === id && i.platform === platform)) { GS.ui.toast('Ya está en tu carrito.', 'info'); return false; }
        items.push({ id, platform, qty: 1 });
      } else {
        if (p.stock <= 0) { GS.ui.toast(p.name + ' no tiene existencias.', 'error'); return false; }
        const ex = items.find(i => i.id === id);
        const nq = (ex ? ex.qty : 0) + qty;
        if (nq > p.stock) { GS.ui.toast('Solo quedan ' + p.stock + ' unidades de ' + p.name + '.', 'error'); return false; }
        if (ex) ex.qty = nq; else items.push({ id, platform: PHYS, qty });
      }
      C.save(items);
      GS.ui.toast(p.name + ' se agregó al carrito', 'success');
      return true;
    },
    remove(id, platform) { C.save(C.items().filter(i => !(i.id === id && i.platform === platform))); },
    async setQty(id, platform, qty) {
      const p = await GS.api.getGame(id);
      const items = C.items(), it = items.find(i => i.id === id && i.platform === platform);
      if (!it || !p) return false;
      if (qty < 1) { C.remove(id, platform); return true; }
      if (p.type === 'fisico' && qty > p.stock) { GS.ui.toast('Solo hay ' + p.stock + ' unidades disponibles.', 'error'); return false; }
      it.qty = qty; C.save(items); return true;
    },
    clear() { C.save([]); },

    /* Líneas del carrito con el producto actualizado (precio, inventario). */
    async detailed() {
      const out = [];
      for (const it of C.items()) {
        const product = await GS.api.getGame(it.id);
        if (product) out.push(Object.assign({}, it, { product }));
        else C.remove(it.id, it.platform); // producto retirado del catálogo
      }
      return out;
    },

    /* Problemas que impiden comprar: devuelve { 'id|plataforma': {code,name,stock} } */
    async issues(lines) {
      const res = {};
      const me = GS.session.user();
      const lib = me ? await GS.api.getLibrary() : [];
      lines.forEach(l => {
        const p = l.product, k = l.id + '|' + l.platform;
        if (!p.available) res[k] = { code: 'UNAVAILABLE', name: p.name };
        else if (p.type === 'fisico' && p.stock < l.qty) res[k] = { code: 'OUT_OF_STOCK', name: p.name, stock: p.stock };
        else if (p.type === 'digital' && lib.some(x => x.productId === p.id && x.platform === l.platform)) res[k] = { code: 'ALREADY_OWNED', name: p.name };
      });
      return res;
    }
  };

  /* Botones "Agregar" de cualquier tarjeta (delegación de eventos) */
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-add]');
    if (!b || b.disabled) return;
    e.preventDefault();
    const p = await GS.api.getGame(b.dataset.add);
    if (!p) return;
    let platform = b.dataset.platform || null;
    if (p.type === 'digital' && !platform && p.platforms.length > 1) {
      platform = await GS.ui.choosePlatform(p);
      if (!platform) return;
    }
    await C.add(p.id, p.type === 'fisico' ? PHYS : (platform || p.platforms[0]), 1);
  });

  /* ---------- Página del carrito ---------- */
  const page = $('#cartPage');
  if (page) {
    page.addEventListener('click', async e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const { act, id, plat } = b.dataset;
      if (act === 'rm') C.remove(id, plat);
      else if (act === 'clear') { if (!confirm('¿Vaciar todo el carrito?')) return; C.clear(); }
      else if (act === 'inc' || act === 'dec') {
        const it = C.items().find(i => i.id === id && i.platform === plat);
        if (!it) return;
        await C.setQty(id, plat, it.qty + (act === 'inc' ? 1 : -1));
      }
      renderCart();
    });
    renderCart();
  }

  async function renderCart() {
    const lines = await C.detailed();
    if (!lines.length) { GS.ui.errorPanel(page, GS.ui.errorByCode('EMPTY_CART')); return; }
    const issues = await C.issues(lines);
    const hasIssue = Object.keys(issues).length > 0;
    const t = GS.calc.totals(lines);
    const logged = !!GS.session.user();

    const rows = lines.map(l => {
      const p = l.product, k = l.id + '|' + l.platform, is = issues[k];
      const unit = GS.calc.unitPrice(p);
      const qtyCtl = p.type === 'fisico'
        ? '<div class="qty"><button data-act="dec" data-id="' + esc(l.id) + '" data-plat="' + esc(l.platform) + '" aria-label="Menos"' + (l.qty <= 1 ? ' disabled' : '') + '>−</button><span>' + l.qty + '</span><button data-act="inc" data-id="' + esc(l.id) + '" data-plat="' + esc(l.platform) + '" aria-label="Más"' + (l.qty >= p.stock ? ' disabled' : '') + '>+</button></div>'
        : '<span class="muted small">Licencia digital × 1</span>';
      return '<div class="cart-line"><a href="' + GS.url('pages/detalles.html?id=' + encodeURIComponent(p.id)) + '"><img src="' + GS.ui.art(p) + '" alt=""></a>' +
        '<div><a class="cl-name" href="' + GS.url('pages/detalles.html?id=' + encodeURIComponent(p.id)) + '">' + esc(p.name) + '</a>' +
        '<div class="gc-meta">' + (p.type === 'digital' ? '<span class="chip chip-' + l.platform.toLowerCase() + '">' + esc(l.platform) + '</span>' : '<span class="chip chip-phys">Producto físico</span>') + '</div>' +
        '<div class="small muted" style="margin-top:6px">Precio individual: ' + (p.discount ? '<s>' + money(p.price) + '</s> ' : '') + '<strong>' + money(unit) + '</strong></div>' +
        (is ? '<div class="line-warn">' + (is.code === 'OUT_OF_STOCK' ? 'Sin existencias suficientes' + (is.stock ? ' (quedan ' + is.stock + ')' : '') : is.code === 'ALREADY_OWNED' ? 'Ya está en tu biblioteca' : 'Producto no disponible') + '</div>' : '') +
        '<button class="cl-remove" data-act="rm" data-id="' + esc(l.id) + '" data-plat="' + esc(l.platform) + '">Eliminar</button></div>' +
        '<div class="cl-qty">' + qtyCtl + '</div>' +
        '<div class="cl-price"><span class="now">' + money(unit * l.qty) + '</span></div></div>';
    }).join('');

    const next = logged ? GS.url('pages/checkout.html') : GS.url('login.html?next=' + encodeURIComponent('pages/checkout.html'));
    page.innerHTML =
      '<div class="page-title"><h1>Carrito de compras</h1><p>Revisa tus productos antes de continuar.</p></div>' +
      '<div class="two-col"><div class="panel"><div class="panel-title"><span>Tus productos (' + C.count() + ')</span><button class="btn btn-danger btn-sm" data-act="clear">Vaciar carrito</button></div>' + rows + '</div>' +
      '<aside class="panel summary"><div class="panel-title">Resumen</div>' +
      '<div class="sum-row"><span>Subtotal</span><span>' + money(t.subtotal) + '</span></div>' +
      '<div class="sum-row discount"><span>Descuentos</span><span>−' + money(t.discount) + '</span></div>' +
      '<div class="sum-row total"><span>Total a pagar</span><span>' + money(t.total) + '</span></div>' +
      '<p class="points-note" style="margin-top:12px">⭐ Ganarás ' + t.points + ' Gaming Points</p>' +
      '<p class="small muted">Los puntos se acreditan al confirmar una compra exitosa (1 punto por cada $10 pagados). Podrás usar tus puntos como descuento en el checkout.</p>' +
      (hasIssue ? '<div class="alert alert-error">Hay productos con problemas. Retíralos o ajusta cantidades para continuar.</div>' : '') +
      (logged ? '' : '<div class="alert alert-info">Inicia sesión para finalizar tu compra.</div>') +
      '<a class="btn btn-orange btn-lg btn-block' + (hasIssue ? ' btn-disabled' : '') + '" ' + (hasIssue ? 'aria-disabled="true" onclick="return false"' : 'href="' + next + '"') + '>Continuar con la compra</a>' +
      '<a class="btn btn-ghost btn-block" style="margin-top:10px" href="' + GS.url('pages/catalogo.html') + '">Seguir comprando</a></aside></div>';
  }

  GS.updateCartBadge();
})();
