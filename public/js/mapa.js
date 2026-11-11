'use strict';

window.SigepMapa = (() => {
  // Direcciones publicadas por ITM: https://www.itm.edu.co/sedes/
  // Centros de campus verificados con Nominatim/OpenStreetMap; no son puntos de objetos.
  const SEDES = Object.freeze({
    Castilla: { direccion: 'Carrera 65 No. 98A–75, Medellín', lat: 6.2939231, lon: -75.5692940, osm: 346654419 },
    Fraternidad: { direccion: 'Calle 54A No. 30–01, Medellín', lat: 6.2451243, lon: -75.5499752, osm: 377766797 },
    Robledo: { direccion: 'Calle 73 No. 76A–354, Medellín', lat: 6.2746337, lon: -75.5887750, osm: 269921174 }
  });

  function normalizar(texto) {
    return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function separarUbicacion(ubicacion) {
    const texto = String(ubicacion || '').trim();
    // Solo reconoce un prefijo de sede; no asigna una sede a reportes antiguos ambiguos.
    const coincidencia = texto.match(/^(?:sede|campus)\s+(Castilla|Fraternidad|Robledo)(?:\s*[·|–—-]\s*|$)/i);
    if (!coincidencia) return { sede: '', lugar: texto };
    const sede = Object.keys(SEDES).find(nombre => normalizar(nombre) === normalizar(coincidencia[1]));
    return { sede, lugar: texto.slice(coincidencia[0].length).trim() };
  }

  function completarUbicacion(sede, lugar) {
    return Object.hasOwn(SEDES, sede) ? `Sede ${sede} · ${String(lugar).trim()}` : String(lugar).trim();
  }

  function actualizar(contenedor, sede, lugar = '') {
    if (!contenedor) return;
    const datos = Object.hasOwn(SEDES, sede) ? SEDES[sede] : null;
    const iframe = contenedor.querySelector('[data-mapa-frame]');
    const enlace = contenedor.querySelector('[data-mapa-enlace]');
    iframe.hidden = !datos;
    enlace.hidden = !datos;
    contenedor.querySelector('[data-mapa-vacio]').hidden = Boolean(datos);
    contenedor.querySelector('[data-mapa-direccion]').textContent = datos
      ? `Sede ${sede} · ${datos.direccion}` : 'Selecciona una sede para ver su ubicación.';
    contenedor.querySelector('[data-mapa-seleccion]').textContent = datos
      ? (lugar.trim() ? `Lugar seleccionado: Sede ${sede} · ${lugar.trim()}` : `Sede ${sede} seleccionada. Indica el lugar dentro del campus.`)
      : (lugar.trim() ? (contenedor.dataset.mapaSede ? `Lugar: ${lugar.trim()}. Selecciona la sede para ubicarlo en el mapa.` : `Lugar registrado: ${lugar.trim()}. Este reporte no indica una sede.`) : 'Sin ubicación seleccionada.');
    if (!datos) {
      contenedor.querySelector('[data-mapa-carga]').hidden = true;
      iframe.onload = null;
      iframe.removeAttribute('src');
      enlace.removeAttribute('href');
      return;
    }
    const limites = [datos.lon - 0.003, datos.lat - 0.002, datos.lon + 0.003, datos.lat + 0.002];
    const consulta = new URLSearchParams({ bbox: limites.join(','), layer: 'mapnik', marker: `${datos.lat},${datos.lon}` });
    const fuente = `https://www.openstreetmap.org/export/embed.html?${consulta}`;
    if (iframe.getAttribute('src') !== fuente) {
      const carga = contenedor.querySelector('[data-mapa-carga]');
      carga.hidden = false;
      iframe.onload = () => { carga.hidden = true; };
      iframe.src = fuente;
    }
    iframe.title = `Mapa de referencia de la sede ${sede} del ITM`;
    enlace.href = `https://www.openstreetmap.org/way/${datos.osm}#map=17/${datos.lat}/${datos.lon}`;
  }

  for (const contenedor of document.querySelectorAll('[data-minimapa]')) {
    const sede = document.getElementById(contenedor.dataset.mapaSede);
    const lugar = document.getElementById(contenedor.dataset.mapaLugar);
    if (!sede || !lugar) continue;
    const refrescar = () => actualizar(contenedor, sede.value, lugar.value);
    sede.addEventListener('change', refrescar);
    lugar.addEventListener('input', refrescar);
    lugar.addEventListener('change', refrescar);
    sede.form?.addEventListener('reset', () => queueMicrotask(refrescar));
    refrescar();
  }

  return Object.freeze({ separarUbicacion, completarUbicacion, actualizar });
})();
