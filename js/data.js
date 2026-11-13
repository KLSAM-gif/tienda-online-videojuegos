/* =====================================================================
 * Gaming Store - Datos de demostración
 * ===================================================================== */
window.GS = window.GS || {};

GS.CONFIG = {
  currency: 'MXN',
  mxnPerPoint: 10,     // Por cada $10 MXN de compra elegible = 1 punto
  pointValueMXN: 1,    // 1 punto = $1 MXN de descuento al canjearlo
  stageMs: 40000,      // DEMO: cada etapa del envío físico avanza cada 40 s
  digitalStageMs: 3000,// DEMO: generación de licencia digital
  levels: [
    { id: 'bronce',   name: 'Bronce',   min: 0,    icon: '🥉', color: '#cd7f32' },
    { id: 'plata',    name: 'Plata',    min: 200,  icon: '🥈', color: '#c0c8d4' },
    { id: 'oro',      name: 'Oro',      min: 600,  icon: '🥇', color: '#ffc94a' },
    { id: 'diamante', name: 'Diamante', min: 1500, icon: '💎', color: '#27A9E0' }
  ],
  demoUser: {
    name: 'Alex Gamer',
    username: 'alexgamer',
    email: 'demo@gamingstore.mx',
    password: 'demo1234'
  },
  // Credenciales exclusivas de demostración. No usar en producción.
  demoAdmin: {
    name: 'Administrador GamingStore',
    username: 'admin',
    email: 'admin@gamingstore.mx',
    password: 'AdminGS2026!'
  }
};

(function () {
  const REQ = {
    low: {
      min: { 'Sistema': 'Windows 10 64-bit', 'Procesador': 'Intel Core i3-6100 / AMD FX-6300', 'Memoria': '8 GB RAM', 'Gráficos': 'NVIDIA GTX 750 Ti (2 GB)', 'Almacenamiento': '25 GB libres' },
      rec: { 'Sistema': 'Windows 10/11 64-bit', 'Procesador': 'Intel Core i5-8400 / Ryzen 5 2600', 'Memoria': '8 GB RAM', 'Gráficos': 'NVIDIA GTX 1060 (6 GB)', 'Almacenamiento': '25 GB SSD' }
    },
    mid: {
      min: { 'Sistema': 'Windows 10 64-bit', 'Procesador': 'Intel Core i5-8400 / Ryzen 5 1600', 'Memoria': '12 GB RAM', 'Gráficos': 'NVIDIA GTX 1060 (6 GB)', 'Almacenamiento': '60 GB libres' },
      rec: { 'Sistema': 'Windows 10/11 64-bit', 'Procesador': 'Intel Core i7-9700 / Ryzen 7 3700X', 'Memoria': '16 GB RAM', 'Gráficos': 'NVIDIA RTX 2060 (6 GB)', 'Almacenamiento': '60 GB SSD' }
    },
    high: {
      min: { 'Sistema': 'Windows 10/11 64-bit', 'Procesador': 'Intel Core i7-8700 / Ryzen 5 3600', 'Memoria': '16 GB RAM', 'Gráficos': 'NVIDIA GTX 1070 (8 GB)', 'Almacenamiento': '100 GB SSD' },
      rec: { 'Sistema': 'Windows 11 64-bit', 'Procesador': 'Intel Core i7-12700 / Ryzen 7 5800X', 'Memoria': '32 GB RAM', 'Gráficos': 'NVIDIA RTX 3070 (8 GB)', 'Almacenamiento': '100 GB SSD' }
    }
  };

  // G(id, nombre, plataformas, género, precio, %desc, ventas, lanzamiento, calificación, colores, descripción, requisitos, imagen)
  function G(id, name, platforms, genre, price, discount, sales, release, rating, colors, desc, req, image) {
    return { id, name, platforms, genre, price, discount, sales, release, rating, colors, desc, image: image || null,
      type: 'digital', stock: null, available: true, req: REQ[req || 'mid'] };
  }

  // A(id, nombre, plataformas, precio, %desc, ventas, lanzamiento, calificación, existencias, icono, colores, descripción, imagen)
  function A(id, name, platforms, price, discount, sales, release, rating, stock, icon, colors, desc, image) {
    return { id, name, platforms, genre: 'Accesorios', price, discount, sales, release, rating, colors, desc, image: image || null,
      type: 'fisico', stock, available: true, icon };
  }

  GS.DATA = { genres: ['Acción', 'Aventura', 'Deportes', 'Terror', 'Mundo abierto', 'RPG', 'Estrategia'], platforms: ['PC', 'Xbox', 'PlayStation'] };

  GS.DATA.games = [
    G('elden-ring', 'Elden Ring', ['PC', 'Xbox', 'PlayStation'], 'RPG', 1199, 0, 98, '2022-02-25', 4.8, ['#2a1d08', '#d9a93c'], 'Explora las Tierras Intermedias en un RPG de acción de mundo abierto con combates exigentes y una historia enigmática.', 'high', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT82I2N7gDiUfDisR4DpZap-S5Mm25Un2Ocf3Z2Plfgsw&s=10'),
    G('witcher-3', 'The Witcher 3: Wild Hunt', ['PC', 'Xbox', 'PlayStation'], 'RPG', 599, 50, 95, '2015-05-19', 4.9, ['#1b2a33', '#8ea6b4'], 'Geralt de Rivia busca a su hija adoptiva en un vasto mundo lleno de monstruos, política y decisiones difíciles.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTP2VLvI9EU6xJa9COH1dBoZ5aCO1JDRXI4fAMPIsTKaw&s=10'),
    G('cyberpunk-2077', 'Cyberpunk 2077', ['PC', 'Xbox', 'PlayStation'], 'Mundo abierto', 899, 40, 90, '2020-12-10', 4.4, ['#3d0b4f', '#f7e600'], 'Conviértete en mercenario en Night City, una megalópolis obsesionada con el poder, la moda y las modificaciones corporales.', 'high', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6rqWc1WwhLnl_Sq2GP1A5WFgilKCofRE8y8seiwwt-g&s=10'),
    G('rdr2', 'Red Dead Redemption 2', ['PC', 'Xbox', 'PlayStation'], 'Mundo abierto', 1099, 30, 94, '2018-10-26', 4.8, ['#4a1f10', '#e08a4a'], 'Arthur Morgan y la banda de Van der Linde huyen por el oeste americano a finales del siglo XIX.', 'high','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQflvyn1fuqWC_e_dQCfAZiEDHokV80zj7QnIvOT3SyiQ&s=10'),
    G('gta-v', 'Grand Theft Auto V', ['PC', 'Xbox', 'PlayStation'], 'Mundo abierto', 549, 0, 97, '2013-09-17', 4.7, ['#0b3d2e', '#ffb000'], 'Tres criminales muy distintos planean golpes en la soleada ciudad de Los Santos.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR15ims4tzXojagJfyCW1JrbsshoO4oyYTU7Aimg0RoDw&s=10'),
    G('god-of-war', 'God of War', ['PC', 'PlayStation'], 'Acción', 1099, 20, 92, '2018-04-20', 4.9, ['#1a2a3a', '#c23b22'], 'Kratos y su hijo Atreus emprenden un viaje por los reinos nórdicos en una aventura de acción cinematográfica.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXBNYO2XFUywDJ_jtmWjxwFtsK6Tm1LR5r5VKL9v4Jjw&s=10'),
    G('halo-infinite', 'Halo Infinite', ['PC', 'Xbox'], 'Acción', 899, 0, 80, '2021-12-08', 4.3, ['#12331f', '#6fe3a0'], 'El Jefe Maestro regresa para enfrentar a los Desterrados en el anillo Zeta Halo.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJdvYOugHY-Az1_N6p6TF-KJubtCCex-4hu6ZG00PmVA&s=10'),
    G('forza-horizon-5', 'Forza Horizon 5', ['PC', 'Xbox'], 'Deportes', 999, 0, 88, '2021-11-09', 4.7, ['#8a2a00', '#ffcc33'], 'Carreras de mundo abierto en un festival gigante ambientado en un México vibrante.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCLHgilHxV-pboX5qLBn6kC54BtshjfOPAseQlhIaV2Q&s=10'),
    G('fc-25', 'EA Sports FC 25', ['PC', 'Xbox', 'PlayStation'], 'Deportes', 1399, 0, 91, '2024-09-27', 4.0, ['#0a2a55', '#3ddc97'], 'La nueva entrega de fútbol con clubes, ligas y modos competitivos en línea.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTO6CODRv_yDhPG_Ps3Q9VJj-dL2ujq0r0dGYN2DnuJiA&s=10'),
    G('nba-2k25', 'NBA 2K25', ['PC', 'Xbox', 'PlayStation'], 'Deportes', 1299, 15, 76, '2024-09-06', 3.9, ['#2b1055', '#ff6a3d'], 'Baloncesto de simulación con plantillas actualizadas, MiCARRERA y MiEQUIPO.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhy05JLFzTjJa_yCksv1wnWZ0eKWt_zLfPc7mDAtd8wA&s=10'),
    G('resident-evil-4', 'Resident Evil 4', ['PC', 'Xbox', 'PlayStation'], 'Terror', 1099, 25, 89, '2023-03-24', 4.8, ['#2b0a0a', '#b3b39a'], 'Leon S. Kennedy rescata a la hija del presidente en un remake de supervivencia y terror.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWQRuK60kdufTig5gD6oulIRRm_zZV3DUd-nXPwQa9iA&s=10'),
    G('silent-hill-2', 'Silent Hill 2', ['PC', 'PlayStation'], 'Terror', 1399, 0, 72, '2024-10-08', 4.6, ['#1d2a2f', '#9fb4b8'], 'James Sunderland regresa a un pueblo cubierto de niebla en el remake del clásico de terror psicológico.', 'high','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxkY_IDrzaPQd-A7U04U7DCGbCgR86RepIvNJ8VjfcdA&s=10'),
    G('dead-space', 'Dead Space', ['PC', 'Xbox', 'PlayStation'], 'Terror', 1199, 40, 78, '2023-01-27', 4.6, ['#101826', '#d34a2f'], 'El ingeniero Isaac Clarke lucha por sobrevivir a bordo de una nave minera infestada de necromorfos.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8qufwcEgAu45HrC_ol5MiJeesrYxeWffeqxgBLN5qmw&s=10'),
    G('alan-wake-2', 'Alan Wake 2', ['PC', 'Xbox', 'PlayStation'], 'Terror', 1099, 30, 70, '2023-10-27', 4.6, ['#0c1f1a', '#7dd87f'], 'Un thriller de terror psicológico donde la realidad y la ficción se mezclan sin remedio.', 'high','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7zTecv9YpSsijd9WmROBxnBW7PMt7hZ0xeiA0JE8uPw&s=10'),
    G('civilization-6', 'Sid Meier’s Civilization VI', ['PC', 'Xbox', 'PlayStation'], 'Estrategia', 549, 70, 74, '2016-10-21', 4.5, ['#1c3b57', '#e8c95a'], 'Construye un imperio capaz de resistir el paso del tiempo en este clásico de estrategia por turnos.', 'low','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMWkNeLR0gHcnwzc3ItjwwAOO-1e-kO9kGz_wFlzsxCQ&s=10'),
    G('age-of-empires-4', 'Age of Empires IV', ['PC', 'Xbox'], 'Estrategia', 799, 0, 68, '2021-10-28', 4.3, ['#3a2a14', '#6aa9d8'], 'Estrategia en tiempo real con civilizaciones históricas y campañas medievales.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXyw8hz1s-p9Q9vXR5UMFb-e1p5iM1nBspNwBtOd3w-Q&s=10'),
    G('total-war-warhammer-3', 'Total War: Warhammer III', ['PC'], 'Estrategia', 1099, 35, 64, '2022-02-17', 4.3, ['#2a0f3a', '#d94f4f'], 'Estrategia a gran escala con batallas épicas y un mapa de campaña lleno de caos.', 'high','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH9tyQtZXJ8u7tPhIv4tOWDLoaTOV_rcnWFiQ5gpSqKA&s=10'),
    G('baldurs-gate-3', 'Baldur’s Gate 3', ['PC', 'Xbox', 'PlayStation'], 'RPG', 1399, 0, 96, '2023-08-03', 4.9, ['#240b36', '#c31432'], 'Reúne a tu grupo y regresa a los Reinos Olvidados en un RPG por turnos con libertad total.', 'high','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSX0rKp4DouCmvZYMvc8IyE1K2Zu8NpRcwnzT7d3Kevg&s=10'),
    G('diablo-4', 'Diablo IV', ['PC', 'Xbox', 'PlayStation'], 'RPG', 1399, 20, 79, '2023-06-06', 4.2, ['#2a0505', '#ff4a3a'], 'Combate infernal, botín interminable y un santuario en ruinas que debes salvar.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU8UnZiQsW8Nc10e8LO9uA6olrCjvJCBy4bjW8ByrSRQ&s=10'),
    G('hogwarts-legacy', 'Hogwarts Legacy', ['PC', 'Xbox', 'PlayStation'], 'Aventura', 1299, 45, 93, '2023-02-10', 4.5, ['#1d2459', '#d4a84b'], 'Vive tu propia aventura mágica en el mundo de los magos durante el siglo XIX.', 'high','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqVTM9CgSshWYdwQuPzLv-j-ouCj1dMrNsR0yGw3v3kw&s=10'),
    G('hades', 'Hades', ['PC', 'Xbox', 'PlayStation'], 'Acción', 399, 35, 86, '2020-09-17', 4.9, ['#3b0a1a', '#ff7a45'], 'Escapa del inframundo en este roguelike de acción con una narrativa que evoluciona en cada intento.', 'low','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2uG32Y8tfQOP_373hGPMo4bqpo1EsoLKRFhaqYPQAaw&s=10'),
    G('minecraft', 'Minecraft', ['PC', 'Xbox', 'PlayStation'], 'Aventura', 549, 0, 99, '2011-11-18', 4.8, ['#1f5a1f', '#8bd16a'], 'Construye, explora y sobrevive en mundos infinitos generados al azar.', 'low','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-TvEQRMfxI8bbexg_t6GQ1D_aQaTGnjvmCIkCTcmEhw&s=10'),
    G('last-of-us-1', 'The Last of Us Parte I', ['PC', 'PlayStation'], 'Aventura', 1299, 15, 85, '2022-09-02', 4.7, ['#26301a', '#c6a15b'], 'Joel y Ellie cruzan unos Estados Unidos devastados en una historia inolvidable.', 'high','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmAW6LnQfSmn4WtsuK0lTLsx-wLnYUGqenAP1EWG5oUQ&s=10'),
    G('spider-man-2', 'Marvel’s Spider-Man 2', ['PlayStation'], 'Acción', 1599, 0, 87, '2023-10-20', 4.7, ['#7a0a1f', '#1f6fe0'], 'Peter y Miles unen fuerzas para enfrentar nuevas amenazas en una Nueva York más grande que nunca.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0K5r7ep8SBPThGj_IrPbHglHwMXzrwvbMKAImJbkuBg&s=10'),
    G('gran-turismo-7', 'Gran Turismo 7', ['PlayStation'], 'Deportes', 1299, 0, 73, '2022-03-04', 4.4, ['#0b2a4f', '#e63946'], 'El simulador de conducción definitivo con cientos de autos y circuitos legendarios.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNdfUlhFLvrXzk8WneA15DdZcA3po1Uo2FrnTCx76oyA&s=10'),
    G('horizon-forbidden-west', 'Horizon Forbidden West', ['PC', 'PlayStation'], 'Mundo abierto', 1199, 30, 77, '2022-02-18', 4.6, ['#0f3b4a', '#f08a3c'], 'Aloy viaja al Oeste Prohibido para detener una misteriosa plaga en un mundo lleno de máquinas.', 'high','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLOkcdablVZCmggPCEbi4wZwUWlf93AxZW8XvbgRASSA&s=10'),
    G('assassins-creed-shadows', 'Assassin’s Creed Shadows', ['PC', 'Xbox', 'PlayStation'], 'Mundo abierto', 1599, 0, 83, '2025-03-20', 4.2, ['#2b0f17', '#d94a5a'], 'Dos protagonistas, shinobi y samurái, en el Japón feudal del siglo XVI.', 'high','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQByyqpEIbJCrnrn1yZu30dBOJxwe9O_4qyprVeFTr6jA&s=10'),
    G('black-myth-wukong', 'Black Myth: Wukong', ['PC', 'PlayStation'], 'Acción', 1099, 0, 82, '2024-08-20', 4.5, ['#1b1408', '#e0b04a'], 'Un RPG de acción inspirado en el viaje al Oeste con combates espectaculares.', 'high','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ28kQXelOrFx7b30il7KtNDg2Gq360wMZ6Ns1nxErViQ&s=10'),
    G('astro-bot', 'Astro Bot', ['PlayStation'], 'Aventura', 1299, 10, 71, '2024-09-06', 4.8, ['#0b3a6b', '#5cd6ff'], 'Una aventura de plataformas colorida y llena de creatividad para toda la familia.', 'low','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhdJ_sQkOfkUN8TB80LvHS0IEtVsFslgHvo2zuamOi-A&s=10'),
    G('starfield', 'Starfield', ['PC', 'Xbox'], 'RPG', 1399, 50, 69, '2023-09-06', 3.9, ['#0a1530', '#8fb4ff'], 'Explora cientos de planetas como parte de Constelación, los últimos exploradores del espacio.', 'high','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRm8FsEGHc6iDEmo5JPHhP7yE0uLSobS6-g2K8eHWrN9g&s=10'),

    // --- NUEVOS VIDEOJUEGOS ---
    G('gta-6', 'Grand Theft Auto VI', ['PC', 'PlayStation', 'Xbox'], 'Mundo abierto', 1599, 0, 99, '2025-11-01', 5.0, ['#1f0a2a', '#ff007f'], 'Regresa a Vice City en la entrega más esperada de la franquicia.', 'high', 'https://i.blogs.es/557d7b/grand-theft-auto-vi-official-cover-art-hi-res/650_1200.jpeg'),
    G('silksong', 'Hollow Knight: Silksong', ['PC', 'Xbox', 'PlayStation'], 'Acción', 399, 0, 95, '2025-05-10', 4.9, ['#1a0000', '#ff3333'], 'Juega como Hornet en un vasto e interconectado reino de insectos.', 'low', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYYzKqsszwkDQsiqAxX3dVBHAhsmk4-AB_WGY24xlHbw&s=10'),
    G('tekken-8', 'Tekken 8', ['PC', 'Xbox', 'PlayStation'], 'Acción', 1299, 20, 88, '2024-01-26', 4.6, ['#2d0a0a', '#e63946'], 'Siente el poder de cada golpe con batallas épicas de artes marciales.', 'mid', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJL35Z86ZGrrWXElPxfTjYL_By9yCtxX6aXmobVYsRcw&s=10'),
    G('mh-wilds', 'Monster Hunter Wilds', ['PC', 'Xbox', 'PlayStation'], 'RPG', 1499, 0, 92, '2025-02-28', 4.8, ['#3a200a', '#d99b26'], 'Caza monstruos colosales en ecosistemas dinámicos e impredecibles.', 'high', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnV-57uxIAiH9Yh6VGbUfTdxmIGjTmBQ5cRbZMRgpSjQ&s=10'),
    G('doom-dark-ages', 'Doom: The Dark Ages', ['PC', 'Xbox', 'PlayStation'], 'Acción', 1399, 0, 89, '2025-06-15', 4.7, ['#1a0d00', '#e65100'], 'El origen cinematográfico de la furia del Slayer en una guerra oscura medieval.', 'high', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0kwvrtJtUCMM1AQJzKYcs9M-0tc3HyzTqflH06DHNMA&s=10'),

    // Producto de ejemplo NO disponible
    Object.assign(G('neon-drift-2', 'Neon Drift 2 (Próximamente)', ['PC', 'PlayStation'], 'Deportes', 799, 0, 10, '2026-12-01', 0, ['#08002b', '#00e0ff'], 'Secuela de carreras arcade futuristas. Aún no está disponible para compra.', 'mid','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPAofsNlPyHQ-bxlfx_kxKqbHGJ_qoMxkYeGxMel3RtQ&s=10'), { available: false })
  ];

  // --- ACCESORIOS Y PRODUCTOS FÍSICOS ---
  GS.DATA.games.push(
    A('acc-control-xbox', 'Control inalámbrico Xbox', ['Xbox', 'PC'], 1299, 0, 90, '2023-05-01', 4.7, 12, '🎮', ['#0f3d1f', '#6fe34a'], 'Control con agarre texturizado, Bluetooth y compatibilidad con consola y PC.','https://cms-assets.xboxservices.com/assets/c8/9b/c89bc936-8ec4-48a2-9368-7226fa5ece8c.jpg?n=257427_3-Up-0_Center_468x539_01.jpg'),
    A('acc-control-dualsense', 'Control DualSense', ['PlayStation', 'PC'], 1399, 10, 88, '2023-05-01', 4.8, 8, '🕹️', ['#16203d', '#7aa2ff'], 'Gatillos adaptativos y respuesta háptica para una inmersión total.','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQT5_1DdK3dTgsqyL0cYE1SXHWAOLKaCId2eFiEvICt0g&s=10'),
    A('acc-audifonos', 'Audífonos Gamer 7.1', ['PC', 'Xbox', 'PlayStation'], 899, 20, 84, '2024-02-10', 4.4, 15, '🎧', ['#1a1a40', '#27A9E0'], 'Sonido envolvente 7.1 virtual, micrófono retráctil y almohadillas de espuma viscoelástica.','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUHpdW0leQOfVV84o4Ds9e8dX4sFjrwaegSHmBBu1D3w&s=10'),
    A('acc-teclado', 'Teclado mecánico RGB', ['PC'], 1199, 0, 75, '2024-03-15', 4.5, 6, '⌨️', ['#2a0a3a', '#ff5ad1'], 'Switches lineales, iluminación RGB por tecla y estructura de aluminio.','https://www.atk.store/cdn/shop/articles/V75X_V75K-web_01.png?v=1767000086&width=1500'),
    A('acc-mouse', 'Mouse gamer 16K DPI', ['PC'], 699, 15, 81, '2024-01-20', 4.5, 20, '🖱️', ['#0b2a3a', '#ff8c32'], 'Sensor óptico de 16,000 DPI, 8 botones programables y peso ajustable.','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYy-42PsBW4wTAHnU0AlmELf2CixjfvtizPQI3MqB4pQ&s=10'),
    A('acc-ssd', 'SSD externo 1 TB', ['PC', 'Xbox', 'PlayStation'], 1799, 12, 73, '2023-11-05', 4.6, 5, '💾', ['#102a3d', '#4ac1ff'], 'Almacenamiento portátil de alta velocidad para ampliar tu consola o PC.','https://m.media-amazon.com/images/I/91AnJNkXzFL.jpg'),
    A('acc-mousepad', 'Mousepad XL Gaming Store', ['PC'], 349, 0, 60, '2024-06-01', 4.3, 30, '🟦', ['#071A33', '#1261A0'], 'Superficie de tela de 90×40 cm con base antideslizante y bordes cosidos.','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUNRnvpf_OKb4Srd8hrscpORsID_wiUvO_Htl-zXr7Ag&s=10'),
    A('acc-camara', 'Cámara de transmisión HD', ['PC'], 999, 0, 55, '2024-04-12', 4.1, 0, '📷', ['#2d1a0a', '#ffb347'], 'Cámara 1080p a 60 fps con micrófono integrado para streaming. (Sin existencias: demo de error)','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4tbAjWug2c2uW6c2drpzWxsJN0O2sK28oyOkbqsUT-Q&s=10'),

    // --- NUEVOS ACCESORIOS ---
    A('acc-silla-gamer', 'Silla Gamer Ergonómica Pro', ['PC', 'Xbox', 'PlayStation'], 3499, 10, 45, '2024-08-01', 4.8, 10, '💺', ['#111111', '#ff0000'], 'Silla ergonómica con reclinación de 180° y cojines lumbares viscoelásticos.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNqNa89DhPLY9wViKtTsPLvvOm23JJemXKPZR5YTZYSA&s=10'),
    A('acc-volante-pedales', 'Volante y Pedales Pro Racing', ['PC', 'PlayStation'], 4299, 0, 30, '2024-09-15', 4.9, 4, '🏎️', ['#222222', '#00ffcc'], 'Force Feedback con motor dual y pedales ajustables de acero inoxidable.','https://resource.logitechg.com/w_544,h_544,ar_1,c_fill,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/drivingforce/2025/gallery/g920-g29-video-thumbnail-6.png'),
    A('acc-microfono-condensador', 'Micrófono USB Streaming RGB', ['PC', 'PlayStation'], 1199, 15, 62, '2024-05-10', 4.7, 18, '🎙️', ['#1b0b2e', '#9c27b0'], 'Micrófono de condensador con patrón cardioide y botón táctil de silencio.','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZD1PisnqgnCpN_Jnf_SSYoDnBTV-rFSk4TdspGs8Bbw&s=10'),
    A('acc-soporte-rgb', 'Soporte de Audífonos con Hub USB', ['PC'], 599, 0, 50, '2024-07-20', 4.4, 22, '🎧', ['#0f172a', '#38bdf8'], 'Soporte vertical RGB con 3 puertos USB 3.0 para tus periféricos.','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0i5DgZORb7STXgYrYgW5t69DQZ0ERD76YKbLtv__hTQ&s=10'),
    A('acc-cargador-dualsense', 'Estación de Carga DualSense', ['PlayStation'], 499, 10, 78, '2024-03-01', 4.8, 25, '⚡', ['#030712', '#3b82f6'], 'Carga rápida para dos controles de PS5 simultáneamente.','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuCerqbBlxOzgab4wHIa3Wit9BPKIOfbaWXgQIvNRTbQ&s=10'),
    A('acc-mousepad-rgb', 'Mousepad XXL Iluminado RGB', ['PC'], 499, 20, 85, '2024-04-05', 4.5, 35, '🟪', ['#18181b', '#a855f7'], 'Superficie gigante de 90x40 cm con 14 modos de iluminación LED RGB.','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHElvA6O9OsypnkIZgfrPZWrFGQc7S79khSBJMNPvDAQ&s=10')
  );

  // Recompensas canjeables con Gaming Points
  GS.DATA.rewards = [
    { id: 'cupon-50',   type: 'cupon',    name: 'Cupón de descuento $50',   desc: 'Cupón de $50 MXN aplicable en tu próxima compra.', cost: 50,  value: 50,  icon: '🏷️', colors: ['#7a3a00', '#ff8c32'] },
    { id: 'cupon-150',  type: 'cupon',    name: 'Cupón de descuento $150',  desc: 'Cupón de $150 MXN aplicable en tu próxima compra.', cost: 140, value: 150, icon: '🎟️', colors: ['#7a3a00', '#ff8c32'] },
    { id: 'gift-200',   type: 'giftcard', name: 'Tarjeta de regalo digital $200', desc: 'Saldo de $200 MXN para usar en cualquier compra de Gaming Store.', cost: 200, value: 200, icon: '🎁', colors: ['#0b3a6b', '#27A9E0'] },
    { id: 'gift-500',   type: 'giftcard', name: 'Tarjeta de regalo digital $500', desc: 'Saldo de $500 MXN para usar en cualquier compra de Gaming Store.', cost: 480, value: 500, icon: '💳', colors: ['#0b3a6b', '#1261A0'] },
    { id: 'wallpapers', type: 'wallpaper', name: 'Fondos de pantalla exclusivos', desc: 'Pack de 10 fondos 4K con la identidad de Gaming Store.', cost: 30, icon: '🖼️', colors: ['#071A33', '#27A9E0'] },
    { id: 'llavero',    type: 'especial', name: 'Llavero metálico Gaming Store', desc: 'Artículo especial de colección con grabado láser.', cost: 90, icon: '🔑', colors: ['#172438', '#FF8C32'] },
    { id: 'soporte',    type: 'accesorio', name: 'Soporte para audífonos',   desc: 'Soporte de aluminio con base antideslizante y puerto USB.', cost: 260, icon: '🎧', colors: ['#1a1a40', '#27A9E0'] },
    { id: 'mousepad-gs', type: 'accesorio', name: 'Mousepad edición Gaming Store', desc: 'Edición limitada para miembros del programa Gaming Points.', cost: 180, icon: '🟦', colors: ['#071A33', '#1261A0'] },
    { id: 'control-gs', type: 'accesorio', name: 'Control inalámbrico Gaming Store', desc: 'Control edición especial azul y naranja, compatible con PC.', cost: 900, icon: '🎮', colors: ['#0b2a4f', '#FF8C32'] }
  ];
})();