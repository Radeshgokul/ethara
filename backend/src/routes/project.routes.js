const express = require('express');
const { body } = require('express-validator');
const {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  changeMemberRole,
} = require('../controllers/project.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole, requireMembership } = require('../middleware/role.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// List all projects user belongs to
router.get('/', listProjects);

// Create a new project
router.post(
  '/',
  [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Project name must be 3-100 characters.'),
    body('description').optional().trim(),
  ],
  createProject
);

// Get project details (members can view)
router.get('/:id', requireMembership, getProject);

// Update project (ADMIN only)
router.patch(
  '/:id',
  requireRole('ADMIN'),
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Project name must be 3-100 characters.'),
    body('description').optional().trim(),
  ],
  updateProject
);

// Delete project (ADMIN only)
router.delete('/:id', requireRole('ADMIN'), deleteProject);

// Add member (ADMIN only)
router.post(
  '/:id/members',
  requireRole('ADMIN'),
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'MEMBER'])
      .withMessage('Role must be ADMIN or MEMBER.'),
  ],
  addMember
);

// Remove member (ADMIN only)
router.delete('/:id/members/:userId', requireRole('ADMIN'), removeMember);

// Change member role (ADMIN only)
router.patch(
  '/:id/members/:userId',
  requireRole('ADMIN'),
  [body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER.')],
  changeMemberRole
);

module.exports = router;
