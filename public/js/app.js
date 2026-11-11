'use strict';

(() => {
  const mensaje = document.getElementById('mensaje-general');
  const error = document.getElementById('error-general');
  const reintentar = document.getElementById('reintentar-conexion');
  const lista = document.getElementById('lista-reportes');

  async function cargarReportes() {
    error.textContent = '';
    mensaje.textContent = 'Cargando reportes…';
    lista.setAttribute('aria-busy', 'true');
    reintentar.hidden = true;
    reintentar.disabled = true;
    try {
      const reportes = await window.SigepAPI.listar();
      window.SigepUI.mostrarReportes(reportes);
      mensaje.textContent = '';
    } catch (problema) {
      mensaje.textContent = '';
      error.textContent = problema.message;
      reintentar.hidden = false;
    } finally {
      lista.setAttribute('aria-busy', 'false');
      reintentar.disabled = false;
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
  reintentar.addEventListener('click', cargarReportes);
  cargarReportes();
})();
