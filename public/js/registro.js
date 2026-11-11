'use strict';

(() => {
  const formulario = document.getElementById('formulario-registro');
  const campos = document.getElementById('campos-registro');
  const boton = document.getElementById('registrar-reporte');
  const error = document.getElementById('error-registro');
  const mensaje = document.getElementById('mensaje-registro');
  const enlaceCreado = document.getElementById('ver-reporte-creado');
  const archivo = document.getElementById('foto');
  const quitarFoto = document.getElementById('quitar-foto');
  const errorFoto = document.getElementById('error-foto');
  const tipoInicial = document.body.dataset.tipo;
  let foto = '';
  let guardando = false;
  let procesandoFoto = false;
  let versionFoto = 0;

  function prepararFormulario() {
    formulario.elements.namedItem('tipo').value = tipoInicial;
    const hoy = new Date();
    formulario.elements.namedItem('fecha').value = [hoy.getFullYear(),
      String(hoy.getMonth() + 1).padStart(2, '0'), String(hoy.getDate()).padStart(2, '0')].join('-');
  }

  function leerReporte() {
    const reporte = {};
    for (const campo of ['tipo', 'nombre', 'categoria', 'descripcion', 'ubicacion', 'fecha', 'contacto']) {
      reporte[campo] = formulario.elements.namedItem(campo).value.trim();
    }
    reporte.foto = foto;
    return reporte;
  }

  function actualizarPrevia() {
    const reporte = leerReporte();
    const alternativas = { nombre: 'Nombre del objeto', categoria: 'Sin seleccionar',
      descripcion: 'La descripción aparecerá aquí.', ubicacion: 'Sin indicar', fecha: 'Sin indicar', contacto: 'Tu alias' };
    for (const [campo, alternativa] of Object.entries(alternativas)) {
      let valor = reporte[campo] || alternativa;
      if (campo === 'fecha' && reporte.fecha) valor = reporte.fecha.split('-').reverse().join('/');
      document.getElementById(`previa-${campo}`).textContent = valor;
    }
    const tipo = document.getElementById('previa-tipo');
    tipo.textContent = reporte.tipo === 'encontrado' ? 'Encontrado' : 'Perdido';
    tipo.className = `preview-badge ${reporte.tipo}`;
    document.getElementById('contador-descripcion').textContent = `${formulario.elements.namedItem('descripcion').value.length}/1000`;
    const imagen = document.getElementById('foto-previa');
    imagen.hidden = !foto;
    if (foto) imagen.src = foto;
    else imagen.removeAttribute('src');
    document.getElementById('simbolo-previa').hidden = Boolean(foto);
  }

  function limpiarFoto() {
    versionFoto++;
    foto = '';
    archivo.value = '';
    procesandoFoto = false;
    errorFoto.textContent = '';
    quitarFoto.hidden = true;
    boton.disabled = guardando;
    actualizarPrevia();
  }

  function leerArchivo(imagen) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result);
      lector.onerror = () => reject(new Error('No se pudo leer la fotografía. Selecciona otra imagen.'));
      lector.readAsDataURL(imagen);
    });
  }

  async function reducirFoto(imagen) {
    const fuente = await leerArchivo(imagen);
    const original = new Image();
    original.src = fuente;
    try { await original.decode(); }
    catch { throw new Error('No se pudo abrir la fotografía. Selecciona una imagen válida.'); }
    const escala = Math.min(1, 800 / Math.max(original.naturalWidth, original.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(original.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(original.naturalHeight * escala));
    const contexto = canvas.getContext('2d');
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.drawImage(original, 0, 0, canvas.width, canvas.height);
    const resultado = canvas.toDataURL('image/jpeg', 0.8);
    if (resultado.length > 1500000) throw new Error('La fotografía es demasiado pesada. Selecciona una más pequeña.');
    return resultado;
  }

  async function seleccionarFoto(imagen) {
    limpiarFoto();
    if (!imagen) return;
    const version = versionFoto;
    quitarFoto.hidden = false;
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(imagen.type)) {
        throw new Error('Selecciona una fotografía en formato JPG, PNG o WEBP.');
      }
      if (imagen.size > 3 * 1024 * 1024) throw new Error('La fotografía supera los 3 MB. Selecciona una más pequeña.');
      procesandoFoto = true;
      boton.disabled = true;
      const resultado = await reducirFoto(imagen);
      if (version !== versionFoto) return;
      foto = resultado;
      actualizarPrevia();
    } catch (problema) {
      if (version === versionFoto) errorFoto.textContent = problema.message;
    } finally {
      if (version === versionFoto) {
        procesandoFoto = false;
        boton.disabled = guardando;
      }
    }
  }

  async function registrar(evento) {
    evento.preventDefault();
    if (guardando || procesandoFoto) return;
    error.textContent = '';
    mensaje.textContent = '';
    enlaceCreado.hidden = true;
    const reporte = leerReporte();
    const validacion = window.SigepAPI.validarReporte(reporte) || errorFoto.textContent;
    if (validacion) {
      error.textContent = validacion;
      error.focus();
      return;
    }
    guardando = true;
    campos.disabled = true;
    boton.disabled = true;
    boton.textContent = 'Registrando…';
    formulario.setAttribute('aria-busy', 'true');
    try {
      const creado = await window.SigepAPI.crear(reporte);
      formulario.reset();
      prepararFormulario();
      limpiarFoto();
      mensaje.textContent = 'Reporte guardado correctamente.';
      enlaceCreado.href = `index.html?reporte=${encodeURIComponent(creado.id)}#detalle-reporte`;
      enlaceCreado.hidden = false;
    } catch (problema) {
      error.textContent = problema.message;
      error.focus();
    } finally {
      guardando = false;
      campos.disabled = false;
      boton.disabled = false;
      boton.textContent = 'Registrar reporte';
      formulario.setAttribute('aria-busy', 'false');
    }
  }

  formulario.addEventListener('input', actualizarPrevia);
  formulario.addEventListener('change', actualizarPrevia);
  formulario.addEventListener('submit', registrar);
  archivo.addEventListener('change', () => seleccionarFoto(archivo.files[0]));
  quitarFoto.addEventListener('click', limpiarFoto);
  const zonaFoto = document.getElementById('zona-foto');
  zonaFoto.addEventListener('dragover', evento => { evento.preventDefault(); });
  zonaFoto.addEventListener('drop', evento => {
    evento.preventDefault();
    if (!guardando) seleccionarFoto(evento.dataTransfer.files[0]);
  });
  prepararFormulario();
  actualizarPrevia();
})();
