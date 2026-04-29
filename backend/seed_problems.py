"""
Seeds 20 easy, 10 medium, and 5 boss problems into the database.
Run: python seed_problems.py
"""
import asyncio
from sqlalchemy import insert
from app.core.database import engine
from app.models.models import Problem

PROBLEMS = [
    # ── EASY (20) ──────────────────────────────────────────────────────────
    {
        "title": "Power Rule 1",
        "body_latex": r"\int x^3 \, dx",
        "answer_latex": r"\frac{x^4}{4}",
        "difficulty": "easy",
        "technique_tags": ["power-rule"],
    },
    {
        "title": "Power Rule 2",
        "body_latex": r"\int 5x^4 \, dx",
        "answer_latex": r"x^5",
        "difficulty": "easy",
        "technique_tags": ["power-rule"],
    },
    {
        "title": "Power Rule 3",
        "body_latex": r"\int \sqrt{x} \, dx",
        "answer_latex": r"\frac{2}{3} x^{3/2}",
        "difficulty": "easy",
        "technique_tags": ["power-rule"],
    },
    {
        "title": "Power Rule 4",
        "body_latex": r"\int \frac{1}{x^2} \, dx",
        "answer_latex": r"-\frac{1}{x}",
        "difficulty": "easy",
        "technique_tags": ["power-rule"],
    },
    {
        "title": "Power Rule 5",
        "body_latex": r"\int 6x^2 - 4x + 1 \, dx",
        "answer_latex": r"2x^3 - 2x^2 + x",
        "difficulty": "easy",
        "technique_tags": ["power-rule"],
    },
    {
        "title": "Exponential 1",
        "body_latex": r"\int e^x \, dx",
        "answer_latex": r"e^x",
        "difficulty": "easy",
        "technique_tags": ["power-rule"],
    },
    {
        "title": "Exponential 2",
        "body_latex": r"\int 3e^x \, dx",
        "answer_latex": r"3e^x",
        "difficulty": "easy",
        "technique_tags": ["power-rule"],
    },
    {
        "title": "Natural Log",
        "body_latex": r"\int \frac{1}{x} \, dx",
        "answer_latex": r"\ln|x|",
        "difficulty": "easy",
        "technique_tags": ["power-rule"],
    },
    {
        "title": "Basic Trig 1",
        "body_latex": r"\int \cos(x) \, dx",
        "answer_latex": r"\sin(x)",
        "difficulty": "easy",
        "technique_tags": ["trig-integrals"],
    },
    {
        "title": "Basic Trig 2",
        "body_latex": r"\int \sin(x) \, dx",
        "answer_latex": r"-\cos(x)",
        "difficulty": "easy",
        "technique_tags": ["trig-integrals"],
    },
    {
        "title": "Basic Trig 3",
        "body_latex": r"\int \sec^2(x) \, dx",
        "answer_latex": r"\tan(x)",
        "difficulty": "easy",
        "technique_tags": ["trig-integrals"],
    },
    {
        "title": "Basic Trig 4",
        "body_latex": r"\int 2\cos(x) - 3\sin(x) \, dx",
        "answer_latex": r"2\sin(x) + 3\cos(x)",
        "difficulty": "easy",
        "technique_tags": ["trig-integrals"],
    },
    {
        "title": "Simple U-Sub 1",
        "body_latex": r"\int 2x \cdot e^{x^2} \, dx",
        "answer_latex": r"e^{x^2}",
        "difficulty": "easy",
        "technique_tags": ["u-substitution"],
    },
    {
        "title": "Simple U-Sub 2",
        "body_latex": r"\int 3x^2 \cos(x^3) \, dx",
        "answer_latex": r"\sin(x^3)",
        "difficulty": "easy",
        "technique_tags": ["u-substitution"],
    },
    {
        "title": "Simple U-Sub 3",
        "body_latex": r"\int \frac{2x}{x^2 + 1} \, dx",
        "answer_latex": r"\ln(x^2 + 1)",
        "difficulty": "easy",
        "technique_tags": ["u-substitution"],
    },
    {
        "title": "Simple U-Sub 4",
        "body_latex": r"\int (2x+1)^4 \, dx",
        "answer_latex": r"\frac{(2x+1)^5}{10}",
        "difficulty": "easy",
        "technique_tags": ["u-substitution"],
    },
    {
        "title": "Simple U-Sub 5",
        "body_latex": r"\int \cos(3x) \, dx",
        "answer_latex": r"\frac{\sin(3x)}{3}",
        "difficulty": "easy",
        "technique_tags": ["u-substitution"],
    },
    {
        "title": "Simple U-Sub 6",
        "body_latex": r"\int e^{2x} \, dx",
        "answer_latex": r"\frac{e^{2x}}{2}",
        "difficulty": "easy",
        "technique_tags": ["u-substitution"],
    },
    {
        "title": "Simple U-Sub 7",
        "body_latex": r"\int \frac{\ln x}{x} \, dx",
        "answer_latex": r"\frac{(\ln x)^2}{2}",
        "difficulty": "easy",
        "technique_tags": ["u-substitution"],
    },
    {
        "title": "Simple U-Sub 8",
        "body_latex": r"\int \sin(x) \cos(x) \, dx",
        "answer_latex": r"\frac{\sin^2(x)}{2}",
        "difficulty": "easy",
        "technique_tags": ["u-substitution"],
    },

    # ── MEDIUM (10) ─────────────────────────────────────────────────────────
    {
        "title": "Integration by Parts 1",
        "body_latex": r"\int x e^x \, dx",
        "answer_latex": r"(x-1)e^x",
        "difficulty": "medium",
        "technique_tags": ["integration-by-parts"],
    },
    {
        "title": "Integration by Parts 2",
        "body_latex": r"\int x \cos(x) \, dx",
        "answer_latex": r"x\sin(x) + \cos(x)",
        "difficulty": "medium",
        "technique_tags": ["integration-by-parts"],
    },
    {
        "title": "Integration by Parts 3",
        "body_latex": r"\int x \ln(x) \, dx",
        "answer_latex": r"\frac{x^2}{2}\ln(x) - \frac{x^2}{4}",
        "difficulty": "medium",
        "technique_tags": ["integration-by-parts"],
    },
    {
        "title": "Integration by Parts 4",
        "body_latex": r"\int \ln(x) \, dx",
        "answer_latex": r"x\ln(x) - x",
        "difficulty": "medium",
        "technique_tags": ["integration-by-parts"],
    },
    {
        "title": "Trig Integral 1",
        "body_latex": r"\int \sin^2(x) \, dx",
        "answer_latex": r"\frac{x}{2} - \frac{\sin(2x)}{4}",
        "difficulty": "medium",
        "technique_tags": ["trig-integrals"],
    },
    {
        "title": "Trig Integral 2",
        "body_latex": r"\int \cos^2(x) \, dx",
        "answer_latex": r"\frac{x}{2} + \frac{\sin(2x)}{4}",
        "difficulty": "medium",
        "technique_tags": ["trig-integrals"],
    },
    {
        "title": "Trig Substitution 1",
        "body_latex": r"\int \frac{1}{\sqrt{1-x^2}} \, dx",
        "answer_latex": r"\arcsin(x)",
        "difficulty": "medium",
        "technique_tags": ["trig-substitution"],
    },
    {
        "title": "Trig Substitution 2",
        "body_latex": r"\int \frac{1}{1+x^2} \, dx",
        "answer_latex": r"\arctan(x)",
        "difficulty": "medium",
        "technique_tags": ["trig-substitution"],
    },
    {
        "title": "Partial Fractions 1",
        "body_latex": r"\int \frac{1}{x^2 - 1} \, dx",
        "answer_latex": r"\frac{1}{2}\ln\left|\frac{x-1}{x+1}\right|",
        "difficulty": "medium",
        "technique_tags": ["partial-fractions"],
    },
    {
        "title": "U-Substitution (Medium)",
        "body_latex": r"\int \frac{x}{\sqrt{x^2+4}} \, dx",
        "answer_latex": r"\sqrt{x^2+4}",
        "difficulty": "medium",
        "technique_tags": ["u-substitution"],
    },

    # ── BOSS (5) ────────────────────────────────────────────────────────────
    {
        "title": "IBP Twice",
        "body_latex": r"\int x^2 e^x \, dx",
        "answer_latex": r"(x^2 - 2x + 2)e^x",
        "difficulty": "boss",
        "technique_tags": ["integration-by-parts"],
    },
    {
        "title": "Trig Substitution (Boss)",
        "body_latex": r"\int \sqrt{1 - x^2} \, dx",
        "answer_latex": r"\frac{x\sqrt{1-x^2}}{2} + \frac{\arcsin(x)}{2}",
        "difficulty": "boss",
        "technique_tags": ["trig-substitution"],
    },
    {
        "title": "Partial Fractions (Boss)",
        "body_latex": r"\int \frac{x^2 + 1}{x^3 - x} \, dx",
        "answer_latex": r"-\ln|x| + \ln|x-1| + \ln|x+1|",
        "difficulty": "boss",
        "technique_tags": ["partial-fractions"],
    },
    {
        "title": "Reduction Formula",
        "body_latex": r"\int \sin^3(x) \, dx",
        "answer_latex": r"-\cos(x) + \frac{\cos^3(x)}{3}",
        "difficulty": "boss",
        "technique_tags": ["trig-integrals"],
    },
    {
        "title": "Feynman Technique",
        "body_latex": r"\int_0^\infty e^{-x^2} \, dx",
        "answer_latex": r"\frac{\sqrt{\pi}}{2}",
        "difficulty": "boss",
        "technique_tags": ["feynman-technique"],
    },
]


async def run():
    async with engine.begin() as conn:
        count = {"easy": 0, "medium": 0, "boss": 0}
        for p in PROBLEMS:
            await conn.execute(
                insert(Problem).values(
                    title=p["title"],
                    body_latex=p["body_latex"],
                    answer_latex=p["answer_latex"],
                    difficulty=p["difficulty"],
                    technique_tags=p["technique_tags"],
                    status="approved",
                )
            )
            count[p["difficulty"]] += 1

    print(f"Seeded {count['easy']} easy, {count['medium']} medium, {count['boss']} boss problems.")

asyncio.run(run())
