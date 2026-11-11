const express = require('express');
const path = require('path');
require('./db'); // abre la BD y crea la tabla al arrancar

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});
app.use(express.static(path.join(__dirname, 'public')));

// Manejador de errores: siempre responde JSON con { error } en español.
// El cuarto parametro (next) es obligatorio para que Express lo trate como manejador.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La foto es demasiado pesada. Elige una imagen más pequeña.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'No se pudo leer la información enviada.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Ocurrió un error en el servidor. Intenta de nuevo.' });
});

app.listen(PORT, () => {
  console.log(`SIGEP corriendo en http://localhost:${PORT}`);
});
