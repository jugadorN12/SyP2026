# Prompt maestro — Web App de Stock y Punto de Venta para Boliche

> Copiá y pegá este documento completo al agente de desarrollo (Claude Code, Cursor, etc.)
> como instrucción inicial del proyecto. Está pensado para ejecutarse **por fases**, en orden.
> No avances a la fase siguiente hasta que la anterior esté funcionando y probada.

---

## 0. Contexto del proyecto (leer primero)

Estás construyendo una **Web App** de control de stock y punto de venta de bebidas para un
boliche/nightclub. La prioridad número uno del sistema es la **integridad del stock**: durante
el horario de apertura, ningún cajero ni encargado de barra debe poder generar una venta o un
traspaso incorrecto sin que el sistema lo detecte o lo bloquee. Es preferible que el sistema sea
más lento o pida una confirmación de más, antes que permitir un descuadre de stock silencioso.

**Dispositivos de uso:**
- Cajas: **tablets**, en landscape, pantalla táctil, uso con una sola mano, poca luz.
- Encargados de barra / boliche: tablet o celular.
- Dueño: celular, PC o notebook — panel de lectura, no de venta.

**No es una app nativa**: es una Web App responsive, accesible desde el navegador, sin instalación.

---

## 1. Stack tecnológico recomendado

**Opción A — PostgreSQL (backend propio):**
- **Frontend**: React + TypeScript, Vite. Tailwind CSS para estilos.
- **Estado offline-first**: IndexedDB (via Dexie.js) como caché local + cola de sincronización.
- **Backend**: Node.js + TypeScript (NestJS o Express) con API REST o tRPC.
- **Base de datos**: PostgreSQL (transaccional, integridad de stock con locks `SELECT ... FOR UPDATE`).
- **Tiempo real**: WebSockets (Socket.io) para reflejar stock, ventas y traspasos en vivo.
- **Hosting**: backend + DB en un VPS o servicio administrado (Railway, Render, Fly.io).

**Opción B — Firebase (recomendada para este proyecto, más rápida de entregar):**
- **Frontend**: React + TypeScript, Vite. Tailwind CSS para estilos.
- **Base de datos**: Cloud Firestore. Offline y tiempo real vienen incluidos de fábrica (no hay que construir la cola de sincronización a mano).
- **Autenticación**: Firebase Authentication (usuario/contraseña para encargados y dueño).
- **Backend de lógica crítica**: Cloud Functions para las operaciones que requieren transacción (venta, traspaso, ajuste) — nunca escribir el stock directamente desde el cliente.
- **Hosting**: Firebase Hosting para el frontend.

**Por qué Firebase encaja bien acá**: como cada sector (barra o depósito) tiene su propio
stock físicamente separado — nunca comparten el mismo documento — la única concurrencia real
a resolver es dentro de un mismo sector (ej. dos cajeros de la misma barra vendiendo a la vez),
un caso mucho más acotado que si el stock fuera un pool único. Con `runTransaction` de Firestore
alcanza para blindar ese caso. Esto simplifica bastante la Fase 9 (offline-first), porque
Firestore ya sincroniza solo al reconectar.

**Regla no negociable en ambas opciones**: ninguna venta, traspaso o ajuste de stock se escribe
nunca directo desde el cliente (frontend). Siempre pasa por una función/endpoint que valida
stock disponible y ejecuta la escritura dentro de una transacción atómica.

- **Autenticación de cajeros**: PIN numérico rápido (login secundario, no reemplaza el
  usuario/contraseña del encargado que dio de alta al cajero).
- **PWA obligatorio**: Service Worker + manifest, para que funcione en modo offline y se pueda
  agregar a la pantalla de inicio de la tablet como un ícono, sin pasar por una tienda de apps.

Si el agente tiene una preferencia de stack distinta pero cumple con los requisitos de
tiempo real + offline-first + integridad transaccional, puede proponerla antes de empezar.

---

## 2. Roles y permisos (implementar como enum + middleware de autorización)

| Rol | Acceso |
|---|---|
| `cajero` | Pantalla de venta únicamente. Ve el stock de su propia barra. Puede solicitar traspasos. No ve costos ni márgenes. |
| `encargado_barra` | Todo lo del cajero + aprobar/confirmar traspasos de su barra, ver stock detallado de su barra, generar pedido por WhatsApp, ver alertas de su sector. |
| `encargado_boliche` | Ve todos los sectores. Aprueba traspasos entre barras. Carga costos y precios. Ve reportes consolidados. Gestiona alertas globales. |
| `dueño` | Acceso total: ganancias, márgenes, gastos, reportes financieros, gestión de usuarios y permisos. |

Cada endpoint del backend debe validar el rol antes de ejecutar la acción, no solo ocultar
el botón en el frontend. Un cajero que intente llamar directamente al endpoint de "modificar
precio" debe recibir 403, aunque no tenga el botón visible.

---

## 3. Modelo de datos (entidades mínimas)

Diseñá el esquema con estas entidades como base (ajustá nombres a tu convención):

- `usuarios` (id, nombre, rol, pin_hash, password_hash, sector_asignado, activo)
- `sectores` (id, nombre, tipo: "barra" | "deposito_general" | "boliche_general") — el depósito
  general es un sector más, con su propio stock, no una entidad aparte.
- `productos` (id, nombre, categoria, unidad_medida, costo, precio_publico, margen_calculado)
- `stock_por_sector` (id, producto_id, sector_id, cantidad_actual, stock_minimo)
- `movimientos_stock` (id, producto_id, sector_id, tipo: "venta"|"traspaso_salida"|"traspaso_entrada"|"ajuste"|"compra", cantidad, motivo, usuario_id, timestamp)
- `ventas` (id, cajero_id, sector_id, timestamp, total, medio_pago, estado: "activa"|"anulada")
- `venta_items` (id, venta_id, producto_id, cantidad, precio_unitario)
- `traspasos` (id, producto_id, sector_origen_id, sector_destino_id, cantidad_enviada, cantidad_recibida, estado: "pendiente"|"en_transito"|"cerrado"|"en_disputa", usuario_solicita_id, usuario_confirma_salida_id, usuario_confirma_entrada_id, timestamps) —
  `sector_origen_id` y `sector_destino_id` pueden ser **cualquier combinación de sectores**:
  barra→barra, depósito→barra, barra→depósito. No hay una jerarquía fija de "el depósito
  siempre es origen"; el encargado elige el origen que le convenga en el momento.
- `alertas_config` (id, producto_id, sector_id, stock_minimo)
- `anulaciones` (id, venta_id, motivo, usuario_id, timestamp)

**Regla de integridad clave**: toda modificación de `stock_por_sector.cantidad_actual` tiene
que pasar por una transacción de base de datos que también inserte un registro en
`movimientos_stock`. Nunca se actualiza el número de stock "suelto" sin dejar rastro del
movimiento que lo causó.

**Regla clave sobre traspasos vs. ventas**: un traspaso (`traspaso_salida`/`traspaso_entrada`)
nunca debe impactar `ventas`, ingresos ni reportes financieros — solo reubica unidades entre
`stock_por_sector` de dos sectores. Es un movimiento de gestión interna, no una transacción
comercial.

**Regla clave — el traspaso NO respeta el stock mínimo del sector origen**: la única
validación al confirmar la salida de un traspaso es que `cantidad_enviada <= cantidad_actual`
en el sector origen en ese momento (no se puede traspasar más de lo que hay físicamente). El
sistema **no debe bloquear ni advertir** si el traspaso deja al sector origen en 0 unidades de
ese producto, aunque sea su único stock restante. Esto es intencional: se prioriza asegurar la
venta en el sector con demanda real por sobre mantener stock repartido en un sector que quizás
no lo va a vender esa noche. Es una decisión de negocio del encargado, no un error que el
sistema deba prevenir.

---

## 4. Fases de implementación (ejecutar en este orden)

### Fase 1 — Setup del proyecto
1. Inicializar repo, monorepo o dos repos (frontend/backend) según preferencia del agente.
2. Configurar linting, TypeScript estricto, variables de entorno.
3. Levantar PostgreSQL local (docker-compose) y correr migraciones iniciales con el esquema de la sección 3.
4. Configurar CI básico (lint + test) antes de escribir features.

### Fase 2 — Autenticación y roles
1. Login de encargados/dueño con usuario y contraseña.
2. Login de cajero con PIN numérico (4-6 dígitos), rápido, pantalla completa, sin teclado físico.
3. Middleware de autorización por rol en cada endpoint.
4. Pantalla de gestión de usuarios (solo dueño y encargado_boliche pueden crear/editar usuarios).

### Fase 3 — Catálogo y stock
1. CRUD de productos: nombre, categoría, unidad de medida, costo, precio al público.
2. El margen se calcula automáticamente en el backend (nunca se carga a mano).
3. CRUD de stock por sector, con motivo obligatorio en cada modificación manual.
4. Función de "conteo físico / auditoría": pantalla donde el encargado ingresa el conteo real y el sistema muestra la diferencia contra lo esperado.
5. Todo movimiento de stock queda registrado en `movimientos_stock`.

### Fase 4 — Punto de venta (pantalla de cajero) — LA MÁS CRÍTICA
Ver sección 5 de este documento para el detalle de diseño visual. Requisitos funcionales:
1. Grid de botones grandes por producto, agrupados por categoría, con color por categoría.
2. Al tocar un producto se suma 1 unidad; tocar varias veces incrementa la cantidad, mostrada en números grandes sobre el botón.
3. Panel de resumen de venta (carrito) siempre visible, con opción de quitar ítems.
4. Confirmación de venta con resumen grande antes de cobrar.
5. Botón de deshacer/cancelar último ítem siempre accesible.
6. Si `cantidad_actual` de un producto en el sector llega a 0, el botón se deshabilita visualmente (opacidad reducida + candado) y no permite agregar más unidades al carrito, sin excepción, ni siquiera si el cajero insiste.
7. Al confirmar la venta: transacción atómica que descuenta stock, crea el registro de venta y sus items, y emite el evento por WebSocket a todas las pantallas conectadas del mismo sector y al panel del dueño.
8. Función de anulación de venta: requiere motivo obligatorio, deja registro en `anulaciones`, y devuelve el stock a `stock_por_sector`.

### Fase 5 — Traspasos entre sectores (doble confirmación obligatoria, sin mínimo en origen)
El traspaso es un mecanismo genérico entre **dos sectores cualesquiera** — barra→barra,
depósito→barra o barra→depósito. No hay un flujo distinto para "reposición desde depósito":
es el mismo traspaso, solo cambia qué sector aparece como origen. Implementar como una
máquina de estados: `pendiente` → `en_transito` → `cerrado` (o `en_disputa`).

1. Se solicita el traspaso (producto + cantidad + sector origen + sector destino). El origen lo
   elige el encargado que resuelve la alerta — puede ser el depósito general o cualquier otra
   barra con excedente, a su criterio.
2. El encargado del sector origen confirma la salida, validando la cantidad exacta física.
   Única validación: `cantidad_enviada <= cantidad_actual` en ese momento. **No se valida stock
   mínimo del origen ni se pide confirmación extra si el traspaso deja el origen en 0** — ver
   la regla en la sección 3. Al confirmar → estado `en_transito`, se descuenta el stock de origen.
3. El sector destino recibe notificación en tiempo real (WebSocket/Firestore listener) y confirma
   la cantidad física recibida.
4. Si la cantidad confirmada en destino coincide con la enviada → estado `cerrado`, se suma el
   stock en destino.
5. Si NO coincide → estado `en_disputa`, no se cierra automáticamente, y se notifica al
   encargado de boliche para que lo resuelva manualmente.
6. Cada traspaso queda en un historial permanente, filtrable por sector, producto, usuario y
   fecha, y se registra en `movimientos_stock` como `traspaso_salida`/`traspaso_entrada` —
   nunca como `venta`, y nunca impacta ingresos ni reportes financieros.

### Fase 6 — Alertas de stock (dos niveles: mínimo y crítico/cero)
Hay dos niveles de alerta distintos, no confundirlos:

1. **Alerta de stock mínimo** (advertencia): configuración de `stock_minimo` por producto y por
   sector (tabla `alertas_config`). Cuando `cantidad_actual <= stock_minimo`, notificación visual
   al encargado de barra y al encargado de boliche. Vista tipo semáforo (verde/amarillo/rojo) en
   el dashboard de cada rol con visibilidad de stock.
2. **Alerta crítica** (`cantidad_actual == 0`): más urgente que la anterior — implica que la
   venta de ese producto ya está bloqueada en esa barra en este mismo momento. Dispara una
   notificación destacada (no solo el semáforo en rojo) al encargado de esa barra, con dos
   acciones directas desde la misma notificación:
   - **Pedir al depósito general** (si tiene stock disponible).
   - **Pedirle a otro sector** (el encargado elige de cuál, según lo que él vea conveniente
     esa noche).
   Ambas acciones abren el flujo de traspaso de la Fase 5, con el sector elegido como origen.

### Fase 7 — Pedidos por WhatsApp
1. Botón "generar pedido" que arma automáticamente la lista de productos bajo stock mínimo (o selección manual del encargado).
2. Generar un link `https://wa.me/<numero>?text=<mensaje_url_encoded>` con el detalle producto + cantidad.
3. El número de destino (proveedor) debe ser configurable por producto o por categoría, no hardcodeado.

### Fase 8 — Reportes y panel financiero en tiempo real
1. Reportes por sector: ventas, unidades vendidas, producto más/menos vendido, traspasos enviados/recibidos. Visible para encargado_barra (su sector), encargado_boliche y dueño (todos los sectores).
2. Reporte general (solo dueño): ingresos, costos, ganancia bruta y neta, comparativa entre barras, evolución por noche/semana/mes. Usar gráficos simples (barras/líneas), no sobrecargar de información.
3. Cierre de caja por cajero: total vendido, medios de pago, diferencias.
4. Todos los reportes se actualizan en tiempo real vía WebSocket mientras el boliche está abierto (no requieren refrescar la página).

### Fase 9 — Offline-first y PWA
1. Convertir el frontend en PWA instalable (manifest.json + Service Worker).
2. Cachear la pantalla de venta y el catálogo de productos localmente (IndexedDB).
3. Si se corta la conexión: las ventas se siguen registrando localmente en una cola de sincronización, con indicador visual claro de "sin conexión — sincronizando pendiente".
4. Al recuperar la conexión: sincronizar la cola en orden, resolviendo conflictos de stock server-side (el servidor es la fuente de verdad final; si el stock quedó en negativo por ventas offline simultáneas, generar una alerta de conciliación para el encargado, nunca fallar en silencio).

### Fase 10 — Testing y hardening antes de producción
1. Tests unitarios de la lógica de stock (ventas, traspasos, anulaciones) — son la parte más crítica del sistema, no se puede saltear.
2. Test de concurrencia: dos cajeros vendiendo el último ítem de stock al mismo tiempo — el sistema debe garantizar que solo uno de los dos lo consiga (usar transacciones con lock a nivel de fila en PostgreSQL, `SELECT ... FOR UPDATE`).
3. Test de la pantalla de venta en tablet real (no solo emulador de navegador) — validar tamaño de botones, legibilidad con poca luz, tiempo de respuesta al tocar.
4. Checklist de seguridad: nunca confiar en el rol que manda el frontend, siempre validar en backend; PINs con rate-limiting de intentos; logs de auditoría de quién hizo qué y cuándo.

---

## 5. Especificación visual de la pantalla de venta (cajero)

Esta es la pantalla que más se usa y la que menos margen de error tiene. Especificaciones:

- **Layout**: grid de tarjetas de producto grandes (mínimo 100x100px táctil), organizadas por categoría en pestañas o secciones con scroll horizontal.
- **Color por categoría**: cada categoría de bebida tiene un color distintivo consistente (ej: cerveza, tragos, gaseosas/sin alcohol, energizantes).
- **Cantidad en el botón**: al tocar un producto, un número grande (mínimo 28px) aparece superpuesto en la esquina o centro del botón mostrando cuántas unidades hay en el carrito.
- **Carrito/resumen lateral o inferior**: siempre visible, sin necesidad de abrir un modal, con lista de ítems + cantidad + subtotal, y el total grande y destacado.
- **Botón de cobrar**: grande, de un solo color de acento, fácil de alcanzar con el pulgar.
- **Botón deshacer**: visible sin scroll, cerca del carrito.
- **Producto sin stock**: botón atenuado (opacidad ~40%) con un ícono de bloqueo, no clickeable.
- **Confirmación de cobro**: pantalla o modal con el resumen completo en letras grandes antes de cerrar la venta, para que el cajero pueda verificar de un vistazo.
- **Sin inputs de texto libre** en el flujo de venta — todo es táctil (números y selección), para minimizar errores de tipeo bajo presión.

---

## 6. Criterios de aceptación (para considerar el MVP listo)

- [ ] Un cajero puede vender sin poder nunca dejar el stock en negativo.
- [ ] Un traspaso nunca cierra solo si las cantidades de origen y destino no coinciden.
- [ ] Un traspaso puede dejar el sector origen en 0 unidades sin bloqueo ni advertencia extra —
      el sistema no impone un mínimo de stock en el origen de un traspaso.
- [ ] Un traspaso puede hacerse entre cualquier par de sectores (barra→barra, depósito→barra,
      barra→depósito), no solo desde el depósito.
- [ ] Ningún traspaso afecta `ventas`, ingresos ni reportes financieros — solo reubica stock.
- [ ] El dueño ve ventas, costos y ganancias actualizándose en tiempo real sin refrescar.
- [ ] La pantalla de venta funciona sin conexión y sincroniza sola al reconectar.
- [ ] Las alertas de stock mínimo (advertencia) y de stock 0 (crítica, con opciones de
      reposición) se disparan automáticamente sin intervención manual.
- [ ] Todo movimiento de stock (venta, traspaso, ajuste) tiene usuario, motivo y timestamp registrados.
- [ ] Ningún endpoint del backend confía en el rol enviado por el frontend sin validarlo server-side.

---

## 7. Cómo usar este documento con el agente

Pegá este archivo completo como primer mensaje al agente de desarrollo. Sugerencia de cierre
para agregar al final del prompt real:

> "Empezá por la Fase 1. Al terminar cada fase, mostrame un resumen de lo implementado y
> esperá mi confirmación antes de avanzar a la siguiente. Priorizá siempre la integridad del
> stock por sobre la velocidad de desarrollo."
