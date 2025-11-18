const db = require('../config/database');

const getGroups = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT g.*, u.name as teacher_name 
       FROM groups g 
       LEFT JOIN users u ON g.teacher_id = u.id 
       WHERE g.teacher_id = $1 
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json({ groups: result.rows });
  } catch (error) {
    console.error('Error obteniendo grupos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT g.*, u.name as teacher_name 
       FROM groups g 
       LEFT JOIN users u ON g.teacher_id = u.id 
       WHERE g.id = $1 AND g.teacher_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    res.json({ group: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo grupo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, level, description } = req.body;
    
    const result = await db.query(
      'INSERT INTO groups (name, level, description, teacher_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, level, description, req.user.id]
    );

    res.status(201).json({ 
      message: 'Grupo creado exitosamente', 
      group: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creando grupo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, description } = req.body;

    // Verificar que el grupo pertenece al profesor
    const groupExists = await db.query(
      'SELECT id FROM groups WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );

    if (groupExists.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const result = await db.query(
      'UPDATE groups SET name = $1, level = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, level, description, id]
    );

    res.json({ 
      message: 'Grupo actualizado exitosamente', 
      group: result.rows[0] 
    });
  } catch (error) {
    console.error('Error actualizando grupo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el grupo pertenece al profesor
    const groupExists = await db.query(
      'SELECT id FROM groups WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );

    if (groupExists.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    await db.query('DELETE FROM groups WHERE id = $1', [id]);

    res.json({ message: 'Grupo eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando grupo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getGroupStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el grupo pertenece al profesor
    const groupExists = await db.query(
      'SELECT id FROM groups WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );

    if (groupExists.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    // Obtener estadísticas del grupo
    const studentsCount = await db.query(
      'SELECT COUNT(*) FROM students WHERE group_id = $1',
      [id]
    );

    const activitiesCount = await db.query(
      `SELECT COUNT(DISTINCT a.id) 
       FROM activities a 
       JOIN students s ON a.student_id = s.id 
       WHERE s.group_id = $1`,
      [id]
    );

    const progressStats = await db.query(
      `SELECT p.progress_status, COUNT(*) 
       FROM progress p 
       JOIN students s ON p.student_id = s.id 
       WHERE s.group_id = $1 
       GROUP BY p.progress_status`,
      [id]
    );

    res.json({
      stats: {
        total_students: parseInt(studentsCount.rows[0].count),
        total_activities: parseInt(activitiesCount.rows[0].count),
        progress_breakdown: progressStats.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupStats
};