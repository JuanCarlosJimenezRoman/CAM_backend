const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateUser, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateUser, register);
router.post('/login', [
  handleValidationErrors
], login);
router.get('/profile', auth, getProfile);

module.exports = router;