const prisma = require('../utils/prismaClient');

/**
 * Middleware to check if the user has the required role in a project.
 * Must be used after verifyToken middleware.
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'MEMBER')
 */
const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required.' });
      }

      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
      });

      if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this project.' });
      }

      if (!roles.includes(membership.role)) {
        return res.status(403).json({ error: `This action requires one of these roles: ${roles.join(', ')}` });
      }

      req.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if the user is a member of the project (any role).
 */
const requireMembership = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required.' });
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireRole, requireMembership };
