const express = require('express');
const path = require('path');
require('./db'); // abre la BD y crea la tabla al arrancar

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`SIGEP corriendo en http://localhost:${PORT}`);
});
