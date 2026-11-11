'use strict';

window.SigepAPI = (() => {
  const BASE = '/api/reportes';
  const ERROR_CONEXION = 'No se pudo conectar. Intenta de nuevo.';
  const CATEGORIAS = [
    'Electrónicos', 'Mochilas y bolsos', 'Documentos', 'Llaves',
    'Botellas y termos', 'Ropa', 'Otros'
  ];

  async function solicitar(ruta, opciones = {}) {
    let respuesta;
    try {
      respuesta = await fetch(ruta, {
        ...opciones,
        headers: { Accept: 'application/json', ...opciones.headers },
        signal: AbortSignal.timeout(10000)
      });
    } catch {
      throw new Error(ERROR_CONEXION);
    }

    let datos;
    try {
      datos = await respuesta.json();
    } catch {
      throw new Error('El servidor no devolvió una respuesta válida. Intenta de nuevo.');
    }
    if (!respuesta.ok) {
      const mensaje = typeof datos?.error === 'string' && datos.error.trim()
        ? datos.error
        : 'No se pudo completar la solicitud. Intenta de nuevo.';
      throw new Error(mensaje);
    }
    return datos;
  }

  async function listar(filtros = {}) {
    const parametros = new URLSearchParams();
    for (const campo of ['tipo', 'categoria', 'ubicacion', 'estado']) {
      const valor = String(filtros[campo] ?? '').trim();
      if (valor) parametros.set(campo, valor);
    }
    const consulta = parametros.toString();
    const datos = await solicitar(consulta ? `${BASE}?${consulta}` : BASE);
    if (!Array.isArray(datos)) {
      throw new Error('El servidor no devolvió una lista de reportes válida.');
    }
    return datos;
  }

  function obtener(id) {
    return solicitar(`${BASE}/${encodeURIComponent(id)}`);
  }

  // Devuelve un mensaje de error o una cadena vacía si el reporte es válido.
  // Otros campos obligatorios tienen prioridad; después descripción y ubicación.
  function validarReporte(reporte = {}) {
    const texto = campo => String(reporte[campo] ?? '').trim();
    if (['tipo', 'nombre', 'categoria', 'fecha', 'contacto'].some(campo => !texto(campo))) {
      return 'Por favor completa todos los campos obligatorios.';
    }
    if (!texto('descripcion')) return 'Debes incluir una descripción del objeto.';
    if (!texto('ubicacion')) return 'Debes indicar dónde se perdió o encontró el objeto.';
    if (!['perdido', 'encontrado'].includes(texto('tipo'))) {
      return 'Selecciona un tipo de reporte válido.';
    }
    if (!CATEGORIAS.includes(texto('categoria'))) return 'Selecciona una categoría válida.';
    const fecha = texto('fecha');
    const fechaReal = new Date(`${fecha}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(fechaReal.getTime()) ||
        fechaReal.toISOString().slice(0, 10) !== fecha) {
      return 'Indica una fecha válida.';
    }
    return '';
  }

  async function crear(reporte) {
    const error = validarReporte(reporte);
    if (error) throw new Error(error);
    return solicitar(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reporte)
    });
  }

  function marcarDevuelto(id) {
    return solicitar(`${BASE}/${encodeURIComponent(id)}/devuelto`, { method: 'PATCH' });
  }

  return Object.freeze({ listar, obtener, crear, marcarDevuelto, validarReporte });
})();
