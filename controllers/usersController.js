const bcrypt = require('bcryptjs');
const db = require('../config/database');

const getUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, role, created_at FROM users WHERE role = $1',
      ['teacher']
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    // Verificar que el usuario existe
    const userExists = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email) {
      const emailExists = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (emailExists.rows.length > 0) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }

    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, email, name, role, updated_at',
      [name, email, id]
    );

    res.json({ 
      message: 'Usuario actualizado exitosamente', 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Verificar usuario actual
    const userResult = await db.query('SELECT password FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hash nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getUsers, getUserById, updateUser, changePassword };