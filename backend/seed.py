import asyncio
from datetime import date
from app.core.database import engine
from app.models.models import Problem, DailySchedule
from sqlalchemy import insert

async def seed():
    async with engine.begin() as conn:
        # Insert 4 problems (2 easy, 1 medium, 1 boss)
        r1 = await conn.execute(
            insert(Problem).values(
                title="Power Rule 1",
                body_latex=r"\int x^2 \, dx",
                answer_latex=r"\frac{x^3}{3}",
                difficulty="easy",
                technique_tags=["power-rule"],
                status="approved",
            ).returning(Problem.id)
        )
        r2 = await conn.execute(
            insert(Problem).values(
                title="Power Rule 2",
                body_latex=r"\int 3x^4 \, dx",
                answer_latex=r"\frac{3x^5}{5}",
                difficulty="easy",
                technique_tags=["power-rule"],
                status="approved",
            ).returning(Problem.id)
        )
        r3 = await conn.execute(
            insert(Problem).values(
                title="U-Substitution",
                body_latex=r"\int 2x e^{x^2} \, dx",
                answer_latex=r"e^{x^2}",
                difficulty="medium",
                technique_tags=["u-substitution"],
                status="approved",
            ).returning(Problem.id)
        )
        r4 = await conn.execute(
            insert(Problem).values(
                title="Integration by Parts",
                body_latex=r"\int x e^x \, dx",
                answer_latex=r"(x-1)e^x",
                difficulty="boss",
                technique_tags=["integration-by-parts"],
                status="approved",
            ).returning(Problem.id)
        )

        easy1_id = r1.scalar()
        easy2_id = r2.scalar()
        medium_id = r3.scalar()
        boss_id = r4.scalar()

        # Schedule all 4 for today
        await conn.execute(
            insert(DailySchedule).values(
                date=date.today(),
                easy1_id=easy1_id,
                easy2_id=easy2_id,
                medium_id=medium_id,
                boss_id=boss_id,
            )
        )

    print(f"Seeded 4 problems for {date.today()}")

asyncio.run(seed())
