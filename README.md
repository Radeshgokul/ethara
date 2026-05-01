# Ethara — Team Task Manager

A full-stack team task management application built with React, Express, PostgreSQL, and Prisma. Ethara enables teams to create projects, invite members, assign tasks, and track progress with role-based access control (Admin/Member).

## 🌐 Live URL

> **Live:** [Your Railway URL here]
>
> **GitHub:** [Your GitHub Repo here]

## ✨ Features

- **User Authentication** — JWT-based signup/login with bcrypt password hashing
- **Project Management** — Create, edit, and delete projects
- **Team Collaboration** — Invite members via email, manage roles (Admin/Member)
- **Task Tracking** — Kanban board with TODO, In Progress, In Review, Done columns
- **Role-Based Access** — Admins can manage members, edit all tasks; Members can update own tasks
- **Overdue Detection** — Visual indicators for overdue tasks
- **Filtering** — Filter tasks by status, priority, and assignee
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Dark Mode UI** — Premium glassmorphism design with modern aesthetics

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite, React Router v6, Axios, TailwindCSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (via Railway) |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Deployment | Railway |

## 📁 Project Structure

```
ethara/
├── backend/
│   ├── prisma/          # Schema + seed
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/   # Auth + role middleware
│   │   ├── routes/       # Express routes
│   │   └── utils/        # Prisma client
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios instance
│   │   ├── components/   # Shared UI
│   │   ├── context/      # Auth context
│   │   └── pages/        # App pages
│   └── package.json
└── README.md
```

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd ethara
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npx prisma migrate dev --name init
npm run seed   # Optional: seed demo data
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with VITE_API_URL (default: http://localhost:5000/api)
npm run dev
```

### Demo Credentials (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password123 |
| Member | member1@demo.com | password123 |
| Member | member2@demo.com | password123 |

## 📡 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Login, returns JWT |
| GET | `/me` | Get current user (JWT) |

### Projects (`/api/projects`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Any | List user's projects |
| POST | `/` | Any | Create project |
| GET | `/:id` | Member | Get project details |
| PATCH | `/:id` | Admin | Update project |
| DELETE | `/:id` | Admin | Delete project |
| POST | `/:id/members` | Admin | Add member |
| DELETE | `/:id/members/:userId` | Admin | Remove member |
| PATCH | `/:id/members/:userId` | Admin | Change role |

### Tasks (`/api/projects/:projectId/tasks`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Member | List tasks (filterable) |
| POST | `/` | Member | Create task |
| GET | `/:taskId` | Member | Get task |
| PATCH | `/:taskId` | Member+ | Update task |
| DELETE | `/:taskId` | Admin | Delete task |

### Users (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search?email=` | Search users by email |

## 🚢 Railway Deployment

1. Create a Railway project at [railway.app](https://railway.app)
2. Add PostgreSQL plugin (provides `DATABASE_URL`)
3. Deploy backend: point to `/backend`, set `JWT_SECRET` env var
4. Deploy frontend: point to `/frontend`, set `VITE_API_URL` to backend URL
5. Both services use `railway.toml` for build/start commands

## 📋 License

MIT
