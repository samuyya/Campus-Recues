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

  function mostrarReportes(reportes, hayFiltros = false) {
    const fragmento = document.createDocumentFragment();
    for (const reporte of reportes) fragmento.append(crearTarjeta(reporte));
    lista.replaceChildren(fragmento);
    mensajeListado.textContent = reportes.length === 0
      ? (hayFiltros ? 'No se encontraron objetos con los criterios seleccionados.' : 'No hay reportes registrados todavía.')
      : `${reportes.length} ${reportes.length === 1 ? 'reporte registrado' : 'reportes registrados'}.`;
  }

  function leerFiltros() {
    const formulario = document.getElementById('formulario-filtros');
    const filtros = {};
    for (const campo of ['categoria', 'ubicacion', 'tipo']) {
      const valor = formulario.elements.namedItem(campo).value.trim();
      if (valor) filtros[campo] = valor;
    }
    return filtros;
  }

  function leerReporte() {
    const formulario = document.getElementById('formulario-reporte');
    const reporte = {};
    for (const campo of ['tipo', 'nombre', 'categoria', 'descripcion', 'ubicacion', 'fecha', 'contacto']) {
      reporte[campo] = formulario.elements.namedItem(campo).value.trim();
    }
    reporte.estado = 'activo';
    return reporte;
  }

  function mostrarMensajeFormulario(mensaje = '', esError = false) {
    document.getElementById('error-formulario').textContent = esError ? mensaje : '';
    document.getElementById('mensaje-formulario').textContent = esError ? '' : mensaje;
  }

  function establecerGuardando(guardando) {
    const formulario = document.getElementById('formulario-reporte');
    formulario.setAttribute('aria-busy', String(guardando));
    formulario.querySelector('fieldset').disabled = guardando;
    formulario.querySelector('button[type="reset"]').disabled = guardando;
    const boton = document.getElementById('guardar-reporte');
    boton.disabled = guardando;
    boton.textContent = guardando ? 'Guardando…' : 'Guardar reporte';
  }

  return Object.freeze({ mostrarReportes, leerFiltros, leerReporte, mostrarMensajeFormulario, establecerGuardando });
})();
