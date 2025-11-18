const db = require('../config/database');

const getProgress = async (req, res) => {
  try {
    const { student_id, activity_id } = req.query;
    
    let query = `
      SELECT p.*, s.name as student_name, a.title as activity_title 
      FROM progress p 
      JOIN students s ON p.student_id = s.id 
      JOIN activities a ON p.activity_id = a.id 
      JOIN groups g ON s.group_id = g.id 
      WHERE g.teacher_id = $1
    `;
    let params = [req.user.id];

    if (student_id) {
      query += ' AND p.student_id = $2';
      params.push(student_id);
    }

    if (activity_id) {
      query += ' AND p.activity_id = $' + (params.length + 1);
      params.push(activity_id);
    }

    query += ' ORDER BY p.progress_date DESC';

    const result = await db.query(query, params);
    res.json({ progress: result.rows });
  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getProgressById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT p.*, s.name as student_name, a.title as activity_title 
       FROM progress p 
       JOIN students s ON p.student_id = s.id 
       JOIN activities a ON p.activity_id = a.id 
       JOIN groups g ON s.group_id = g.id 
       WHERE p.id = $1 AND g.teacher_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registro de progreso no encontrado' });
    }

    res.json({ progress: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const createProgress = async (req, res) => {
  try {
    const {
      student_id,
      activity_id,
      progress_status,
      performance_indicators,
      teacher_notes,
      progress_date
    } = req.body;

    // Verificar que el estudiante y actividad pertenecen al profesor
    const validRecord = await db.query(
      `SELECT s.id 
       FROM students s 
       JOIN activities a ON a.student_id = s.id 
       JOIN groups g ON s.group_id = g.id 
       WHERE s.id = $1 AND a.id = $2 AND g.teacher_id = $3`,
      [student_id, activity_id, req.user.id]
    );

    if (validRecord.rows.length === 0) {
      return res.status(400).json({ error: 'Estudiante o actividad no válidos' });
    }

    const result = await db.query(
      `INSERT INTO progress (
        student_id, activity_id, progress_status, performance_indicators,
        teacher_notes, progress_date
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        student_id, activity_id, progress_status, performance_indicators,
        teacher_notes, progress_date
      ]
    );

    res.status(201).json({ 
      message: 'Progreso registrado exitosamente', 
      progress: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creando progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      progress_status,
      performance_indicators,
      teacher_notes,
      progress_date
    } = req.body;

    // Verificar que el registro de progreso pertenece al profesor
    const progressExists = await db.query(
      `SELECT p.id 
       FROM progress p 
       JOIN students s ON p.student_id = s.id 
       JOIN groups g ON s.group_id = g.id 
       WHERE p.id = $1 AND g.teacher_id = $2`,
      [id, req.user.id]
    );

    if (progressExists.rows.length === 0) {
      return res.status(404).json({ error: 'Registro de progreso no encontrado' });
    }

    const result = await db.query(
      `UPDATE progress SET 
        progress_status = COALESCE($1, progress_status),
        performance_indicators = COALESCE($2, performance_indicators),
        teacher_notes = COALESCE($3, teacher_notes),
        progress_date = COALESCE($4, progress_date)
       WHERE id = $5 RETURNING *`,
      [progress_status, performance_indicators, teacher_notes, progress_date, id]
    );

    res.json({ 
      message: 'Progreso actualizado exitosamente', 
      progress: result.rows[0] 
    });
  } catch (error) {
    console.error('Error actualizando progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const deleteProgress = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el registro de progreso pertenece al profesor
    const progressExists = await db.query(
      `SELECT p.id 
       FROM progress p 
       JOIN students s ON p.student_id = s.id 
       JOIN groups g ON s.group_id = g.id 
       WHERE p.id = $1 AND g.teacher_id = $2`,
      [id, req.user.id]
    );

    if (progressExists.rows.length === 0) {
      return res.status(404).json({ error: 'Registro de progreso no encontrado' });
    }

    await db.query('DELETE FROM progress WHERE id = $1', [id]);

    res.json({ message: 'Progreso eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando progreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getProgress,
  getProgressById,
  createProgress,
  updateProgress,
  deleteProgress
};