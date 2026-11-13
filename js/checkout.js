/* =====================================================================
 * Gaming Store - Checkout en 5 pasos
 * 1 Resumen · 2 Método de pago · 3 Entrega · 4 Gaming Points · 5 Confirmación
 * El pago es SIMULADO (api.js). No se conecta ninguna pasarela real ni se
 * guardan datos de tarjeta. Tarjetas de prueba:
 *   4242 4242 4242 4242 -> aprobada · ...0002 -> rechazada · ...9999 -> error de procesamiento
 * Con backend: POST /api/orders (procesa pago, puntos, licencias e inventario).
 * ===================================================================== */
(async function () {
  'use strict';
  const root = document.getElementById('checkoutPage');
  if (!root) return;
  const $ = GS.util.$, $$ = GS.util.$$, esc = GS.util.esc, money = GS.util.money;

  const user = await GS.auth.requireAuth(root);
  if (!user) return;

  let lines = await GS.cart.detailed();
  if (!lines.length) { GS.ui.errorPanel(root, GS.ui.errorByCode('EMPTY_CART')); return; }
  let coupons = await GS.api.getCoupons();
  const hasPhysical = () => lines.some(l => l.product.type === 'fisico');
  const hasDigital = () => lines.some(l => l.product.type === 'digital');

  const STEPS = ['Resumen', 'Pago', 'Entrega', 'Puntos', 'Confirmación'];
  const st = {
    step: 1, method: 'card', card: { number: '', name: '', exp: '', cvv: '' }, paypal: '',
    email: user.email, addr: { name: user.name, street: '', city: '', state: '', zip: '', phone: '' },
    points: 0, coupon: '', busy: false, result: null
  };

  /* ---------- Cálculos del paso actual ---------- */
  function calc() {
    const t = GS.calc.totals(lines);
    const c = coupons.find(x => x.code === st.coupon);
    const couponAmt = c ? Math.min(c.amount, t.total) : 0;
    const afterC = GS.calc.round2(t.total - couponAmt);
    const maxPts = GS.calc.maxPointsUsable(afterC, user.points.balance);
    if (st.points > maxPts) st.points = maxPts;
    if (st.points < 0) st.points = 0;
    const ptsDisc = st.points * GS.CONFIG.pointValueMXN;
    const due = GS.calc.round2(Math.max(0, afterC - ptsDisc));
    return Object.assign({}, t, { couponAmt, afterC, maxPts, ptsDisc, due, earn: GS.calc.pointsFor(due), remaining: user.points.balance - st.points });
  }

  const stepper = () => '<div class="stepper">' + STEPS.map((s, i) =>
    '<div class="step ' + (i + 1 < st.step ? 'done' : i + 1 === st.step ? 'active' : '') + '"><div class="s-dot">' + (i + 1 < st.step ? '✓' : i + 1) + '</div>' + s + '</div>').join('') + '</div>';
  const platText = l => l.product.type === 'fisico' ? 'Producto físico' : l.platform;

  /* ---------- Pasos ---------- */
  function step1() {
    const t = calc();
    return '<div class="panel"><h2>1. Resumen del pedido</h2><div class="table-wrap"><table class="table"><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead><tbody>' +
      lines.map(l => '<tr><td>' + esc(l.product.name) + '<div class="small muted">' + esc(platText(l)) + '</div></td><td>' + l.qty + '</td><td>' + money(GS.calc.unitPrice(l.product)) + '</td><td>' + money(GS.calc.unitPrice(l.product) * l.qty) + '</td></tr>').join('') +
      '</tbody></table></div>' +
      '<div class="sum-row"><span>Subtotal</span><span>' + money(t.subtotal) + '</span></div>' +
      '<div class="sum-row discount"><span>Descuentos</span><span>−' + money(t.discount) + '</span></div>' +
      '<div class="sum-row total"><span>Total</span><span>' + money(t.total) + '</span></div>' +
      '<p class="points-note" style="margin-top:10px">⭐ Con esta compra obtendrás hasta ' + t.points + ' Gaming Points</p>' +
      '<div class="checkout-actions"><a class="btn btn-ghost" href="' + GS.url('pages/carrito.html') + '">← Volver al carrito</a><button class="btn btn-orange" data-go="next">Continuar al pago →</button></div></div>';
  }

  function step2() {
    return '<div class="panel"><h2>2. Método de pago</h2><div id="stepErr" class="alert alert-error" hidden></div>' +
      '<div class="alert alert-info small">Pago <strong>simulado</strong>: no se realiza ningún cargo real. Tarjetas de prueba: <code>4242 4242 4242 4242</code> (aprobada), terminada en <code>0002</code> (rechazada), terminada en <code>9999</code> (error de procesamiento).</div>' +
      '<div class="radio-cards">' +
      '<label class="radio-card ' + (st.method === 'card' ? 'selected' : '') + '"><span class="rc-icon">💳</span><span><strong>Tarjeta bancaria</strong><br><span class="small muted">Crédito o débito</span></span><input type="radio" name="pm" value="card" ' + (st.method === 'card' ? 'checked' : '') + '></label>' +
      '<label class="radio-card ' + (st.method === 'paypal' ? 'selected' : '') + '"><span class="rc-icon">🅿️</span><span><strong>PayPal</strong><br><span class="small muted">Con tu cuenta PayPal</span></span><input type="radio" name="pm" value="paypal" ' + (st.method === 'paypal' ? 'checked' : '') + '></label></div>' +
      (st.method === 'card'
        ? '<div class="field"><label for="cNum">Número de tarjeta</label><input id="cNum" data-f="card.number" inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242" value="' + esc(st.card.number) + '"></div>' +
          '<div class="field"><label for="cName">Nombre del titular</label><input id="cName" data-f="card.name" autocomplete="off" value="' + esc(st.card.name) + '"></div>' +
          '<div class="field-row"><div class="field"><label for="cExp">Vencimiento (MM/AA)</label><input id="cExp" data-f="card.exp" inputmode="numeric" placeholder="MM/AA" maxlength="5" autocomplete="off" value="' + esc(st.card.exp) + '"></div>' +
          '<div class="field"><label for="cCvv">CVV</label><input id="cCvv" data-f="card.cvv" inputmode="numeric" maxlength="4" autocomplete="off" type="password" value="' + esc(st.card.cvv) + '"></div></div>'
        : '<div class="field"><label for="pEmail">Correo de PayPal</label><input id="pEmail" data-f="paypal" type="email" placeholder="tucorreo@ejemplo.com" value="' + esc(st.paypal) + '"><span class="hint">Simulación: no se abrirá PayPal.</span></div>') +
      '<div class="checkout-actions"><button class="btn btn-ghost" data-go="back">← Atrás</button><button class="btn btn-orange" data-go="next">Continuar →</button></div></div>';
  }

  function step3() {
    const f = (id, label, key, ph, extra) => '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" data-f="addr.' + key + '" placeholder="' + (ph || '') + '" value="' + esc(st.addr[key]) + '" ' + (extra || '') + '></div>';
    return '<div class="panel"><h2>3. Información de entrega</h2><div id="stepErr" class="alert alert-error" hidden></div>' +
      (hasDigital() ? '<div class="radio-card selected" style="margin-bottom:14px"><span class="rc-icon">⚡</span><span><strong>Entrega digital</strong> (videojuegos)<br><span class="small muted">La licencia aparecerá en Mi Biblioteca Digital al confirmar la compra.</span></span><input type="radio" checked disabled></div>' +
        '<div class="field"><label for="dEmail">Correo para recibir tus claves</label><input id="dEmail" data-f="email" type="email" value="' + esc(st.email) + '"></div>' : '') +
      (hasPhysical() ? '<div class="radio-card selected" style="margin:14px 0"><span class="rc-icon">🚚</span><span><strong>Envío físico</strong> (accesorios y productos)<br><span class="small muted">Envío estándar de 3 a 5 días hábiles, sin costo (demostración).</span></span><input type="radio" checked disabled></div>' +
        f('aName', 'Nombre de quien recibe', 'name') + f('aStreet', 'Calle y número', 'street', 'Av. Principal 123') +
        '<div class="field-row">' + f('aCity', 'Ciudad', 'city') + f('aState', 'Estado', 'state') + '</div>' +
        '<div class="field-row">' + f('aZip', 'Código postal', 'zip', '5 dígitos', 'inputmode="numeric" maxlength="5"') + f('aPhone', 'Teléfono', 'phone', '10 dígitos', 'inputmode="numeric" maxlength="10"') + '</div>' : '') +
      '<div class="checkout-actions"><button class="btn btn-ghost" data-go="back">← Atrás</button><button class="btn btn-orange" data-go="next">Continuar →</button></div></div>';
  }

  function summary4() {
    const t = calc();
    return '<div class="sum-row"><span>Total del pedido</span><span>' + money(t.total) + '</span></div>' +
      (t.couponAmt ? '<div class="sum-row discount"><span>Cupón / tarjeta de regalo</span><span>−' + money(t.couponAmt) + '</span></div>' : '') +
      '<div class="sum-row discount"><span>Descuento por puntos (' + st.points + ')</span><span>−' + money(t.ptsDisc) + '</span></div>' +
      '<div class="sum-row total"><span>Total a pagar</span><span>' + money(t.due) + '</span></div>' +
      '<div class="sum-row"><span>Puntos que obtendrás</span><span class="pos">+' + t.earn + '</span></div>' +
      '<div class="sum-row"><span>Puntos restantes después de la compra</span><span>' + t.remaining + '</span></div>' +
      (st.points > 0 ? '<p class="small muted">Lo pagado con puntos no genera puntos adicionales.</p>' : '');
  }

  function step4() {
    const t = calc();
    return '<div class="panel"><h2>4. Aplicar Gaming Points</h2><div id="stepErr" class="alert alert-error" hidden></div>' +
      '<p>Tu saldo: <strong>' + user.points.balance + ' puntos</strong> <span class="muted">(1 punto = ' + money(GS.CONFIG.pointValueMXN) + ')</span></p>' +
      (coupons.length ? '<div class="field"><label for="coupSel">Cupón o tarjeta de regalo</label><select id="coupSel" class="select"><option value="">Sin cupón</option>' +
        coupons.map(c => '<option value="' + esc(c.code) + '"' + (c.code === st.coupon ? ' selected' : '') + '>' + esc(c.source) + ' — ' + money(c.amount) + ' (' + esc(c.code) + ')</option>').join('') + '</select></div>' : '') +
      '<div class="field"><label for="ptsInput">Puntos a utilizar (máximo <span id="ptsMax">' + t.maxPts + '</span>)</label>' +
      '<input id="ptsInput" type="number" min="0" max="' + t.maxPts + '" step="1" value="' + st.points + '"><input id="ptsRange" type="range" min="0" max="' + t.maxPts + '" step="1" value="' + st.points + '" aria-label="Puntos a utilizar"></div>' +
      '<div id="ptsMsg" class="alert alert-warn" hidden></div>' +
      '<div class="hero-actions" style="margin:0 0 14px"><button class="btn btn-ghost btn-sm" data-pts="max">Usar máximo</button><button class="btn btn-ghost btn-sm" data-pts="0">No usar puntos</button></div>' +
      '<div id="ptsSummary">' + summary4() + '</div>' +
      '<div class="checkout-actions"><button class="btn btn-ghost" data-go="back">← Atrás</button><button class="btn btn-orange btn-lg" data-go="pay">Confirmar y pagar</button></div></div>';
  }

  /* ---------- Render ---------- */
  function render() {
    const body = [step1, step2, step3, step4][st.step - 1]();
    root.innerHTML = '<div class="page-title"><h1>Finalizar compra</h1></div>' + stepper() + body;
  }
  function showErr(msg) { const b = $('#stepErr'); if (b) { b.textContent = msg; b.hidden = false; b.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }

  /* ---------- Validaciones ---------- */
  const emailOk = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  function validate(step) {
    if (step === 2) {
      if (st.method === 'paypal') return emailOk(st.paypal.trim()) ? '' : 'Escribe un correo de PayPal válido.';
      const n = st.card.number.replace(/\D/g, '');
      if (n.length < 15 || n.length > 19) return 'El número de tarjeta debe tener entre 15 y 19 dígitos.';
      if (st.card.name.trim().length < 3) return 'Escribe el nombre del titular.';
      const m = /^(\d{2})\/(\d{2})$/.exec(st.card.exp);
      if (!m || +m[1] < 1 || +m[1] > 12) return 'El vencimiento debe tener el formato MM/AA.';
      const now = new Date(), yy = now.getFullYear() % 100;
      if (+m[2] < yy || (+m[2] === yy && +m[1] < now.getMonth() + 1)) return 'La tarjeta está vencida.';
      if (!/^\d{3,4}$/.test(st.card.cvv)) return 'El CVV debe tener 3 o 4 dígitos.';
    }
    if (step === 3) {
      if (hasDigital() && !emailOk(st.email.trim())) return 'Escribe un correo válido para la entrega digital.';
      if (hasPhysical()) {
        const a = st.addr;
        if (!a.name.trim() || !a.street.trim() || !a.city.trim() || !a.state.trim()) return 'Completa todos los datos de envío.';
        if (!/^\d{5}$/.test(a.zip)) return 'El código postal debe tener 5 dígitos.';
        if (!/^\d{10}$/.test(a.phone)) return 'El teléfono debe tener 10 dígitos.';
      }
    }
    if (step === 4) {
      if (st.points > user.points.balance) return 'No puedes usar más puntos de los que tienes.';
    }
    return '';
  }

  /* ---------- Pago (paso 5) ---------- */
  function processing() {
    root.innerHTML = '<div class="page-title"><h1>Finalizar compra</h1></div>' + stepper() +
      '<div class="panel center"><div class="spinner"></div><h2>Procesando tu pago…</h2><p class="muted">No cierres esta ventana. (Simulación)</p></div>';
  }

  async function pay() {
    if (st.busy) return;
    st.busy = true; st.step = 5; processing();
    try {
      lines = await GS.cart.detailed();
      const res = await GS.api.checkout({
        lines: lines.map(l => ({ id: l.id, platform: l.platform, qty: l.qty })),
        payment: st.method === 'card' ? { method: 'card', number: st.card.number } : { method: 'paypal', email: st.paypal },
        delivery: { email: hasDigital() ? st.email.trim() : null, address: hasPhysical() ? Object.assign({}, st.addr) : null },
        pointsToUse: st.points, couponCode: st.coupon || null
      });
      GS.cart.clear();
      st.result = res; success(res); GS.renderHeader();
    } catch (err) { failure(err); } finally { st.busy = false; }
  }

  function success(res) {
    const o = res.order;
    root.innerHTML = '<div class="page-title"><h1>Finalizar compra</h1></div>' + stepper().replace(/class="step [^"]*"/g, 'class="step done"').replace(/<div class="s-dot">\d<\/div>/g, '<div class="s-dot">✓</div>') +
      '<div class="panel success-box"><div class="success-check">✓</div><h2>¡Compra completada!</h2><p class="muted">Gracias por tu compra en Gaming Store.</p>' +
      '<div style="max-width:520px;margin:18px auto;text-align:left">' +
      '<div class="sum-row"><span>Número de pedido</span><strong>' + esc(o.id) + '</strong></div>' +
      '<div class="sum-row"><span>Total pagado</span><strong>' + money(o.total) + '</strong></div>' +
      '<div class="sum-row"><span>Productos adquiridos</span><span></span></div>' +
      '<ul style="margin:0 0 8px;padding-left:20px">' + o.items.map(i => '<li>' + esc(i.name) + (i.type === 'digital' ? ' <span class="muted small">(' + esc(i.platform) + ')</span>' : ' ×' + i.qty) + '</li>').join('') + '</ul>' +
      '<div class="sum-row"><span>Puntos obtenidos</span><span class="pos">+' + res.points.earned + '</span></div>' +
      '<div class="sum-row"><span>Puntos utilizados</span><span class="neg">−' + res.points.used + '</span></div>' +
      '<div class="sum-row total"><span>Nuevo saldo de Gaming Points</span><span>' + res.points.balance + '</span></div></div>' +
      '<div class="state-actions">' +
      (o.hasDigital ? '<a class="btn btn-primary" href="' + GS.url('pages/biblioteca.html') + '">Mi Biblioteca Digital</a>' : '') +
      '<a class="btn btn-accent" href="' + GS.url('pages/pedidos.html?id=' + encodeURIComponent(o.id)) + '">Mis pedidos</a>' +
      '<a class="btn btn-orange" href="' + GS.url('index.html') + '">Volver a la tienda</a></div></div>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function failure(err) {
    const cfg = GS.ui.errorByCode(err.code, Object.assign({ message: err.message }, err.extra));
    const go = n => () => { st.step = n; render(); };
    const cart = { label: 'Regresar al carrito', href: GS.url('pages/carrito.html'), kind: 'ghost' };
    const retry = { label: 'Reintentar', onClick: () => pay(), kind: 'orange' };
    if (err.code === 'PAYMENT_DECLINED') cfg.actions = [retry, { label: 'Cambiar método de pago', onClick: go(2), kind: 'primary' }, cart];
    else if (err.code === 'PROCESSING_ERROR') cfg.actions = [retry, cart];
    else if (err.code === 'INSUFFICIENT_POINTS') cfg.actions = [{ label: 'Ajustar puntos', onClick: go(4), kind: 'orange' }, cart];
    else if (err.code === 'VALIDATION') { cfg.title = 'No pudimos completar la compra'; cfg.message = err.message; cfg.actions = [{ label: 'Revisar mi compra', onClick: go(4), kind: 'orange' }, cart]; }
    else if (!cfg.actions.length) cfg.actions = [retry, cart];
    root.innerHTML = '<div class="page-title"><h1>Finalizar compra</h1></div>' + stepper() + '<div id="errBox"></div>';
    GS.ui.errorPanel($('#errBox'), cfg);
  }

  /* ---------- Eventos ---------- */
  function setPoints(v, fromTyping) {
    const t = calc();
    v = Math.floor(Number(v) || 0);
    const msg = $('#ptsMsg');
    if (v > user.points.balance) { msg.textContent = 'Puntos insuficientes: solo tienes ' + user.points.balance + ' puntos disponibles.'; msg.hidden = false; v = t.maxPts; }
    else if (v > t.maxPts) { msg.textContent = 'Solo puedes usar hasta ' + t.maxPts + ' puntos en esta compra (no puedes exceder el total).'; msg.hidden = false; v = t.maxPts; }
    else msg.hidden = true;
    if (v < 0) v = 0;
    st.points = v;
    // Mientras se teclea no se reescribe el campo, salvo que el valor se haya corregido (límite de saldo/total).
    const raw = String($('#ptsInput').value).trim();
    if (!fromTyping || (raw !== '' && String(v) !== raw)) $('#ptsInput').value = v;
    $('#ptsRange').value = v;
    $('#ptsSummary').innerHTML = summary4();
  }

  root.addEventListener('click', async e => {
    const g = e.target.closest('[data-go]');
    if (g) {
      const a = g.dataset.go;
      if (a === 'back') { st.step = Math.max(1, st.step - 1); render(); }
      else if (a === 'next') {
        // Revalida carrito (existencias, disponibilidad) antes de avanzar del resumen
        if (st.step === 1) {
          lines = await GS.cart.detailed();
          if (!lines.length) { GS.ui.errorPanel(root, GS.ui.errorByCode('EMPTY_CART')); return; }
          const issues = await GS.cart.issues(lines);
          const k = Object.keys(issues)[0];
          if (k) { GS.ui.errorPanel(root, GS.ui.errorByCode(issues[k].code, issues[k])); return; }
        }
        const msg = validate(st.step);
        if (msg) return showErr(msg);
        st.step += 1; render();
      } else if (a === 'pay') {
        const msg = validate(4); if (msg) return showErr(msg);
        pay();
      }
      return;
    }
    const p = e.target.closest('[data-pts]');
    if (p) setPoints(p.dataset.pts === 'max' ? calc().maxPts : 0);
  });

  root.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'ptsInput') return setPoints(t.value, true);
    if (t.id === 'ptsRange') return setPoints(t.value);
    const key = t.dataset.f; if (!key) return;
    if (key === 'card.number') t.value = t.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
    if (key === 'card.exp') { let v = t.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); t.value = v; }
    if (key === 'card.cvv' || key === 'addr.zip' || key === 'addr.phone') t.value = t.value.replace(/\D/g, '');
    const [a, b] = key.split('.');
    if (b) st[a][b] = t.value; else st[a] = t.value;
  });

  root.addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'pm') { st.method = t.value; render(); }
    else if (t.id === 'coupSel') {
      st.coupon = t.value;
      const m = calc();
      $('#ptsMax').textContent = m.maxPts; $('#ptsInput').max = m.maxPts; $('#ptsRange').max = m.maxPts;
      setPoints(st.points);
    }
  });

  render();
})();
