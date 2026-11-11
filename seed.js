// Carga reportes ficticios para la demo: npm run seed
// Solo inserta si la tabla esta vacia, para no duplicar ni mezclar con datos reales.
const db = require('./db');

const EJEMPLOS = [
  {
    tipo: 'encontrado',
    nombre: 'Mochila azul',
    categoria: 'Mochilas y bolsos',
    descripcion: 'Mochila azul marino con un llavero de estrella y un cuaderno adentro.',
    ubicacion: 'Biblioteca, segundo piso',
    fecha: '2026-11-05',
    contacto: 'LunaVerde',
  },
  {
    tipo: 'perdido',
    nombre: 'Audífonos inalámbricos',
    categoria: 'Electrónicos',
    descripcion: 'Estuche negro de audífonos con una calcomanía de gato en la tapa.',
    ubicacion: 'Cafetería central',
    fecha: '2026-11-06',
    contacto: 'GatoNocturno',
  },
  {
    tipo: 'encontrado',
    nombre: 'Llaves con llavero rojo',
    categoria: 'Llaves',
    descripcion: 'Tres llaves en un aro con un llavero rojo en forma de corazón.',
    ubicacion: 'Edificio de ingeniería, entrada',
    fecha: '2026-11-07',
    contacto: 'PuenteAzul',
  },
  {
    tipo: 'perdido',
    nombre: 'Termo verde',
    categoria: 'Botellas y termos',
    descripcion: 'Termo verde oscuro de acero, con una abolladura en la base.',
    ubicacion: 'Cancha de baloncesto',
    fecha: '2026-11-03',
    contacto: 'RayoVeloz',
  },
  {
    tipo: 'encontrado',
    nombre: 'Chaqueta gris',
    categoria: 'Ropa',
    descripcion: 'Chaqueta gris talla M con capucha, encontrada en una silla del salón.',
    ubicacion: 'Salón 204, bloque B',
    fecha: '2026-11-02',
    contacto: 'NubeClara',
    devuelto: true,
  },
];

function cargarEjemplos() {
  if (db.listar().length > 0) {
    console.log('La base de datos ya tiene reportes; no se agregó nada.');
    return;
  }
  for (const { devuelto, ...reporte } of EJEMPLOS) {
    const guardado = db.insertar(reporte);
    if (devuelto) db.marcarDevuelto(guardado.id);
  }
  console.log(`Listo: se cargaron ${EJEMPLOS.length} reportes de ejemplo.`);
}

cargarEjemplos();
