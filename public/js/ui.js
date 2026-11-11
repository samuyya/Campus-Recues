'use strict';

window.SigepUI = (() => {
  const lista = document.getElementById('lista-reportes');
  const mensajeListado = document.getElementById('mensaje-listado');

  function crearTexto(etiqueta, texto, clase) {
    const elemento = document.createElement(etiqueta);
    elemento.textContent = texto;
    if (clase) elemento.className = clase;
    return elemento;
  }

  function crearTarjeta(reporte) {
    const tarjeta = document.createElement('article');
    const estado = reporte.estado === 'devuelto' ? 'devuelto' : 'activo';
    tarjeta.classList.add('tarjeta', estado);
    tarjeta.dataset.id = reporte.id;

    const media = document.createElement('div');
    media.className = 'report-media';
    if (typeof reporte.foto === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(reporte.foto)) {
      const foto = document.createElement('img');
      foto.src = reporte.foto;
      foto.alt = `Foto de ${reporte.nombre}`;
      foto.loading = 'lazy';
      media.append(foto);
    } else {
      const simbolos = { 'Electrónicos': '▱', 'Mochilas y bolsos': '▣', 'Documentos': '▤', 'Llaves': '⚿', 'Botellas y termos': '♜', 'Ropa': '♧', 'Otros': '◇' };
      const simbolo = crearTexto('span', simbolos[reporte.categoria] || '◇');
      simbolo.setAttribute('aria-hidden', 'true');
      media.append(simbolo);
    }
    tarjeta.append(media);
    tarjeta.append(
      crearTexto('h3', reporte.nombre),
      crearTexto('p', reporte.tipo === 'encontrado' ? 'Encontrado' : 'Perdido', 'tipo-reporte ' + (reporte.tipo === 'encontrado' ? 'encontrado' : 'perdido')),
      crearTexto('p', estado === 'devuelto' ? 'Devuelto' : 'Activo', 'estado-reporte'),
      crearTexto('p', `Categoría: ${reporte.categoria}`),
      crearTexto('p', `Ubicación: ${reporte.ubicacion}`)
    );

    const fecha = crearTexto('p', 'Fecha: ');
    const tiempo = crearTexto('time', reporte.fecha);
    tiempo.dateTime = reporte.fecha;
    fecha.append(tiempo);

    tarjeta.append(fecha);
    const verDetalle = crearTexto('a', 'Ver detalle →', 'card-detail-link');
    verDetalle.href = `detalle.html?id=${encodeURIComponent(reporte.id)}`;
    verDetalle.setAttribute('aria-label', `Ver detalle de ${reporte.nombre}`);

    tarjeta.append(verDetalle);
    return tarjeta;
  }

  function mostrarReportes(reportes, hayFiltros = false) {
    const fragmento = document.createDocumentFragment();
    for (const reporte of reportes) fragmento.append(crearTarjeta(reporte));
    lista.replaceChildren(fragmento);
    mensajeListado.textContent = reportes.length === 0
      ? (hayFiltros ? 'No se encontraron objetos con los criterios seleccionados.' : 'No hay reportes registrados todavía.')
      : `${reportes.length} ${reportes.length === 1 ? 'reporte registrado' : 'reportes registrados'}.`;
  }

  function mostrarEstadisticas(reportes) {
    document.getElementById('total-activos').textContent = reportes.filter(r => r.estado === 'activo').length;
    document.getElementById('total-encontrados').textContent = reportes.filter(r => r.tipo === 'encontrado').length;
    document.getElementById('total-recuperados').textContent = reportes.filter(r => r.estado === 'devuelto').length;
  }

  function prepararDetalle() {
    document.getElementById('contenido-detalle').replaceChildren();
    document.getElementById('ayuda-detalle').textContent = 'Cargando detalle…';
    document.getElementById('error-detalle').textContent = '';
    document.getElementById('detalle-reporte').setAttribute('aria-busy', 'true');
  }

  function mostrarDetalle(reporte, enfocar = true) {
    const contenido = document.getElementById('contenido-detalle');
    const datos = document.createElement('dl');
    const campos = [
      ['Tipo', reporte.tipo === 'encontrado' ? 'Encontrado' : 'Perdido'],
      ['Nombre', reporte.nombre], ['Categoría', reporte.categoria],
      ['Descripción', reporte.descripcion], ['Ubicación', reporte.ubicacion],
      ['Fecha', reporte.fecha], ['Alias de contacto', reporte.contacto],
      ['Estado', reporte.estado === 'devuelto' ? 'Devuelto' : 'Activo']
    ];
    for (const [etiqueta, valor] of campos) {
      datos.append(crearTexto('dt', etiqueta), crearTexto('dd', valor));
    }
    contenido.replaceChildren(datos);
    if (typeof reporte.foto === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(reporte.foto)) {
      const foto = document.createElement('img');
      foto.src = reporte.foto;
      foto.alt = 'Foto de ' + reporte.nombre;
      contenido.prepend(foto);
    }
    if (reporte.estado === 'activo') {
      const boton = crearTexto('button', 'Marcar como devuelto');
      boton.type = 'button';
      boton.id = 'marcar-devuelto';
      contenido.append(boton);
    }
    if (reporte.tipo === 'encontrado' && reporte.estado === 'activo') {
      const reclamar = crearTexto('button', 'Este objeto es mío', 'claim-open-button');
      reclamar.type = 'button';
      reclamar.id = 'reclamar-objeto';
      contenido.append(reclamar);
    }
    document.getElementById('ayuda-detalle').textContent = '';
    document.getElementById('error-detalle').textContent = '';
    const titulo = document.getElementById('titulo-detalle');
    titulo.textContent = `Detalle: ${reporte.nombre}`;
    titulo.tabIndex = -1;
    if (enfocar) titulo.focus();
  }

  function mostrarErrorDetalle(mensaje) {
    document.getElementById('ayuda-detalle').textContent = '';
    document.getElementById('error-detalle').textContent = mensaje;
  }

  return Object.freeze({ mostrarReportes, mostrarEstadisticas, prepararDetalle, mostrarDetalle, mostrarErrorDetalle });
})();
