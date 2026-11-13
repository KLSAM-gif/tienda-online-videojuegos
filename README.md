# Gaming Store

Tienda digital de videojuegos (PC, Xbox y PlayStation), accesorios y productos físicos, con el programa de fidelización **Gaming Points**.

> **Prototipo frontend.** HTML5 + CSS3 + JavaScript puro, con **LocalStorage** simulando el backend. Todo lo simulado está marcado en el código (`js/api.js`, `js/data.js`) y aquí.

## Cómo ejecutarlo

No requiere instalación ni dependencias. Se recomienda servirlo por HTTP:

```bash
cd GamingStore
python3 -m http.server 8080      # o: npx serve .
# abrir http://localhost:8080
```

Con Docker (solo sirve los archivos estáticos con nginx; el backend aún no existe):

```bash
docker build -t gaming-store .
docker run -p 8080:80 gaming-store
```

## Datos de demostración

| Dato | Valor |
|---|---|
| Usuario demo cliente | `demo@gamingstore.mx` / `demo1234` (botón «Usar demo de cliente» en el login) |
| Usuario demo administrador | `admin@gamingstore.mx` / `AdminGS2026!` (botón «Usar demo de administrador» en el login) |
| Tarjeta aprobada | `4242 4242 4242 4242` |
| Tarjeta rechazada | número terminado en `0002` |
| Error de procesamiento | número terminado en `9999` |
| Restablecer todo | Perfil → Opciones y configuración → «Restablecer datos de demostración» |

No se conectan pasarelas de pago reales, **no se guardan números de tarjeta**, las claves de juego son ficticias (`DEMO-XXXXX-…`) y la autenticación/roles **son simulados en LocalStorage**. El panel incluye indicadores generales, gestión de productos (alta/edición/retiro), consulta y seguimiento manual de pedidos (avanzar envío/cancelar con reversión de stock y puntos cuando aplica), listado de usuarios y asignación de roles para demostración. No publiques estas credenciales ni uses este control de acceso en producción: cualquier usuario puede modificar LocalStorage. La autorización real debe implementarse en Spring Security y validarse en cada endpoint.


## Panel de administración (modo demostración)

1. Abre `login.html`.
2. Pulsa **Usar demo de administrador** o ingresa `admin@gamingstore.mx` / `AdminGS2026!`.
3. El inicio de sesión de una cuenta con rol `admin` abre `pages/admin.html`.
4. El panel permite consultar indicadores, crear/editar/retirar productos, consultar pedidos y cambiar roles de usuario (cliente/administrador). Se protege cada método administrativo de la API simulada con una comprobación de rol.

**Importante:** esta implementación permite probar el flujo administrativo en el frontend, pero no constituye seguridad real. Los roles y las contraseñas viven en LocalStorage y pueden alterarse desde DevTools. Antes de producción migra usuarios, roles y permisos al backend; almacena contraseñas con BCrypt y aplica autorización por endpoint con Spring Security. Nunca confíes en los permisos enviados por el navegador.

## Reglas de Gaming Points

- 1 punto por cada `$10 MXN` pagados (se redondea hacia abajo); 1 punto = `$1 MXN` de descuento.
- Los puntos se acreditan **solo al confirmar la compra**, una única vez (el saldo sale del historial; recargar la página no duplica nada).
- Lo pagado con puntos o con cupón **no genera puntos**.
- No se puede usar más puntos que el saldo ni más que el total de la compra.
- Cancelar o reembolsar un pedido revierte los puntos obtenidos y devuelve los usados.
- Niveles Bronce / Plata / Oro / Diamante según puntos **acumulados** (canjear no baja de nivel). Los umbrales se configuran en `js/data.js` (`CONFIG`) o desde Perfil → Opciones y configuración.

## Estructura

```
GamingStore/
├── index.html · login.html · register.html
├── pages/    catalogo · detalles · carrito · checkout · perfil · biblioteca · pedidos · recompensas · error
├── css/      styles.css (base, layout) · components.css · responsive.css
├── js/
│   ├── data.js        catálogo, recompensas y reglas (DATOS SIMULADOS)
│   ├── api.js         capa de datos sobre LocalStorage  ← se sustituye por fetch() al backend
│   ├── app.js         utilidades de UI, encabezado, modales, errores
│   ├── auth.js · catalogo.js · carrito.js · checkout.js
│   └── puntos.js · pedidos.js · biblioteca.js · perfil.js · home.js · detalles.js
└── assets/   images/ · games/ · icons/   (las portadas se generan en SVG desde JS; aquí irán las reales)
```

«Mis Gaming Points» y «Canjear puntos» viven en `perfil.html#puntos` y `recompensas.html`; accesorios es la pestaña *Accesorios* del catálogo (`catalogo.html?tipo=accesorios`).

La **interfaz nunca toca LocalStorage directamente**: todas las páginas llaman a `GS.api.*` (asíncrono, ya devuelve promesas).

## Migración a Spring Boot + MySQL

Cada método de `GS.api` corresponde a un endpoint futuro:

| Método actual | Endpoint propuesto |
|---|---|
| `register` / `login` / `logout` / `me` | `POST /api/auth/register`, `/login`, `/logout` · `GET /api/auth/me` |
| `getGames` / `getGame` (incluye inventario) | `GET /api/games`, `GET /api/games/{id}` |
| `checkout` | `POST /api/orders` (pago, puntos, stock y licencias en **una transacción**) |
| `getOrders` / `getOrder` / `cancelOrder` | `GET /api/orders`, `GET /api/orders/{id}`, `POST /api/orders/{id}/cancel` |
| `getLibrary` / `markDownloaded` | `GET /api/library` · `POST /api/library/{id}/download` |
| `getPoints` | `GET /api/points` (historial/ledger) |
| `getRewards` / `redeemReward` / `getCoupons` | `GET /api/rewards` · `POST /api/rewards/{id}/redeem` · `GET /api/coupons` |
| `updateProfile` | `PUT /api/users/me` |

Notas para el backend: el saldo de puntos debe calcularse desde un historial de movimientos (no un contador editable), la validación de stock, puntos y totales debe repetirse en el servidor, y las contraseñas deben guardarse con BCrypt.


## Mejoras del panel de administración

- El panel consulta el catálogo completo de juegos y accesorios, además de los productos agregados desde administración.
- Incluye búsqueda por nombre, ID, descripción o plataforma y filtros por tipo y disponibilidad.
- Permite agregar, editar y eliminar productos; actualizar precio, descripción, plataformas, stock, descuento y disponibilidad.
- Las descripciones se sincronizan en los campos que consume el catálogo público para que los cambios se reflejen en la tienda.
