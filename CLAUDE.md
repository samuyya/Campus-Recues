# CLAUDE.md

## Nombre del proyecto
SIGEP (Sistema de Gestion de Elementos Perdidos)

## Objetivo

Construir una aplicación web que ayude a los estudiantes y personal del campus a reportar objetos perdidos o encontrados, consultar reportes existentes y gestionar la devolución de objetos a sus propietarios.

## Problema

En el campus se extravían con frecuencia objetos personales como mochilas, cuadernos, llaves, botellas, dispositivos electrónicos y documentos. Actualmente no existe una forma centralizada y sencilla para reportar estos objetos, consultar si han sido encontrados o hacer seguimiento a su devolución.

## Usuario objetivo

- Estudiantes
- Docentes
- Personal administrativo
- Visitantes del campus

## Alcance mínimo funcional

La aplicación debe permitir:

1. Crear reportes de objetos perdidos.
2. Crear reportes de objetos encontrados.
3. Consultar todos los reportes.
4. Filtrar reportes por:
   - Categoría
   - Ubicación
   - Tipo de reporte (perdido o encontrado)
5. Ver los detalles completos de un reporte.
6. Marcar un objeto como devuelto a su propietario.
7. Mantener los datos después de recargar la página utilizando almacenamiento local.

## Datos requeridos en cada reporte

- Tipo de reporte (Perdido o Encontrado)
- Nombre del objeto
- Categoría
- Descripción
- Ubicación
- Fecha
- Alias de contacto
- Estado
- Foto (opcional)

## Reglas obligatorias

- La descripción es obligatoria.
- La ubicación es obligatoria.
- No se debe permitir guardar reportes incompletos.
- Debe diferenciar claramente reportes activos y reportes resueltos.
- Debe mostrar mensajes de error claros cuando falten datos.

## Categorías sugeridas

- Electrónicos
- Mochilas y bolsos
- Documentos
- Llaves
- Botellas y termos
- Ropa
- Otros

## Estados permitidos

- Activo
- Devuelto

## Flujo principal esperado

1. El usuario registra una mochila encontrada.
2. La aplicación guarda el reporte.
3. Otro usuario utiliza filtros para localizar la mochila.
4. Se visualizan los detalles del reporte.
5. El objeto es entregado a su propietario.
6. El reporte se marca como devuelto.

## Casos de error

### Campos vacíos
Mensaje:
"Por favor completa todos los campos obligatorios."

### Descripción vacía
Mensaje:
"Debes incluir una descripción del objeto."

### Ubicación vacía
Mensaje:
"Debes indicar dónde se perdió o encontró el objeto."

### No existen reportes
Mensaje:
"No hay reportes registrados todavía."

### Filtro sin coincidencias
Mensaje:
"No se encontraron objetos con los criterios seleccionados."

## Requisitos de experiencia de usuario

- Interfaz sencilla para personas sin experiencia técnica.
- Diseño responsive para celular y computador.
- Formularios fáciles de completar.
- Botones claramente identificables.
- Colores que diferencien reportes activos y devueltos.
- Navegación intuitiva.

## Persistencia

La información debe almacenarse localmente para conservar los reportes después de actualizar o cerrar la página.

## Criterios de éxito

La aplicación será considerada exitosa cuando:

- Se pueda registrar un objeto perdido o encontrado.
- Los filtros funcionen correctamente.
- Se puedan consultar detalles.
- Se pueda cambiar el estado a "Devuelto".
- Los datos permanezcan después de recargar la página.
- Un usuario nuevo pueda utilizarla sin instrucciones adicionales.

## Prioridades

Alta prioridad:
- Registro de reportes
- Filtros
- Cambio de estado
- Persistencia de datos

Media prioridad:
- Foto del objeto
- Mejoras visuales

Baja prioridad:
- Funciones adicionales que no hagan parte del reto
## Stack

- HTML5 + CSS3 + JavaScript puro (vanilla). Sin frameworks, sin Node, sin build, sin dependencias.
- Persistencia: `localStorage`, bajo una sola llave (`sigep_reportes`) con un arreglo de reportes en JSON.
- Sin backend, sin base de datos, sin login y sin servicios externos.
- Se ejecuta abriendo `index.html` en el navegador (doble clic). Probar en Chrome y en vista de celular.

### Estructura de archivos

```
index.html      pantallas y formulario
css/styles.css  estilos (responsive, colores de estado)
js/storage.js   leer y guardar en localStorage (única parte que toca localStorage)
js/reportes.js  lógica: crear, validar, filtrar, marcar devuelto
js/ui.js        pintar listas, detalle, mensajes de error, eventos
js/app.js       arranque
README.md
proceso-ia.md
```

### Restricciones técnicas

- Funciones cortas, una responsabilidad cada una; la lógica (validar, filtrar) separada de la parte visual.
- Cada reporte tiene un `id` único (por ejemplo `Date.now()`).
- Fechas guardadas como texto `AAAA-MM-DD`.
- Todo texto que escribe el usuario se muestra con `textContent`, nunca con `innerHTML` (evita inyectar HTML).
- Foto opcional: se reduce con `canvas` (máx. ~800 px de ancho) y se guarda como texto base64 en el reporte. `localStorage` tiene límite (~5 MB): si se llena, mostrar un mensaje amable y no perder los demás datos.
- Si `localStorage` está dañado o no disponible, la app no se cae: arranca con lista vacía.
- Cada cambio debe probarse recargando la página (F5) para confirmar que los datos persisten.

### Datos de ejemplo

Incluir 4 o 5 reportes ficticios para la demo (nombres y alias inventados, sin datos personales reales).

### Cómo probar

1. Abrir `index.html`.
2. Crear un reporte "Encontrado" y uno "Perdido".
3. Intentar guardar con descripción o ubicación vacía: deben salir los mensajes de error.
4. Filtrar por categoría, ubicación y tipo; probar un filtro sin resultados.
5. Marcar un reporte como devuelto y confirmar que cambia de color.
6. Recargar (F5): todo debe seguir igual.
7. Probar con texto muy largo y con la ventana angosta (celular).
