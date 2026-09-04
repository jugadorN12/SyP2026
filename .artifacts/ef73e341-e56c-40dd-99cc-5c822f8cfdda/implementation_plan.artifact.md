# Plan de Implementación: Edición de Promociones y Restricción de Roles

El objetivo es permitir que los encargados editen promociones existentes y asegurar que solo el personal autorizado (Encargados de Barra, Encargado General/Boliche y Dueños) tenga acceso a esta sección.

## User Review Required

> [!IMPORTANT]
> Se mantendrá la restricción actual en las rutas que ya incluye a `dueño`, `encargado_barra`, `encargado_boliche` y `developer`, excluyendo a los `cajeros` del menú de promociones, tal como se solicitó.

## Proposed Changes

### 1. Gestión de Promociones
#### [MODIFY] [PromosPage.tsx](file:///C:/Users/simpl/AndroidStudioProjects/SyP/web/src/pages/PromosPage.tsx)
- **Estado de Edición**: Añadir `editingId: string | null` para rastrear si se está editando una promo.
- **Acción de Editar**: Añadir un botón con el icono `Edit2` en la lista de promociones. Al hacer clic, se cargarán los datos de la promo en el formulario y se hará scroll hacia arriba.
- **Actualización en Firestore**: Modificar `handleCreatePromo` para que use `updateDoc` si `editingId` está presente, o `addDoc` si es una nueva.
- **Botón Dinámico**: El botón principal cambiará su texto a "Actualizar Promo" y el icono a `Save` cuando esté en modo edición.
- **Botón Cancelar**: Añadir un botón para salir del modo edición y limpiar el formulario.

### 2. Seguridad y Roles
#### [MODIFY] [App.tsx](file:///C:/Users/simpl/AndroidStudioProjects/SyP/web/src/App.tsx)
- Verificar y ajustar las `allowedRoles` en la ruta `/promos` para asegurar que coincida exactamente con lo solicitado (excluir cajeros).

## Plan de Verificación

### Pruebas de Funcionalidad
- **Creación**: Verificar que se pueden seguir creando promos nuevas.
- **Edición**: Seleccionar una promo existente, cambiar su precio y productos, y verificar que se actualice correctamente sin crear un duplicado.
- **Cancelación**: Iniciar una edición y cancelarla; el formulario debe quedar vacío y el estado volver a "Nueva Promo".

### Pruebas de Seguridad
- Intentar acceder a la ruta `/promos` con un usuario de rol `cajero` y verificar que sea redirigido a `/unauthorized`.
- Verificar que `encargado_barra` y `encargado_boliche` puedan entrar y operar normalmente.
