# Employ.me

Employ.me is a full-stack job platform focused on Ghana's market. The monorepo contains two frontend codebases (Vite and Next.js migration) and one backend API.

## Monorepo Structure

- `client/` - React 19 + TypeScript + Vite (active app, port `5173`)
- `client-nextjs/` - Next.js 16 App Router migration track (port `3000`)
- `server/` - Express + Prisma + PostgreSQL + Socket.IO (port `5001`)

## Core Features

- Role-based access: `JOB_SEEKER`, `EMPLOYER`, `ADMIN`
- Employer verification and job approval moderation flow
- Job posting, job applications, and messaging
- Realtime chat powered by Socket.IO
- Authentication with JWT + refresh token flow
- Email notification workflows

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS
- Next.js track: Next.js 16 (App Router)
- Backend: Node.js, Express, Prisma ORM
- Database: PostgreSQL
- Realtime: Socket.IO

## Local Development

### 1. Server

```bash
cd server
npm install
npm run dev
```

### 2. Vite Frontend

```bash
cd client
npm install
npm run dev
```

### 3. Next.js Frontend

```bash
cd client-nextjs
npm install
npm run dev
```

## Build Commands

```bash
# React + Vite
cd client && npm run build && npm run lint

# Next.js
cd client-nextjs && npm run build && npm run lint

# Server
cd server && npm run build
```

## Database (Prisma)

```bash
cd server
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Environment Notes

- Set `JWT_SECRET` and `JWT_REFRESH_SECRET` for auth/refresh paths.
- Keep CORS origins aligned with active frontend URL:
  - Vite: `http://localhost:5173`
  - Next.js: `http://localhost:3000`
- Email failures should degrade gracefully and not block core flows.

## Important Repository Docs

- `CHAT_IMPLEMENTATION.md` - chat architecture and troubleshooting
- `SOCIAL_AUTH_ROLE_FIX.md` - OAuth role/session behavior
- `server/EMAIL_NOTIFICATIONS.md` - email trigger catalog
- `TEST_DATA.md` - seeded test data and accounts

## Current Status

- `client/` remains the active production-like frontend.
- `client-nextjs/` is the migration and feature track for Next.js 16.

