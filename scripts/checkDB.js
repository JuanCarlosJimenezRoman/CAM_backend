const { Pool } = require('pg');
require('dotenv').config();

const checkDB = async () => {
  console.log('🔍 Verificando conexión a BD...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Presente' : '❌ No encontrada');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a PostgreSQL:', result.rows[0].now);
    
    // Verificar tablas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 Tablas existentes:', tables.rows.map(t => t.table_name));
    
  } catch (error) {
    console.error('❌ Error conectando a BD:', error.message);
  } finally {
    await pool.end();
  }
};

checkDB();