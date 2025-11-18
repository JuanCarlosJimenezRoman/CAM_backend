const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validaciones para usuarios
const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  handleValidationErrors
];

// Validaciones para grupos
const validateGroup = [
  body('name').notEmpty().trim(),
  body('level').notEmpty().trim(),
  handleValidationErrors
];

// Validaciones para estudiantes
const validateStudent = [
  body('name').notEmpty().trim(),
  body('disability_type').notEmpty().trim(),
  body('group_id').isUUID(),
  handleValidationErrors
];

// Validaciones para actividades
const validateActivity = [
  body('title').notEmpty().trim(),
  body('student_id').isUUID(),
  body('category').notEmpty().trim(),
  handleValidationErrors
];

// Validaciones para progreso
const validateProgress = [
  body('student_id').isUUID(),
  body('activity_id').isUUID(),
  body('progress_status').isIn(['achieved', 'in_progress', 'not_achieved']),
  body('progress_date').isDate(),
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateGroup,
  validateStudent,
  validateActivity,
  validateProgress,
  handleValidationErrors
};