const { Pool } = require('pg');
require('dotenv').config();

const initDatabase = async () => {
  console.log('🔄 Inicializando base de datos...');
  
  // Connection string para Render PostgreSQL
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.log('❌ DATABASE_URL no encontrada, saltando inicialización de BD');
    return;
  }

  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Probar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado a PostgreSQL en Render');

    // Crear extensión UUID
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ Extensión UUID verificada');

    // Crear tabla users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'teacher',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla users verificada');

    // Crear tabla groups
    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        level VARCHAR(100) NOT NULL,
        description TEXT,
        teacher_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla groups verificada');

    // Crear tabla students
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        group_id UUID REFERENCES groups(id),
        disability_type VARCHAR(100) NOT NULL,
        academic_level VARCHAR(100),
        tutor_name VARCHAR(255),
        tutor_phone VARCHAR(50),
        tutor_email VARCHAR(255),
        photo_url VARCHAR(500),
        additional_info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla students verificada');

    // Crear tabla activities
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES students(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        difficulty_level VARCHAR(50),
        objective TEXT,
        due_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla activities verificada');

    // Crear tabla progress
    await pool.query(`
      CREATE TABLE IF NOT EXISTS progress (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID REFERENCES students(id),
        activity_id UUID REFERENCES activities(id),
        progress_status VARCHAR(50) NOT NULL,
        performance_indicators JSONB,
        teacher_notes TEXT,
        progress_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla progress verificada');

    // Crear índices
    await pool.query('CREATE INDEX IF NOT EXISTS idx_students_group_id ON students(group_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_activities_student_id ON activities(student_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_progress_student_id ON progress(student_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_progress_activity_id ON progress(activity_id)');
    console.log('✅ Índices creados');

    console.log('🎉 Base de datos inicializada correctamente en Render');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
  } finally {
    await pool.end();
  }
};

// Solo ejecutar si se llama directamente
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;