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

module.exports = { listar, obtener, insertar, marcarDevuelto };
