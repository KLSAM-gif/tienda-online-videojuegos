/* Gaming Store - Catálogo con filtros, categorías, búsqueda y ordenamiento.
 * Consulta GS.api.getGames(); con backend: GET /api/games?plataforma=&genero=&q=&orden= */
(async function () {
  'use strict';
  const root = document.getElementById('catalogPage');
  if (!root) return;
  const $ = GS.util.$, $$ = GS.util.$$, norm = GS.util.norm, esc = GS.util.esc, money = GS.util.money;

  const all = await GS.api.getGames();
  const P = GS.util.params();
  const SORTS = { popular: 'Más populares', menor: 'Menor precio', mayor: 'Mayor precio', vendidos: 'Más vendidos', recientes: 'Lanzamientos recientes' };
  const TIPOS = ['juegos', 'accesorios', 'todos'];

  const state = {
    q: (P.get('q') || '').trim(),
    tipo: TIPOS.includes(P.get('tipo')) ? P.get('tipo') : 'juegos',
    platforms: new Set(), genres: new Set(), maxPrice: 2000,
    offers: P.get('ofertas') === '1', pop: 0,
    sort: SORTS[P.get('orden')] ? P.get('orden') : 'popular'
  };
  if (GS.DATA.platforms.includes(P.get('plataforma'))) state.platforms.add(P.get('plataforma'));
  if (GS.DATA.genres.includes(P.get('genero'))) state.genres.add(P.get('genero'));

  /* Controles estáticos */
  $('#fPlatforms').innerHTML = GS.DATA.platforms.map(x => '<label class="check"><input type="checkbox" data-kind="plat" value="' + x + '"> ' + x + '</label>').join('');
  $('#fGenres').innerHTML = GS.DATA.genres.map(x => '<label class="check"><input type="checkbox" data-kind="genre" value="' + x + '"> ' + x + '</label>').join('');
  $('#sortSel').innerHTML = Object.keys(SORTS).map(k => '<option value="' + k + '">' + SORTS[k] + '</option>').join('');

  function toggle(set, v, on) { if (on) set.add(v); else set.delete(v); }

  $('#filters').addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.kind === 'plat') toggle(state.platforms, t.value, t.checked);
    else if (t.dataset.kind === 'genre') toggle(state.genres, t.value, t.checked);
    else if (t.id === 'fOffers') state.offers = t.checked;
    else if (t.id === 'fPop') state.pop = +t.value;
    render();
  });
  $('#fPrice').addEventListener('input', e => { state.maxPrice = +e.target.value; render(); });
  $('#sortSel').addEventListener('change', e => { state.sort = e.target.value; render(); });
  $('#typeTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tipo]'); if (!b) return;
    state.tipo = b.dataset.tipo;
    if (state.tipo === 'accesorios') state.genres.clear();
    render();
  });
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('[data-chip]'); if (!b) return;
    const v = b.dataset.chip, kind = b.dataset.kind;
    if (kind === 'all') { state.platforms.clear(); state.genres.clear(); }
    else {
      const set = kind === 'plat' ? state.platforms : state.genres;
      const was = set.size === 1 && set.has(v);
      set.clear(); if (!was) set.add(v);
    }
    render();
  });
  $('#resetFilters').addEventListener('click', resetAll);
  $('#filtersToggle').addEventListener('click', () => $('#filters').classList.toggle('open'));

  function resetAll() {
    state.q = ''; state.platforms.clear(); state.genres.clear(); state.maxPrice = 2000; state.offers = false; state.pop = 0; state.sort = 'popular';
    const gq = $('#globalQ'); if (gq) gq.value = '';
    render();
  }

  function apply() {
    const list = all.filter(p => {
      if (state.tipo === 'juegos' && p.type !== 'digital') return false;
      if (state.tipo === 'accesorios' && p.type !== 'fisico') return false;
      if (state.q && !norm(p.name).includes(norm(state.q))) return false;
      if (state.platforms.size && !p.platforms.some(x => state.platforms.has(x))) return false;
      if (state.genres.size && !state.genres.has(p.genre)) return false;
      if (GS.calc.unitPrice(p) > state.maxPrice) return false;
      if (state.offers && !p.discount) return false;
      if (state.pop && p.sales < state.pop) return false;
      return true;
    });
    const s = state.sort;
    list.sort((a, b) =>
      s === 'menor' ? GS.calc.unitPrice(a) - GS.calc.unitPrice(b) :
      s === 'mayor' ? GS.calc.unitPrice(b) - GS.calc.unitPrice(a) :
      s === 'vendidos' ? b.sales - a.sales :
      s === 'recientes' ? new Date(b.release) - new Date(a.release) :
      (b.rating * 10 + b.sales / 10) - (a.rating * 10 + a.sales / 10));
    return list;
  }

  function render() {
    /* Sincroniza controles */
    $$('#filters [data-kind=plat]').forEach(c => { c.checked = state.platforms.has(c.value); });
    $$('#filters [data-kind=genre]').forEach(c => { c.checked = state.genres.has(c.value); });
    $('#fOffers').checked = state.offers; $('#fPop').value = String(state.pop);
    $('#fPrice').value = state.maxPrice; $('#fPriceLabel').textContent = money(state.maxPrice);
    $('#sortSel').value = state.sort;
    $$('#typeTabs button').forEach(b => b.classList.toggle('active', b.dataset.tipo === state.tipo));
    $('#gGenres').hidden = state.tipo === 'accesorios';

    /* Categorías rápidas */
    const chips = [['all', 'all', 'Todos', !state.platforms.size && !state.genres.size]]
      .concat(GS.DATA.platforms.map(x => ['plat', x, x, state.platforms.size === 1 && state.platforms.has(x)]));
    if (state.tipo !== 'accesorios') chips.push(...GS.DATA.genres.map(x => ['genre', x, x, state.genres.size === 1 && state.genres.has(x)]));
    $('#chips').innerHTML = chips.map(c => '<button class="chip-btn' + (c[3] ? ' active' : '') + '" data-kind="' + c[0] + '" data-chip="' + esc(c[1]) + '">' + esc(c[2]) + '</button>').join('');

    /* Título */
    $('#catTitle').textContent = state.q ? 'Resultados para “' + state.q + '”' :
      state.offers ? 'Ofertas y promociones' : state.tipo === 'accesorios' ? 'Accesorios y productos físicos' : state.tipo === 'todos' ? 'Todo el catálogo' : 'Videojuegos';

    const list = apply();
    $('#resultCount').textContent = list.length + (list.length === 1 ? ' producto' : ' productos');
    const ctxPlat = state.platforms.size === 1 ? [...state.platforms][0] : null;
    $('#results').innerHTML = list.length
      ? list.map(p => GS.ui.gameCard(p, { platform: ctxPlat && p.platforms.includes(ctxPlat) ? ctxPlat : null })).join('')
      : '<div class="state-panel" style="grid-column:1/-1;margin:10px auto"><div class="state-icon">🔎</div><h2>Sin resultados</h2><p class="muted">No encontramos productos con esos filtros. Prueba con otra búsqueda o limpia los filtros.</p><div class="state-actions"><button class="btn btn-orange" id="emptyReset">Limpiar filtros</button></div></div>';
    const er = $('#emptyReset'); if (er) er.addEventListener('click', resetAll);
  }

  render();
})();
