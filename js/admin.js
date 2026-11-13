/* GamingStore - Centro de administración (prototipo frontend). */
document.addEventListener('DOMContentLoaded', async () => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money = value => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value) || 0);
  const date = value => value ? new Date(value).toLocaleDateString('es-MX') : '—';
  const errorBox = $('#adminError');
  const showError = message => { errorBox.textContent = message; errorBox.hidden = !message; };

  try {
    const user = await GS.api.me();
    if (!user) { location.href = GS.url('login.html?next=' + encodeURIComponent('pages/admin.html')); return; }
    if (user.role !== 'admin') { showError('Acceso denegado. Tu cuenta no tiene permisos de administrador.'); setTimeout(() => { location.href = GS.url('index.html'); }, 1800); return; }

    const modal = $('#productModal'), form = $('#productForm'), modalError = $('#modalError');
    const productList = $('#adminProductList');
    let allProducts = [];

    function stat(label, value, hint) {
      return `<article class="admin-stat"><span class="muted small">${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong><span class="muted small">${escapeHTML(hint || '')}</span></article>`;
    }
    async function loadOverview() {
      const data = await GS.api.adminGetOverview();
      $('#adminStats').innerHTML = [
        stat('Ventas confirmadas', money(data.revenue), 'Ingresos de pedidos no cancelados'),
        stat('Pedidos', data.orders, `${data.pendingOrders} en seguimiento`),
        stat('Productos', data.products, 'En el catálogo'),
        stat('Usuarios', data.users, `${data.admins} administradores`)
      ].join('');
    }
    function renderProducts() {
      const query = ($('#adminProductSearch')?.value || '').trim().toLocaleLowerCase('es-MX');
      const typeFilter = $('#adminProductType')?.value || 'todos';
      const statusFilter = $('#adminProductStatus')?.value || 'todos';
      const filtered = allProducts.filter(item => {
        const title = item.title || item.name || '';
        const platforms = item.platforms?.join(', ') || item.platform || '';
        const matchesText = [title, item.id, platforms, item.description, item.desc].join(' ').toLocaleLowerCase('es-MX').includes(query);
        const isAccessory = item.type === 'fisico' || item.type === 'accesorio';
        const matchesType = typeFilter === 'todos' || (typeFilter === 'accesorio' ? isAccessory : !isAccessory);
        const matchesStatus = statusFilter === 'todos' || (statusFilter === 'activo' ? item.available !== false : item.available === false);
        return matchesText && matchesType && matchesStatus;
      });
      $('#adminProductCount').textContent = `Mostrando ${filtered.length} de ${allProducts.length} productos`;
      if (!filtered.length) {
        productList.innerHTML = '<tr><td colspan="8" class="admin-empty">No hay productos que coincidan con la búsqueda o los filtros.</td></tr>';
        return;
      }
      productList.innerHTML = filtered.map(item => {
        const title = item.title || item.name || 'Sin nombre';
        const type = item.type === 'fisico' || item.type === 'accesorio' ? 'Accesorio' : 'Juego digital';
        const platforms = item.platforms?.join(', ') || item.platform || '—';
        const stock = item.stock === null || item.stock === undefined ? '—' : item.stock;
        const status = item.available === false ? 'No disponible' : 'Activo';
        return `<tr><td><code>${escapeHTML(item.id)}</code></td><td><strong>${escapeHTML(title)}</strong><br><span class="muted small">${escapeHTML(item.description || item.desc || '')}</span></td><td>${type}</td><td>${escapeHTML(platforms)}</td><td>${money(item.price)}${Number(item.discount) > 0 ? `<br><span class="muted small">${escapeHTML(item.discount)}% de descuento</span>` : ''}</td><td>${escapeHTML(stock)}</td><td>${status}</td><td><div class="admin-actions"><button class="btn btn-sm btn-ghost btn-edit" type="button" data-id="${escapeHTML(item.id)}">Editar</button><button class="btn btn-sm btn-ghost btn-delete" type="button" data-id="${escapeHTML(item.id)}">Eliminar</button></div></td></tr>`;
      }).join('');
    }
    async function loadProducts() {
      allProducts = await GS.api.adminGetProducts();
      renderProducts();
    }
    async function loadOrders() {
      const rows = await GS.api.adminGetOrders();
      const host = $('#adminOrderList');
      if (!rows.length) { host.innerHTML = '<tr><td colspan="7" class="admin-empty">Todavía no hay pedidos.</td></tr>'; return; }
      host.innerHTML = rows.map(o => `<tr><td><strong>${escapeHTML(o.id)}</strong></td><td>${date(o.createdAt)}</td><td>${escapeHTML(o.customerName)}<br><span class="muted small">${escapeHTML(o.customerEmail)}</span></td><td>${(o.items || []).length}</td><td>${money(o.total)}</td><td>${escapeHTML(o.status === 'Cancelado' ? 'Cancelado' : (o.statusLabel || o.status || 'Confirmado'))}</td><td><div class="admin-actions">${o.status !== 'Cancelado' && o.hasPhysical ? `<button class="btn btn-sm btn-ghost btn-advance-order" type="button" data-id="${escapeHTML(o.id)}">Avanzar envío</button>` : ''}${o.status !== 'Cancelado' ? `<button class="btn btn-sm btn-ghost btn-cancel-order" type="button" data-id="${escapeHTML(o.id)}">Cancelar</button>` : '—'}</div></td></tr>`).join('');
    }
    async function loadUsers() {
      const rows = await GS.api.adminGetUsers();
      const host = $('#adminUserList');
      host.innerHTML = rows.map(u => `<tr><td><strong>${escapeHTML(u.name)}</strong><br><span class="muted small">@${escapeHTML(u.username)}</span></td><td>${escapeHTML(u.email)}</td><td>${date(u.createdAt)}</td><td>${u.orders}</td><td>${u.role === 'admin' ? 'Administrador' : 'Cliente'}</td><td><button class="btn btn-sm btn-ghost btn-role" type="button" data-id="${escapeHTML(u.id)}" data-role="${u.role === 'admin' ? 'customer' : 'admin'}" ${u.id === user.id ? 'disabled title="No puedes cambiar tu propio rol"' : ''}>${u.role === 'admin' ? 'Hacer cliente' : 'Hacer admin'}</button></td></tr>`).join('');
    }
    async function refreshAll() { await Promise.all([loadOverview(), loadProducts(), loadOrders(), loadUsers()]); }

    ['adminProductSearch', 'adminProductType', 'adminProductStatus'].forEach(id => {
      const control = $('#' + id);
      if (control) control.addEventListener('input', renderProducts);
      if (control && control.tagName === 'SELECT') control.addEventListener('change', renderProducts);
    });

    // Navegación entre módulos del panel.
    $$('.admin-tabs [data-tab]').forEach(button => button.addEventListener('click', () => {
      $$('.admin-tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', String(b === button)));
      $$('.admin-tab-panel').forEach(panel => { panel.hidden = panel.id !== `tab-${button.dataset.tab}`; });
    }));

    function openModal(game) {
      form.reset(); modalError.hidden = true;
      $('#prodId').value = game?.id || '';
      $('#prodTitle').value = game ? (game.title || game.name || '') : '';
      $('#prodType').value = game && (game.type === 'fisico' || game.type === 'accesorio') ? 'accesorio' : 'juego';
      $('#prodPlatform').value = game?.platforms?.join(', ') || game?.platform || 'PC';
      $('#prodPrice').value = game?.price ?? '';
      $('#prodStock').value = game?.stock ?? 10;
      $('#prodDesc').value = game?.description || game?.desc || '';
      $('#prodDiscount').value = game?.discount ?? 0;
      $('#prodAvailable').checked = game ? game.available !== false : true;
      $('#modalTitle').textContent = game ? 'Editar producto' : 'Agregar producto';
      modal.hidden = false;
    }
    $('#btnNewProduct').addEventListener('click', () => openModal(null));
    $('#btnCancelModal').addEventListener('click', () => { modal.hidden = true; });
    modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });

    form.addEventListener('submit', async event => {
      event.preventDefault(); modalError.hidden = true;
      const id = $('#prodId').value;
      const data = { title: $('#prodTitle').value, type: $('#prodType').value, platform: $('#prodPlatform').value, price: $('#prodPrice').value, stock: $('#prodStock').value, description: $('#prodDesc').value, discount: $('#prodDiscount').value, available: $('#prodAvailable').checked };
      const save = $('#btnSaveProduct'); save.disabled = true;
      try {
        if (id) await GS.api.updateGame(id, data); else await GS.api.createGame(data);
        modal.hidden = true; await Promise.all([loadProducts(), loadOverview()]);
      } catch (err) { modalError.textContent = err.message || 'No se pudo guardar el producto.'; modalError.hidden = false; }
      finally { save.disabled = false; }
    });

    productList.addEventListener('click', async event => {
      const button = event.target.closest('button[data-id]'); if (!button) return;
      try {
        const game = await GS.api.getGame(button.dataset.id);
        if (button.classList.contains('btn-edit')) openModal(game);
        if (button.classList.contains('btn-delete') && confirm(`¿Retirar "${game?.title || game?.name || button.dataset.id}" del catálogo?`)) {
          await GS.api.deleteGame(button.dataset.id); await Promise.all([loadProducts(), loadOverview()]);
        }
      } catch (err) { showError(err.message || 'No se pudo completar la operación.'); }
    });

    $('#adminOrderList').addEventListener('click', async event => {
      const button = event.target.closest('button[data-id]'); if (!button) return;
      try {
        if (button.classList.contains('btn-advance-order')) await GS.api.adminAdvanceOrder(button.dataset.id);
        if (button.classList.contains('btn-cancel-order')) {
          if (!confirm(`¿Confirmas cancelar el pedido ${button.dataset.id}? Se revertirán stock, puntos y cupón cuando corresponda.`)) return;
          await GS.api.adminCancelOrder(button.dataset.id);
        }
        await Promise.all([loadOrders(), loadOverview()]);
      } catch (err) { showError(err.message || 'No se pudo actualizar el pedido.'); }
    });

    $('#adminUserList').addEventListener('click', async event => {
      const button = event.target.closest('.btn-role'); if (!button || button.disabled) return;
      const action = button.dataset.role === 'admin' ? 'otorgar permisos de administrador' : 'retirar permisos de administrador';
      if (!confirm(`¿Confirmas ${action} a este usuario?`)) return;
      try { await GS.api.adminSetUserRole(button.dataset.id, button.dataset.role); await Promise.all([loadUsers(), loadOverview()]); }
      catch (err) { showError(err.message || 'No se pudo actualizar el rol.'); }
    });

    await refreshAll();
  } catch (err) {
    showError(err.message || 'No se pudo inicializar el panel de administración.');
  }
});
