const express = require('express');
const { body } = require('express-validator');
const {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole, requireMembership } = require('../middleware/role.middleware');

const router = express.Router({ mergeParams: true });

// All routes require authentication + project membership
router.use(verifyToken);

// List tasks (filterable)
router.get('/', requireMembership, listTasks);

// Create task (any member)
router.post(
  '/',
  requireMembership,
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Task title must be 1-200 characters.'),
    body('description').optional().trim(),
    body('status')
      .optional()
      .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
      .withMessage('Invalid status.'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority.'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format.'),
    body('assigneeId').optional({ nullable: true }).isUUID().withMessage('Invalid assignee ID.'),
  ],
  createTask
);

// Get single task
router.get('/:taskId', requireMembership, getTask);

// Update task (ADMIN can update all, members can update status of own tasks)
router.patch(
  '/:taskId',
  requireMembership,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Task title must be 1-200 characters.'),
    body('description').optional().trim(),
    body('status')
      .optional()
      .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
      .withMessage('Invalid status.'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority.'),
    body('dueDate').optional({ nullable: true }),
    body('assigneeId').optional({ nullable: true }),
  ],
  updateTask
);

// Delete task (ADMIN only)
router.delete('/:taskId', requireRole('ADMIN'), deleteTask);

module.exports = router;
