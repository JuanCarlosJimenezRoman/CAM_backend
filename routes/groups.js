const express = require('express');
const {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupStats
} = require('../controllers/groupsController');
const { auth, isTeacher } = require('../middleware/auth');
const { validateGroup, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(auth, isTeacher);

router.get('/', getGroups);
router.get('/:id', getGroupById);
router.get('/:id/stats', getGroupStats);
router.post('/', validateGroup, createGroup);
router.put('/:id', validateGroup, updateGroup);
router.delete('/:id', deleteGroup);

module.exports = router;