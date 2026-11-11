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

  reintentar.addEventListener('click', cargarReportes);
  cargarReportes();
})();
