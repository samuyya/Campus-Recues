'use strict';

// Mismas reglas para la validación en el navegador y el servidor.
(function (raiz) {
  function validarReclamacion(entrada) {
    const cuerpo = entrada && typeof entrada === 'object' ? entrada : {};
    const datos = {};
    for (const campo of ['nombre', 'tipo_documento', 'documento', 'telefono', 'correo']) {
      datos[campo] = typeof cuerpo[campo] === 'string' ? cuerpo[campo].trim() : '';
    }
    if (datos.nombre.length < 2 || datos.nombre.length > 100) return { error: 'Indica tu nombre completo (entre 2 y 100 caracteres).' };
    if (!['cedula', 'tarjeta_identidad', 'carne', 'otro'].includes(datos.tipo_documento)) return { error: 'Selecciona un tipo de identificación.' };
    if (!/^[A-Za-z0-9 .-]{3,30}$/.test(datos.documento)) return { error: 'Indica una identificación válida (entre 3 y 30 caracteres).' };
    if (!datos.telefono && !datos.correo) return { error: 'Indica un número de contacto o un correo electrónico.' };
    if (datos.telefono && (!/^[+0-9 ()-]{7,30}$/.test(datos.telefono) || !/^[0-9]{7,15}$/.test(datos.telefono.replace(/\D/g, '')))) {
      return { error: 'Indica un número de contacto válido, con entre 7 y 15 dígitos.' };
    }
    if (datos.correo && (datos.correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo))) return { error: 'Indica un correo electrónico válido.' };
    datos.documento = datos.documento.toUpperCase();
    return { datos };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { validarReclamacion };
  else raiz.SigepReclamacion = Object.freeze({ validarReclamacion });
})(typeof window !== 'undefined' ? window : globalThis);
