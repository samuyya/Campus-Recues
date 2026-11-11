# Proceso con IA — SIGEP

Este documento cuenta cómo se usó la IA (Claude Code) para construir SIGEP en el concurso de 4 horas, qué decisiones se tomaron, qué problemas aparecieron y cómo se comprobó que todo funcionaba.

> **Estado:** la sección del backend (persona A) está completa. Las secciones de B y V están vacías para que las llene cada quien con lo suyo.

## 1. Cómo se trabajó

- **Primero un plan, sin código.** Se le dio a la IA el `CLAUDE.md` y se le pidió solo un plan: tareas numeradas, de máximo 25 minutos, cada una con archivos, forma de comprobarla, tiempo y dependencias. La IA devolvió también 11 dudas del `CLAUDE.md` para aclarar antes de empezar.
- **Dos bloques que no se pisan.** A se quedó con `server.js`, `db.js`, `routes/`, `seed.js`, `package.json`, el CSS y los documentos. B se quedó con `public/index.html` y `public/js/`. Así nadie editó el mismo archivo.
- **Contrato de nombres desde el minuto 0.** Campos como en la tabla del `CLAUDE.md`, `tipo` y `estado` en minúscula, errores como `{ "error": "..." }`, y las clases `.tarjeta .activo` y `.tarjeta .devuelto` para los colores.
- **Una tarea, una prueba, un commit.** Después de cada tarea la IA probó lo hecho, mostró el resultado y esperó la orden de A antes de hacer commit y push. Nada se subió sin que A lo pidiera.

## 2. Parte de A (backend): tareas hechas

| Tarea | Qué quedó |
|---|---|
| T1 | `package.json`, `server.js` y una página provisional; el servidor arranca en `localhost:3000`. |
| A2 | `db.js`: crea `data/sigep.db` y la tabla `reportes`; funciones para listar con filtros, obtener, insertar y marcar devuelto. |
| A3 | `GET /api/reportes` (con filtros) y `GET /api/reportes/:id`. |
| A4 | `seed.js`: 5 reportes ficticios con `npm run seed`. |
| A5 | `POST /api/reportes` con una sola función de validación. |
| A6 | `PATCH /api/reportes/:id/devuelto` y manejo de errores siempre en JSON. |
| A7 | `public/css/styles.css`: ámbar para activos, verde para devueltos, diseño responsive. |
| A8 | `README.md` completo. |

## 3. Decisiones de diseño

- **Consultas siempre con parámetros (`?`).** Se probó con un nombre que contenía comillas y un `DROP TABLE`: se guardó como texto y la tabla quedó intacta. Los `%` y `_` que escribe el usuario en el filtro de ubicación se buscan literalmente.
- **Una sola función de validación** (`validar()` en `routes/reportes.js`). Si falta solo la descripción, sale el mensaje de descripción; si falta solo la ubicación, el de ubicación; cualquier otra combinación de vacíos sale con el mensaje genérico de campos obligatorios. Un campo con solo espacios cuenta como vacío.
- **El estado nunca viene del cliente.** Un reporte nuevo siempre nace `activo`, aunque la petición traiga `estado: "devuelto"` o un `id`.
- **Filtro de ubicación por texto parcial**, sin distinguir mayúsculas. Categoría, tipo y estado deben coincidir exactamente. Lista ordenada del más reciente al más antiguo.
- **`PATCH` idempotente.** Marcar como devuelto un reporte que ya lo estaba responde igual, sin error.
- **Errores siempre en JSON y en español**, también cuando la petición supera 2 MB, cuando el JSON viene dañado o cuando la ruta no existe, para que el frontend nunca reciba una página HTML de error.
- **`seed.js` solo carga si la tabla está vacía**, para no duplicar datos ni mezclar ejemplos con reportes reales.
- **Variables de entorno `SIGEP_DB` y `PORT`** para poder probar con una base de datos temporal y otro puerto sin tocar la base real.
- **Mensajes que la IA redactó** porque el `CLAUDE.md` no los define: "Revisa los datos: el tipo, la categoría, la fecha o la foto no son válidos.", "La foto es demasiado pesada. Elige una imagen más pequeña.", "No se pudo leer la información enviada.", "No se encontró el reporte solicitado." y "Ocurrió un error en el servidor. Intenta de nuevo.". El equipo puede cambiarlos.
- **Sin tope de longitud en los textos.** Solo existe el límite de 2 MB de toda la petición. Era una duda abierta del plan.

## 4. Problemas que aparecieron y cómo se resolvieron

1. **El `CLAUDE.md` cambió de stack a mitad del trabajo.** Un commit del equipo reescribió las instrucciones a una versión solo frontend con `localStorage` (sin Express ni SQLite) y quitó `node_modules/` y `data/*.db` del `.gitignore`. La IA lo detectó al ver archivos que debían estar ignorados y revisó el diff. En vez de seguir construyendo sobre una suposición, se detuvo y preguntó. El equipo decidió **mantener el backend con SQLite**, y se restauraron `CLAUDE.md` y `.gitignore` en un commit aparte.
2. **Un servidor de prueba quedó vivo y ocupó el puerto 3000.** Salió el error `EADDRINUSE`. La IA identificó el proceso (era suyo, de una prueba anterior), lo detuvo y desde entonces las pruebas usan otro puerto y una base de datos temporal.
3. **Errores HTML en lugar de JSON** con un cuerpo de más de 2 MB o un JSON dañado. Se vio al probar A5 y se corrigió en A6 con un manejador de errores.
4. **Comandos de prueba que fallaban en PowerShell.** Primero, `curl.exe` pierde las comillas dobles al pasar JSON en línea. Después, `Invoke-RestMethod` oculta el mensaje de error cuando el servidor responde 400 y solo muestra "(400) Solicitud incorrecta". Se corrigió con un `try/catch` que lee `$_.ErrorDetails.Message`. El otro error que reportó el equipo ("No es posible conectar con el servidor remoto") era simplemente que el servidor estaba apagado.
5. **Falsas alarmas de las propias pruebas.** PowerShell cuenta un arreglo vacío como 1 elemento al usar `@(...)`, lo que parecía un fallo del filtro. La IA lo verificó con la respuesta cruda de `curl` antes de dar nada por bueno.
6. **Mezcla de commits.** `git checkout` dejó archivos en el área de preparación y un commit se llevó cambios de más. Como aún no estaba subido, se separó en dos commits antes del push.
7. **Push rechazado** porque el remoto tenía commits nuevos de B. Se integró con `git pull` (merge, sin conflictos porque cada quien tocaba archivos distintos) y se volvió a subir.

## 5. Cómo se verificó

- Cada función y endpoint se probó con una **base de datos temporal**, que se borró al terminar.
- Se probaron casos buenos y malos: campos vacíos, solo espacios, tipos y categorías inválidos, fechas imposibles, foto válida e inválida, texto con comillas, HTML y 3000 caracteres, y un cuerpo mayor de 2 MB.
- **Persistencia:** se reinició el servidor y se confirmó que los reportes y el estado `devuelto` seguían ahí.
- **README:** se siguieron todos sus pasos en un **clon limpio** del repositorio (`npm install`, `seed`, `start` y comandos de la API).
- **CSS:** se vio en un navegador a 1100 px y a 375 px de ancho, con un reporte de nombre larguísimo sin espacios, y no hubo desborde horizontal.

## 6. Lo que decidió una persona, no la IA

- Qué stack se usa (backend con SQLite, no `localStorage`).
- Cuándo hacer commit y push.
- Qué debía contener este documento.

## 7. Pendientes o dudas abiertas

- Si se quiere un tope de longitud para nombre, descripción y ubicación.
- Revisar que los mensajes redactados por la IA (sección 3) convenzan al equipo.
- Confirmar que los nombres de los botones del README coinciden con los de la pantalla (lo hace V en la prueba final).

## 8. Parte de B (frontend)

_Por completar: qué se le pidió a la IA, qué decisiones tomó, qué problemas hubo y cómo lo comprobó._

## 9. Parte de V (verificación)

_Por completar: qué se probó, qué fallos se encontraron y cómo se resolvieron._
