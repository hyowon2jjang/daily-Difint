# dailyDifint — Progress & Roadmap

## Current State (2026-04-24)

Full-stack calculus daily challenge app running locally. Core features complete and tested.

---

## Infrastructure

- PostgreSQL database `dailydifint` — 15 tables (13 original + `post_upvotes`)
- Python venv with all dependencies installed
- Backend: `http://localhost:8001` (port 8001 — 8000 was occupied)
- Frontend: `http://localhost:5173`
- Admin panel: `http://localhost:5173/admin` (login as wonlee or admin2)

### Dependency fixes required on fresh install
```bash
pip install "bcrypt==3.2.2"          # passlib 1.7.4 incompatibility
pip install antlr4-python3-runtime==4.11  # SymPy LaTeX parser
```

---

## Backend (FastAPI + PostgreSQL + SQLAlchemy async)

### Auth `/auth`
- `POST /auth/register` — username, email, password, optional friend code (+50 XP both)
- `POST /auth/login` — returns JWT (7-day expiry)

### Daily Challenge `/daily`
- `GET /daily/today` — today's 4 problems from `daily_schedule`
- `GET /daily/status` — solved problem IDs + current streak count (JWT required)
- `POST /daily/submit` — SymPy CAS + numeric fallback answer check; awards XP + updates streak
  - XP: easy=10, medium=25, boss=50
  - Returns `xp_earned`, `streak`, `correct`, `attempt_number`
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

### Admin `/admin` ⭐ new
- `GET /admin/problems` — list all problems in pool
- `POST /admin/problems` — create problem (admin only)
- `GET /admin/schedule` — list last 30 scheduled dates
- `POST /admin/schedule` — schedule 4 problems for a date
- `DELETE /admin/schedule/{date}` — remove a scheduled day
- Admin check: compares JWT username against `ADMIN_USERNAMES` in `.env`

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
| `/admin` | Admin panel — create problems, schedule days |

### Key Components
- **ProblemCard** — answer input, attempt tracker, cooldown system
  - Medium: 60s cooldown after 3 wrong attempts; persists via `localStorage`
  - Boss: 1 attempt only
  - Shows `+XP` badge on correct
- **LatexCheatSheet** — collapsible, 5 sections (Powers, Trig, Exp/Log, Calculus, Greek), rendered math + code, click-to-copy with green flash feedback
- **MathDisplay** — KaTeX wrapper, null-safe, clears on re-render
- **Navbar** — streak 🔥, avatar → profile, Admin link (admin only), login/signup
- **BottomNav** ⭐ new — fixed mobile bottom tab bar (Daily, Community, Ranks, Profile icons); hidden on desktop `md:`
- **SubmitModal** — live LaTeX preview while typing problem + answer

### State
- Zustand store (localStorage): `user`, `token`, `streak`
- Streak synced from DB on app load + after each correct solve

### Community PostRow
- Upvote: DB-enforced once-per-user, button locks after click
- Try It: inline solver → "✓ Solve Again" after first correct (no duplicate solve count)
- Discuss: lazy-loaded comments, inline post form

---

## Seed / Utility Scripts

| Script | Purpose |
|--------|---------|
| `create_tables.py` | Create all DB tables from SQLAlchemy models |
| `add_upvote_table.py` | Create `post_upvotes` table (one-time migration) |
| `seed.py` | Insert 4 sample problems + today's schedule |
| `seed_problems.py` | ⭐ Insert 20 easy + 10 medium + 5 boss problems |
| `add_daily.py` | ⭐ Script to schedule problems for any date |
| `test_checker.py` | Verify SymPy answer checker works |

---

## Bug Fixes Applied (2026-04-24 Code Audit)

- **AttemptTracker** — fixed off-by-one in dot color logic
- **Streak chaining** — now correctly increments from yesterday's count
- **level_pct** — capped at 100% with `min(100, ...)`
- **boss_solved** — now queries `UserAttempt JOIN Problem` (was hardcoded 0)
- **MAX_ATTEMPTS** — changed to `.get()` to prevent KeyError
- **Duplicate XP ledger** — removed double referral entry in auth.py
- **Null safety** — added `?.[0]?.toUpperCase() ?? '?'` in Navbar + Leaderboard
- **MathDisplay** — null guard + `innerHTML = ''` clear before re-render
- **Comment fetch** — wrapped in try/catch
- **Mobile layout** — ProfilePage stats `grid-cols-1 sm:grid-cols-2`; Community buttons `flex-wrap`; LatexCheatSheet `minmax(160px)`

---

## Known Limitations

- **No Alembic migrations** — schema changes require manual scripts
- **No daily schedule automation** — admin must manually schedule each day via admin panel
- **Topic stats not tracked** — `topic_stats` table exists but nothing writes to it on solve
- **Upvote not persisted on frontend reload** — DB blocks duplicate, but button shows un-upvoted after refresh
- **No email verification** at signup
- **No nudge / friend system UI** — models exist, no endpoints
- **No DB indexes** — full table scans on `UserAttempt`, `Streak`, `XPLedger`
- **Answer checker tolerance** — `1e-6` may reject valid answers; consider `1e-5`
- **No rate limiting** — submit endpoint can be spammed

---

## Pre-Publish Checklist

### 🔴 Must Fix Before Launch

1. **Change SECRET_KEY** — `hello` in `.env` is insecure; generate a strong random key:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Schedule problems for upcoming days** — admin panel → Schedule Day. Without this, `/daily/today` returns 404 and the app shows nothing. Schedule at least 2 weeks ahead.

3. **Set strong DB password** — change from `asdf` to something secure before any public deployment.

4. **Add DB indexes** — add to `models.py` before deploying to avoid slow queries under load:
   ```python
   # In UserAttempt.__table_args__
   Index('ix_ua_user_problem', 'user_id', 'problem_id'),
   # In Streak.__table_args__
   Index('ix_streak_user_date', 'user_id', 'date'),
   # In XPLedger
   Index('ix_xp_user_created', 'user_id', 'created_at'),
   ```

5. **CORS origins** — add production frontend URL to `main.py` `allow_origins` list.

6. **Fix FIREBASE_CREDENTIALS_PATH** — either remove Firebase entirely from requirements and code, or supply real credentials. Currently it silently errors on startup.

### 🟡 Strongly Recommended

7. **Track topic stats on solve** — the Technique Strength radar on profiles is always empty. In `daily.py submit_answer`, after a correct solve, upsert `TopicStat` for each tag in `problem.technique_tags`.

8. **Persist upvote state** — add `GET /community/my-upvotes` endpoint; on community load, mark already-upvoted posts so the button shows correctly after refresh.

9. **Rate limiting** — add `slowapi` to limit submit attempts (e.g. 20/min per IP) to prevent spam.

10. **Answer checker tolerance** — change `TOLERANCE = 1e-6` to `1e-5` in `answer_checker.py` to reduce false negatives.

11. **Automate daily scheduling** — build a simple cron or manual weekly workflow to pre-schedule problems. Without this, the app goes dark whenever an admin forgets.

### 🟢 Nice to Have Before Launch

12. **Badge awarding** — wire up at least 2-3 badges (e.g. first solve, 7-day streak, boss killer) to make the badge section on profiles non-empty.

13. **Mobile: Navbar links** — the top navbar links (Daily, Community, Leaderboard) are `hidden md:flex`. On tablets they're also invisible. Consider showing them at `sm:` breakpoint.

14. **Landing page CTAs** — make sure the "Start Today" / "Sign Up" buttons route correctly and the hero section looks good on mobile.

15. **404 page** — add a fallback `<Route path="*">` so unknown URLs don't show a blank screen.

16. **Loading states** — several pages show nothing if the API is slow. Add skeleton loaders or at minimum a spinner.

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

### Fresh setup order
```bash
python create_tables.py        # create DB schema
python add_upvote_table.py     # create post_upvotes table
python seed_problems.py        # load 35 problems into pool
# then go to /admin → Schedule Day to set up today + upcoming dates
```
