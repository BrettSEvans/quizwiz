# QuizWiz Setup Guide

This guide helps developers get QuizWiz running locally for development.

## Prerequisites

- **Node.js** 22+ (for `--import` tsx flag support)
- **PostgreSQL** 12+ (local or Docker)
- **Git**

## Quick Start (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/BrettSEvans/quizwiz.git
cd quizwiz
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/quizwiz

# Auth
JWT_SECRET=your-secret-key-min-32-chars-long-change-this-!!!

# Logging
LOG_DIR=./logs

# Server
PORT=3000
NODE_ENV=development
```

**Development defaults:**
- Local PostgreSQL on `localhost:5432`
- Database: `quizwiz`
- User: `postgres`
- Password: `postgres` (change in production!)

### 3. Install Dependencies & Set Up Database

```bash
npm run setup
```

This command:
1. Installs npm dependencies
2. Runs Prisma migrations
3. Generates Prisma client types

### 4. Start the Dev Server

```bash
npm run dev
```

The server starts on `http://localhost:3000` with auto-reload.

**Open in browser:**
- Landing page: http://localhost:3000
- Host login: http://localhost:3000/auth/qm-login (once Phase 6 API routes are complete)

---

## Common Commands

### Development

```bash
# Start dev server with auto-reload
npm run dev

# Run in background (logs to logs.txt)
npm run dev:daemon

# Stop background server
pkill -f "node --import tsx server.ts"
```

### Testing

```bash
# Run all tests
npm test

# Run tests for a specific file
npm test -- src/lib/domain/__tests__/quizmaster-accounts.test.ts

# Run tests with UI dashboard
npm run test:ui

# Watch mode (re-runs on file changes)
npm test -- --watch
```

### Database

```bash
# Create a new migration (after schema changes)
npx prisma migrate dev --name migration_name

# Reset database (deletes all data!)
npm run db:reset

# Generate Prisma client (after schema changes)
npx prisma generate

# Open Prisma Studio (web UI for database)
npx prisma studio
```

### Building & Deployment

```bash
# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## Project Structure

```
quizwiz/
├── src/
│   ├── app/                      # Next.js App Router routes
│   │   ├── page.tsx              # Landing page
│   │   ├── auth/                 # Auth routes (signup, login, join)
│   │   ├── host/                 # Host control panel
│   │   ├── play/[token]/         # Team app
│   │   ├── board/[token]/        # Public scoreboard
│   │   ├── quizmaster/           # Quizmaster portal
│   │   └── api/                  # REST API endpoints
│   │
│   ├── components/
│   │   ├── primitives/           # Bauhaus design primitives (Button, Card, etc.)
│   │   └── [feature]/            # Feature-specific components
│   │
│   ├── lib/
│   │   ├── domain/               # Pure domain logic (TDD-first)
│   │   │   ├── __tests__/        # Unit tests
│   │   │   ├── quizmaster-accounts.ts
│   │   │   ├── host-management.ts
│   │   │   ├── game-state.ts
│   │   │   ├── scoring.ts
│   │   │   └── ...
│   │   │
│   │   ├── db/
│   │   │   ├── prisma.ts         # Prisma client wrapper
│   │   │   └── repositories.ts   # Database CRUD operations
│   │   │
│   │   ├── auth/
│   │   │   ├── jwt.ts            # JWT token creation/verification
│   │   │   └── __tests__/
│   │   │
│   │   ├── logger/
│   │   │   └── system-log.ts     # Capped file-based logging
│   │   │
│   │   ├── realtime/
│   │   │   └── socket-handlers.ts # Socket.IO event handlers
│   │   │
│   │   └── contexts/             # React contexts
│   │
│   └── middleware.ts             # Auth middleware
│
├── app/
│   └── (App Router routes mount here)
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
│
├── e2e/                          # Playwright end-to-end tests
├── public/                       # Static assets
├── server.ts                     # Custom Node.js server (Next + Socket.IO)
├── tsconfig.json                 # TypeScript config
├── vitest.config.ts              # Test runner config
├── package.json
└── README.md
```

---

## Architecture Overview

### Stack

- **Frontend:** React 19 + Next.js 15 (App Router)
- **Backend:** Node.js + Express (custom server wrapping Next)
- **Database:** PostgreSQL + Prisma ORM
- **Real-time:** Socket.IO (custom Node server)
- **Styling:** Tailwind CSS v4
- **Testing:** Vitest + jsdom (unit), Playwright (E2E)
- **Auth:** JWT + bcrypt

### Key Concepts

**Test-Driven Development (TDD):**
- All domain logic is tested first (red → green → refactor)
- Tests in `src/lib/domain/__tests__/`
- Run `npm test` to verify

**Pure Domain Functions:**
- Located in `src/lib/domain/`
- No side effects, no database access
- Easy to test and reason about
- Examples: `scoring.ts`, `game-state.ts`, `quizmaster-accounts.ts`

**Repositories Pattern:**
- All database access goes through repositories
- Located in `src/lib/db/repositories.ts`
- Examples: `gameRepo.create()`, `hostRepo.findByQuizmaster()`

**Socket.IO Real-time:**
- Custom Node server wraps Next.js
- Defined in `server.ts`
- Event handlers in `src/lib/realtime/socket-handlers.ts`
- Room per game (game state is in-memory)

**State Machine for Games:**
- Game transitions: registration → active → locked → published → completed
- Defined in `src/lib/domain/game-state.ts`
- All transitions validated (can't skip states)

---

## Development Workflow

### 1. **Feature Development (TDD Workflow)**

```
1. Write failing test in src/lib/domain/__tests__/
2. Implement function to pass test
3. Refactor for clarity
4. Commit with message: "Phase X.Y: Feature name (N tests)"
```

### 2. **Database Changes**

```
1. Edit prisma/schema.prisma
2. Run: npx prisma migrate dev --name feature_name
3. Prisma generates types automatically
4. Implement repository functions
5. Write tests
6. Commit migration + code together
```

### 3. **Adding a Socket.IO Event**

```
1. Write test in src/lib/realtime/__tests__/
2. Add event handler in src/lib/realtime/socket-handlers.ts
3. Server automatically emits to client
4. Commit with message: "Add [event-name] socket handler"
```

### 4. **Adding a UI Component**

```
1. Create component in src/components/[feature]/
2. Write tests using Testing Library + jsdom
3. Test user interactions (clicks, form submits)
4. Use Bauhaus design tokens
5. Commit with message: "Add [ComponentName] component"
```

---

## Local PostgreSQL Setup

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL in Docker
docker run --name quizwiz-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=quizwiz \
  -p 5432:5432 \
  -d postgres:15

# Stop the container
docker stop quizwiz-db

# Start again (data persists)
docker start quizwiz-db
```

### Option B: System PostgreSQL

```bash
# On macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Create database
createdb quizwiz

# Connect and verify
psql quizwiz
```

---

## Debugging

### View Database with Prisma Studio

```bash
npx prisma studio
```

Opens `http://localhost:5555` with a web UI to browse and edit data.

### Check System Logs

```bash
# View last 100 lines
tail -100 ./logs/system.log

# Watch in real-time
tail -f ./logs/system.log

# Check log size
wc -l ./logs/system.log
```

### Enable Debug Logging

```bash
# Run with debug output
DEBUG=quizwiz:* npm run dev
```

### Inspect Socket.IO Events

In browser DevTools:
```javascript
// Check Socket.IO connection
io()

// Listen to all events
socket.onAny((event, ...args) => {
  console.log('Event:', event, args);
});
```

---

## Common Issues

### Database Connection Error

```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solution:**
- Is PostgreSQL running? (`brew services list`)
- Check DATABASE_URL in `.env`
- For Docker: `docker ps` to verify container is running

### "Cannot find module" Error

```
Error: Cannot find module 'src/lib/domain/...'
```

**Solution:**
- Run `npm test` to check if imports are correct
- Verify path aliases in `tsconfig.json`: `@/*` → `./src/*`
- Restart dev server (`npm run dev`)

### Migration Failed

```
Error: Migration failed
```

**Solution:**
- Check Prisma schema syntax
- Run `npx prisma validate` to check for errors
- If stuck: `npm run db:reset` (⚠️ deletes all data)

### Port 3000 Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solution:**
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

---

## Test Coverage

**Current Status:**
- Domain logic: 196+ tests (≥90% coverage)
- Repository tests: Real Postgres database
- Component tests: Testing Library + jsdom
- E2E tests: Playwright (phases 2+ completed)

**Run specific test file:**
```bash
npm test -- src/lib/domain/__tests__/quizmaster-accounts.test.ts
```

**Check coverage:**
```bash
npm test -- --coverage
```

---

## Deployment (Railway.app)

See [README.md](README.md) for Railway deployment instructions.

Quick reference:
1. Push to GitHub
2. Connect repo to Railway
3. Railway auto-detects Node.js project
4. Add PostgreSQL plugin
5. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `LOG_DIR`
6. Deploy

---

## Performance Tips

### Avoid N+1 Queries

```typescript
// ❌ Bad: N queries
const hosts = await hostRepo.findByQuizmaster(qmId);
for (const host of hosts) {
  const games = await gameRepo.findByHost(host.id); // N queries
}

// ✅ Good: 1 query with include
const hosts = await hostRepo.findByQuizmaster(qmId, {
  include: { games: true } // Prisma includes related data
});
```

### Defer Heavy Operations

```typescript
// ❌ Bad: Blocks request
app.post('/score', async (req, res) => {
  await calculateLeaderboard(); // Slow!
  res.json({ ok: true });
});

// ✅ Good: Queue for later
app.post('/score', async (req, res) => {
  queue.add(() => calculateLeaderboard()); // Fire and forget
  res.json({ ok: true });
});
```

---

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Write tests first (TDD)
3. Implement feature
4. Run `npm test` to verify
5. Commit with clear message
6. Push and create pull request

---

**Happy coding! 🚀**

For questions, check [USER_GUIDE.md](USER_GUIDE.md) or open an issue on GitHub.
