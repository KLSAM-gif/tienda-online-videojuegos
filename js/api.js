/* =====================================================================
 * Gaming Store - Capa de datos (API SIMULADA con LocalStorage)
 * ---------------------------------------------------------------------
 * Toda la lógica de datos y reglas de negocio está AQUÍ, separada de la
 * interfaz. Cada método es async y devuelve la misma forma que tendrá la
 * futura API REST (Spring Boot + MySQL).
 * ===================================================================== */
(function () {
  'use strict';

  /* ---------- Almacenamiento (LocalStorage) ---------- */
  const S = GS.storage = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento lleno o bloqueado */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* noop */ } }
  };

  class GSError extends Error {
    constructor(code, message, extra) { super(message || code); this.code = code; this.extra = extra || {}; }
  }
  GS.GSError = GSError;

  const clone = o => JSON.parse(JSON.stringify(o));
  const round2 = n => Math.round(n * 100) / 100;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Cálculos puros ---------- */
  GS.calc = {
    round2,
    unitPrice(p) { return round2(p.price * (1 - (p.discount || 0) / 100)); },
    pointsFor(amount) { return Math.floor(Math.max(0, amount) / GS.CONFIG.mxnPerPoint); },
    totals(lines) {
      let subtotal = 0, discount = 0;
      lines.forEach(l => {
        const q = l.qty || 1;
        subtotal += l.product.price * q;
        discount += (l.product.price - GS.calc.unitPrice(l.product)) * q;
      });
      subtotal = round2(subtotal); discount = round2(discount);
      const total = round2(subtotal - discount);
      return { subtotal, discount, total, points: GS.calc.pointsFor(total) };
    },
    maxPointsUsable(amount, balance) { return Math.max(0, Math.min(balance, Math.floor(amount / GS.CONFIG.pointValueMXN))); },
    levels() {
      const mins = S.get('gs_levels', null);
      return GS.CONFIG.levels.map((l, i) => Object.assign({}, l, { min: i === 0 ? 0 : (mins && mins[i] != null ? mins[i] : l.min) }));
    },
    levelInfo(earned) {
      const lv = GS.calc.levels();
      let idx = 0;
      lv.forEach((l, i) => { if (earned >= l.min) idx = i; });
      const cur = lv[idx], next = lv[idx + 1] || null;
      const progress = next ? Math.min(100, Math.max(0, Math.round((earned - cur.min) / (next.min - cur.min) * 100))) : 100;
      return { current: cur, next, progress, remaining: next ? next.min - earned : 0, index: idx };
    }
  };

  /* ---------- Usuarios ---------- */
  const U = {
    all() { return S.get('gs_users', []); },
    save(a) { S.set('gs_users', a); },
    byId(id) { return U.all().find(u => u.id === id) || null; },
    current() { const id = S.get('gs_session', null); return id ? U.byId(id) : null; },
    update(id, fn) {
      const a = U.all(); const i = a.findIndex(u => u.id === id);
      if (i < 0) throw new GSError('UNAUTHENTICATED', 'Sesión no válida');
      fn(a[i]); U.save(a); return a[i];
    }
  };
  const pub = u => {
    if (!u) return null;
    const c = clone(u); delete c.password;
    c.level = GS.calc.levelInfo(c.points.earned);
    return c;
  };
  GS.session = { user() { return pub(U.current()); } };

  /* ---------- Inventario ---------- */
  const customGames = () => S.get('gs_custom_games', []);
  const setCustomGames = (a) => S.set('gs_custom_games', a);
  const gameOverrides = () => S.get('gs_game_overrides', {});
  const deletedGames = () => S.get('gs_deleted_games', []);
  const stockMap = () => S.get('gs_stock', {});

  function product(id) {
    if (deletedGames().includes(id)) return null;
    const base = GS.DATA.games.find(g => g.id === id);
    const custom = customGames().find(g => g.id === id);
    const p = custom || (base ? { ...base, ...(gameOverrides()[id] || {}) } : null);
    if (!p) return null;
    const c = clone(p);
    if (c.type === 'fisico' || c.type === 'accesorio') { 
      const m = stockMap(); 
      if (m[id] !== undefined) c.stock = m[id]; 
    }
    return c;
  }
  function adjustStock(id, delta) {
    const p = product(id);
    if (!p || (p.type !== 'fisico' && p.type !== 'accesorio')) return;
    const m = stockMap(); m[id] = Math.max(0, (p.stock || 0) + delta); S.set('gs_stock', m);
  }

  /* ---------- Utilidades de negocio ---------- */
  const CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = n => Array.from({ length: n }, () => CH[Math.floor(Math.random() * CH.length)]).join('');
  const genKey = () => 'DEMO-' + seg(5) + '-' + seg(5) + '-' + seg(5);
  function nextOrderId() { const n = S.get('gs_order_seq', 240000) + 1; S.set('gs_order_seq', n); return 'GS-' + n; }

  function applyPoints(u, delta, kind, concept, ref, date) {
    u.points.balance = Math.max(0, u.points.balance + delta);
    if (kind === 'compra') u.points.earned += delta;
    else if (kind === 'reversa') u.points.earned = Math.max(0, u.points.earned + delta);
    else if (kind === 'canje' || kind === 'descuento') u.points.used += -delta;
    else if (kind === 'reembolso') u.points.used = Math.max(0, u.points.used - delta);
    u.movements.unshift({
      id: 'M-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: date || new Date().toISOString(), kind, concept, points: delta, balance: u.points.balance, ref: ref || null
    });
  }

  const PHYS = ['Pago confirmado', 'Empacado', 'En tránsito', 'Entregado'];
  const DIG = ['Pago confirmado', 'Generando licencia', 'Licencia entregada'];

  function decorate(o) {
    const c = clone(o);
    if (o.status === 'Cancelado') { c.tracking = { physical: null, digital: null }; c.statusLabel = 'Cancelado'; c.finished = true; return c; }
    const el = Date.now() - new Date(o.createdAt).getTime();
    const tr = { physical: null, digital: null };
    if (o.hasPhysical) {
      const idx = Math.min(3, Math.max(o.stage || 0, Math.floor(el / GS.CONFIG.stageMs)));
      tr.physical = { idx, labels: PHYS };
    }
    if (o.hasDigital) {
      const idx = Math.min(2, Math.floor(el / GS.CONFIG.digitalStageMs));
      tr.digital = { idx, labels: DIG };
    }
    c.tracking = tr;
    c.statusLabel = tr.physical ? PHYS[tr.physical.idx] : DIG[tr.digital.idx];
    c.finished = (!tr.physical || tr.physical.idx === 3) && (!tr.digital || tr.digital.idx === 2);
    return c;
  }

  function buildOrder(u, p, date) {
    const t = GS.calc.totals(p.lines);
    const couponAmount = p.coupon ? Math.min(p.coupon.amount, t.total) : 0;
    const afterCoupon = round2(t.total - couponAmount);
    const pointsUsed = p.pointsUsed || 0;
    const pointsDiscount = pointsUsed * GS.CONFIG.pointValueMXN;
    const paid = round2(Math.max(0, afterCoupon - pointsDiscount));
    const earned = GS.calc.pointsFor(paid);
    const id = nextOrderId();
    const items = p.lines.map(l => ({
      id: l.product.id, name: l.product.name || l.product.title, platform: l.platform, type: l.product.type,
      qty: l.qty, original: l.product.price, unitPrice: GS.calc.unitPrice(l.product)
    }));
    const order = {
      id, createdAt: date, items, subtotal: t.subtotal, discount: t.discount,
      couponCode: p.coupon ? p.coupon.code : null, couponAmount,
      pointsUsed, pointsDiscount, total: paid, paymentMethod: p.payment.label,
      delivery: p.delivery || {}, hasPhysical: items.some(i => i.type === 'fisico' || i.type === 'accesorio'),
      hasDigital: items.some(i => i.type === 'digital' || i.type === 'juego'), status: 'Confirmado', earnedPoints: earned, stage: 0
    };
    p.lines.forEach(l => { if (l.product.type === 'fisico' || l.product.type === 'accesorio') adjustStock(l.product.id, -l.qty); });
    p.lines.forEach(l => {
      if (l.product.type === 'digital' || l.product.type === 'juego') {
        u.library.push({
          id: 'L-' + id + '-' + l.product.id + '-' + l.platform, orderId: id, productId: l.product.id,
          name: l.product.name || l.product.title, platform: l.platform, acquiredAt: date, key: genKey(), downloaded: false
        });
      }
    });
    if (pointsUsed > 0) applyPoints(u, -pointsUsed, 'descuento', 'Descuento con puntos en pedido ' + id, id, date);
    if (earned > 0) applyPoints(u, earned, 'compra', 'Compra ' + id, id, date);
    if (p.coupon) { const c = u.coupons.find(x => x.code === p.coupon.code); if (c) { c.used = true; c.usedOn = id; } }
    u.orders.unshift(order);
    return order;
  }

  async function simulatePayment(payment) {
    await sleep(1300);
    if (payment.method === 'card') {
      const n = String(payment.number || '').replace(/\D/g, '');
      if (n.endsWith('0002')) throw new GSError('PAYMENT_DECLINED', 'El banco rechazó el pago.');
      if (n.endsWith('9999')) throw new GSError('PROCESSING_ERROR', 'Ocurrió un error al procesar el pago.');
    }
    if (payment.method === 'paypal' && /rechaz/i.test(payment.email || '')) throw new GSError('PAYMENT_DECLINED', 'PayPal rechazó el pago.');
  }

  /* ---------- Seed del usuario demo ---------- */
  function seed() {
    if (S.get('gs_users', null)) return;
    const d = GS.CONFIG.demoUser;
    const u = {
      id: 'u-demo', name: d.name, username: d.username, email: d.email, password: d.password, role: 'customer', avatar: '🎮',
      createdAt: '2026-01-15T10:00:00', points: { balance: 0, earned: 0, used: 0 },
      movements: [], orders: [], library: [], redeemed: [], coupons: []
    };
    const L = (id, platform, qty) => ({ product: product(id), platform, qty: qty || 1 });
    const addr = { name: 'Alex Gamer', street: 'Av. Universidad 100', city: 'Santiago de Querétaro', state: 'Querétaro', zip: '76000', phone: '4421234567' };
    buildOrder(u, { lines: [L('elden-ring', 'PC'), L('hades', 'PC')], payment: { label: 'Tarjeta •••• 4242' }, delivery: { email: d.email }, pointsUsed: 0, coupon: null }, '2026-08-20T15:30:00');
    buildOrder(u, { lines: [L('baldurs-gate-3', 'PC'), L('acc-mouse', 'Físico')], payment: { label: 'PayPal' }, delivery: { email: d.email, address: addr }, pointsUsed: 0, coupon: null }, '2026-09-28T19:05:00');
    buildOrder(u, { lines: [L('halo-infinite', 'PC'), L('rdr2', 'PC')], payment: { label: 'Tarjeta •••• 4242' }, delivery: { email: d.email }, pointsUsed: 0, coupon: null }, '2026-10-15T12:40:00');
    applyPoints(u, -30, 'canje', 'Canje: Fondos de pantalla exclusivos', 'RC-SEED1', '2026-10-20T09:00:00');
    u.redeemed.push({ id: 'RC-SEED1', rewardId: 'wallpapers', name: 'Fondos de pantalla exclusivos', type: 'wallpaper', cost: 30, date: '2026-10-20T09:00:00', code: null });
    S.set('gs_users', [u]);
  }
  seed();

  /* ---------- API pública (async) ---------- */
  const emailOk = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  const userOk = x => /^[a-z0-9_]{3,20}$/.test(x);
  const needUser = () => { const u = U.current(); if (!u) throw new GSError('UNAUTHENTICATED', 'Debes iniciar sesión.'); return u; };
  const needAdmin = () => { const u = needUser(); if (u.role !== 'admin') throw new GSError('FORBIDDEN', 'Se requieren permisos de administrador.'); return u; };

  // Agrega el administrador de demostración incluso si el navegador ya tenía datos guardados.
  function ensureDemoAdmin() {
    const d = GS.CONFIG.demoAdmin;
    const users = U.all();
    const admin = users.find(u => u.id === 'u-admin-demo');
    const emailInUse = users.some(u => u.email === d.email && u.id !== 'u-admin-demo');
    const usernameInUse = users.some(u => u.username === d.username && u.id !== 'u-admin-demo');
    if (!admin && !emailInUse && !usernameInUse) {
      users.push({ id: 'u-admin-demo', name: d.name, username: d.username, email: d.email, password: d.password, role: 'admin', avatar: '🛡️', createdAt: new Date().toISOString(), points: { balance: 0, earned: 0, used: 0 }, movements: [], orders: [], library: [], redeemed: [], coupons: [] });
      U.save(users);
    }
  }
  ensureDemoAdmin();

  GS.api = {
    async register(d) {
      const name = (d.name || '').trim(), username = (d.username || '').trim().toLowerCase(), email = (d.email || '').trim().toLowerCase();
      if (name.length < 2) throw new GSError('VALIDATION', 'Escribe tu nombre completo.');
      if (!userOk(username)) throw new GSError('VALIDATION', 'El usuario debe tener 3 a 20 caracteres: letras minúsculas, números o guion bajo.');
      if (!emailOk(email)) throw new GSError('VALIDATION', 'Escribe un correo válido.');
      if (!d.password || d.password.length < 6) throw new GSError('VALIDATION', 'La contraseña debe tener al menos 6 caracteres.');
      const all = U.all();
      if (all.some(u => u.email === email)) throw new GSError('VALIDATION', 'Ese correo ya está registrado.');
      if (all.some(u => u.username === username)) throw new GSError('VALIDATION', 'Ese nombre de usuario ya existe.');
      const u = {
        id: 'u-' + Date.now().toString(36), name, username, email, password: d.password, role: 'customer', avatar: '🕹️',
        createdAt: new Date().toISOString(), points: { balance: 0, earned: 0, used: 0 },
        movements: [], orders: [], library: [], redeemed: [], coupons: []
      };
      all.push(u); U.save(all); S.set('gs_session', u.id);
      return pub(u);
    },
    async login(email, password) {
      email = (email || '').trim().toLowerCase();
      const u = U.all().find(x => x.email === email && x.password === password);
      if (!u) throw new GSError('AUTH', 'Correo o contraseña incorrectos.');
      S.set('gs_session', u.id);
      return pub(u);
    },
    async logout() { S.del('gs_session'); },
    async me() { return pub(U.current()); },
    async updateProfile(p) {
      const u = needUser();
      const name = (p.name || '').trim(), username = (p.username || '').trim().toLowerCase(), email = (p.email || '').trim().toLowerCase();
      if (name.length < 2) throw new GSError('VALIDATION', 'Escribe tu nombre completo.');
      if (!userOk(username)) throw new GSError('VALIDATION', 'Usuario no válido (3-20 caracteres: a-z, 0-9, _).');
      if (!emailOk(email)) throw new GSError('VALIDATION', 'Escribe un correo válido.');
      const others = U.all().filter(x => x.id !== u.id);
      if (others.some(x => x.email === email)) throw new GSError('VALIDATION', 'Ese correo ya está en uso.');
      if (others.some(x => x.username === username)) throw new GSError('VALIDATION', 'Ese usuario ya está en uso.');
      if (p.newPassword && p.newPassword.length < 6) throw new GSError('VALIDATION', 'La nueva contraseña debe tener al menos 6 caracteres.');
      const r = U.update(u.id, uu => {
        uu.name = name; uu.username = username; uu.email = email;
        if (p.avatar) uu.avatar = p.avatar;
        if (p.newPassword) uu.password = p.newPassword;
      });
      return pub(r);
    },

    /* ----- Catálogo e inventario ----- */
    async getGames() {
      const baseGames = GS.DATA.games.map(g => product(g.id)).filter(Boolean);
      const baseIds = new Set(GS.DATA.games.map(g => g.id));
      const customs = customGames().filter(g => !deletedGames().includes(g.id) && !baseIds.has(g.id)).map(g => product(g.id)).filter(Boolean);
      return [...baseGames, ...customs];
    },
    async getGame(id) { return product(id); },
    async getRewards() { return clone(GS.DATA.rewards); },

    /* ----- Módulo Administrador ----- */
    async adminGetProducts() {
      needAdmin();
      const all = await this.getGames();
      const unique = new Map();
      all.forEach(item => { if (item && item.id) unique.set(item.id, item); });
      return Array.from(unique.values());
    },
    async adminGetOverview() {
      needAdmin();
      const users = U.all();
      const orders = users.flatMap(u => (u.orders || []).map(o => ({ ...o, customerName: u.name, customerEmail: u.email })));
      const games = await this.getGames();
      return {
        users: users.length,
        customers: users.filter(u => u.role !== 'admin').length,
        admins: users.filter(u => u.role === 'admin').length,
        products: games.length,
        orders: orders.length,
        revenue: round2(orders.filter(o => o.status !== 'Cancelado').reduce((sum, o) => sum + (Number(o.total) || 0), 0)),
        pendingOrders: orders.filter(o => o.status !== 'Cancelado' && o.status !== 'Entregado').length
      };
    },
    async adminGetUsers() {
      needAdmin();
      return U.all().map(u => ({ id: u.id, name: u.name, username: u.username, email: u.email, role: u.role || 'customer', createdAt: u.createdAt, orders: (u.orders || []).length }));
    },
    async adminSetUserRole(userId, role) {
      needAdmin();
      if (!['admin', 'customer'].includes(role)) throw new GSError('VALIDATION', 'Rol no válido.');
      const users = U.all();
      const target = users.find(u => u.id === userId);
      if (!target) throw new GSError('NOT_FOUND', 'Usuario no encontrado.');
      if (target.id === U.current().id && role !== 'admin') throw new GSError('VALIDATION', 'No puedes quitarte tus propios permisos de administrador.');
      if (target.role === 'admin' && role !== 'admin' && users.filter(u => u.role === 'admin').length <= 1) throw new GSError('VALIDATION', 'Debe existir al menos un administrador.');
      target.role = role; U.save(users);
      return { id: target.id, role: target.role };
    },
    async adminGetOrders() {
      needAdmin();
      return U.all().flatMap(u => (u.orders || []).map(o => ({ ...decorate(o), customerName: u.name, customerEmail: u.email })))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async adminAdvanceOrder(orderId) {
      needAdmin();
      let result = null;
      const owner = U.all().find(u => (u.orders || []).some(o => o.id === orderId));
      if (!owner) throw new GSError('NOT_FOUND', 'Pedido no encontrado.');
      U.update(owner.id, uu => {
        const order = uu.orders.find(o => o.id === orderId);
        if (!order || order.status === 'Cancelado') throw new GSError('ORDER_NOT_CANCELLABLE', 'No se puede actualizar este pedido.');
        if (!order.hasPhysical) throw new GSError('VALIDATION', 'Este pedido no contiene productos físicos.');
        const current = decorate(order).tracking.physical.idx;
        order.stage = Math.min(3, current + 1);
        result = { ...decorate(order), customerName: uu.name, customerEmail: uu.email };
      });
      return result;
    },
    async adminCancelOrder(orderId) {
      needAdmin();
      const owner = U.all().find(u => (u.orders || []).some(o => o.id === orderId));
      if (!owner) throw new GSError('NOT_FOUND', 'Pedido no encontrado.');
      let result = null;
      U.update(owner.id, uu => {
        const order = uu.orders.find(o => o.id === orderId);
        if (!order) throw new GSError('NOT_FOUND', 'Pedido no encontrado.');
        if (order.status === 'Cancelado') throw new GSError('ORDER_NOT_CANCELLABLE', 'Este pedido ya fue cancelado.');
        const tracking = decorate(order).tracking;
        if (tracking.physical && tracking.physical.idx >= 2) throw new GSError('ORDER_NOT_CANCELLABLE', 'El pedido ya está en tránsito o fue entregado y no puede cancelarse.');
        if (uu.library.some(item => item.orderId === order.id && item.downloaded)) throw new GSError('ORDER_NOT_CANCELLABLE', 'Ya se descargó un juego de este pedido.');
        order.items.forEach(item => { if (item.type === 'fisico' || item.type === 'accesorio') adjustStock(item.id, item.qty); });
        uu.library = uu.library.filter(item => item.orderId !== order.id);
        if (order.earnedPoints > 0) applyPoints(uu, -order.earnedPoints, 'reversa', 'Reversa administrativa de puntos por cancelación de ' + order.id, order.id);
        if (order.pointsUsed > 0) applyPoints(uu, order.pointsUsed, 'reembolso', 'Reembolso administrativo de puntos por cancelación de ' + order.id, order.id);
        if (order.couponCode) { const coupon = uu.coupons.find(item => item.code === order.couponCode); if (coupon) { coupon.used = false; delete coupon.usedOn; } }
        order.status = 'Cancelado'; order.cancelledAt = new Date().toISOString();
        result = { ...decorate(order), customerName: uu.name, customerEmail: uu.email };
      });
      return result;
    },
    async createGame(gameData) {
      needAdmin();
      const title = String(gameData.title || '').trim();
      const price = Number(gameData.price);
      const stock = Number.parseInt(gameData.stock, 10);
      if (title.length < 2) throw new GSError('VALIDATION', 'El nombre debe tener al menos 2 caracteres.');
      if (!Number.isFinite(price) || price < 0) throw new GSError('VALIDATION', 'El precio debe ser un número válido mayor o igual a cero.');
      if (!Number.isInteger(stock) || stock < 0) throw new GSError('VALIDATION', 'El stock debe ser un entero mayor o igual a cero.');
      const customs = customGames();
      const id = 'game_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const type = gameData.type === 'accesorio' ? 'fisico' : 'digital';
      const platforms = String(gameData.platform || 'PC').split(',').map(x => x.trim()).filter(Boolean);
      const description = String(gameData.description || '').trim();
      const discount = Number(gameData.discount ?? 0);
      if (!Number.isFinite(discount) || discount < 0 || discount > 100) throw new GSError('VALIDATION', 'El descuento debe estar entre 0 y 100%.');
      const newGame = { id, title, name: title, type, platform: platforms.join(', '), platforms, price, stock: type === 'fisico' ? stock : null, description, desc: description, available: gameData.available !== false, discount, genre: type === 'fisico' ? 'Accesorios' : 'Nuevo', colors: ['#152238', '#ff8c32'] };
      customs.push(newGame); setCustomGames(customs);
      return clone(newGame);
    },
    async updateGame(id, updatedData) {
      needAdmin();
      const current = product(id);
      if (!current) throw new GSError('NOT_FOUND', 'Producto no encontrado.');
      const title = String(updatedData.title || '').trim();
      const price = Number(updatedData.price);
      const stock = Number.parseInt(updatedData.stock, 10);
      if (title.length < 2) throw new GSError('VALIDATION', 'El nombre debe tener al menos 2 caracteres.');
      if (!Number.isFinite(price) || price < 0) throw new GSError('VALIDATION', 'El precio debe ser un número válido mayor o igual a cero.');
      if (!Number.isInteger(stock) || stock < 0) throw new GSError('VALIDATION', 'El stock debe ser un entero mayor o igual a cero.');
      const platforms = String(updatedData.platform || current.platforms?.join(', ') || 'PC').split(',').map(x => x.trim()).filter(Boolean);
      const description = String(updatedData.description ?? current.description ?? current.desc ?? '').trim();
      const discount = Number(updatedData.discount ?? current.discount ?? 0);
      if (!Number.isFinite(discount) || discount < 0 || discount > 100) throw new GSError('VALIDATION', 'El descuento debe estar entre 0 y 100%.');
      const patch = { title, name: title, type: updatedData.type === 'accesorio' ? 'fisico' : 'digital', platform: platforms.join(', '), platforms, price, description, desc: description, discount, available: updatedData.available !== false };
      if (patch.type === 'fisico') patch.stock = stock;
      if (GS.DATA.games.some(g => g.id === id)) {
        const overrides = gameOverrides(); overrides[id] = { ...(overrides[id] || {}), ...patch }; S.set('gs_game_overrides', overrides);
      } else {
        const customs = customGames(); const idx = customs.findIndex(g => g.id === id);
        if (idx < 0) throw new GSError('NOT_FOUND', 'Producto no encontrado.');
        customs[idx] = { ...customs[idx], ...patch }; setCustomGames(customs);
      }
      if (patch.type === 'fisico') { const m = stockMap(); m[id] = stock; S.set('gs_stock', m); }
      return product(id);
    },
    async deleteGame(id) {
      needAdmin();
      if (!product(id)) throw new GSError('NOT_FOUND', 'Producto no encontrado.');
      if (GS.DATA.games.some(g => g.id === id)) {
        const removed = deletedGames(); if (!removed.includes(id)) removed.push(id); S.set('gs_deleted_games', removed);
        const overrides = gameOverrides(); delete overrides[id]; S.set('gs_game_overrides', overrides);
      } else setCustomGames(customGames().filter(g => g.id !== id));
      return { success: true, id };
    },

    /* ----- Compra ----- */
    async checkout(req) {
      const u = needUser();
      if (!req || !req.lines || !req.lines.length) throw new GSError('EMPTY_CART', 'Tu carrito está vacío.');
      const lines = [];
      for (const l of req.lines) {
        const p = product(l.id);
        if (!p || !p.available) throw new GSError('UNAVAILABLE', 'Producto no disponible.', { name: p ? (p.name || p.title) : l.id });
        let qty = 1;
        if (p.type === 'fisico' || p.type === 'accesorio') {
          qty = Math.max(1, parseInt(l.qty, 10) || 1);
          if (p.stock < qty) throw new GSError('OUT_OF_STOCK', 'Producto sin existencias suficientes.', { name: p.name || p.title, stock: p.stock });
        } else {
          if (p.platforms && !p.platforms.includes(l.platform)) throw new GSError('UNAVAILABLE', 'Plataforma no disponible.', { name: p.name || p.title });
          if (u.library.some(x => x.productId === p.id && x.platform === l.platform)) throw new GSError('ALREADY_OWNED', 'Ya tienes este juego en tu biblioteca.', { name: p.name || p.title });
        }
        lines.push({ product: p, qty, platform: l.platform });
      }
      const t = GS.calc.totals(lines);
      let coupon = null;
      if (req.couponCode) {
        coupon = u.coupons.find(c => c.code === req.couponCode && !c.used);
        if (!coupon) throw new GSError('VALIDATION', 'El cupón no es válido o ya fue utilizado.');
      }
      const couponAmount = coupon ? Math.min(coupon.amount, t.total) : 0;
      const pointsUsed = Math.floor(Number(req.pointsToUse) || 0);
      if (pointsUsed < 0) throw new GSError('VALIDATION', 'Cantidad de puntos no válida.');
      if (pointsUsed > u.points.balance) throw new GSError('INSUFFICIENT_POINTS', 'No tienes suficientes Gaming Points.', { missing: pointsUsed - u.points.balance });
      if (pointsUsed * GS.CONFIG.pointValueMXN > Math.max(0, t.total - couponAmount)) throw new GSError('VALIDATION', 'No puedes usar más puntos que el total de la compra.');
      const due = round2(t.total - couponAmount - pointsUsed * GS.CONFIG.pointValueMXN);
      if (due > 0) await simulatePayment(req.payment || {});
      const label = due <= 0 ? 'Gaming Points / saldo' : (req.payment.method === 'paypal' ? 'PayPal' : 'Tarjeta •••• ' + String(req.payment.number || '').replace(/\D/g, '').slice(-4));
      let order;
      const updated = U.update(u.id, uu => {
        order = buildOrder(uu, { lines, payment: { label }, delivery: req.delivery, pointsUsed, coupon }, new Date().toISOString());
      });
      return { order: decorate(order), points: { balance: updated.points.balance, earned: order.earnedPoints, used: pointsUsed }, user: pub(updated) };
    },

    /* ----- Pedidos ----- */
    async getOrders() { return needUser().orders.map(decorate); },
    async getOrder(id) { const o = needUser().orders.find(x => x.id === id); return o ? decorate(o) : null; },
    async advanceOrder(id) {
      const u = needUser();
      U.update(u.id, uu => {
        const o = uu.orders.find(x => x.id === id);
        if (!o || o.status === 'Cancelado' || !o.hasPhysical) return;
        const cur = decorate(o).tracking.physical.idx;
        o.stage = Math.min(3, cur + 1);
      });
      return this.getOrder(id);
    },
    async cancelOrder(id) {
      const u = needUser();
      U.update(u.id, uu => {
        const o = uu.orders.find(x => x.id === id);
        if (!o) throw new GSError('NOT_FOUND', 'Pedido no encontrado.');
        if (o.status === 'Cancelado') throw new GSError('ORDER_NOT_CANCELLABLE', 'Este pedido ya fue cancelado.');
        const tr = decorate(o).tracking;
        if (tr.physical && tr.physical.idx >= 2) throw new GSError('ORDER_NOT_CANCELLABLE', 'El pedido ya está en tránsito o fue entregado y no puede cancelarse.');
        if (uu.library.some(x => x.orderId === o.id && x.downloaded)) throw new GSError('ORDER_NOT_CANCELLABLE', 'Ya descargaste un juego de este pedido, por lo que no puede cancelarse.');
        o.items.forEach(i => { if (i.type === 'fisico' || i.type === 'accesorio') adjustStock(i.id, i.qty); });
        uu.library = uu.library.filter(x => x.orderId !== o.id);
        if (o.earnedPoints > 0) applyPoints(uu, -o.earnedPoints, 'reversa', 'Reversa de puntos por cancelación de ' + o.id, o.id);
        if (o.pointsUsed > 0) applyPoints(uu, o.pointsUsed, 'reembolso', 'Reembolso de puntos por cancelación de ' + o.id, o.id);
        if (o.couponCode) { const c = uu.coupons.find(x => x.code === o.couponCode); if (c) { c.used = false; delete c.usedOn; } }
        o.status = 'Cancelado'; o.cancelledAt = new Date().toISOString();
      });
      return this.getOrder(id);
    },

    /* ----- Biblioteca ----- */
    async getLibrary() { return clone(needUser().library); },
    async markDownloaded(id) {
      const u = needUser();
      U.update(u.id, uu => { const l = uu.library.find(x => x.id === id); if (l) l.downloaded = true; });
    },

    /* ----- Gaming Points ----- */
    async getPoints() {
      const u = needUser();
      return { balance: u.points.balance, earned: u.points.earned, used: u.points.used, movements: clone(u.movements), level: GS.calc.levelInfo(u.points.earned) };
    },
    async redeemReward(id) {
      const u = needUser();
      const r = GS.DATA.rewards.find(x => x.id === id);
      if (!r) throw new GSError('NOT_FOUND', 'Recompensa no encontrada.');
      let entry;
      const updated = U.update(u.id, uu => {
        if (uu.points.balance < r.cost) throw new GSError('INSUFFICIENT_POINTS', 'No tienes suficientes Gaming Points.', { missing: r.cost - uu.points.balance });
        const date = new Date().toISOString();
        const rid = 'RC-' + Date.now().toString(36).toUpperCase();
        applyPoints(uu, -r.cost, 'canje', 'Canje: ' + r.name, rid, date);
        entry = { id: rid, rewardId: r.id, name: r.name, type: r.type, cost: r.cost, date, code: null };
        if (r.type === 'cupon' || r.type === 'giftcard') {
          const code = (r.type === 'cupon' ? 'CUP-' : 'GIFT-') + seg(4) + '-' + seg(4);
          entry.code = code; entry.value = r.value;
          uu.coupons.push({ code, amount: r.value, used: false, source: r.name, kind: r.type });
        } else if (r.type !== 'wallpaper') {
          entry.note = 'Se enviará a tu domicilio registrado (DEMO).';
        }
        uu.redeemed.unshift(entry);
      });
      return { redeemed: entry, balance: updated.points.balance };
    },
    async getRedeemed() { return clone(needUser().redeemed); },
    async getCoupons() { return clone(needUser().coupons.filter(c => !c.used)); },

    /* ----- Configuración ----- */
    async saveLevels(mins) {
      const ok = Array.isArray(mins) && mins.length === 4 && mins.every(n => Number.isInteger(n) && n >= 0) && mins[0] === 0 && mins[1] < mins[2] && mins[2] < mins[3] && mins[1] > 0;
      if (!ok) throw new GSError('VALIDATION', 'Los puntos de cada nivel deben ser enteros y estar en orden creciente.');
      S.set('gs_levels', mins);
    },
    async resetLevels() { S.del('gs_levels'); },
    async resetDemo() {
      try { Object.keys(localStorage).filter(k => k.indexOf('gs_') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { /* noop */ }
      seed();
    }
  };
})();