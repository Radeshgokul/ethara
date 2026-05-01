const { validationResult } = require('express-validator');
const prisma = require('../utils/prismaClient');

// List projects the user belongs to
const listProjects = async (req, res, next) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            _count: { select: { members: true, tasks: true } },
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
            tasks: {
              select: { status: true },
            },
          },
        },
      },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      role: m.role,
      memberCount: m.project._count.members,
      taskCount: m.project._count.tasks,
      openTaskCount: m.project.tasks.filter((t) => t.status !== 'DONE').length,
    }));

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// Create a new project
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { members: true, tasks: true } },
      },
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// Get project details
const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { members: true, tasks: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Get current user's role in this project
    const membership = project.members.find((m) => m.user.id === req.user.id);

    res.json({ ...project, currentUserRole: membership?.role || null });
  } catch (error) {
    next(error);
  }
};

// Update project
const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { name, description } = req.body;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name, description },
    });

    res.json(project);
  } catch (error) {
    next(error);
  }
};

// Delete project
const deleteProject = async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// Add a member to the project
const addMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, role } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email.' });
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: req.params.id,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member of this project.' });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.params.id,
        userId: user.id,
        role: role || 'MEMBER',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};

// Remove a member from the project
const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;

    // Check if this is the last ADMIN
    const adminCount = await prisma.projectMember.count({
      where: { projectId, role: 'ADMIN' },
    });

    const memberToRemove = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!memberToRemove) {
      return res.status(404).json({ error: 'Member not found in this project.' });
    }

    if (memberToRemove.role === 'ADMIN' && adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last admin of the project.' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });

    // Also unassign any tasks assigned to this user in this project
    await prisma.task.updateMany({
      where: { projectId, assigneeId: userId },
      data: { assigneeId: null },
    });

    res.json({ message: 'Member removed successfully.' });
  } catch (error) {
    next(error);
  }
};

// Change member role
const changeMemberRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { id: projectId, userId } = req.params;
    const { role } = req.body;

    // Prevent removing the last ADMIN
    if (role === 'MEMBER') {
      const currentMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });

      if (currentMember?.role === 'ADMIN') {
        const adminCount = await prisma.projectMember.count({
          where: { projectId, role: 'ADMIN' },
        });
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot demote the last admin of the project.' });
        }
      }
    }

    const member = await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(member);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  changeMemberRole,
};
