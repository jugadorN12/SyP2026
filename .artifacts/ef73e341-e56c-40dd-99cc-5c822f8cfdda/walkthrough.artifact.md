# Walkthrough: Control Estricto de Distribución de Stock

Se ha implementado una capa de seguridad crítica que garantiza que el stock distribuido entre las barras nunca supere el **Stock Global** disponible en el boliche. Esto asegura un recuento exacto y evita la "creación" de stock inexistente durante la jornada.

## Cambios Realizados

### 1. Validación Inteligente en el Conteo
- **[InitialInventoryCheck.tsx](file:///C:/Users/simpl/AndroidStudioProjects/SyP/web/src/pages/InitialInventoryCheck.tsx)**:
    - El sistema ahora calcula dinámicamente el **Máximo Disponible** para cada barra.
    - `Disponible = Stock Global - Suma de Stock en otras barras`.
    - Si un cajero intenta ingresar más de lo disponible, el campo se marca en **rojo** y el botón de inicio se bloquea.
    - Se añadió una etiqueta informativa debajo de cada producto indicando la disponibilidad real en el boliche.

### 2. Visibilidad del Depósito (Sobrante)
- **[BarMonitorPage.tsx](file:///C:/Users/simpl/AndroidStudioProjects/SyP/web/src/pages/BarMonitorPage.tsx)**:
    - Se añadió una nueva sección: **"Stock Restante en Depósito"**.
    - Permite al encargado ver exactamente cuántas botellas quedan "libres" para ser repartidas, facilitando la logística de reposición durante la noche.

## Verificación

> [!IMPORTANT]
> **Ejemplo de Uso**: Si tienes 10 botellas de Gin en total (Stock Global) y la Barra VIP ya cargó 8, al abrir la Barra 1 el sistema te informará que solo puedes cargar un máximo de 2.

1. **Límites**: Se probó que al intentar superar el stock global, el sistema impide el avance y muestra alertas claras.
2. **Sincronización**: Las ventas en el POS liberan stock global, lo que permite que el encargado asigne esas unidades a otras barras si fuera necesario.
3. **Monitoreo**: El panel de encargado ahora refleja no solo lo que tienen los cajeros, sino también lo que queda guardado en el depósito central.
