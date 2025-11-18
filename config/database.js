const { Pool } = require('pg');
require('dotenv').config();

// Render inyecta DATABASE_URL automáticamente
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL no encontrada en variables de entorno');
  console.log('Variables disponibles:', Object.keys(process.env));
}

const pool = new Pool({
  connectionString: connectionString,
  // SSL es requerido en Render
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false
});

// Verificar conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL en Render');
});

pool.on('error', (err) => {
  console.error('❌ Error en conexión a PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};