# QuizWiz

**Live bar trivia scoring platform for Head Games Trivia**

*"Eat. Drink. Think. WIN!"*

QuizWiz is a real-time trivia game system that enables Quizmasters to create and host games, Hosts to run games with live grading, and Teams to compete on a public scoreboard.

---

## 📖 Documentation

- **[User Guide](USER_GUIDE.md)** — For end users (Quizmasters, Hosts, Teams)
  - How to create trivia packages
  - Running games and grading answers
  - Team joining and answering
  - Troubleshooting
  
- **[Setup Guide](SETUP.md)** — For developers
  - Quick start (5 minutes)
  - Project structure
  - Architecture overview
  - Development workflow
  - Debugging and common issues

---

## 🚀 Quick Start

### For Users

1. **Quizmaster:** Sign up with invite code → Create trivia packages → Manage hosts
2. **Host:** Accept invite → Start a game → Grade answers in real-time
3. **Team:** Scan QR code → Submit answers → Check scoreboard

### For Developers

```bash
# Clone and setup
git clone https://github.com/BrettSEvans/quizwiz.git
cd quizwiz
npm run setup

# Start dev server
npm run dev

# Run tests
npm test
```

See [SETUP.md](SETUP.md) for detailed development instructions.

---

## 🏗️ Architecture

**Stack:**
- Frontend: React 19 + Next.js 15 (App Router) + Tailwind CSS v4
- Backend: Node.js + Express + Socket.IO
- Database: PostgreSQL + Prisma ORM
- Testing: Vitest + Playwright
- Auth: JWT + bcrypt
- Design: Bauhaus + Head Games branding

**Key Features:**
- Real-time scoreboard with Socket.IO
- Game state machine (registration → active → locked → published)
- Test-driven development (196+ tests)
- Soft-delete pattern for data recovery
- Game resume capability
- Multi-venue analytics
- Host flexibility (pause, void, award, skip)

---

## 📊 Progress

**Completed:**
- ✅ Phase 0 — Project scaffolding
- ✅ Phase 1 — Vertical MVP (full game loop)
- ✅ Phase 2 — Quizmaster Portal (package authoring)
- ✅ Phase 3 — Host flexibility (overrides, manual teams, pause/resume)
- ✅ Phase 4 — Scoreboard enhancements (per-round breakdown, tiebreaker, paging)
- ✅ Phase 6.1-6.4 — Auth domain & database (Quizmaster accounts, Host management, JWT)

**In Progress:**
- 🔄 Phase 6.5-6.9 — Auth flows & UI (API routes, sign-up, join flows, E2E tests)
- 🔄 Phase 5 — Reporting & analytics (game archives, cross-venue insights)

**Test Coverage:** 271 tests passing (out of 300)

---

## 🌐 Deployment

Deploy to **Railway.app** (recommended) or any Node.js host:

```bash
# Build
npm run build

# Start
npm start
```

**Environment variables:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
LOG_DIR=/data/logs
NODE_ENV=production
PORT=3000
```

For Railway-specific instructions, see [SETUP.md](SETUP.md#deployment-railwayapp).

---

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server with auto-reload
npm run dev:daemon      # Run in background (logs to logs.txt)

# Testing
npm test                # Run all tests
npm run test:ui         # Open test dashboard
npm test -- --watch    # Watch mode

# Database
npm run setup           # Install deps + run migrations + generate Prisma client
npm run db:reset        # ⚠️ Delete all data and reset schema

# Production
npm run build           # Build Next.js app
npm start              # Start production server
npm run lint           # Run ESLint
```

---

## 🔑 Key Concepts

### Test-Driven Development (TDD)
All domain logic is tested first (red → green → refactor). Tests are in `src/lib/domain/__tests__/`.

### Pure Domain Functions
Business logic has no side effects and lives in `src/lib/domain/` (e.g., `scoring.ts`, `game-state.ts`).

### Repositories Pattern
All database access goes through repositories in `src/lib/db/repositories.ts`.

### Socket.IO Real-time
Custom Node server wraps Next.js. Game state is in-memory, persisted to database on critical events.

### State Machine
Games follow strict state transitions: registration → active → locked → published → completed.

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js routes
│   ├── page.tsx                 # Landing
│   ├── auth/                    # Auth flows
│   ├── host/                    # Host control panel
│   ├── play/[token]/            # Team app
│   ├── board/[token]/           # Scoreboard
│   ├── quizmaster/              # QM portal
│   └── api/                     # REST endpoints
├── components/                   # React components
│   ├── primitives/              # Bauhaus design system
│   └── [feature]/               # Feature components
├── lib/
│   ├── domain/                  # Pure business logic (TDD)
│   ├── db/                      # Database (Prisma)
│   ├── auth/                    # Authentication
│   ├── logger/                  # System logging
│   ├── realtime/                # Socket.IO handlers
│   └── contexts/                # React contexts
└── middleware.ts                # Auth middleware

server.ts                         # Custom Node server
prisma/schema.prisma            # Database schema
```

---

## 🐛 Troubleshooting

**Can't connect to database?**
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- See [SETUP.md](SETUP.md#troubleshooting)

**Tests failing?**
- Run `npm test` to see specific errors
- Check `src/lib/domain/__tests__/` for test examples
- See [SETUP.md](SETUP.md#debugging)

**Socket.IO connection issues?**
- Check server is running (`npm run dev`)
- Browser DevTools → Network → WS (WebSocket)
- See [SETUP.md](SETUP.md#debugging)

For more, see [USER_GUIDE.md](USER_GUIDE.md#troubleshooting) or open an issue.

---

## 🤝 Contributing

1. Read [SETUP.md](SETUP.md#contributing)
2. Create feature branch: `git checkout -b feature/my-feature`
3. Write tests first (TDD)
4. Run `npm test` to verify
5. Commit: `git commit -m "feature: clear description"`
6. Push and open PR

---

## 📄 License

MIT — See LICENSE file

---

## 👥 Team

Built with ❤️ for Head Games Trivia

**Repository:** https://github.com/BrettSEvans/quizwiz

---

**Status:** Early development (v0.1.0)  
**Last Updated:** 2026-06-17  
**Tests:** 271 passing, 29 pending
