# Employ.me Workspace Instructions

Full-stack job platform for Ghana's market with two frontend codebases:

- `client/`: React 19 + TypeScript + Vite (active app on port 5173)
- `client-nextjs/`: Next.js 16 migration track (app router, port 3000)
- `server/`: Express + Prisma + PostgreSQL + Socket.IO (port 5001)

## Build And Run

Use app-specific commands from each package.

```bash
# Backend
cd server
npm install
npm run dev

# Frontend (React + Vite)
cd client
npm install
npm run dev

# Frontend (Next.js migration app)
cd client-nextjs
npm install
npm run dev
```

### Build/Lint

```bash
# React client
cd client && npm run build && npm run lint

# Next.js client
cd client-nextjs && npm run build && npm run lint

# Server
cd server && npm run build
```

### Database (Prisma)

```bash
cd server
npm run db:generate
npm run db:push      # dev schema sync
npm run db:migrate   # migration workflow
npm run db:seed
npm run db:studio
```

Notes:

- No standardized automated test command is configured yet across apps.
- After schema changes, run `npm run db:generate` before any push/migrate flow.

## Architecture

### Server boundaries

- `server/src/controllers/`: business logic per domain.
- `server/src/routes/`: HTTP route wiring and middleware.
- `server/src/middleware/errorHandler.ts`: `AppError` and `catchAsync` source of truth.
- `server/prisma/schema.prisma`: data model source of truth.
- `server/src/index.ts`: Express + Socket.IO bootstrap.

### React client boundaries

- `client/src/services/api.ts`: centralized API client, auth token handling, request deduping.
- `client/src/contexts/AuthContext.tsx`: auth/session state.
- `client/src/contexts/ChatContext.tsx`: Socket.IO connection + real-time chat state.
- `client/src/pages/`: feature pages by role/domain.

### Next.js client boundaries

- `client-nextjs/app/`: app-router pages and nested layouts.
- `client-nextjs/lib/api.ts` and `client-nextjs/services/api.ts`: API adapters.
- `client-nextjs/contexts/`: auth/chat/theme context providers.

## Project Conventions

### Domain and roles

- Roles are strict: `JOB_SEEKER`, `EMPLOYER`, `ADMIN`.
- User profile shape is role-based (one-to-one profile tables per role).
- Moderation is two-tier:
  - Employer account verification: `Employer.isVerified`
  - Job listing approval: `Job.isApproved`

### Backend patterns

- Always use `catchAsync` in controllers and throw `AppError` for expected failures.
- API responses follow `{ success, data?, message? }`.
- For user lookups where role context matters, include all role profiles (`jobSeeker`, `employer`, `admin`).
- Handle Prisma unique collisions explicitly (`P2002`), especially for duplicate applications.

### Frontend patterns

- Use React Icons (`react-icons/md`, `react-icons/hi`) for UI icons.
- Initialize list-like state to `[]` and guard on `response.success` before data access.
- Use semantic Tailwind tokens defined in `client/src/index.css`; avoid hardcoded color literals.
- For file uploads, reset input value after processing and revoke object URLs on cleanup.

### Realtime/chat patterns

- Socket auth payload uses `userId` (not `id`) from JWT.
- Emit new-message events to the receiver channel and prevent local duplicate rendering.
- Avoid stale closure bugs in socket listeners by using refs for current user/conversation state.

## Environment Pitfalls

- Keep `JWT_SECRET` configured or auth/socket flows fail.
- Keep `JWT_REFRESH_SECRET` configured for refresh-token login paths.
- CORS origins must match active frontend URL (`5173` for Vite, `3000` for Next.js).
- Email notifications should never block core flows; failures should be logged and degraded gracefully.

## Reference Docs

Use these docs instead of duplicating detailed behavior in responses:

- `CHAT_IMPLEMENTATION.md` for end-to-end chat architecture and troubleshooting.
- `SOCIAL_AUTH_ROLE_FIX.md` for OAuth role-selection/session flow details.
- `server/EMAIL_NOTIFICATIONS.md` for email trigger catalog and template behavior.
- `TEST_DATA.md` for seed/test account details.

## Agent Behavior In This Workspace

- Before coding, identify target app ( `client-nextjs`, or `server`) and keep changes scoped.
- Prefer minimal, local changes that follow existing patterns in nearby files.
- When touching Prisma schema, update related backend logic and regenerate client artifacts.
- When touching auth or chat, verify HTTP and Socket.IO behavior together.
