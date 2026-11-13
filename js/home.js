/* Gaming Store - Lógica de la página principal (index.html). Datos de demostración. */
(async function () {
  'use strict';
  const root = document.getElementById('homePage');
  if (!root) return;
  const $ = GS.util.$, esc = GS.util.esc, money = GS.util.money;

  const all = await GS.api.getGames();
  const games = all.filter(g => g.type === 'digital' && g.available);
  const fill = (id, list) => { $(id).innerHTML = list.map(p => GS.ui.gameCard(p)).join(''); };
  const by = (k, dir) => (a, b) => dir * (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0);

  /* Banner principal: videojuego destacado aleatorio */
  const randomIndex = Math.floor(Math.random() * games.length);
  const f = games[randomIndex] || games[0];

  const unit = GS.calc.unitPrice(f);
  $('#hero').innerHTML =
    '<div class="hero-content"><span class="hero-tag">JUEGO DESTACADO' + (f.discount ? ' · -' + f.discount + '%' : '') + '</span>' +
    '<h1>' + esc(f.name) + '</h1><p>' + esc(f.desc) + '</p>' +
    '<div class="gc-meta">' + GS.ui.platformChips(f) + '<span class="chip">' + esc(f.genre) + '</span></div>' +
    '<div class="hero-price">' + (f.discount ? '<span class="old">' + money(f.price) + '</span>' : '') + '<span class="now">' + money(unit) + '</span></div>' +
    '<div class="hero-actions"><a class="btn btn-orange btn-lg" href="' + GS.url('pages/detalles.html?id=' + f.id) + '">Ver detalles</a>' +
    '<button class="btn btn-ghost btn-lg" data-add="' + esc(f.id) + '">Agregar al carrito</button></div></div>' +
    '<div class="hero-art"><a href="' + GS.url('pages/detalles.html?id=' + f.id) + '"><img src="' + GS.ui.art(f) + '" alt="Portada de ' + esc(f.name) + '"></a></div>';

  /* Secciones limitadas a 5 elementos */
  fill('#secTop', games.slice().sort(by('sales', -1)).slice(0, 5));
  fill('#secNew', games.slice().sort((a, b) => new Date(b.release) - new Date(a.release)).slice(0, 5));
  fill('#secOffers', all.filter(g => g.available && g.discount > 0).sort(by('discount', -1)).slice(0, 5));
  fill('#secAcc', all.filter(g => g.type === 'fisico').slice(0, 5));

  /* Beneficios del programa Gaming Points */
  const lv = GS.calc.levels();
  $('#levelStrip').innerHTML = lv.map(l =>
    '<span class="level-badge" style="color:' + l.color + '">' + l.icon + ' ' + l.name + ' · ' + l.min + '+ pts</span>').join('');
  const me = GS.session.user();
  $('#benefitCta').innerHTML = me
    ? '<a class="btn btn-orange" href="' + GS.url('pages/perfil.html#puntos') + '">Ver mis Gaming Points</a><a class="btn btn-ghost" href="' + GS.url('pages/recompensas.html') + '">Canjear puntos</a>'
    : '<a class="btn btn-orange" href="' + GS.url('register.html') + '">Crear cuenta gratis</a><a class="btn btn-ghost" href="' + GS.url('pages/recompensas.html') + '">Ver recompensas</a>';
})();