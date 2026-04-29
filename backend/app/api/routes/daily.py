from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from jose import jwt, JWTError
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.models import DailySchedule, Problem, UserAttempt, User, Streak, XPLedger

router = APIRouter(prefix="/daily", tags=["daily"])

MAX_ATTEMPTS = {"easy": None, "medium": None, "boss": 1}

XP_REWARDS = {"easy": 10, "medium": 25, "boss": 50}


def _get_user_id(authorization: str | None = Header(default=None)) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


class SubmitRequest(BaseModel):
    problem_id: str
    answer_latex: str
    guest_session: str | None = None


def _serialize_problem(p: Problem) -> dict:
    return {
        "id": str(p.id),
        "title": p.title,
        "body_latex": p.body_latex,
        "difficulty": p.difficulty,
        "technique_tags": p.technique_tags or [],
    }


@router.get("/today")
async def get_today(db: AsyncSession = Depends(get_db)):
    today = date.today()
    result = await db.execute(
        select(DailySchedule).where(DailySchedule.date == today)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="No problems scheduled for today.")

    async def fetch(pid):
        if not pid:
            return None
        r = await db.execute(select(Problem).where(Problem.id == pid))
        return r.scalar_one_or_none()

    easy1 = await fetch(schedule.easy1_id)
    easy2 = await fetch(schedule.easy2_id)
    medium = await fetch(schedule.medium_id)
    boss = await fetch(schedule.boss_id)

    return {
        "date": str(today),
        "easy1": _serialize_problem(easy1) if easy1 else None,
        "easy2": _serialize_problem(easy2) if easy2 else None,
        "medium": _serialize_problem(medium) if medium else None,
        "boss": _serialize_problem(boss) if boss else None,
    }


@router.get("/status")
async def get_status(
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(_get_user_id),
):
    if not user_id:
        return {"solved": []}

    today = date.today()
    schedule_result = await db.execute(
        select(DailySchedule).where(DailySchedule.date == today)
    )
    schedule = schedule_result.scalar_one_or_none()
    if not schedule:
        return {"solved": []}

    today_ids = [
        str(pid) for pid in [
            schedule.easy1_id, schedule.easy2_id,
            schedule.medium_id, schedule.boss_id,
        ] if pid
    ]

    result = await db.execute(
        select(UserAttempt).where(
            UserAttempt.user_id == user_id,
            UserAttempt.is_correct == True,
            UserAttempt.problem_id.in_(today_ids),
        )
    )
    solved_attempts = result.scalars().all()
    solved_ids = list({str(a.problem_id) for a in solved_attempts})

    # Also return current streak count
    streak_result = await db.execute(
        select(Streak).where(Streak.user_id == user_id, Streak.date == today)
    )
    streak_row = streak_result.scalar_one_or_none()
    streak_count = streak_row.streak_count if streak_row else 0

    return {"solved": solved_ids, "streak": streak_count}


async def _award_xp_and_streak(db: AsyncSession, user_id: str, problem: Problem):
    """Award XP and update today's streak row for a correct daily solve."""
    today = date.today()
    xp = XP_REWARDS.get(problem.difficulty, 10)

    # Update user XP
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.xp += xp

    # Log XP
    db.add(XPLedger(
        user_id=user_id,
        amount=xp,
        reason=f"daily_{problem.difficulty}",
        reference_id=problem.id,
    ))

    # Upsert today's streak row
    streak_result = await db.execute(
        select(Streak).where(Streak.user_id == user_id, Streak.date == today)
    )
    streak = streak_result.scalar_one_or_none()

    if not streak:
        # Check yesterday to determine streak count
        from datetime import timedelta
        yesterday = today - timedelta(days=1)
        prev_result = await db.execute(
            select(Streak).where(Streak.user_id == user_id, Streak.date == yesterday)
        )
        prev = prev_result.scalar_one_or_none()
        prev_count = prev.streak_count if prev else 0

        streak = Streak(
            user_id=user_id,
            date=today,
            streak_count=prev_count,
        )
        db.add(streak)

    # Mark the solved slot
    diff = problem.difficulty
    if diff == "easy":
        # Figure out which easy slot this problem fills
        schedule_result = await db.execute(
            select(DailySchedule).where(DailySchedule.date == today)
        )
        schedule = schedule_result.scalar_one_or_none()
        if schedule and str(schedule.easy1_id) == str(problem.id):
            streak.easy1_done = True
        else:
            streak.easy2_done = True
    elif diff == "medium":
        streak.medium_done = True
    elif diff == "boss":
        streak.boss_done = True

    # Set streak count once all required problems are done
    if streak.easy1_done and streak.easy2_done and streak.medium_done:
        from datetime import timedelta
        yesterday = today - timedelta(days=1)
        prev_result = await db.execute(
            select(Streak).where(Streak.user_id == user_id, Streak.date == yesterday)
        )
        prev = prev_result.scalar_one_or_none()
        prev_count = prev.streak_count if (prev and prev.easy1_done and prev.easy2_done and prev.medium_done) else 0
        streak.streak_count = prev_count + 1

    return xp


@router.post("/submit")
async def submit_answer(
    body: SubmitRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(_get_user_id),
):
    from app.services.answer_checker import check_answer

    result = await db.execute(select(Problem).where(Problem.id == body.problem_id))
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found.")

    # Filter attempts by user or guest session
    if user_id:
        attempt_filter = (
            (UserAttempt.problem_id == body.problem_id) &
            (UserAttempt.user_id == user_id)
        )
    elif body.guest_session:
        attempt_filter = (
            (UserAttempt.problem_id == body.problem_id) &
            (UserAttempt.guest_session == body.guest_session)
        )
    else:
        attempt_filter = UserAttempt.problem_id == body.problem_id

    prior = await db.execute(select(UserAttempt).where(attempt_filter))
    prior_attempts = prior.scalars().all()
    attempt_number = len(prior_attempts) + 1

    max_att = MAX_ATTEMPTS.get(problem.difficulty)
    if max_att and len(prior_attempts) >= max_att:
        raise HTTPException(status_code=400, detail="No attempts remaining.")

    if any(a.is_correct for a in prior_attempts):
        raise HTTPException(status_code=400, detail="Already solved.")

    is_correct = check_answer(body.answer_latex, problem.answer_latex)

    attempt = UserAttempt(
        problem_id=body.problem_id,
        user_id=user_id,
        guest_session=body.guest_session if not user_id else None,
        submitted_answer=body.answer_latex,
        is_correct=is_correct,
        attempt_number=attempt_number,
    )
    db.add(attempt)

    xp_earned = 0
    streak_count = 0
    if is_correct and user_id:
        xp_earned = await _award_xp_and_streak(db, user_id, problem)

    await db.commit()

    if is_correct and user_id:
        streak_result = await db.execute(
            select(Streak).where(Streak.user_id == user_id, Streak.date == date.today())
        )
        streak_row = streak_result.scalar_one_or_none()
        streak_count = streak_row.streak_count if streak_row else 0

    response = {"correct": is_correct, "attempt_number": attempt_number, "xp_earned": xp_earned, "streak": streak_count}
    if not is_correct and max_att:
        remaining = max_att - attempt_number
        response["attempts_remaining"] = remaining
        if remaining == 0:
            response["correct_answer"] = problem.answer_latex

    return response
