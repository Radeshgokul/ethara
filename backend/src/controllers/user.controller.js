const prisma = require('../utils/prismaClient');

// Search users by email (for adding to projects)
const searchUsers = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email || email.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 characters to search.' });
    }

    const users = await prisma.user.findMany({
      where: {
        email: { contains: email, mode: 'insensitive' },
        id: { not: req.user.id }, // Exclude current user
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = { searchUsers };
