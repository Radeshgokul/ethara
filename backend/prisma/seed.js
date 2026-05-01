const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@demo.com',
      password: hashedPassword,
    },
  });

  const member1 = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'member1@demo.com',
      password: hashedPassword,
    },
  });

  const member2 = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'member2@demo.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Users created');

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Ethara Platform',
      description: 'Building the next-generation team collaboration platform with real-time features and AI-powered insights.',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member1.id, role: 'MEMBER' },
          { userId: member2.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Redesign',
      description: 'Complete UI/UX overhaul of the mobile application with modern design patterns.',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member1.id, role: 'ADMIN' },
        ],
      },
    },
  });

  console.log('✅ Projects created');

  // Create tasks for project 1
  const now = new Date();
  const tasks = [
    {
      title: 'Design system architecture',
      description: 'Create the overall system architecture document including database design, API endpoints, and deployment strategy.',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: admin.id,
      creatorId: admin.id,
    },
    {
      title: 'Implement user authentication',
      description: 'Set up JWT-based authentication with signup, login, and token refresh functionality.',
      status: 'DONE',
      priority: 'URGENT',
      dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: member1.id,
      creatorId: admin.id,
    },
    {
      title: 'Build project management API',
      description: 'Create CRUD endpoints for projects with role-based access control.',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: member1.id,
      creatorId: admin.id,
    },
    {
      title: 'Create task board UI',
      description: 'Build a Kanban-style task board with drag-and-drop support and filtering capabilities.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: member2.id,
      creatorId: admin.id,
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and Railway deployment.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: null,
      creatorId: admin.id,
    },
    {
      title: 'Write API documentation',
      description: 'Document all API endpoints with request/response examples using Swagger.',
      status: 'TODO',
      priority: 'LOW',
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: member2.id,
      creatorId: member1.id,
    },
    // Tasks for project 2
    {
      title: 'Create wireframes',
      description: 'Design wireframes for all major screens of the mobile app redesign.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      projectId: project2.id,
      assigneeId: member1.id,
      creatorId: admin.id,
    },
    {
      title: 'User research report',
      description: 'Compile findings from user interviews and usability testing sessions.',
      status: 'TODO',
      priority: 'URGENT',
      dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Overdue!
      projectId: project2.id,
      assigneeId: admin.id,
      creatorId: member1.id,
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log('✅ Tasks created');
  console.log('\n🎉 Seed completed successfully!');
  console.log('\nDemo credentials:');
  console.log('  admin@demo.com / password123');
  console.log('  member1@demo.com / password123');
  console.log('  member2@demo.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
