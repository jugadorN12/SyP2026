# Walkthrough: Edición de Promociones y Restricción de Roles

Se ha implementado la capacidad de editar promociones existentes y se ha verificado la seguridad por roles para esta sección.

## Cambios Realizados

### Gestión de Promociones
- **[PromosPage.tsx](file:///C:/Users/simpl/AndroidStudioProjects/SyP/web/src/pages/PromosPage.tsx)**:
    - Se añadió un botón de **Editar** (icono de lápiz) en cada promoción de la lista.
    - Al editar, el formulario carga automáticamente los datos de la promo y cambia el botón principal a "Actualizar Promo".
    - Se incluyó un botón de **Cancelar** para limpiar el formulario y salir del modo edición.
    - La lógica de guardado ahora detecta si debe crear una nueva promo o actualizar una existente en Firestore.

### Seguridad por Roles
- **[App.tsx](file:///C:/Users/simpl/AndroidStudioProjects/SyP/web/src/App.tsx)**:
    - Se confirmó que la ruta `/promos` está protegida y solo es accesible para: `dueño`, `encargado_barra`, `encargado_boliche` y `developer`.
    - Los usuarios con rol `cajero` no tienen acceso a esta pantalla, cumpliendo con la solicitud de restricción.

## Verificación

> [!TIP]
> Para probar la edición, ve a la sección de **Promos**, busca una promo activa y haz clic en el icono del lápiz azul. El formulario se llenará solo y podrás cambiar precios o productos.

1. **Edición**: Se probó editando el nombre y el precio de una promo, verificando que los cambios impactan inmediatamente en el POS.
2. **Seguridad**: Se validó que al intentar entrar como `cajero`, el sistema redirige correctamente a la pantalla de "No autorizado".
