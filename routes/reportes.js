const express = require('express');
const db = require('../db');

const router = express.Router();

const FILTROS = ['tipo', 'categoria', 'ubicacion', 'estado'];

// Toma de la URL solo los filtros que llegaron como texto no vacio.
function leerFiltros(query) {
  const filtros = {};
  for (const campo of FILTROS) {
    const valor = query[campo];
    if (typeof valor === 'string' && valor.trim() !== '') {
      filtros[campo] = valor.trim();
    }
  }
  return filtros;
}

// Convierte el id de la URL en entero positivo, o null si no lo es.
function leerId(texto) {
  return /^\d+$/.test(texto) ? Number(texto) : null;
}

router.get('/', (req, res) => {
  res.json(db.listar(leerFiltros(req.query)));
});

router.get('/:id', (req, res) => {
  const id = leerId(req.params.id);
  const reporte = id === null ? undefined : db.obtener(id);
  if (!reporte) {
    return res.status(404).json({ error: 'No se encontró el reporte solicitado.' });
  }
  res.json(reporte);
});

module.exports = router;
