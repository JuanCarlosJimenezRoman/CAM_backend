const { Pool } = require('pg');
require('dotenv').config();

const initDB = async () => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    // Crear base de datos si no existe
    await pool.query('CREATE DATABASE cam_app');
    console.log('Base de datos creada exitosamente');
  } catch (error) {
    if (error.code === '42P04') {
      console.log('La base de datos ya existe');
    } else {
      console.error('Error creando base de datos:', error);
    }
  } finally {
    await pool.end();
  }
};

initDB();