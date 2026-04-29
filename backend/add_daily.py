"""
Add daily problems for any date.
Edit the PROBLEMS list and DATE below, then run:
    python add_daily.py
"""
import asyncio
from datetime import date
from sqlalchemy import insert, select
from app.core.database import engine
from app.models.models import Problem, DailySchedule

# ─── EDIT THIS ────────────────────────────────────────────────
DATE = date.today()   # or e.g. date(2026, 4, 25)

PROBLEMS = {
    "easy1": {
        "title": "Power Rule",
        "body_latex": r"\int x^2 \, dx",
        "answer_latex": r"\frac{x^3}{3}",
        "technique_tags": ["power-rule"],
    },
    "easy2": {
        "title": "Constant Multiple",
        "body_latex": r"\int 4x^3 \, dx",
        "answer_latex": r"x^4",
        "technique_tags": ["power-rule"],
    },
    "medium": {
        "title": "U-Substitution",
        "body_latex": r"\int x \cos(x^2) \, dx",
        "answer_latex": r"\frac{\sin(x^2)}{2}",
        "technique_tags": ["u-substitution"],
    },
    "boss": {
        "title": "Integration by Parts",
        "body_latex": r"\int x^2 e^x \, dx",
        "answer_latex": r"(x^2 - 2x + 2)e^x",
        "technique_tags": ["integration-by-parts"],
    },
}
# ──────────────────────────────────────────────────────────────


async def run():
    async with engine.begin() as conn:
        # Check if schedule already exists for this date
        existing = await conn.execute(
            select(DailySchedule).where(DailySchedule.date == DATE)
        )
        if existing.scalar_one_or_none():
            print(f"Schedule for {DATE} already exists. Delete it first if you want to replace it.")
            return

        ids = {}
        for slot, p in PROBLEMS.items():
            result = await conn.execute(
                insert(Problem).values(
                    title=p["title"],
                    body_latex=p["body_latex"],
                    answer_latex=p["answer_latex"],
                    difficulty="boss" if slot == "boss" else ("medium" if slot == "medium" else "easy"),
                    technique_tags=p["technique_tags"],
                    status="approved",
                ).returning(Problem.id)
            )
            ids[slot] = result.scalar()
            print(f"  Created [{slot}] '{p['title']}'")

        await conn.execute(
            insert(DailySchedule).values(
                date=DATE,
                easy1_id=ids["easy1"],
                easy2_id=ids["easy2"],
                medium_id=ids["medium"],
                boss_id=ids["boss"],
            )
        )
        print(f"\nScheduled for {DATE}:")
        print(f"  Easy 1  : {PROBLEMS['easy1']['title']}")
        print(f"  Easy 2  : {PROBLEMS['easy2']['title']}")
        print(f"  Medium  : {PROBLEMS['medium']['title']}")
        print(f"  Boss    : {PROBLEMS['boss']['title']}")

asyncio.run(run())
