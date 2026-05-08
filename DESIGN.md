# dailyDifint — Full Design Document

**Version:** 1.1  
**Date:** 2026-05-07  
**Author:** Won Lee

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Site Architecture](#3-site-architecture)
4. [Daily Challenge Page](#4-daily-challenge-page)
5. [Community Page](#6-community-page)
6. [Technique Tag System](#6-technique-tag-system)
7. [Gamification System](#7-gamification-system)
8. [Friend System](#8-friend-system)
9. [User Profile & Weakness Tracking](#9-user-profile--weakness-tracking)
10. [Answer Checking Pipeline](#10-answer-checking-pipeline)
11. [Problem Management](#11-problem-management)
12. [Leaderboard](#12-leaderboard)
13. [Guest vs Account Experience](#13-guest-vs-account-experience)
14. [Database Schema](#14-database-schema)
15. [API Structure](#15-api-structure)
16. [Frontend Component Tree](#16-frontend-component-tree)
17. [Open Design Decisions](#17-open-design-decisions)

---

## 1. Project Overview

**dailyDifint** is a daily math practice platform focused on differential and integral calculus techniques. It is designed for undergrads and self-learners who enjoy problem solving.

### Core Philosophy
- Closer to **Wordle** than to a textbook — one clean daily challenge, shareable results, social pressure through streaks
- **Technique-focused** — problems are tagged by technique, not just topic. The goal is mastery of methods.
- **Low friction** — guests can play immediately without signing up. Accounts give advantages, not access.
- **Community-driven** — users can submit and discuss interesting problems alongside the curated daily set.

### Two Main Surfaces
| Surface | Purpose |
|---|---|
| Daily Challenge | Curated daily problems with streaks, XP, and leaderboard |
| Community | User-submitted problems, discussion, collaborative solving |

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | React + Vite | Fast dev, component model, mobile-first |
| Styling | TailwindCSS | Utility-first, responsive design easy |
| Math rendering | KaTeX | Fast, lightweight LaTeX rendering in-browser |
| Math input | Plain text (LaTeX) | MathQuill not implemented; users type raw LaTeX with cheat sheet |
| Backend | Python (FastAPI) | Fast API, native SymPy integration |
| CAS engine | SymPy | Symbolic answer equivalence checking |
| Numeric verification | NumPy | Fallback multi-range numeric sampling check |
| Database | PostgreSQL (Neon) | Serverless Neon on free tier |
| Auth | JWT (python-jose) | Firebase not used; custom JWT auth |
| Hosting | Render (backend) + Vercel (frontend) + Neon (DB) | All free tiers; Render kept alive via UptimeRobot |

---

## 3. Site Architecture

### Routes
```
/                        Landing page — today's problem preview, sign-up CTA
/daily                   Daily challenge page (main experience)
/community               Community problem feed and discussion
/community/:problem_id   Individual problem thread
/leaderboard             Weekly / monthly global leaderboard
/profile/:username       User profile, stats, badges, weakness chart
/submit                  Submit a community problem (account required)
/login                   Login page
/signup                  Signup page (with optional friend code field)
/admin                   Admin panel — problem review queue (you only)
```

### Page Hierarchy
```
App
├── Navbar (streak indicator, XP, avatar/login button)
├── / (Landing)
├── /daily (Daily Challenge)
├── /community (Community Feed)
│   └── /community/:id (Problem Thread)
├── /leaderboard
├── /profile/:username
├── /submit
├── /login  /signup
└── /admin
```

---

## 4. Daily Challenge Page

### Schedule

| Day | Problem Set |
|---|---|
| Monday – Friday | 2 Easy + 1 Medium |
| Saturday – Sunday | 2 Easy + 1 Medium + 1 Boss |

All users worldwide see the **same problems on the same day**. Problems rotate at **midnight UTC** but streaks reset at **midnight local time** per user.

### Difficulty Definitions

Difficulty is based on **computation length and number of steps**, not just technique complexity:

| Level | Steps | Technique Count | Description |
|---|---|---|---|
| Easy | 1–2 | 1 | Direct application of a single technique, clean answer |
| Medium | 3–4 | 1–2 | May chain two techniques or require more algebraic manipulation |
| Boss | 5+ | 2–3 | Multi-step, combines techniques, longer computation, appears weekends only |

### Streak Rule
- **Completing Easy x2 + Medium x1 = streak maintained.**
- Boss problems are **bonus only** — they give extra XP and a special badge but do not gate the streak.
- A day is "completed" when all 3 required problems are solved, evaluated at **midnight local time**.

### Page Layout (Mobile-First)

```
┌─────────────────────────────────────────┐
│  dailyDifint         🔥 Streak: 7  [👤] │
│  Friday, Apr 11                         │
├─────────────────────────────────────────┤
│  [Easy 1] [Easy 2] [Medium] [Boss 🔒]   │  ← tab per problem, Boss locked weekdays
├─────────────────────────────────────────┤
│                                         │
│  Technique: integration-by-parts        │
│                                         │
│  Evaluate the integral:                 │
│                                         │
│       ∫ x · eˣ dx                       │
│                                         │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │  x eˣ − eˣ + C         [×] [÷]   │  │  ← MathQuill input
│  │  [sin] [cos] [∫] [√] [^] [frac]  │  │
│  └───────────────────────────────────┘  │
│  [ Submit Answer ]                      │
├─────────────────────────────────────────┤
│  Attempts: ● ● ○   (Easy: unlimited,    │
│             Medium: 3,  Boss: 1)        │
└─────────────────────────────────────────┘
```

### Attempt Rules

| Difficulty | Attempts |
|---|---|
| Easy | Unlimited — learning-focused |
| Medium | 3 attempts |
| Boss | 1 attempt — high stakes |

### After Correct Submission

- Green flash animation + XP gained popup
- Problem tab turns green with checkmark
- **Share card** generated (Wordle-style) — shows attempt count, no answer spoiler
  ```
  dailyDifint  Apr 11 2026
  Easy 1:  ✅ (1 attempt)
  Easy 2:  ✅ (2 attempts)
  Medium:  ✅ (3 attempts)
  🔥 Streak: 8
  ```
- If all 3 required done: streak increment animation, daily completion banner
- If guest: soft prompt — "Sign up to save your streak"

### After Wrong Submission

- Red shake animation
- Attempt counter decrements
- No hints given (answer is final answer only, no step feedback)
- On last failed attempt: correct answer is revealed with a brief note on the technique used

---

## 5. Community Page

### Feed Layout

```
┌─────────────────────────────────────────────┐
│  Community                  [+ Submit]       │
│                                              │
│  Technique filter:                           │
│  [All] [u-sub] [IBP] [trig-sub] [ODE] [▼]  │
│  Sort: [Hot ▼]  [New]  [Most Solved]         │
├─────────────────────────────────────────────┤
│  ▲ 42   Evaluate ∫ x²·ln(x) dx              │
│          Tags: integration-by-parts          │
│          Posted by @wonlee · 12 solves       │
│          [ Discuss (5) ]   [ Try It ]        │
├─────────────────────────────────────────────┤
│  ▲ 18   Solve dy/dx = x·y²                  │
│          Tags: separable-ode                 │
│          Posted by @user2 · 3 solves         │
│          [ Discuss (1) ]   [ Try It ]        │
└─────────────────────────────────────────────┘
```

### Individual Problem Thread

```
┌──────────────────────────────────────────┐
│  ← Back to Community                     │
│                                          │
│  Evaluate ∫ x²·ln(x) dx                  │
│  Tags: integration-by-parts              │
│  ▲ 42 upvotes · 12 solves · 5 comments  │
│                                          │
│  [ Try It — solve inline ]               │
│  ┌────────────────────────────────────┐  │
│  │  MathQuill input + Submit          │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Discussion                              │
│  ──────────────────────────────────────  │
│  @user3: "Nice problem, IBP twice!"      │
│  @wonlee: "Yes, tabular method works"    │
│  [ Add a comment... ]                    │
└──────────────────────────────────────────┘
```

### Community Rules
- Guests can **read and try** problems but cannot submit or comment
- Users can upvote problems and mark them as solved
- Submitted problems go into a **pending review queue** before appearing publicly
- Admin (you) can approve, reject, or edit submissions
- Approved community problems can optionally be **promoted to a future daily problem**

### Sorting Algorithms
- **Hot** — upvotes weighted by recency (like Reddit hot)
- **New** — most recently approved
- **Most Solved** — by total solve count

---

## 6. Technique Tag System

These tags are used on both daily problems and community posts. Each problem can have **1–3 tags**.

### Integration Tags

| Tag | Description | Example |
|---|---|---|
| `u-substitution` | Chain rule in reverse | ∫ 2x·cos(x²) dx |
| `integration-by-parts` | ∫ u dv = uv − ∫ v du | ∫ x·eˣ dx |
| `trig-substitution` | Substitute trig to eliminate radicals | ∫ √(1−x²) dx |
| `partial-fractions` | Decompose rational functions | ∫ 1/(x²−1) dx |
| `trig-integrals` | Powers of sin/cos, tan/sec etc. | ∫ sin³x·cos²x dx |
| `improper-integrals` | Infinite bounds or discontinuities | ∫₀^∞ e^−x dx |
| `feynman-technique` | Differentiation under the integral sign | Classic Feynman trick problems |
| `reduction-formula` | Recursive integral formula | ∫ sinⁿx dx |
| `tabular-integration` | Systematic IBP for repeated use | ∫ x³·eˣ dx |

### Differential Equation Tags

| Tag | Description | Example |
|---|---|---|
| `separable-ode` | Separate variables, integrate both sides | dy/dx = xy |
| `linear-first-order` | Integrating factor method | dy/dx + P(x)y = Q(x) |
| `exact-equations` | M dx + N dy = 0 with ∂M/∂y = ∂N/∂x | Standard exact ODE |
| `homogeneous-ode` | Substitution v = y/x | dy/dx = f(y/x) |
| `bernoulli-equation` | Nonlinear, reducible by substitution | dy/dx + P(x)y = Q(x)yⁿ |
| `second-order-linear` | Characteristic equation | y'' + py' + qy = 0 |
| `undetermined-coefficients` | Particular solution by guessing form | y'' + y = sin(x) |
| `variation-of-parameters` | Particular solution — general method | Non-constant forcing |
| `laplace-transform` | Transform to algebraic, invert | L{f(t)}, L⁻¹{F(s)} |

---

## 7. Gamification System

### XP Table

| Action | XP |
|---|---|
| Solve Easy (any attempt) | 10 |
| Solve Medium — 1st attempt | 30 |
| Solve Medium — 2nd attempt | 20 |
| Solve Medium — 3rd attempt | 10 |
| Solve Boss — 1 attempt | 80 |
| Complete full daily set (streak maintained) | +15 bonus |
| 7-day streak milestone | +25 bonus |
| 30-day streak milestone | +100 bonus |
| Friend referral — both referrer and new user | +50 each |
| Community problem upvoted (per upvote, capped at 20/problem) | +3 |
| Community problem promoted to daily | +30 |

### Streak Rules
- Each user has **one streak counter** — it tracks consecutive days completing the required set (Easy x2 + Medium x1)
- Streak increments once per day, after completing all 3 required problems
- Streak resets at **midnight local time** — if the required set is not completed by then, streak goes to 0
- No freeze mechanic — keeps competition meaningful
- Guest streaks stored in `localStorage` — displayed with a banner: "Create an account to keep this streak forever"

### Levels
XP thresholds for levels (suggested, adjust after playtesting):

| Level | XP Required | Title |
|---|---|---|
| 1 | 0 | Freshman |
| 2 | 100 | Integrator |
| 3 | 300 | Chain Ruler |
| 4 | 600 | Substitutionist |
| 5 | 1,000 | Differentiator |
| 6 | 1,500 | Series Solver |
| 7 | 2,500 | Transform Master |
| 8 | 4,000 | Analyst |
| 9 | 6,000 | Calculus Scholar |
| 10 | 10,000 | Grandmaster |

### Badges

| Badge | Condition |
|---|---|
| **First Blood** | Solve your first problem |
| **On a Roll** | 7-day streak |
| **Month Strong** | 30-day streak |
| **Century** | 100-day streak |
| **Weekend Warrior** | Complete Boss problem 4 weekends in a row |
| **Boss Slayer** | Solve Boss on the first attempt |
| **Flawless** | Complete a full week with every Medium on 1st attempt |
| **Integration Machine** | Solve 50 integral problems |
| **ODE Whisperer** | Solve 30 ODE problems |
| **IBP Expert** | Solve 20 integration-by-parts problems |
| **All-Rounder** | Solve at least 5 problems in every technique category |
| **Community Contributor** | Submit 5 approved community problems |
| **Crowd Pleaser** | Have a community problem reach 50 upvotes |
| **Nudger** | Nudge a friend who then completes the daily set |
| **Chain Reaction** | Have a friend you referred reach a 30-day streak |
| **Early Bird** | Complete daily set before 9am local time |

---

## 8. Friend System

### Friend Code
- Every account is assigned a unique **6-character alphanumeric friend code** (e.g., `DIF-3K9`)
- On signup, there is an optional "Enter a friend's code" field
- If a valid code is entered: **both the new user and the referrer receive +50 XP**
- This is a one-time bonus per referral

### Friend List
- Users can add friends by searching username or entering their code
- Friend list shows for each friend:
  - Username and avatar
  - Current streak count
  - Today's status: `Done ✅` or `Not yet ⏳`
- Friend list is visible on the profile page

### Nudge
- If a friend has **not completed today's set**, a **Nudge** button appears next to their name
- Sending a nudge sends a Firebase push notification to the friend: *"@username is waiting — go solve today's problems!"*
- One nudge per friend per calendar day
- Nudge count is tracked (badge opportunity for nudging)

---

## 9. User Profile & Weakness Tracking

### Profile Layout

```
┌────────────────────────────────────────┐
│  [Avatar]   @wonlee                    │
│  Level 7 — Transform Master            │
│  2,340 XP   🔥 Streak: 14 days         │
│  Friend Code: DIF-3K9  [Copy]          │
├────────────────────────────────────────┤
│  Badges                                │
│  [First Blood] [On a Roll] [Boss ...]  │
├────────────────────────────────────────┤
│  Weakness Radar                        │
│                                        │
│         trig-sub ●●●                   │
│         IBP      ●●○                   │
│         u-sub    ●●●                   │
│         sep-ODE  ●○○  ← weak           │
│         laplace  ●○○  ← weak           │
│                                        │
├────────────────────────────────────────┤
│  Stats                                 │
│  Total solved: 143                     │
│  Accuracy: 78%                         │
│  Favorite technique: IBP               │
│  Boss problems solved: 6               │
├────────────────────────────────────────┤
│  Recent Activity                       │
│  Apr 11 — Full set ✅ +55 XP           │
│  Apr 10 — Full set ✅ +40 XP           │
└────────────────────────────────────────┘
```

### Weakness Tracking Logic

Every problem is tagged with 1–3 technique tags. When a user attempts a problem:
- Correct on 1st attempt → full credit for that tag
- Correct on 2nd–3rd attempt → partial credit
- Failed → negative signal

A **strength score** (0–100) is computed per tag:
```
strength = (weighted correct attempts) / (total attempts) * 100
```

Strength is displayed as a dot scale on the radar chart:
- `●●●` = strong (≥ 70%)
- `●●○` = developing (40–69%)
- `●○○` = weak (< 40%)

**Adaptive influence on daily problems:** When the problem pool has multiple valid candidates for a slot, the system gives a slight preference toward the user's weak tags. This is a soft bias, not a full curriculum lock — randomness is preserved.

---

## 10. Answer Checking Pipeline

### Input
Users enter answers using MathQuill — a calculator-style visual equation editor that outputs LaTeX internally.

### Checking Flow

```
User submits answer (LaTeX string)
         ↓
Step 1 — Normalize
  Parse with SymPy, expand and simplify both
  user answer and correct answer
         ↓
Step 2 — CAS symbolic check
  SymPy checks: simplify(user - correct) == 0
  If True → CORRECT
  If False or error → go to step 3
         ↓
Step 3 — Numeric sampling check
  Substitute N=10 random values into both expressions
  If all outputs match within tolerance → CORRECT
  If any mismatch → INCORRECT
         ↓
Result returned to frontend
```

### Special Cases

| Case | Handling |
|---|---|
| Indefinite integrals | `+ C` is required. SymPy checks up to constant — difference must be a constant |
| Equivalent trig forms | `sin²x` and `1 - cos²x` treated as equal via simplification |
| Sign differences from factoring | Normalized before comparison |
| Complex equivalent forms | e.g., `ln(2x)` vs `ln(x) + ln(2)` — handled by SymPy simplify |
| Wrong variable name | Flagged as incorrect — problems specify the variable clearly |

### Problem Design Constraint
All problems must be designed to have **clean, non-ambiguous answers** — no deeply nested radicals, no unusual special functions outside the defined scope. This is enforced at the problem creation stage.

---

## 11. Problem Management

### Problem Schema (fields)
```
id               UUID
title            Short display title (optional)
body_latex       Full problem statement in LaTeX
answer_latex     Correct answer in LaTeX (used for CAS check)
difficulty       enum: easy | medium | boss
technique_tags   array of tag strings (1–3 tags)
source           enum: admin | community_submission
status           enum: pending | approved | rejected | scheduled
submitted_by     user_id (null if admin-created)
created_at       timestamp
scheduled_date   date (if assigned to a daily slot)
notes            Admin notes (internal only)
```

### Problem Sources

**Admin-created (you):**
- Directly enter problems via admin panel
- Assigned to a daily slot immediately or queued
- No review step needed

**User-submitted:**
- Submitted via `/submit` page
- Goes into pending review queue in admin panel
- Admin can: Approve (enters problem pool), Reject (with optional note), Edit then approve
- Approved community problems appear on the community feed
- Admin can additionally promote a community problem to a future daily slot

### Admin Panel — Review Queue View
```
┌────────────────────────────────────────────┐
│  Admin — Problem Review Queue  (3 pending) │
├────────────────────────────────────────────┤
│  [Pending] [Approved] [Rejected]           │
├────────────────────────────────────────────┤
│  ∫ x·sin(x²) dx                           │
│  Tags: u-substitution  Difficulty: Easy    │
│  Submitted by: @user5  2026-04-10          │
│  [ Preview ] [ Approve ] [ Edit ] [ Reject]│
├────────────────────────────────────────────┤
│  dy/dx + 2y = e^x                          │
│  Tags: linear-first-order  Diff: Medium    │
│  Submitted by: @user7  2026-04-11          │
│  [ Preview ] [ Approve ] [ Edit ] [ Reject]│
└────────────────────────────────────────────┘
```

---

## 12. Leaderboard

### Scope
- **Global only** — no friend-filtered leaderboard
- Two time windows: **Weekly** (Mon–Sun) and **Monthly** (calendar month)
- Ranked by **XP earned within the window**, not total XP
- Guests are not ranked

### Leaderboard Row Fields
```
Rank | Avatar | Username | XP this period | Current Streak
```

### Special Styling
- Top 3 rows get gold/silver/bronze styling
- Users who are top 3 for the week/month get a **special badge border** on their avatar that week/month

### Leaderboard Reset
- Weekly: resets every Monday at 00:00 UTC
- Monthly: resets on the 1st of each month at 00:00 UTC

---

## 13. Guest vs Account Experience

| Feature | Guest | Account |
|---|---|---|
| Play daily problems | Yes | Yes |
| See problems on community | Yes | Yes |
| Try community problems | Yes | Yes |
| Streak tracking | localStorage only (volatile) | Persistent in DB |
| XP and levels | None | Full |
| Leaderboard | Not ranked | Ranked |
| Badges | None | Full |
| Post community problems | No | Yes |
| Comment on community | No | Yes |
| Friend system | No | Yes |
| Nudge friends | No | Yes |
| Weakness tracking | None | Full |
| Submit problems for review | No | Yes |
| Share result card | Yes (no streak shown) | Yes (with streak) |

### Guest Soft Prompts (non-blocking)
- After completing a problem: "Sign up to save your progress"
- After completing full daily set: "Create an account to build your streak"
- When trying to post/comment: "You need an account to do this"

---

## 14. Database Schema

### PostgreSQL Tables

```sql
-- Users
users (
  id              UUID PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE,
  firebase_uid    TEXT UNIQUE,
  xp              INTEGER DEFAULT 0,
  level           INTEGER DEFAULT 1,
  friend_code     VARCHAR(7) UNIQUE NOT NULL,  -- e.g. "DIF-3K9"
  referred_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Streaks
streaks (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  date            DATE NOT NULL,              -- local date of user
  easy1_done      BOOLEAN DEFAULT FALSE,
  easy2_done      BOOLEAN DEFAULT FALSE,
  medium_done     BOOLEAN DEFAULT FALSE,
  boss_done       BOOLEAN DEFAULT FALSE,
  streak_count    INTEGER,                   -- streak at end of this day
  UNIQUE (user_id, date)
)

-- Problems
problems (
  id              UUID PRIMARY KEY,
  title           TEXT,
  body_latex      TEXT NOT NULL,
  answer_latex    TEXT NOT NULL,
  difficulty      TEXT CHECK (difficulty IN ('easy','medium','boss')),
  technique_tags  TEXT[],
  source          TEXT CHECK (source IN ('admin','community')),
  status          TEXT CHECK (status IN ('pending','approved','rejected','scheduled')),
  submitted_by    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  admin_notes     TEXT
)

-- Daily Schedule
daily_schedule (
  date            DATE PRIMARY KEY,
  easy1_id        UUID REFERENCES problems(id),
  easy2_id        UUID REFERENCES problems(id),
  medium_id       UUID REFERENCES problems(id),
  boss_id         UUID REFERENCES problems(id)   -- NULL on weekdays
)

-- User Attempts
user_attempts (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id),     -- NULL for guests
  guest_session   TEXT,                          -- localStorage session ID for guests
  problem_id      UUID REFERENCES problems(id),
  submitted_answer TEXT NOT NULL,
  is_correct      BOOLEAN NOT NULL,
  attempt_number  INTEGER NOT NULL,
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
)

-- Topic / Technique Stats per User
topic_stats (
  user_id         UUID REFERENCES users(id),
  tag             TEXT NOT NULL,
  total_attempts  INTEGER DEFAULT 0,
  correct_first   INTEGER DEFAULT 0,            -- correct on 1st attempt
  correct_later   INTEGER DEFAULT 0,            -- correct on later attempt
  failed          INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, tag)
)

-- Badges
badges (
  id              UUID PRIMARY KEY,
  name            TEXT UNIQUE NOT NULL,
  description     TEXT,
  condition_key   TEXT                          -- maps to backend logic
)

user_badges (
  user_id         UUID REFERENCES users(id),
  badge_id        UUID REFERENCES badges(id),
  earned_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
)

-- Friends
friends (
  user_id         UUID REFERENCES users(id),
  friend_id       UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id)
)

-- Nudges
nudges (
  id              UUID PRIMARY KEY,
  from_user_id    UUID REFERENCES users(id),
  to_user_id      UUID REFERENCES users(id),
  date            DATE NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id, date)       -- one nudge per pair per day
)

-- Community Posts (wraps an approved problem with community metadata)
community_posts (
  id              UUID PRIMARY KEY,
  problem_id      UUID REFERENCES problems(id),
  posted_by       UUID REFERENCES users(id),
  upvotes         INTEGER DEFAULT 0,
  solve_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Comments
comments (
  id              UUID PRIMARY KEY,
  post_id         UUID REFERENCES community_posts(id),
  user_id         UUID REFERENCES users(id),
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- XP Ledger (audit trail)
xp_ledger (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  amount          INTEGER NOT NULL,
  reason          TEXT NOT NULL,               -- e.g. "solve_easy", "streak_bonus"
  reference_id    UUID,                        -- problem_id or null
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

---

## 15. API Structure

### Auth (JWT — no Firebase)
```
POST /auth/register          Create user in DB, return JWT
POST /auth/login             Verify password, return JWT (7-day expiry)
```

### Daily
```
GET  /daily/today            Get today's problem set (all 4 slots, boss null on weekdays)
POST /daily/submit           Submit an answer { problem_id, answer_latex }
GET  /daily/status           Get today's completion status for current user/guest
```

### Community
```
GET  /community              Get community feed (query: sort, tag, page)
GET  /community/:id          Get single problem thread + comments
POST /community              Submit a new problem (auth required)
POST /community/:id/upvote   Upvote a problem (auth required)
POST /community/:id/comment  Post a comment (auth required)
POST /community/:id/solve    Submit answer on a community problem
```

### Leaderboard
```
GET  /leaderboard            Get leaderboard (query: period=weekly|monthly)
```

### Profile
```
GET  /profile/:username      Get public profile, stats, badges
GET  /profile/me/stats       Get current user's full stats + weakness data
```

### Friends
```
GET  /friends                Get friend list with today's status
POST /friends/add            Add friend by username or friend code
POST /friends/nudge/:user_id Send nudge to a friend
```

### Admin
```
GET    /admin/problems        List all problems (with answers)
POST   /admin/problems        Create a problem (admin only)
GET    /admin/schedule        List last 30 scheduled dates
POST   /admin/schedule        Schedule 4 problems for a date
DELETE /admin/schedule/:date  Remove a scheduled day
```

---

## 16. Frontend Component Tree

```
src/
├── main.jsx
├── App.jsx
├── router.jsx
│
├── components/
│   ├── Navbar/
│   │   ├── Navbar.jsx           Streak badge, XP bar, avatar/login
│   │   └── StreakBadge.jsx
│   │
│   ├── MathInput/
│   │   ├── MathInput.jsx        MathQuill wrapper component
│   │   └── MathKeyboard.jsx     On-screen calculator keyboard
│   │
│   ├── MathDisplay/
│   │   └── MathDisplay.jsx      KaTeX rendering component
│   │
│   ├── ProblemCard/
│   │   ├── ProblemCard.jsx      Problem display + input + submit
│   │   ├── AttemptTracker.jsx   Wordle-style attempt dots
│   │   └── ShareCard.jsx        Shareable result card generator
│   │
│   ├── Community/
│   │   ├── ProblemFeed.jsx
│   │   ├── ProblemThread.jsx
│   │   ├── CommentSection.jsx
│   │   └── TagFilter.jsx
│   │
│   ├── Leaderboard/
│   │   ├── Leaderboard.jsx
│   │   └── LeaderboardRow.jsx
│   │
│   ├── Profile/
│   │   ├── ProfilePage.jsx
│   │   ├── WeaknessRadar.jsx    Radar chart (recharts or d3)
│   │   ├── BadgeShowcase.jsx
│   │   └── ActivityFeed.jsx
│   │
│   └── Auth/
│       ├── LoginForm.jsx
│       └── SignupForm.jsx       Includes friend code field
│
├── pages/
│   ├── Landing.jsx
│   ├── DailyChallenge.jsx
│   ├── CommunityFeed.jsx
│   ├── CommunityThread.jsx
│   ├── LeaderboardPage.jsx
│   ├── ProfilePage.jsx
│   ├── SubmitProblem.jsx
│   └── AdminPanel.jsx
│
├── hooks/
│   ├── useAuth.js
│   ├── useStreak.js
│   ├── useDailyStatus.js
│   └── useWeaknessStats.js
│
├── store/
│   └── userStore.js            Zustand or Redux for global user state
│
└── utils/
    ├── latexHelpers.js         LaTeX string normalization helpers
    ├── xpHelpers.js            XP computation helpers
    └── dateHelpers.js          Local midnight, UTC conversion
```

---

## 17. Open Design Decisions

| # | Question | Current Status |
|---|---|---|
| 1 | **How far ahead should daily problems be scheduled?** | `schedule_30days.py` auto-schedules 30 days; re-run every ~3 weeks |
| 2 | **Should the Boss problem be the same for all users?** | Yes — same for all, weekend only |
| 3 | **Should there be a "hint" system for Medium?** | Not implemented — keeping clean |
| 4 | **What topics are in scope?** | Single-variable calculus + first/second order ODEs + Laplace. No multivariable. |
| 5 | **Should community problem solves show on the radar chart?** | Not yet — `topic_stats` table exists but nothing writes to it |
| 6 | **Notifications for nudges?** | Firebase removed; nudge system not yet implemented |
| 7 | **MathQuill input?** | Not implemented — users type raw LaTeX with cheat sheet sidebar |

---

*End of Design Document*
