'use strict';

(() => {
  const mensaje = document.getElementById('mensaje-general');
  const error = document.getElementById('error-general');
  const reintentar = document.getElementById('reintentar-conexion');
  const lista = document.getElementById('lista-reportes');

  const parametrosPagina = new URLSearchParams(window.location.search);
  let filtrosAplicados = parametrosPagina.get('estado') === 'devuelto' ? { estado: 'devuelto' } : {};
  let ultimaSolicitud = 0;

  async function cargarReportes() {
    const solicitud = ++ultimaSolicitud;
    const filtros = { ...filtrosAplicados };
    error.textContent = '';
    mensaje.textContent = 'Cargando reportes…';
    lista.setAttribute('aria-busy', 'true');
    reintentar.hidden = true;
    reintentar.disabled = true;
    try {
      const hayFiltros = Object.keys(filtros).length > 0;
      const [reportes, todos] = await Promise.all([
        window.SigepAPI.listar(filtros),
        hayFiltros ? window.SigepAPI.listar() : Promise.resolve(null)
      ]);
      if (solicitud !== ultimaSolicitud) return;
      window.SigepUI.mostrarReportes(reportes, hayFiltros);
      window.SigepUI.mostrarEstadisticas(todos || reportes);
      document.getElementById('titulo-reportes').textContent = filtros.estado === 'devuelto'
        ? 'Elementos recuperados' : hayFiltros ? 'Resultados de búsqueda' : 'Últimos reportes';
      mensaje.textContent = '';
    } catch (problema) {
      if (solicitud !== ultimaSolicitud) return;
      mensaje.textContent = '';
      error.textContent = problema.message;
      reintentar.hidden = false;
    } finally {
      if (solicitud === ultimaSolicitud) {
        lista.setAttribute('aria-busy', 'false');
        reintentar.disabled = false;
      }
    }
  }

  let reporteSeleccionado = null;
  let solicitudDetalle = 0;
  const devolucionesPendientes = new Set();
  const detalle = document.getElementById('detalle-reporte');

  async function abrirDetalle(id) {
    const solicitud = ++solicitudDetalle;
    reporteSeleccionado = null;
    window.SigepUI.prepararDetalle();
    try {
      const reporte = await window.SigepAPI.obtener(id);
      if (solicitud !== solicitudDetalle) return;
      reporteSeleccionado = reporte;
      window.SigepUI.mostrarDetalle(reporte);
      const boton = document.getElementById('marcar-devuelto');
      if (boton) boton.disabled = devolucionesPendientes.has(reporte.id);
    } catch (problema) {
      if (solicitud === solicitudDetalle) window.SigepUI.mostrarErrorDetalle(problema.message);
    } finally {
      if (solicitud === solicitudDetalle) detalle.setAttribute('aria-busy', 'false');
    }
  }

  async function devolverReporte(boton) {
    const reporte = reporteSeleccionado;
    if (!reporte || reporte.estado !== 'activo' || devolucionesPendientes.has(reporte.id)) return;
    const solicitud = solicitudDetalle;
    devolucionesPendientes.add(reporte.id);
    boton.disabled = true;
    boton.textContent = 'Actualizando…';
    document.getElementById('error-detalle').textContent = '';
    try {
      const actualizado = await window.SigepAPI.marcarDevuelto(reporte.id);
      if (solicitud === solicitudDetalle) {
        reporteSeleccionado = actualizado;
        window.SigepUI.mostrarDetalle(actualizado);
      }
      await cargarReportes();
    } catch (problema) {
      if (solicitud === solicitudDetalle) window.SigepUI.mostrarErrorDetalle(problema.message);
    } finally {
      devolucionesPendientes.delete(reporte.id);
      // Puede haberse abierto de nuevo el mismo reporte mientras se actualizaba.
      if (reporteSeleccionado?.id === reporte.id) {
        const actual = document.getElementById('marcar-devuelto');
        if (actual) {
          actual.disabled = false;
          actual.textContent = 'Marcar como devuelto';
        }
      }
    }
  }

  lista.addEventListener('click', evento => {
    const tarjeta = evento.target.closest('.tarjeta');
    if (tarjeta && lista.contains(tarjeta)) abrirDetalle(tarjeta.dataset.id);
  });
  document.getElementById('contenido-detalle').addEventListener('click', evento => {
    const boton = evento.target.closest('#marcar-devuelto');
    if (boton) devolverReporte(boton);
  });

  const formularioFiltros = document.getElementById('formulario-filtros');
  formularioFiltros.addEventListener('submit', evento => {
    evento.preventDefault();
    filtrosAplicados = { ...window.SigepUI.leerFiltros(), ...(filtrosAplicados.estado ? { estado: filtrosAplicados.estado } : {}) };
    cargarReportes();
  });
  formularioFiltros.addEventListener('reset', () => {
    filtrosAplicados = {};
    cargarReportes();
  });
  document.getElementById('aplicar-filtros').disabled = false;
  document.getElementById('nav-recuperados').addEventListener('click', () => {
    filtrosAplicados = { ...window.SigepUI.leerFiltros(), estado: 'devuelto' };
    cargarReportes();
  });
  document.getElementById('ver-todos').addEventListener('click', () => {
    document.querySelector('.nav-link[href="#reportes"]:not(#nav-recuperados)').click();
  });
  document.querySelectorAll('.nav-link').forEach(enlace => {
    enlace.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(item => {
        item.classList.remove('is-active');
        item.removeAttribute('aria-current');
      });
      enlace.classList.add('is-active');
      enlace.setAttribute('aria-current', 'location');
      if (enlace.id !== 'nav-recuperados' && enlace.getAttribute('href') === '#reportes') {
        formularioFiltros.reset();
      }
    });
  });
  document.querySelectorAll('.site-footer a[href^="#"]').forEach(enlace => {
    enlace.addEventListener('click', () => {
      const destino = document.querySelector(enlace.getAttribute('href'));
      if (destino?.tagName === 'DETAILS') destino.open = true;
    });
  });
  reintentar.addEventListener('click', cargarReportes);
  cargarReportes();
  if (parametrosPagina.get('reporte')) abrirDetalle(parametrosPagina.get('reporte'));
})();
