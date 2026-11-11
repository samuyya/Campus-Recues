'use strict';

(() => {
  const id = new URLSearchParams(window.location.search).get('id');
  const detalle = document.getElementById('detalle-reporte');
  const reintentar = document.getElementById('reintentar-detalle');
  let reporteActual = null;
  let guardando = false;

  async function cargarDetalle() {
    window.SigepUI.prepararDetalle();
    reintentar.hidden = true;
    detalle.setAttribute('aria-busy', 'true');
    try {
      if (!id || !/^\d+$/.test(id)) throw new Error('Selecciona un reporte desde la página Buscar.');
      reporteActual = await window.SigepAPI.obtener(id);
      window.SigepUI.mostrarDetalle(reporteActual, false);
    } catch (problema) {
      window.SigepUI.mostrarErrorDetalle(problema.message);
      reintentar.hidden = !id || !/^\d+$/.test(id);
    } finally {
      detalle.setAttribute('aria-busy', 'false');
    }
  }

  document.getElementById('contenido-detalle').addEventListener('click', async evento => {
    const boton = evento.target.closest('#marcar-devuelto');
    if (!boton || guardando || reporteActual?.estado !== 'activo') return;
    guardando = true;
    boton.disabled = true;
    boton.textContent = 'Actualizando…';
    document.getElementById('error-detalle').textContent = '';
    try {
      reporteActual = await window.SigepAPI.marcarDevuelto(id);
      window.SigepUI.mostrarDetalle(reporteActual);
      document.getElementById('mensaje-devolucion').textContent = 'El elemento se marcó como devuelto correctamente.';
    } catch (problema) {
      window.SigepUI.mostrarErrorDetalle(problema.message);
      boton.disabled = false;
      boton.textContent = 'Marcar como devuelto';
    } finally {
      guardando = false;
    }
  });
  reintentar.addEventListener('click', cargarDetalle);
  cargarDetalle();
})();
