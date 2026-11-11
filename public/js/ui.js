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

    tarjeta.append(
      crearTexto('h3', reporte.nombre),
      crearTexto('p', reporte.tipo === 'encontrado' ? 'Encontrado' : 'Perdido', 'tipo-reporte'),
      crearTexto('p', estado === 'devuelto' ? 'Devuelto' : 'Activo', 'estado-reporte'),
      crearTexto('p', `Categoría: ${reporte.categoria}`),
      crearTexto('p', `Ubicación: ${reporte.ubicacion}`)
    );

    const fecha = crearTexto('p', 'Fecha: ');
    const tiempo = crearTexto('time', reporte.fecha);
    tiempo.dateTime = reporte.fecha;
    fecha.append(tiempo);
    tarjeta.append(fecha);
    return tarjeta;
  }

  function mostrarReportes(reportes) {
    const fragmento = document.createDocumentFragment();
    for (const reporte of reportes) fragmento.append(crearTarjeta(reporte));
    lista.replaceChildren(fragmento);
    mensajeListado.textContent = reportes.length === 0
      ? 'No hay reportes registrados todavía.'
      : `${reportes.length} ${reportes.length === 1 ? 'reporte registrado' : 'reportes registrados'}.`;
  }

  return Object.freeze({ mostrarReportes });
})();
