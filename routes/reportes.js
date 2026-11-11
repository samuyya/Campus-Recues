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

const TIPOS = ['perdido', 'encontrado'];
const CATEGORIAS = [
  'Electrónicos',
  'Mochilas y bolsos',
  'Documentos',
  'Llaves',
  'Botellas y termos',
  'Ropa',
  'Otros',
];
const CAMPOS_TEXTO = ['tipo', 'nombre', 'categoria', 'descripcion', 'ubicacion', 'fecha', 'contacto'];

const MSG_INCOMPLETO = 'Por favor completa todos los campos obligatorios.';
const MSG_SIN_DESCRIPCION = 'Debes incluir una descripción del objeto.';
const MSG_SIN_UBICACION = 'Debes indicar dónde se perdió o encontró el objeto.';
const MSG_DATOS_INVALIDOS = 'Revisa los datos: el tipo, la categoría, la fecha o la foto no son válidos.';

function esFechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const fecha = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
}

function esFotoValida(foto) {
  return foto === '' || (typeof foto === 'string' && /^data:image\/[a-z+.-]+;base64,/i.test(foto));
}

// Unica funcion de validacion. Devuelve { error } o { datos } ya limpios.
// El estado nunca se lee del cliente: todo reporte nuevo nace "activo".
function validar(cuerpo) {
  const entrada = cuerpo && typeof cuerpo === 'object' ? cuerpo : {};
  const datos = {};
  for (const campo of CAMPOS_TEXTO) {
    datos[campo] = typeof entrada[campo] === 'string' ? entrada[campo].trim() : '';
  }
  datos.foto = entrada.foto === undefined || entrada.foto === null ? '' : entrada.foto;

  const faltantes = CAMPOS_TEXTO.filter((campo) => datos[campo] === '');
  if (faltantes.length === 1 && faltantes[0] === 'descripcion') return { error: MSG_SIN_DESCRIPCION };
  if (faltantes.length === 1 && faltantes[0] === 'ubicacion') return { error: MSG_SIN_UBICACION };
  if (faltantes.length > 0) return { error: MSG_INCOMPLETO };

  const validos =
    TIPOS.includes(datos.tipo) &&
    CATEGORIAS.includes(datos.categoria) &&
    esFechaValida(datos.fecha) &&
    esFotoValida(datos.foto);
  if (!validos) return { error: MSG_DATOS_INVALIDOS };

  return { datos };
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

router.post('/', (req, res) => {
  const { error, datos } = validar(req.body);
  if (error) return res.status(400).json({ error });
  res.status(201).json(db.insertar(datos));
});

// Marcar como devuelto es idempotente: si ya lo estaba, responde igual con el reporte.
router.patch('/:id/devuelto', (req, res) => {
  const id = leerId(req.params.id);
  const reporte = id === null ? undefined : db.marcarDevuelto(id);
  if (!reporte) {
    return res.status(404).json({ error: 'No se encontró el reporte solicitado.' });
  }
  res.json(reporte);
});

module.exports = router;
