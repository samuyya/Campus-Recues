const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const RUTA_BD = process.env.SIGEP_DB || path.join(__dirname, 'data', 'sigep.db');

fs.mkdirSync(path.dirname(RUTA_BD), { recursive: true });
const db = new DatabaseSync(RUTA_BD);

db.exec(`
  CREATE TABLE IF NOT EXISTS reportes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo        TEXT NOT NULL CHECK (tipo IN ('perdido', 'encontrado')),
    nombre      TEXT NOT NULL,
    categoria   TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    ubicacion   TEXT NOT NULL,
    fecha       TEXT NOT NULL,
    contacto    TEXT NOT NULL,
    estado      TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'devuelto')),
    foto        TEXT NOT NULL DEFAULT '',
    creado_en   TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Los datos de reclamantes se guardan aparte de los reportes públicos.
db.exec(`
  CREATE TABLE IF NOT EXISTS reclamaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporte_id INTEGER NOT NULL REFERENCES reportes(id),
    nombre TEXT NOT NULL,
    tipo_documento TEXT NOT NULL,
    documento TEXT NOT NULL,
    telefono TEXT NOT NULL DEFAULT '',
    correo TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'pendiente',
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(reporte_id, tipo_documento, documento)
  )
`);

function crearReclamacion(reporteId, datos) {
  db.prepare(`INSERT INTO reclamaciones
    (reporte_id, nombre, tipo_documento, documento, telefono, correo)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(reporte_id, tipo_documento, documento) DO NOTHING`)
    .run(reporteId, datos.nombre, datos.tipo_documento, datos.documento, datos.telefono, datos.correo);
  // Solo se devuelve el comprobante; nunca los datos de identificación o contacto.
  return db.prepare(`SELECT id, estado FROM reclamaciones
    WHERE reporte_id = ? AND tipo_documento = ? AND documento = ?`)
    .get(reporteId, datos.tipo_documento, datos.documento);
}

// Escapa % y _ para que el texto del usuario se busque literalmente en LIKE.
function escaparLike(texto) {
  return texto.replace(/[\\%_]/g, '\\$&');
}

// Devuelve las condiciones SQL y sus parametros segun los filtros recibidos.
function construirFiltros(filtros) {
  const condiciones = [];
  const parametros = [];
  for (const campo of ['tipo', 'categoria', 'estado']) {
    if (filtros[campo]) {
      condiciones.push(`${campo} = ?`);
      parametros.push(filtros[campo]);
    }
  }
  if (filtros.ubicacion) {
    condiciones.push("ubicacion LIKE ? ESCAPE '\\'");
    parametros.push(`%${escaparLike(filtros.ubicacion)}%`);
  }
  return { condiciones, parametros };
}

function listar(filtros = {}) {
  const { condiciones, parametros } = construirFiltros(filtros);
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return db
    .prepare(`SELECT * FROM reportes ${where} ORDER BY id DESC`)
    .all(...parametros);
}

function obtener(id) {
  return db.prepare('SELECT * FROM reportes WHERE id = ?').get(id);
}

function insertar(r) {
  const info = db
    .prepare(
      `INSERT INTO reportes (tipo, nombre, categoria, descripcion, ubicacion, fecha, contacto, foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(r.tipo, r.nombre, r.categoria, r.descripcion, r.ubicacion, r.fecha, r.contacto, r.foto || '');
  return obtener(Number(info.lastInsertRowid));
}

// Devuelve el reporte actualizado, o undefined si el id no existe.
function marcarDevuelto(id) {
  db.prepare("UPDATE reportes SET estado = 'devuelto' WHERE id = ?").run(id);
  return obtener(id);
}

module.exports = { listar, obtener, insertar, marcarDevuelto, crearReclamacion };
