'use strict';

(() => {
  const panel = document.getElementById('panel-reclamacion');
  const formulario = document.getElementById('formulario-reclamacion');
  const campos = document.getElementById('campos-reclamacion');
  const enviar = document.getElementById('enviar-reclamacion');
  const cancelar = document.getElementById('cancelar-reclamacion');
  const error = document.getElementById('error-reclamacion');
  const mensaje = document.getElementById('mensaje-reclamacion');
  const id = new URLSearchParams(window.location.search).get('id');
  let enviando = false;

  function cerrar() {
    if (enviando) return;
    panel.hidden = true;
    document.getElementById('reclamar-objeto')?.focus();
  }

  document.getElementById('contenido-detalle').addEventListener('click', evento => {
    if (evento.target.closest('#marcar-devuelto')) {
      if (!enviando) panel.hidden = true;
      return;
    }
    if (!evento.target.closest('#reclamar-objeto') || enviando) return;
    panel.hidden = false;
    campos.hidden = false;
    enviar.hidden = false;
    error.textContent = '';
    mensaje.textContent = '';
    cancelar.textContent = 'Cancelar';
    document.getElementById('reclamante-nombre').focus();
  });
  cancelar.addEventListener('click', cerrar);
  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (enviando) return;
    error.textContent = '';
    mensaje.textContent = '';
    const entrada = {};
    for (const campo of ['nombre', 'tipo_documento', 'documento', 'telefono', 'correo']) {
      entrada[campo] = formulario.elements.namedItem(campo).value;
    }
    const resultado = window.SigepReclamacion.validarReclamacion(entrada);
    if (resultado.error) {
      error.textContent = resultado.error;
      error.focus();
      return;
    }
    enviando = true;
    campos.disabled = true;
    enviar.disabled = true;
    cancelar.disabled = true;
    enviar.textContent = 'Enviando…';
    formulario.setAttribute('aria-busy', 'true');
    const devolver = document.getElementById('marcar-devuelto');
    if (devolver) devolver.disabled = true;
    try {
      const comprobante = await window.SigepAPI.reclamar(id, resultado.datos);
      formulario.reset();
      campos.hidden = true;
      enviar.hidden = true;
      cancelar.textContent = 'Cerrar';
      mensaje.textContent = `Solicitud #${comprobante.id} registrada. Queda pendiente de verificar la propiedad y coordinar la entrega.`;
    } catch (problema) {
      error.textContent = problema.message;
      error.focus();
    } finally {
      enviando = false;
      campos.disabled = false;
      enviar.disabled = false;
      cancelar.disabled = false;
      enviar.textContent = 'Enviar solicitud';
      formulario.setAttribute('aria-busy', 'false');
      if (devolver?.isConnected) devolver.disabled = false;
    }
  });
})();
