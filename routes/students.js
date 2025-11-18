const express = require('express');
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentProgress
} = require('../controllers/studentsController');
const { auth, isTeacher } = require('../middleware/auth');
const { validateStudent, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(auth, isTeacher);

router.get('/', getStudents);
router.get('/:id', getStudentById);
router.get('/:id/progress', getStudentProgress);
router.post('/', validateStudent, createStudent);
router.put('/:id', validateStudent, updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;