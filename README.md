# SIGEP — Sistema de Gestión de Elementos Perdidos

Aplicación web para que estudiantes, docentes, personal y visitantes del campus **reporten objetos perdidos o encontrados**, consulten los reportes existentes y marquen un objeto como **devuelto** a su dueño.

Funciona completamente en el portátil: sin login, sin servicios externos y sin nube. Los reportes se guardan en una base de datos SQLite, así que **se conservan al recargar la página, al cerrar el navegador y al reiniciar el servidor**.

## Qué se puede hacer

1. Crear un reporte de un objeto **perdido** o **encontrado**.
2. Consultar todos los reportes.
3. Filtrar por **categoría**, **ubicación** y **tipo** (perdido o encontrado).
4. Ver los detalles completos de un reporte.
5. Marcar un reporte como **devuelto**.

Los reportes **activos** se muestran en color ámbar y los **devueltos** en verde, para distinguirlos de un vistazo.

## Requisitos

- **Node.js 22.13 o superior** (usa el módulo integrado `node:sqlite`, que no necesita instalar nada extra).
- npm (viene con Node).

Para comprobar la versión:

```bash
node -v
```

## Instalación y arranque

Se hace `npm install` una sola vez y luego `npm start`:

```bash
npm install
```

```bash
npm start
```

Abre **http://localhost:3000** en el navegador. La base de datos (`data/sigep.db`) se crea sola la primera vez que arranca el servidor.

Para detener el servidor, presiona `Ctrl + C` en la terminal.

> Si el puerto 3000 está ocupado, se puede usar otro. En PowerShell: `$env:PORT = 3001; npm start`. En Git Bash o macOS/Linux: `PORT=3001 npm start`.

## Datos de ejemplo para la demo

Para cargar 5 reportes ficticios (nombres y alias inventados):

```bash
npm run seed
```

El script **solo carga datos si la base está vacía**, para no duplicar reportes. Si quieres empezar de cero, detén el servidor, borra el archivo `data/sigep.db` y vuelve a ejecutar `npm run seed`.

## Cómo usar la aplicación

1. **Reportar un objeto:** en "Crea un reporte" elige el tipo (perdido o encontrado), escribe el nombre, la categoría, la descripción, la ubicación, la fecha y un alias de contacto, y pulsa **Guardar reporte**.
2. **Buscar un objeto:** en "Explora los reportes" usa los filtros de categoría, ubicación y tipo, y pulsa **Aplicar filtros**. **Limpiar filtros** muestra todo otra vez.
3. **Ver el detalle:** pulsa un reporte de la lista para ver todos sus datos.
4. **Devolver un objeto:** en el detalle de un reporte activo, pulsa **Marcar como devuelto**. El reporte cambia a verde.

### Reglas y mensajes de error

Todos los campos del reporte son obligatorios (la foto es opcional) y no se puede guardar un reporte incompleto. La validación se hace en el formulario y también en el servidor.

| Situación | Mensaje |
|---|---|
| Faltan campos obligatorios | Por favor completa todos los campos obligatorios. |
| Descripción vacía | Debes incluir una descripción del objeto. |
| Ubicación vacía | Debes indicar dónde se perdió o encontró el objeto. |
| No hay reportes | No hay reportes registrados todavía. |
| El filtro no encuentra nada | No se encontraron objetos con los criterios seleccionados. |
| El servidor no responde | No se pudo conectar. Intenta de nuevo. |

Categorías: Electrónicos, Mochilas y bolsos, Documentos, Llaves, Botellas y termos, Ropa, Otros.
Estados: Activo, Devuelto.

## API (REST, JSON)

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/api/reportes?tipo=&categoria=&ubicacion=&estado=` | Lista y filtra. Todos los filtros son opcionales. `ubicacion` busca texto parcial, sin distinguir mayúsculas; los demás deben coincidir exactamente. Los más recientes salen primero. |
| `GET` | `/api/reportes/:id` | Detalle de un reporte. |
| `POST` | `/api/reportes` | Crea un reporte. Siempre nace con estado `activo`. |
| `PATCH` | `/api/reportes/:id/devuelto` | Marca el reporte como `devuelto`. |

Los errores responden siempre con `{ "error": "mensaje en español" }`:

| Código | Cuándo |
|---|---|
| `400` | Datos incompletos o inválidos, o JSON dañado. |
| `404` | El reporte o la ruta no existen. |
| `413` | La petición supera los 2 MB (por ejemplo, una foto muy pesada). |
| `500` | Error inesperado del servidor. |

### Campos de un reporte

`id`, `tipo` (`perdido` o `encontrado`), `nombre`, `categoria`, `descripcion`, `ubicacion`, `fecha` (`AAAA-MM-DD`), `contacto`, `estado` (`activo` o `devuelto`), `foto` (imagen en base64, puede ir vacía) y `creado_en`.

### Probar la API a mano

Con el servidor encendido en una terminal, abre **otra** terminal.

Ver los reportes: abre `http://localhost:3000/api/reportes` en el navegador.

Crear un reporte con la descripción vacía (debe responder el error de descripción), en **PowerShell**:

```bash
try { Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/reportes -ContentType "application/json" -Body '{"tipo":"perdido","nombre":"Termo","categoria":"Otros","descripcion":"","ubicacion":"Cancha","fecha":"2026-11-10","contacto":"Ana"}' } catch { $_.ErrorDetails.Message }
```

El mismo caso en **Git Bash, macOS o Linux**:

```bash
curl -s -X POST http://localhost:3000/api/reportes -H "Content-Type: application/json" -d '{"tipo":"perdido","nombre":"Termo","categoria":"Otros","descripcion":"","ubicacion":"Cancha","fecha":"2026-11-10","contacto":"Ana"}'
```

Si escribes algo en `descripcion`, el reporte se crea y aparece en `/api/reportes`.

Marcar como devuelto el reporte 1, en **PowerShell**:

```bash
Invoke-RestMethod -Method Patch -Uri http://localhost:3000/api/reportes/1/devuelto
```

o en **Git Bash, macOS o Linux**:

```bash
curl -s -X PATCH http://localhost:3000/api/reportes/1/devuelto
```

## Estructura del proyecto

```
server.js            arranca Express y sirve public/
db.js                abre SQLite, crea la tabla y expone las consultas
routes/reportes.js   rutas de la API y validación
seed.js              datos de ejemplo (npm run seed)
public/index.html    pantallas y formularios
public/css/          estilos (responsive, colores de estado)
public/js/api.js     llamadas fetch al backend
public/js/ui.js      pintar listas, detalle, mensajes y eventos
public/js/app.js     arranque del frontend
data/                aquí vive sigep.db (no se sube a GitHub)
```

Tecnologías: Node.js + Express en el servidor, SQLite (`node:sqlite`) para los datos y HTML, CSS y JavaScript puros en el navegador, sin frameworks ni paso de compilación. La única dependencia de npm es `express`.

## Problemas frecuentes

- **"No se pudo conectar. Intenta de nuevo."** El servidor está apagado. Ejecuta `npm start` y deja esa terminal abierta.
- **`EADDRINUSE: address already in use :::3000`.** Ya hay otro servidor en el puerto 3000. Ciérralo o usa otro puerto como se explicó arriba.
- **Un aviso `ExperimentalWarning` de SQLite al arrancar.** En algunas versiones de Node aparece porque `node:sqlite` todavía se marca como experimental. No afecta el funcionamiento.
- **Los datos de ejemplo no aparecen.** `npm run seed` no agrega nada si la base ya tiene reportes. Mira el mensaje que imprime.
