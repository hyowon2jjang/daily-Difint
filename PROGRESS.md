# dailyDifint — Progress & Roadmap

## Current State (2026-05-07)

Full-stack calculus daily challenge app live in production.

| Layer | URL |
|---|---|
| Frontend | https://daily-difint.vercel.app |
| Backend | https://daily-difint.onrender.com |
| Database | Neon (PostgreSQL, serverless) |

---

## Infrastructure

- **Database:** Neon PostgreSQL — 15 tables (13 original + `post_upvotes`)
- **Backend:** FastAPI on Render (free tier, kept alive via UptimeRobot 5-min pings)
- **Frontend:** React/Vite static build on Vercel
- **Python version:** pinned to 3.11.9 via `backend/.python-version`
- **SSL:** asyncpg SSL handled via `connect_args` in `database.py` (sslmode stripped from URL)
- **CORS:** configured via `ALLOWED_ORIGINS` env var on Render
- **Routing:** `frontend/vercel.json` rewrites all paths to `index.html` for React Router

### Render Environment Variables
```
DATABASE_URL=postgresql+asyncpg://...neon.tech/...
SECRET_KEY=<64-char hex>
ADMIN_USERNAMES=wonlee,admin2
ALLOWED_ORIGINS=https://daily-difint.vercel.app
```

### Vercel Environment Variables
```
VITE_API_URL=https://daily-difint.onrender.com
```

### Local Dev
```
DATABASE_URL=postgresql+asyncpg://postgres:<password>@localhost/dailydifint
SECRET_KEY=<same as production>
ADMIN_USERNAMES=wonlee,admin2
```

---

## Backend (FastAPI + PostgreSQL + SQLAlchemy async)

### Auth `/auth`
- `POST /auth/register` — username, email, password, optional friend code (+50 XP both)
- `POST /auth/login` — returns JWT (7-day expiry)

### Daily `/daily`
- `GET /daily/today` — today's 4 problems from `daily_schedule`
- `GET /daily/status` — solved problem IDs + current streak count (JWT required)
  - Falls back to yesterday's completed streak count if today's row doesn't exist yet
- `POST /daily/submit` — SymPy CAS + numeric fallback answer check; awards XP + updates streak
  - XP: easy=10, medium=25, boss=50
  - Returns `xp_earned`, `streak`, `correct`, `attempt_number`
  - Supports `guest_session` UUID for guest attempt tracking
- Streak logic: creates/upserts `streaks` row per day; chains correctly from yesterday

### Community `/community`
- `GET /community` — paginated feed, sort by hot/new/most-solved, filter by tag
- `POST /community` — create Problem + CommunityPost (auto-approved)
- `POST /community/{id}/upvote` — unique constraint via `post_upvotes` table; 400 if duplicate
- `GET /community/{id}/comments` — all comments with username
- `POST /community/{id}/comment` — add comment
- `POST /community/{id}/solve` — increment solve_count; blocks duplicate via `UserAttempt`

### Leaderboard `/leaderboard`
- `GET /leaderboard?period=weekly|monthly` — XP sum from `xp_ledger` per period

### Profile `/profile`
- `GET /profile/{username}` — XP, level, streak, friend code, level progress %, XP last 7 days, 6-month solve calendar, topic stats, badges, boss solve count, accuracy

### Admin `/admin`
- `GET /admin/problems` — list all problems in pool (includes `answer_latex`)
- `POST /admin/problems` — create problem (admin only)
- `GET /admin/schedule` — list last 30 scheduled dates
- `POST /admin/schedule` — schedule 4 problems for a date
- `DELETE /admin/schedule/{date}` — remove a scheduled day

---

## Frontend (React 18 + Vite + TailwindCSS)

### Pages
| Route | Description |
|-------|-------------|
| `/` | Landing — hero + feature cards |
| `/daily` | Daily challenge — tabbed Easy1/Easy2/Medium/Boss |
| `/community` | Feed with submit modal, upvote, Try It, Discuss |
| `/leaderboard` | Weekly/monthly rankings, clickable rows → profile |
| `/profile/:username` | Stats, XP chart, solve calendar, logout (own profile) |
| `/login` `/signup` | Auth pages |
| `/admin` | Admin panel — create problems, schedule days, view problem pool with answers |

### Key Components
- **ProblemCard** — answer input, attempt tracker, cooldown system
  - Medium: 60s cooldown after 3 wrong attempts; persists via `localStorage`
  - Boss: 1 attempt only
  - Shows `+XP` badge on correct, red "Incorrect — try again." on wrong
  - Guests: UUID `guest_session` from localStorage sent with every submit
- **DailyChallenge** — shows sign-up prompt modal when guest completes all 3 required problems
- **LatexCheatSheet** — collapsible, 5 sections, click-to-copy
- **MathDisplay** — KaTeX wrapper, null-safe
- **Navbar** — streak 🔥, avatar → profile, Admin link (admin only), login/signup
- **BottomNav** — fixed mobile bottom tab bar; hidden on desktop `md:`

### State
- Zustand store (localStorage): `user`, `token`, `streak`
- Streak synced from DB on app load + after each correct solve

---

## Answer Checker

Pipeline: SymPy CAS symbolic check → multi-range numeric fallback.

Numeric checker tries 5 sample ranges in order and accepts the first where both expressions are real and finite:
1. `(1.5, 8.0)` — default, avoids x=1 singularity
2. `(0.1, 0.9)` — (0,1) domain for arcsin/arccos type
3. `(8.0, 20.0)` — large x
4. `(-0.9, -0.1)` — negative domain
5. `(-8.0, -1.5)` — large negative

This handles cases like `ln((x-1)/(x+1))` vs `ln|(x-1)/(x+1)|` which differ only in domain.

---

## Seed / Utility Scripts

| Script | Purpose |
|--------|---------|
| `create_tables.py` | Create all DB tables from SQLAlchemy models |
| `add_upvote_table.py` | Create `post_upvotes` table |
| `seed.py` | Insert 4 sample problems + today's schedule |
| `seed_problems.py` | Insert 20 easy + 10 medium + 5 boss problems |
| `add_daily.py` | Schedule problems for any date |
| `schedule_30days.py` | Auto-schedule next 30 days from pool; skips existing dates |
| `test_checker.py` | Verify SymPy answer checker works |

---

## Running Locally (Quick Reference)

```bash
# Backend
cd dailyDifint/backend
source venv/Scripts/activate
python -m uvicorn main:app --reload --port 8001

# Frontend (separate terminal)
cd dailyDifint/frontend
npm run dev
```

- API docs: http://localhost:8001/docs
- App: http://localhost:5173
- Admin: http://localhost:5173/admin

### Pointing scripts at Neon (PowerShell)
```powershell
$env:DATABASE_URL = "postgresql+asyncpg://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require"
python schedule_30days.py
```

### Fresh setup order (against Neon)
```bash
python create_tables.py
python add_upvote_table.py
python seed_problems.py
python schedule_30days.py   # run every ~3 weeks
```

---

## Known Limitations

- **No Alembic migrations** — schema changes require manual scripts
- **Render cold start** — mitigated by UptimeRobot 5-min pings (free tier)
- **Neon pauses** — pauses DB after inactivity on free tier; UptimeRobot pings also keep this alive
- **Timezone** — server runs UTC; `schedule_30days.py` uses local date when run locally
- **Topic stats not tracked** — `topic_stats` table exists but nothing writes to it on solve
- **Upvote not persisted on frontend reload** — DB blocks duplicate, but button shows un-upvoted after refresh
- **No email verification** at signup
- **No nudge / friend system UI** — models exist, no endpoints
- **No DB indexes** — full table scans on `UserAttempt`, `Streak`, `XPLedger`
- **No rate limiting** — submit endpoint can be spammed
- **Answer checker tolerance** — `1e-6` may reject valid answers; consider `1e-5`

---

## Remaining Pre-Launch Tasks

### Must Do
1. **Re-run `schedule_30days.py` every ~3 weeks** — problems run out after 30 days; the admin panel shows when the last scheduled date is
2. **Add DB indexes** — add before heavy traffic:
   ```python
   Index('ix_ua_user_problem', 'user_id', 'problem_id'),   # UserAttempt
   Index('ix_streak_user_date', 'user_id', 'date'),         # Streak
   Index('ix_xp_user_created', 'user_id', 'created_at'),   # XPLedger
   ```

### Strongly Recommended
3. **Track topic stats on solve** — Technique Strength radar on profiles is always empty. In `daily.py submit_answer`, after a correct solve, upsert `TopicStat` for each tag in `problem.technique_tags`.
4. **Persist upvote state** — add `GET /community/my-upvotes` endpoint so buttons show correctly after refresh.
5. **Rate limiting** — add `slowapi` to limit submit attempts (e.g. 20/min per IP).
6. **Answer checker tolerance** — change `TOLERANCE = 1e-6` to `1e-5` in `answer_checker.py`.

### Nice to Have
7. **Badge awarding** — wire up at least first solve, 7-day streak, boss killer badges.
8. **Loading states** — add skeleton loaders or spinners on slow API calls.
9. **404 page** — add a fallback `<Route path="*">` for unknown URLs.
