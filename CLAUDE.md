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

Los reportes se guardan en una base de datos (SQLite) a través de un backend, y se conservan después de actualizar o cerrar la página, y desde cualquier navegador que abra la app.

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

- Backend: Node.js (v22 o superior) + Express. Única dependencia de npm: `express`.
- Base de datos: SQLite con el módulo integrado `node:sqlite` (no se instala nada extra). La BD es un archivo local `data/sigep.db`, se crea sola al arrancar.
- Frontend: HTML5 + CSS3 + JavaScript puro (vanilla), servido por el mismo Express desde la carpeta `public/`. Sin frameworks ni build. Se comunica con el backend usando `fetch`.
- Sin login, sin servicios externos, sin nube. Todo corre en el portátil con un solo comando.
- Arranque: `npm install` una vez y luego `npm start` (abre en `http://localhost:3000`).

### Estructura de archivos

```
server.js            arranca Express y sirve public/
db.js                abre SQLite, crea la tabla, funciones de consulta
routes/reportes.js   rutas de la API
public/index.html    pantallas y formulario
public/css/styles.css
public/js/api.js     llamadas fetch al backend (única parte que habla con la API)
public/js/ui.js      pintar listas, detalle, mensajes de error, eventos
public/js/app.js     arranque del frontend
data/                aquí vive sigep.db (no se sube a GitHub)
README.md
proceso-ia.md
```

### API (REST, JSON)

- `GET    /api/reportes?tipo=&categoria=&ubicacion=&estado=`  lista y filtra
- `GET    /api/reportes/:id`                                  detalle
- `POST   /api/reportes`                                      crea un reporte
- `PATCH  /api/reportes/:id/devuelto`                         marca como devuelto

Errores de validación: responder `400` con `{ "error": "mensaje claro en español" }` usando los textos de la sección "Casos de error". La validación se hace en el backend (obligatoria) y también en el frontend (para dar aviso rápido).

### Tabla `reportes`

`id` (entero, autoincremental), `tipo` (`perdido` | `encontrado`), `nombre`, `categoria`, `descripcion`, `ubicacion`, `fecha` (`AAAA-MM-DD`), `contacto`, `estado` (`activo` | `devuelto`), `foto` (texto base64, puede ser vacío), `creado_en`.

### Restricciones técnicas

- Consultas SQL siempre con parámetros (`?`), nunca armando el texto con las variables del usuario (evita inyección SQL).
- En el frontend, todo texto del usuario se muestra con `textContent`, nunca con `innerHTML`.
- Funciones cortas, una responsabilidad cada una. La validación vive en una sola función del backend.
- Foto opcional: el frontend la reduce con `canvas` (máx. ~800 px de ancho) y la manda como base64. Límite de tamaño de la petición en Express: 2 MB; si se pasa, responder un error amable.
- Si el servidor no responde, el frontend muestra "No se pudo conectar. Intenta de nuevo." y no se queda en blanco.
- Cada cambio se prueba recargando la página (F5) y también reiniciando el servidor, para confirmar que los datos persisten en la BD.
- `data/*.db` y `node_modules/` van en `.gitignore`.

### Datos de ejemplo

Un script `npm run seed` carga 4 o 5 reportes ficticios para la demo (nombres y alias inventados, sin datos personales reales).

### Cómo probar

1. `npm install` y `npm start`; abrir `http://localhost:3000`.
2. Crear un reporte "Encontrado" y uno "Perdido".
3. Intentar guardar con descripción o ubicación vacía: deben salir los mensajes de error (también probando la API directo, sin pasar por el formulario).
4. Filtrar por categoría, ubicación y tipo; probar un filtro sin resultados.
5. Marcar un reporte como devuelto y confirmar que cambia de color.
6. Recargar (F5) y luego reiniciar el servidor: todo debe seguir igual.
7. Probar con texto muy largo, comillas y símbolos raros, y con la ventana angosta (celular).
