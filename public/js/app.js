'use strict';

(() => {
  const mensaje = document.getElementById('mensaje-general');
  const error = document.getElementById('error-general');
  const reintentar = document.getElementById('reintentar-conexion');

  async function comprobarConexion() {
    error.textContent = '';
    mensaje.textContent = 'Conectando con el servidor…';
    reintentar.hidden = true;
    reintentar.disabled = true;
    try {
      await window.SigepAPI.listar();
      mensaje.textContent = 'Conexión lista.';
    } catch (problema) {
      mensaje.textContent = '';
      error.textContent = problema.message;
      reintentar.hidden = false;
    } finally {
      reintentar.disabled = false;
    }
  }

  reintentar.addEventListener('click', comprobarConexion);
  comprobarConexion();
})();
