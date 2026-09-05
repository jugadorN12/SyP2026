# Plan de Implementación: Control Estricto de Distribución de Stock Global

Este plan asegura que la mercadería repartida en las barras nunca supere el total físico del boliche (Stock Global). El sistema validará en tiempo real que ningún cajero pueda recibir más bebida de la que realmente hay disponible para distribuir.

## User Review Required

> [!IMPORTANT]
> **Definición de Disponibilidad**:
> `Disponible para Barra X = Stock Global - Suma de Stock en todas las DEMÁS barras`.
> Si una barra intenta cargar más de lo disponible, el sistema bloqueará el guardado para evitar inconsistencias contables.

## Proposed Changes

### 1. Validación en el Conteo Inicial
#### [MODIFY] [InitialInventoryCheck.tsx](file:///C:/Users/simpl/AndroidStudioProjects/SyP/web/src/pages/InitialInventoryCheck.tsx)
- **Cálculo de Límites**: El componente recuperará el inventario de todos los sectores para calcular cuánto queda "libre" de cada producto.
- **UI de Advertencia**: Se mostrará un texto descriptivo: *"Máximo para distribuir: X"* bajo cada campo de entrada.
- **Validación Dinámica**: Los inputs se marcarán en rojo si el número es inválido y el botón de confirmar se deshabilitará automáticamente.

### 2. Consistencia en Ventas (POS)
#### [MODIFY] [POSPage.tsx](file:///C:/Users/simpl/AndroidStudioProjects/SyP/web/src/pages/POSPage.tsx)
- Reforzar el uso de `writeBatch` para que cada venta reste simultáneamente del stock de la barra y del stock global del producto.

### 3. Visibilidad para el Encargado
#### [MODIFY] [BarMonitorPage.tsx](file:///C:/Users/simpl/AndroidStudioProjects/SyP/web/src/pages/BarMonitorPage.tsx)
- Añadir un resumen de **"Stock en Depósito"** (lo que no está en ninguna barra pero existe en el boliche).

## Verification Plan

### Prueba de Tope de Stock
1. Configurar "Fernet" con Stock Global: **10**.
2. **Barra VIP**: Cargar 7 unidades. (Permitido).
3. **Barra 1**: Intentar cargar 5 unidades. (Bloqueado: Debe decir *"Máximo disponible: 3"*).
4. **Barra 1**: Cargar 3 unidades. (Permitido).
5. **Cualquier Barra**: Verificar que no se pueden cargar más Fernets hasta que se vendan o se aumente el stock global.
