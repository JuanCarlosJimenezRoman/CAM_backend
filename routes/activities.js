const express = require('express');
const {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity
} = require('../controllers/activitiesController');
const { auth, isTeacher } = require('../middleware/auth');
const { validateActivity, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

router.use(auth, isTeacher);

router.get('/', getActivities);
router.get('/:id', getActivityById);
router.post('/', validateActivity, createActivity);
router.put('/:id', validateActivity, updateActivity);
router.delete('/:id', deleteActivity);

module.exports = router;