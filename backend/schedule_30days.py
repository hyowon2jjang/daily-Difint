"""
Schedules problems for the next 30 days starting from today.
Uses problems already in the DB (run seed_problems.py first).
Skips dates that are already scheduled.

Run: python schedule_30days.py
"""
import asyncio
import random
from datetime import date, timedelta
from sqlalchemy import select, insert
from app.core.database import engine
from app.models.models import Problem, DailySchedule


async def run():
    today = date.today()
    days = [today + timedelta(days=i) for i in range(30)]

    async with engine.begin() as conn:
        # Load all approved problems grouped by difficulty
        result = await conn.execute(
            select(Problem).where(Problem.status == "approved")
        )
        problems = result.fetchall()

    easy = [p for p in problems if p.difficulty == "easy"]
    medium = [p for p in problems if p.difficulty == "medium"]
    boss = [p for p in problems if p.difficulty == "boss"]

    if len(easy) < 2:
        print("ERROR: Need at least 2 easy problems. Run seed_problems.py first.")
        return
    if not medium:
        print("ERROR: No medium problems found. Run seed_problems.py first.")
        return
    if not boss:
        print("ERROR: No boss problems found. Run seed_problems.py first.")
        return

    # Shuffle once so rotation order is varied
    random.seed(42)
    random.shuffle(easy)
    random.shuffle(medium)
    random.shuffle(boss)

    scheduled = 0
    skipped = 0

    async with engine.begin() as conn:
        for i, day in enumerate(days):
            # Check if already scheduled
            existing = await conn.execute(
                select(DailySchedule).where(DailySchedule.date == day)
            )
            if existing.scalar_one_or_none():
                print(f"  SKIP {day} — already scheduled")
                skipped += 1
                continue

            # Pick 2 easy (no duplicates on same day), 1 medium, 1 boss
            # Cycle through pool using index
            e1 = easy[(i * 2) % len(easy)]
            e2 = easy[(i * 2 + 1) % len(easy)]
            # If pool is odd-sized and they collide, shift e2 forward
            if e1.id == e2.id:
                e2 = easy[(i * 2 + 2) % len(easy)]
            m = medium[i % len(medium)]
            b = boss[i % len(boss)]

            await conn.execute(
                insert(DailySchedule).values(
                    date=day,
                    easy1_id=e1.id,
                    easy2_id=e2.id,
                    medium_id=m.id,
                    boss_id=b.id,
                )
            )
            print(f"  {day}: [{e1.title}] [{e2.title}] [{m.title}] [{b.title}]")
            scheduled += 1

    print(f"\nDone — scheduled {scheduled} days, skipped {skipped} already-existing days.")


asyncio.run(run())
