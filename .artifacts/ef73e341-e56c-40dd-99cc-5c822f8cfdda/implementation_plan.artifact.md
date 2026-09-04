# Plan de Implementación: Formateo de Precios (Separador de Miles)

El objetivo de este plan es estandarizar la visualización de todos los montos de dinero en la aplicación, utilizando el punto `.` como separador de miles (ej: `$40.000` en lugar de `$40000`) para mejorar la legibilidad y evitar errores de cobro.

## Proposed Changes

### 1. Utilidad de Formateo
#### [NEW] `web/src/utils/format.ts`
- Implementar `formatPrice(amount: number): string` que utilice `toLocaleString('es-AR')`.
- Esta función asegurará que siempre se use el punto para los miles y la coma para los decimales (si los hay).

### 2. Actualización de Componentes de Visualización
Se reemplazará el uso de `.toLocaleString()` directo o la falta de formateo por la nueva utilidad en los siguientes archivos:
- **POS**: `ProductButton.tsx`, `CartaProductButton.tsx`, `CartSidebar.tsx`, `POSPage.tsx`.
- **Inventario**: `InventoryPage.tsx`, `ProductManagement.tsx`, `PromosPage.tsx`.
- **Caja**: `CashClosureModal.tsx`, `FinancialCard.tsx`, `Dashboard.tsx`.

### 3. Mejora en Modales de Cobro e Ingreso (Inputs)
#### [MODIFY] `web/src/components/PaymentModal.tsx`
- Formatear el total a cobrar y el ahorro.
- Mostrar una vista previa formateada del monto ingresado en los campos "Efectivo" y "Digital" para que el cajero vea el punto mientras escribe (o justo debajo).

#### [MODIFY] `web/src/components/CashMovementModal.tsx`
- Añadir una visualización grande y formateada del monto que se está ingresando para confirmar la lectura (ej: si escribe 15000, ver en grande **$15.000**).

## Plan de Verificación

### Prueba de Lectura
- Verificar que en el POS todos los precios de botellas y combos muestren el punto (ej: $55.000).
- Comprobar que en el Dashboard los ingresos totales sean legibles (ej: $1.250.000).

### Prueba de Cobro
- En el modal de pago mixto, ingresar un monto y verificar que el sistema muestre la resta con el punto de miles correctamente.
