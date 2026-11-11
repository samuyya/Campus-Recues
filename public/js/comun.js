'use strict';

(() => {
  function abrirSeccion() {
    if (!window.location.hash) return;
    const destino = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (destino?.tagName === 'DETAILS') destino.open = true;
  }
  window.addEventListener('hashchange', abrirSeccion);
  abrirSeccion();
})();
