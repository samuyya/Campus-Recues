'use strict';

(() => {
  const mensaje = document.getElementById('mensaje-general');
  const error = document.getElementById('error-general');
  const reintentar = document.getElementById('reintentar-conexion');
  const lista = document.getElementById('lista-reportes');

  async function cargarInicio() {
    mensaje.textContent = 'Cargando reportes…';
    error.textContent = '';
    reintentar.hidden = true;
    lista.setAttribute('aria-busy', 'true');
    try {
      const reportes = await window.SigepAPI.listar();
      window.SigepUI.mostrarReportes(reportes.slice(0, 3));
      window.SigepUI.mostrarEstadisticas(reportes);
      mensaje.textContent = '';
    } catch (problema) {
      mensaje.textContent = '';
      error.textContent = problema.message;
      reintentar.hidden = false;
    } finally {
      lista.setAttribute('aria-busy', 'false');
    }
  }

  // Mantiene válidos los enlaces a reportes creados antes de separar las páginas.
  const anteriores = new URLSearchParams(window.location.search);
  if (anteriores.get('reporte')) {
    window.location.replace(`detalle.html?id=${encodeURIComponent(anteriores.get('reporte'))}`);
    return;
  }
  if (anteriores.get('estado') === 'devuelto') {
    window.location.replace('recuperados.html');
    return;
  }
  reintentar.addEventListener('click', cargarInicio);
  cargarInicio();
})();
