const db = require('../config/database');

const getActivities = async (req, res) => {
  try {
    const { student_id } = req.query;
    
    let query = `
      SELECT a.*, s.name as student_name, g.name as group_name 
      FROM activities a 
      JOIN students s ON a.student_id = s.id 
      JOIN groups g ON s.group_id = g.id 
      WHERE g.teacher_id = $1
    `;
    let params = [req.user.id];

    if (student_id) {
      query += ' AND a.student_id = $2';
      params.push(student_id);
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await db.query(query, params);
    res.json({ activities: result.rows });
  } catch (error) {
    console.error('Error obteniendo actividades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT a.*, s.name as student_name, g.name as group_name 
       FROM activities a 
       JOIN students s ON a.student_id = s.id 
       JOIN groups g ON s.group_id = g.id 
       WHERE a.id = $1 AND g.teacher_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json({ activity: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo actividad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const createActivity = async (req, res) => {
  try {
    const {
      student_id,
      title,
      description,
      category,
      difficulty_level,
      objective,
      due_date,
      status = 'pending'
    } = req.body;

    // Verificar que el estudiante pertenece a un grupo del profesor
    const studentExists = await db.query(
      `SELECT s.id 
       FROM students s 
       JOIN groups g ON s.group_id = g.id 
       WHERE s.id = $1 AND g.teacher_id = $2`,
      [student_id, req.user.id]
    );

    if (studentExists.rows.length === 0) {
      return res.status(400).json({ error: 'Estudiante no válido' });
    }

    const result = await db.query(
      `INSERT INTO activities (
        student_id, title, description, category, difficulty_level, 
        objective, due_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        student_id, title, description, category, difficulty_level,
        objective, due_date, status
      ]
    );

    res.status(201).json({ 
      message: 'Actividad creada exitosamente', 
      activity: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creando actividad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating activity ID:', id);
    console.log('Request body:', req.body);
    const {
      title,
      description,
      category,
      difficulty_level,
      objective,
      due_date,
      status
    } = req.body;

    // Verificar que la actividad pertenece a un estudiante del profesor
    const activityExists = await db.query(
      `SELECT a.id 
       FROM activities a 
       JOIN students s ON a.student_id = s.id 
       JOIN groups g ON s.group_id = g.id 
       WHERE a.id = $1 AND g.teacher_id = $2`,
      [id, req.user.id]
    );

    if (activityExists.rows.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    const result = await db.query(
      `UPDATE activities SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        difficulty_level = COALESCE($4, difficulty_level),
        objective = COALESCE($5, objective),
        due_date = COALESCE($6, due_date),
        status = COALESCE($7, status)
       WHERE id = $8 RETURNING *`,
      [title, description, category, difficulty_level, objective, due_date, status, id]
    );

    res.json({ 
      message: 'Actividad actualizada exitosamente', 
      activity: result.rows[0] 
    });
  } catch (error) {
    console.error('Error actualizando actividad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la actividad pertenece a un estudiante del profesor
    const activityExists = await db.query(
      `SELECT a.id 
       FROM activities a 
       JOIN students s ON a.student_id = s.id 
       JOIN groups g ON s.group_id = g.id 
       WHERE a.id = $1 AND g.teacher_id = $2`,
      [id, req.user.id]
    );

    if (activityExists.rows.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    await db.query('DELETE FROM activities WHERE id = $1', [id]);

    res.json({ message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando actividad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity
};