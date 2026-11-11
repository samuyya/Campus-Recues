'use strict';

(() => {
  const formulario = document.getElementById('formulario-busqueda');
  const recuperados = document.getElementById('contenido').dataset.recuperados === 'true';
  const lista = document.getElementById('lista-reportes');
  const mensaje = document.getElementById('mensaje-listado');
  const error = document.getElementById('error-general');
  const reintentar = document.getElementById('reintentar-conexion');
  const orden = document.getElementById('orden');
  const paginacion = document.getElementById('paginacion');
  const TAMANO_PAGINA = 6;
  let resultados = [];
  let pagina = 1;
  let solicitudActual = 0;
  let filtrosAplicados = {};

  function leerFiltros() {
    const filtros = {};
    for (const campo of ['q', 'categoria', 'ubicacion', 'tipo', 'estado']) {
      const valor = formulario.elements.namedItem(campo).value.trim();
      if (valor) filtros[campo] = valor;
    }
    if (recuperados) filtros.estado = 'devuelto';
    return filtros;
  }

  function normalizar(texto) {
    return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  }

  function guardarURL() {
    const parametros = new URLSearchParams(filtrosAplicados);
    if (recuperados) parametros.delete('estado');
    if (orden.value !== 'recientes') parametros.set('orden', orden.value);
    if (pagina > 1) parametros.set('pagina', pagina);
    const consulta = parametros.toString();
    window.history.replaceState(null, '', window.location.pathname + (consulta ? `?${consulta}` : ''));
  }

  function crearBotonPagina(texto, destino, deshabilitado = false, actual = false) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = texto;
    boton.disabled = deshabilitado;
    if (actual) boton.setAttribute('aria-current', 'page');
    boton.addEventListener('click', () => {
      pagina = destino;
      pintarResultados();
      document.getElementById('mensaje-listado').scrollIntoView({ block: 'start' });
    });
    return boton;
  }

  function pintarResultados() {
    const ordenados = [...resultados].sort((a, b) => {
      if (orden.value === 'nombre') return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
      const comparacion = String(b.fecha).localeCompare(String(a.fecha)) || b.id - a.id;
      return orden.value === 'antiguos' ? -comparacion : comparacion;
    });
    const paginas = Math.max(1, Math.ceil(ordenados.length / TAMANO_PAGINA));
    pagina = Math.min(Math.max(1, pagina), paginas);
    const inicio = (pagina - 1) * TAMANO_PAGINA;
    const hayFiltros = Object.keys(filtrosAplicados).some(campo => !recuperados || campo !== 'estado');
    window.SigepUI.mostrarReportes(ordenados.slice(inicio, inicio + TAMANO_PAGINA), hayFiltros);
    if (ordenados.length) {
      mensaje.textContent = `Se ${ordenados.length === 1 ? 'encontró 1 resultado' : `encontraron ${ordenados.length} resultados`} · Mostrando ${inicio + 1}–${Math.min(inicio + TAMANO_PAGINA, ordenados.length)}`;
    } else if (recuperados && !hayFiltros) {
      mensaje.textContent = 'Todavía no hay elementos recuperados.';
    }
    const fragmento = document.createDocumentFragment();
    if (paginas > 1) {
      fragmento.append(crearBotonPagina('Anterior', pagina - 1, pagina === 1));
      // Limita los botones para que la navegación siga siendo útil con muchas páginas.
      for (let numero = Math.max(1, pagina - 2); numero <= Math.min(paginas, pagina + 2); numero++) {
        fragmento.append(crearBotonPagina(String(numero), numero, false, numero === pagina));
      }
      fragmento.append(crearBotonPagina('Siguiente', pagina + 1, pagina === paginas));
    }
    paginacion.replaceChildren(fragmento);
    guardarURL();
  }

  async function cargarReportes() {
    const solicitud = ++solicitudActual;
    const filtros = { ...filtrosAplicados };
    error.textContent = '';
    mensaje.textContent = 'Cargando reportes…';
    lista.setAttribute('aria-busy', 'true');
    paginacion.replaceChildren();
    reintentar.hidden = true;
    try {
      const reportes = await window.SigepAPI.listar(filtros);
      if (solicitud !== solicitudActual) return;
      const palabras = normalizar(filtros.q).split(/\s+/).filter(Boolean);
      resultados = reportes.filter(reporte => {
        const texto = normalizar(`${reporte.nombre} ${reporte.descripcion} ${reporte.categoria} ${reporte.ubicacion}`);
        return palabras.every(palabra => texto.includes(palabra));
      });
      pintarResultados();
    } catch (problema) {
      if (solicitud !== solicitudActual) return;
      lista.replaceChildren();
      mensaje.textContent = '';
      error.textContent = problema.message;
      reintentar.hidden = false;
    } finally {
      if (solicitud === solicitudActual) lista.setAttribute('aria-busy', 'false');
    }
  }

  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    filtrosAplicados = leerFiltros();
    pagina = 1;
    cargarReportes();
  });
  formulario.addEventListener('change', evento => {
    if (evento.target.name === 'q') return;
    filtrosAplicados = leerFiltros();
    pagina = 1;
    cargarReportes();
  });
  formulario.addEventListener('reset', () => {
    queueMicrotask(() => {
      filtrosAplicados = recuperados ? { estado: 'devuelto' } : {};
      orden.value = 'recientes';
      pagina = 1;
      cargarReportes();
    });
  });
  orden.addEventListener('change', () => { pagina = 1; pintarResultados(); });
  reintentar.addEventListener('click', cargarReportes);
  const parametros = new URLSearchParams(window.location.search);
  for (const campo of ['q', 'categoria', 'ubicacion', 'tipo', 'estado']) {
    if (parametros.has(campo) && !(recuperados && campo === 'estado')) {
      formulario.elements.namedItem(campo).value = parametros.get(campo);
    }
  }
  if (['recientes', 'antiguos', 'nombre'].includes(parametros.get('orden'))) orden.value = parametros.get('orden');
  const paginaInicial = Number(parametros.get('pagina'));
  if (Number.isSafeInteger(paginaInicial) && paginaInicial > 0) pagina = paginaInicial;
  filtrosAplicados = leerFiltros();
  cargarReportes();
})();
