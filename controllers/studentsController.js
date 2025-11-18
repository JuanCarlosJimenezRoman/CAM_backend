const db = require('../config/database');

const getStudents = async (req, res) => {
  try {
    const { group_id } = req.query;
    
    let query = `
      SELECT s.*, g.name as group_name 
      FROM students s 
      LEFT JOIN groups g ON s.group_id = g.id 
      WHERE g.teacher_id = $1
    `;
    let params = [req.user.id];

    if (group_id) {
      query += ' AND s.group_id = $2';
      params.push(group_id);
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await db.query(query, params);
    res.json({ students: result.rows });
  } catch (error) {
    console.error('Error obteniendo estudiantes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT s.*, g.name as group_name, g.teacher_id 
       FROM students s 
       LEFT JOIN groups g ON s.group_id = g.id 
       WHERE s.id = $1 AND g.teacher_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json({ student: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const createStudent = async (req, res) => {
  try {
    const {
      name,
      group_id,
      disability_type,
      academic_level,
      tutor_name,
      tutor_phone,
      tutor_email,
      photo_url,
      additional_info
    } = req.body;

    // Verificar que el grupo pertenece al profesor
    const groupExists = await db.query(
      'SELECT id FROM groups WHERE id = $1 AND teacher_id = $2',
      [group_id, req.user.id]
    );

    if (groupExists.rows.length === 0) {
      return res.status(400).json({ error: 'Grupo no válido' });
    }

    const result = await db.query(
      `INSERT INTO students (
        name, group_id, disability_type, academic_level, 
        tutor_name, tutor_phone, tutor_email, photo_url, additional_info
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        name, group_id, disability_type, academic_level,
        tutor_name, tutor_phone, tutor_email, photo_url, additional_info
      ]
    );

    res.status(201).json({ 
      message: 'Estudiante creado exitosamente', 
      student: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creando estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      group_id,
      disability_type,
      academic_level,
      tutor_name,
      tutor_phone,
      tutor_email,
      photo_url,
      additional_info
    } = req.body;

    // Verificar que el estudiante pertenece a un grupo del profesor
    const studentExists = await db.query(
      `SELECT s.id 
       FROM students s 
       LEFT JOIN groups g ON s.group_id = g.id 
       WHERE s.id = $1 AND g.teacher_id = $2`,
      [id, req.user.id]
    );

    if (studentExists.rows.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Si se cambia el grupo, verificar que el nuevo grupo pertenece al profesor
    if (group_id) {
      const groupExists = await db.query(
        'SELECT id FROM groups WHERE id = $1 AND teacher_id = $2',
        [group_id, req.user.id]
      );

      if (groupExists.rows.length === 0) {
        return res.status(400).json({ error: 'Grupo no válido' });
      }
    }

    const result = await db.query(
      `UPDATE students SET 
        name = COALESCE($1, name),
        group_id = COALESCE($2, group_id),
        disability_type = COALESCE($3, disability_type),
        academic_level = COALESCE($4, academic_level),
        tutor_name = COALESCE($5, tutor_name),
        tutor_phone = COALESCE($6, tutor_phone),
        tutor_email = COALESCE($7, tutor_email),
        photo_url = COALESCE($8, photo_url),
        additional_info = COALESCE($9, additional_info),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [
        name, group_id, disability_type, academic_level,
        tutor_name, tutor_phone, tutor_email, photo_url, additional_info, id
      ]
    );

    res.json({ 
      message: 'Estudiante actualizado exitosamente', 
      student: result.rows[0] 
    });
  } catch (error) {
    console.error('Error actualizando estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el estudiante pertenece a un grupo del profesor
    const studentExists = await db.query(
      `SELECT s.id 
       FROM students s 
       LEFT JOIN groups g ON s.group_id = g.id 
       WHERE s.id = $1 AND g.teacher_id = $2`,
      [id, req.user.id]
    );

    if (studentExists.rows.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    await db.query('DELETE FROM students WHERE id = $1', [id]);

    res.json({ message: 'Estudiante eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getStudentProgress = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el estudiante pertenece a un grupo del profesor
    const studentExists = await db.query(
      `SELECT s.id 
       FROM students s 
       LEFT JOIN groups g ON s.group_id = g.id 
       WHERE s.id = $1 AND g.teacher_id = $2`,
      [id, req.user.id]
    );

    if (studentExists.rows.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Obtener progreso del estudiante
    const progressResult = await db.query(
      `SELECT p.*, a.title as activity_title 
       FROM progress p 
       LEFT JOIN activities a ON p.activity_id = a.id 
       WHERE p.student_id = $1 
       ORDER BY p.progress_date DESC`,
      [id]
    );

    // Obtener actividades del estudiante
    const activitiesResult = await db.query(
      'SELECT * FROM activities WHERE student_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      progress: progressResult.rows,
      activities: activitiesResult.rows
    });
  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentProgress
};