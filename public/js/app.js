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
      const reportes = await window.SigepAPI.listar(filtros);
      if (solicitud !== ultimaSolicitud) return;
      window.SigepUI.mostrarReportes(reportes, Object.keys(filtros).length > 0);
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
    filtrosAplicados = window.SigepUI.leerFiltros();
    cargarReportes();
  });
  formularioFiltros.addEventListener('reset', () => {
    filtrosAplicados = {};
    cargarReportes();
  });
  document.getElementById('aplicar-filtros').disabled = false;
  reintentar.addEventListener('click', cargarReportes);
  cargarReportes();
})();
