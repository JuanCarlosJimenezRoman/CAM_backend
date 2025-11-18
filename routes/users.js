const express = require('express');
const { getUsers, getUserById, updateUser, changePassword } = require('../controllers/usersController');
const { auth, isTeacher } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(auth, isTeacher);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', handleValidationErrors, updateUser);
router.put('/:id/password', handleValidationErrors, changePassword);

module.exports = router;