/* Gaming Store - Detalles del videojuego / producto.
 * Muestra la imagen principal y la galería de capturas secundarias. */
(async function () {
  'use strict';
  const root = document.getElementById('detailPage');
  if (!root) return;
  const $ = GS.util.$, $$ = GS.util.$$, esc = GS.util.esc, money = GS.util.money;

  const id = GS.util.params().get('id');
  const p = id ? await GS.api.getGame(id) : null;
  if (!p) { GS.ui.errorPanel(root, GS.ui.errorByCode('NOT_FOUND')); return; }
  document.title = p.name + ' | Gaming Store';

  const all = await GS.api.getGames();
  
  const gallery = (p.imagenes && p.imagenes.length > 0)
    ? [p.imagen].concat(p.imagenes)
    : [p.imagen || GS.ui.art(p)].concat([1, 2, 3].map(v => GS.ui.art(p, { variant: v, w: 640, h: 360, title: false })));

  let platform = p.type === 'digital' ? p.platforms[0] : GS.cart.PHYS;
  let qty = 1, img = 0;

  function availability() {
    if (!p.available) return '<span class="avail-bad">Próximamente · aún no disponible para compra</span>';
    if (p.type === 'fisico') {
      if (p.stock <= 0) return '<span class="avail-bad">Sin existencias</span>';
      return '<span class="avail-ok">Disponible · ' + p.stock + (p.stock <= 5 ? ' (¡últimas unidades!)' : ' en existencia') + '</span>';
    }
    return '<span class="avail-ok">Disponible · entrega inmediata de la licencia</span>';
  }

  function reqBlock() {
    if (p.type !== 'digital' || !p.platforms.includes('PC') || !p.req) return '';
    const tbl = o => '<table class="req-table">' + Object.keys(o).map(k => '<tr><td>' + k + '</td><td>' + esc(o[k]) + '</td></tr>').join('') + '</table>';
    return '<section class="panel" style="margin-top:28px"><div class="panel-title">Requisitos del sistema (PC)</div><div class="req-grid"><div><h4>Mínimos</h4>' + tbl(p.req.min) + '</div><div><h4>Recomendados</h4>' + tbl(p.req.rec) + '</div></div><p class="small muted" style="margin:12px 0 0">Datos de demostración.</p></section>';
  }

  function render() {
    const unit = GS.calc.unitPrice(p);
    const canBuy = p.available && !(p.type === 'fisico' && p.stock <= 0);
    const points = GS.calc.pointsFor(unit * qty);
    const related = all.filter(g => g.id !== p.id && g.genre === p.genre && g.available).slice(0, 4);

    root.innerHTML =
      '<nav class="small muted" style="margin-bottom:14px"><a href="' + GS.url('pages/catalogo.html') + '">Catálogo</a> / ' + esc(p.genre) + ' / ' + esc(p.name) + '</nav>' +
      '<div class="detail-layout"><div><div class="g-main"><img src="' + gallery[img] + '" alt="Imagen de ' + esc(p.name) + '"></div>' +
      '<div class="g-thumbs">' + gallery.map((g, i) => '<button data-img="' + i + '" class="' + (i === img ? 'active' : '') + '" aria-label="Imagen ' + (i + 1) + '"><img src="' + g + '" alt=""></button>').join('') + '</div></div>' +
      '<div><h1>' + esc(p.name) + '</h1>' +
      '<div class="gc-meta" style="margin-bottom:8px">' + GS.ui.platformChips(p) + '<span class="chip">' + esc(p.genre) + '</span></div>' +
      '<div>' + GS.ui.stars(p.rating) + '</div>' +
      '<div class="detail-price">' + (p.discount ? '<span class="discount-pill">-' + p.discount + '%</span><span class="old">' + money(p.price) + '</span>' : '') + '<span class="now">' + money(unit) + '</span></div>' +
      (p.discount ? '<p class="small muted" style="margin-top:-6px">Ahorras ' + money(p.price - unit) + ' por unidad.</p>' : '') +
      '<p>' + esc(p.desc) + '</p>' +
      (p.type === 'digital' && p.platforms.length > 1 ? '<div><strong class="small">Plataforma</strong><div class="plat-options">' + p.platforms.map(x => '<button class="plat-opt' + (x === platform ? ' active' : '') + '" data-plat="' + x + '">' + x + '</button>').join('') + '</div></div>' : '') +
      (p.type === 'fisico' && canBuy ? '<div style="margin-bottom:14px"><strong class="small">Cantidad</strong><br><div class="qty" style="margin-top:6px"><button data-q="-1"' + (qty <= 1 ? ' disabled' : '') + '>−</button><span>' + qty + '</span><button data-q="1"' + (qty >= p.stock ? ' disabled' : '') + '>+</button></div></div>' : '') +
      '<div style="margin-bottom:14px">' + (canBuy ? '<span class="points-note">⭐ Obtendrás ' + points + ' Gaming Points con esta compra</span>' : '') + '</div>' +
      '<div class="hero-actions" style="margin:0 0 18px"><button class="btn btn-orange btn-lg" id="addBtn"' + (canBuy ? '' : ' disabled') + '>' + (!p.available ? 'No disponible' : canBuy ? 'Agregar al carrito' : 'Sin existencias') + '</button>' +
      '<a class="btn btn-ghost btn-lg" href="' + GS.url('pages/carrito.html') + '">Ver carrito</a></div>' +
      '<dl class="info-list"><dt>Género</dt><dd>' + esc(p.genre) + '</dd>' +
      '<dt>Plataforma</dt><dd>' + (p.type === 'digital' ? p.platforms.join(', ') : 'Compatible con ' + p.platforms.join(', ')) + '</dd>' +
      '<dt>Lanzamiento</dt><dd>' + GS.util.date(p.release) + '</dd>' +
      '<dt>Formato</dt><dd>' + (p.type === 'digital' ? 'Clave digital (entrega en Mi biblioteca)' : 'Producto físico con envío a domicilio') + '</dd>' +
      '<dt>Disponibilidad</dt><dd>' + availability() + '</dd></dl></div></div>' +
      reqBlock() +
      (related.length ? '<section class="section" style="margin-top:40px"><div class="section-head"><h2>También te puede gustar</h2></div><div class="grid-cards">' + related.map(g => GS.ui.gameCard(g)).join('') + '</div></section>' : '');
  }

  root.addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.img != null) { img = +t.dataset.img; render(); }
    else if (t.dataset.plat) { platform = t.dataset.plat; render(); }
    else if (t.dataset.q) { qty = Math.min(p.stock, Math.max(1, qty + +t.dataset.q)); render(); }
    else if (t.id === 'addBtn') { await GS.cart.add(p.id, platform, qty); }
  });

  render();
})();
