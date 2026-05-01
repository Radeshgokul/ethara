const { validationResult } = require('express-validator');
const prisma = require('../utils/prismaClient');

// List tasks for a project with optional filters
const listTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, assigneeId, priority } = req.query;

    const where = { projectId };
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId === 'unassigned' ? null : assigneeId;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// Create a task
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { projectId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    // If assigneeId is provided, verify they are a project member
    if (assigneeId) {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } },
      });
      if (!membership) {
        return res.status(400).json({ error: 'Assignee must be a member of the project.' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// Get a single task
const getTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (task.projectId !== req.params.projectId) {
      return res.status(404).json({ error: 'Task not found in this project.' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// Update a task
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { taskId, projectId } = req.params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== projectId) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check permissions: ADMIN can update everything, members can update status of their own tasks
    const isAdmin = req.membership.role === 'ADMIN';
    const isAssignee = task.assigneeId === req.user.id;
    const isCreator = task.creatorId === req.user.id;

    if (!isAdmin && !isAssignee && !isCreator) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you or that you created.' });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    // Non-admin members can only update status
    let updateData = {};
    if (isAdmin) {
      updateData = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      };
    } else {
      // Members can only update status
      if (status !== undefined) updateData.status = status;
    }

    // If assigneeId is being changed, verify they are a project member
    if (updateData.assigneeId) {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: updateData.assigneeId } },
      });
      if (!membership) {
        return res.status(400).json({ error: 'Assignee must be a member of the project.' });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// Delete a task
const deleteTask = async (req, res, next) => {
  try {
    const { taskId, projectId } = req.params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== projectId) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await prisma.task.delete({ where: { id: taskId } });
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listTasks, createTask, getTask, updateTask, deleteTask };
