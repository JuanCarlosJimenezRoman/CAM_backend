const express = require('express');
const {
  getProgress,
  getProgressById,
  createProgress,
  updateProgress,
  deleteProgress
} = require('../controllers/progressController');
const { auth, isTeacher } = require('../middleware/auth');
const { validateProgress, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(auth, isTeacher);

router.get('/', getProgress);
router.get('/:id', getProgressById);
router.post('/', validateProgress, createProgress);
router.put('/:id', validateProgress, updateProgress);
router.delete('/:id', deleteProgress);

module.exports = router;