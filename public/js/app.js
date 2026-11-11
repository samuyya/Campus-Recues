'use strict';

(() => {
  const mensaje = document.getElementById('mensaje-general');
  const error = document.getElementById('error-general');
  const reintentar = document.getElementById('reintentar-conexion');
  const lista = document.getElementById('lista-reportes');

  let filtrosAplicados = {};
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

  const formulario = document.getElementById('formulario-reporte');
  let guardando = false;

  async function guardarReporte(evento) {
    evento.preventDefault();
    if (guardando) return;
    const reporte = window.SigepUI.leerReporte();
    const errorValidacion = window.SigepAPI.validarReporte(reporte);
    if (errorValidacion) {
      window.SigepUI.mostrarMensajeFormulario(errorValidacion, true);
      return;
    }

    guardando = true;
    window.SigepUI.establecerGuardando(true);
    window.SigepUI.mostrarMensajeFormulario('Guardando reporte…');
    try {
      await window.SigepAPI.crear(reporte);
      formulario.reset();
      window.SigepUI.mostrarMensajeFormulario('Reporte guardado correctamente.');
      await cargarReportes();
    } catch (problema) {
      window.SigepUI.mostrarMensajeFormulario(problema.message, true);
    } finally {
      guardando = false;
      window.SigepUI.establecerGuardando(false);
    }
  }

  // La validación propia permite mostrar los mensajes acordados en español.
  formulario.noValidate = true;
  formulario.addEventListener('submit', guardarReporte);
  formulario.addEventListener('reset', () => window.SigepUI.mostrarMensajeFormulario());
  window.SigepUI.establecerGuardando(false);
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
  document.querySelectorAll('[data-reportar]').forEach(enlace => {
    enlace.addEventListener('click', () => {
      if (guardando) return;
      formulario.elements.namedItem('tipo').value = enlace.dataset.reportar;
      formulario.elements.namedItem('nombre').focus({ preventScroll: true });
    });
  });
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
  const logo = document.getElementById('logo-itm');
  logo.addEventListener('load', () => {
    logo.hidden = false;
    document.getElementById('logo-alternativo').hidden = true;
  });
  logo.addEventListener('error', () => { logo.hidden = true; });
  logo.src = 'assets/logo-itm.png';
  reintentar.addEventListener('click', cargarReportes);
  cargarReportes();
})();
