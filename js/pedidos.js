/* Gaming Store - Mis pedidos y envíos.
 * El avance del envío es SIMULADO por tiempo (ver GS.CONFIG.stageMs) o con el botón de demo.
 * Con backend: GET /api/orders, GET /api/orders/{id}, POST /api/orders/{id}/cancel */
(async function () {
  'use strict';
  const root = document.getElementById('ordersPage');
  if (!root) return;
  const $ = GS.util.$, $$ = GS.util.$$, esc = GS.util.esc, money = GS.util.money;

  const user = await GS.auth.requireAuth(root);
  if (!user) return;

  const games = await GS.api.getGames();
  const gm = {}; games.forEach(g => { gm[g.id] = g; });
  const highlight = GS.util.params().get('id');
  let orders = [];

  const pill = o => '<span class="status-pill ' + (o.status === 'Cancelado' ? 'st-bad' : o.finished ? 'st-ok' : 'st-warn') + '">' + esc(o.statusLabel) + '</span>';

  function tracker(title, tr) {
    const last = tr.labels.length - 1;
    return '<div><strong class="small">' + title + '</strong><div class="tracker">' + tr.labels.map((lb, i) => {
      const done = i < tr.idx || (i === tr.idx && tr.idx === last);
      const cur = i === tr.idx && tr.idx < last;
      return '<div class="t-step ' + (done ? 'done' : cur ? 'current' : '') + '"><div class="t-dot">' + (done ? '✓' : i + 1) + '</div>' + esc(lb) + '</div>';
    }).join('') + '</div></div>';
  }
  const trackers = o => o.status === 'Cancelado' ? '' :
    (o.tracking.physical ? tracker('Seguimiento del envío (productos físicos)', o.tracking.physical) : '') +
    (o.tracking.digital ? tracker('Licencias digitales', o.tracking.digital) : '');

  function card(o) {
    return '<article class="order-card' + (o.id === highlight ? ' highlight' : '') + '" id="o-' + esc(o.id) + '">' +
      '<div class="order-head"><div><strong>Pedido ' + esc(o.id) + '</strong> <span class="muted small">· ' + GS.util.date(o.createdAt, true) + '</span></div>' + pill(o) + '</div>' +
      '<div class="order-items">' + o.items.map(i => {
        const g = gm[i.id] || { id: i.id, name: i.name, colors: ['#1261A0', '#27A9E0'] };
        return '<span class="order-item"><img src="' + GS.ui.art(g, { w: 120, h: 160, title: false }) + '" alt="">' + esc(i.name) + (i.qty > 1 ? ' ×' + i.qty : '') + '</span>';
      }).join('') + '</div>' +
      '<div class="small muted">Total pagado: <strong style="color:var(--text)">' + money(o.total) + '</strong> · ' + esc(o.paymentMethod) + (o.status === 'Cancelado' ? '' : ' · +' + o.earnedPoints + ' pts') + '</div>' +
      trackers(o) +
      '<div style="margin-top:10px"><button class="btn btn-ghost btn-sm" data-detail="' + esc(o.id) + '">Ver detalles</button></div></article>';
  }

  function render() {
    root.innerHTML = '<div class="page-title"><h1>Mis pedidos y envíos</h1><p>Consulta el estado de tus compras y el seguimiento de tus envíos.</p></div>' +
      (orders.length ? orders.map(card).join('') :
        '<div class="state-panel"><div class="state-icon">📦</div><h2>Aún no tienes pedidos</h2><p class="muted">Cuando realices una compra, aparecerá aquí.</p><div class="state-actions"><a class="btn btn-orange" href="' + GS.url('pages/catalogo.html') + '">Explorar catálogo</a></div></div>');
  }

  function detail(o) {
    const a = o.delivery && o.delivery.address;
    const rows = o.items.map(i => '<tr><td>' + esc(i.name) + '<div class="small muted">' + (i.type === 'digital' ? esc(i.platform) + ' · licencia digital' : 'Producto físico') + '</div></td><td>' + i.qty + '</td><td>' + money(i.unitPrice) + '</td><td>' + money(i.unitPrice * i.qty) + '</td></tr>').join('');
    return '<div class="order-head"><div><strong>Pedido ' + esc(o.id) + '</strong><div class="small muted">' + GS.util.date(o.createdAt, true) + '</div></div>' + pill(o) + '</div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="sum-row"><span>Subtotal</span><span>' + money(o.subtotal) + '</span></div>' +
      '<div class="sum-row discount"><span>Descuentos</span><span>−' + money(o.discount) + '</span></div>' +
      (o.couponAmount ? '<div class="sum-row discount"><span>Cupón (' + esc(o.couponCode) + ')</span><span>−' + money(o.couponAmount) + '</span></div>' : '') +
      (o.pointsUsed ? '<div class="sum-row discount"><span>Puntos utilizados (' + o.pointsUsed + ')</span><span>−' + money(o.pointsDiscount) + '</span></div>' : '') +
      '<div class="sum-row total"><span>Total pagado</span><span>' + money(o.total) + '</span></div>' +
      '<div class="small muted" style="margin:6px 0 12px">Método de pago: ' + esc(o.paymentMethod) + ' · ' + (o.status === 'Cancelado' ? 'Sin puntos por pedido cancelado' : 'Puntos obtenidos: ' + o.earnedPoints) + '</div>' +
      (o.delivery && o.delivery.email ? '<div class="small"><strong>Entrega digital:</strong> ' + esc(o.delivery.email) + '</div>' : '') +
      (a ? '<div class="small"><strong>Envío a:</strong> ' + esc(a.name) + ', ' + esc(a.street) + ', ' + esc(a.city) + ', ' + esc(a.state) + ' C.P. ' + esc(a.zip) + '</div>' : '') +
      trackers(o);
  }

  function openDetail(id) {
    const o = orders.find(x => x.id === id); if (!o) return;
    const actions = [{ label: 'Cerrar', kind: 'ghost' }];
    if (o.status !== 'Cancelado') actions.unshift({
      label: 'Cancelar pedido', kind: 'danger', onClick: close => {
        if (!confirm('¿Cancelar el pedido ' + o.id + '? Se revertirán los puntos obtenidos y se devolverán los puntos usados.')) return;
        GS.api.cancelOrder(o.id).then(async () => {
          close(); GS.ui.toast('Pedido cancelado', 'success');
          await load(); GS.renderHeader();
        }).catch(err => GS.ui.toast(err.message, 'error'));
      }
    });
    if (o.tracking.physical && o.tracking.physical.idx < 3 && o.status !== 'Cancelado') actions.unshift({
      label: 'Avanzar etapa (demo)', kind: 'accent', onClick: async close => { await GS.api.advanceOrder(o.id); close(); await load(); openDetail(o.id); }
    });
    if (o.hasDigital && o.status !== 'Cancelado') actions.unshift({ label: 'Mi biblioteca', kind: 'primary', onClick: () => { location.href = GS.url('pages/biblioteca.html'); } });
    GS.ui.modal({ title: 'Detalle del pedido', body: detail(o), wide: true, actions });
  }

  async function load() { orders = await GS.api.getOrders(); render(); }

  root.addEventListener('click', e => { const b = e.target.closest('[data-detail]'); if (b) openDetail(b.dataset.detail); });

  await load();
  if (highlight) { const el = document.getElementById('o-' + highlight); if (el) { el.scrollIntoView({ block: 'center' }); openDetail(highlight); } }
  // Actualiza estados del seguimiento (simulado) mientras no haya un modal abierto
  setInterval(() => { if (!$('.modal-overlay')) load(); }, 5000);
})();
